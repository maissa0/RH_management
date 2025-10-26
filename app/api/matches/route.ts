import { NextResponse } from "next/server";
import { createGroq } from "@ai-sdk/groq";
import { Prisma } from "@prisma/client";
import { generateObject } from "ai";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY!,
});

interface MatchAnalysis {
  score: number;
  seniorityMatch: number;
  skillMatches: Array<{
    skill: string;
    matchLevel: number;
    explanation: string;
  }>;
  whyMatch: string;
  recommendations: string[];
}

// Define schema for match analysis
const matchAnalysisSchema = z.object({
  score: z.number().min(0).max(100),
  seniorityMatch: z.number().min(0).max(100),
  skillMatches: z.array(
    z.object({
      skill: z.string(),
      matchLevel: z.number().min(0).max(10),
      explanation: z.string(),
    }),
  ),
  whyMatch: z.string(),
  recommendations: z.array(z.string()),
});

// Helper to format candidate and post data for LLM
function formatMatchingData(candidate: any, post: any) {
  return `
Job Post Requirements:
- Title: ${post.title}
- Required Skills: ${post.weights.map((w: any) => `${w.name} (Weight: ${w.weight})`).join(", ")}
- Seniority Level: ${post.seniorityLevel}
- Years of Experience Required: ${post.yearsOfExperience}

Candidate Profile:
- Skills: ${candidate.skills.map((s: any) => `${s.name} (Proficiency: ${s.proficiency})`).join(", ")}
- Work Experience: ${candidate.workExperience
    ?.map(
      (w: any) =>
        `${w.title} at ${w.company} (${w.startDate} - ${w.endDate || "Present"})`,
    )
    .join(", ")}
- Education: ${candidate.education?.map((e: any) => e.degree).join(", ")}
`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.candidateId || !body.organizationId) {
      console.error("❌ Missing required fields:", { body });
      return Response.json(
        { error: "Missing required fields: candidateId and organizationId" },
        { status: 400 },
      );
    }

    const { candidateId, organizationId } = body;
    console.log("🔍 Starting match process for:", {
      candidateId,
      organizationId,
    });

    // Validate GROQ API key
    if (!process.env.GROQ_API_KEY) {
      console.error("❌ GROQ API key not configured");
      return Response.json(
        { error: "Service configuration error" },
        { status: 503 },
      );
    }

    try {
      await prisma.$connect();
    } catch (dbError) {
      console.error("❌ Database connection failed:", dbError);
      return Response.json(
        { error: "Database connection error" },
        { status: 503 },
      );
    }

    // Get candidate with all relevant data
    const candidate = await prisma.candidate.findFirst({
      where: {
        id: candidateId,
        organizationId: organizationId,
        archivedAt: null,
        deletedAt: null,
      },
      include: {
        skills: true,
        workExperience: true,
        education: true,
      },
    });

    if (!candidate) {
      console.error("❌ Candidate not found:", { candidateId, organizationId });
      return Response.json(
        { error: "Candidate not found or not in the organization" },
        { status: 404 },
      );
    }

    // Get active job posts with requirements
    const posts = await prisma.jobPost.findMany({
      where: {
        status: "ACTIVE",
        organizationId: organizationId,
        archivedAt: null,
        deletedAt: null,
      },
      include: { weights: true },
    });

    if (!posts.length) {
      return Response.json(
        { message: "No active job posts found", matches: [] },
        { status: 200 },
      );
    }

    // Process matches using LLM
    const matches = await Promise.all(
      posts.map(async (post) => {
        const matchingData = formatMatchingData(candidate, post);

        try {
          const { object: analysis } = await generateObject<MatchAnalysis>({
            model: groq("deepseek-r1-distill-llama-70b"),
            prompt: `Analyze the match between this candidate and job post. Consider skill matches, 
            seniority level, and experience. Provide detailed scoring and explanation, and in the explanation of the match,
            You are the recruiter,write a summary talking in first person directly to the candidate about how he's a good match for the job post.
            You must talk in the "why match" section in the first person like you're a recruiter talking to the candidate, dont include placeholder name.
            You must be strict, don't give any slack, if the candidate is not a good match, say so.
            
            Matching data:
            ${matchingData}`,
            schema: matchAnalysisSchema,
            temperature: 0.1,
          }).catch((llmError) => {
            console.error("❌ LLM API error:", llmError);
            throw new Error(`LLM processing failed: ${llmError.message}`);
          });

          if (analysis.score >= 10) {
            const matchData: Prisma.MatchUpsertArgs = {
              where: {
                postId_candidateId: {
                  postId: post.id,
                  candidateId: candidate.id,
                },
              },
              update: {
                score: analysis.score,
                whyMatch: analysis.whyMatch,
                status: "NEW",
                metadata: analysis as unknown as Prisma.JsonObject,
              },
              create: {
                postId: post.id,
                candidateId: candidate.id,
                score: analysis.score,
                whyMatch: analysis.whyMatch,
                feedback: 0,
                status: "NEW",
                metadata: analysis as unknown as Prisma.JsonObject,
              },
            };

            return prisma.match.upsert(matchData);
          }
          return null;
        } catch (error) {
          console.error("❌ LLM analysis failed for post:", {
            postId: post.id,
            error: error instanceof Error ? error.message : error,
          });
          return null;
        }
      }),
    );

    const validMatches = matches.filter(Boolean);

    if (validMatches.length === 0) {
      return Response.json(
        {
          message: "No matches met the minimum threshold",
          matches: [],
        },
        { status: 200 },
      );
    }

    return Response.json(
      {
        message: "Match process completed successfully",
        matches: validMatches,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("❌ Match creation error:", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");

    if (!postId) {
      return new NextResponse("Post ID is required", { status: 400 });
    }

    const matches = await prisma.match.findMany({
      where: {
        postId,
        post: {
          organizationId: user.organizationId!,
          archivedAt: null,
          deletedAt: null,
        },
        candidate: {
          archivedAt: null,
          deletedAt: null,
        }
      },
      include: {
        candidate: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(matches);
  } catch (error) {
    console.error("[MATCHES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
