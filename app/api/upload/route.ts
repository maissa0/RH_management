import { randomUUID } from "crypto";
import { createGroq } from "@ai-sdk/groq";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { generateObject } from "ai";
import { z } from "zod";

import { s3Client } from "@/lib/aws";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY!,
});

const candidateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  skills: z
    .array(
      z.object({
        name: z.string().min(1, "Skill name is required"),
        proficiency: z.number().min(1).max(10),
      }),
    )
    .default([]),
  education: z
    .array(
      z.object({
        degree: z.string().min(1, "Degree is required"),
        school: z.string().min(1, "School is required"),
        startDate: z.string().min(1, "Start date is required"),
        endDate: z.string().nullable(),
        description: z.string().optional(),
      }),
    )
    .default([]),
  workExperience: z
    .array(
      z.object({
        company: z.string().min(1, "Company is required"),
        title: z.string().min(1, "Title is required"),
        startDate: z.string().min(1, "Start date is required"),
        endDate: z.string().nullable(),
        description: z.string().min(1, "Description is required"),
      }),
    )
    .default([]),
  achievements: z
    .array(
      z.object({
        title: z.string().min(1, "Title is required"),
        description: z.string().min(1, "Description is required"),
      }),
    )
    .default([]),
});

interface OCRSpaceResponse {
  ParsedResults: Array<{
    ParsedText: string;
    ErrorMessage: string | null;
    ErrorDetails: string | null;
  }>;
  OCRExitCode: number;
  IsErroredOnProcessing: boolean;
  ErrorMessage: string | null;
  ErrorDetails: string | null;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  retries = 3,
  delay = 1000,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries === 0) throw error;
    console.log(
      `⏳ Retrying operation after ${delay}ms, ${retries} attempts left`,
    );
    await sleep(delay);
    return retryWithBackoff(operation, retries - 1, delay * 2);
  }
}

async function convertPDFToText(buffer: Buffer): Promise<{
  key: string;
  text: string;
}> {
  try {
    // Upload file to S3 first
    const tempKey = `candidates/${randomUUID()}.pdf`;
    console.log("📄 Uploading PDF to S3:", { tempKey });
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.CLOUD_AWS_S3_BUCKET!,
        Key: tempKey,
        Body: buffer,
        ContentType: "application/pdf",
      }),
    );
    console.log("✅ S3 upload complete");

    // Generate presigned URL (valid for 5 minutes)
    console.log("🔗 Generating presigned URL");
    const command = new GetObjectCommand({
      Bucket: process.env.CLOUD_AWS_S3_BUCKET!,
      Key: tempKey,
    });
    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 300,
    });
    console.log("✅ Presigned URL generated:", {
      urlLength: presignedUrl.length,
    });

    // Call OCR.space API with retries
    console.log("🔍 Calling OCR.space API");
    const ocrResult = await retryWithBackoff(async () => {
      const response = await fetch("https://api.ocr.space/parse/image", {
        method: "POST",
        headers: {
          apikey: process.env.OCR_API_KEY!,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          url: presignedUrl,
          language: "eng",
          isTable: "true",
          OCREngine: "2",
        }),
        // Add timeout of 30 seconds
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ OCR API error response:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        });
        throw new Error(`OCR API error: ${response.statusText} - ${errorText}`);
      }

      return response.json() as Promise<OCRSpaceResponse>;
    });

    console.log("✅ OCR API response received");

    if (ocrResult.IsErroredOnProcessing || ocrResult.ErrorMessage) {
      console.error("❌ OCR processing failed:", {
        error: ocrResult.ErrorMessage,
        exitCode: ocrResult.OCRExitCode,
        details: ocrResult.ErrorDetails,
      });
      throw new Error(ocrResult.ErrorMessage || "OCR processing failed");
    }

    // Combine all parsed text from results
    const text = ocrResult.ParsedResults.map((r) => r.ParsedText).join("\n");
    console.log("✅ Text extraction complete", {
      textLength: text.length,
      firstChars: text.substring(0, 100) + "...",
    });

    return {
      key: tempKey,
      text,
    };
  } catch (error) {
    console.error("❌ Text extraction error:", {
      error,
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : "Unknown error",
      cause: error instanceof Error ? error.cause : undefined,
    });
    throw new Error("Failed to extract text from PDF");
  }
}

function parseDate(dateStr: string): Date {
  try {
    // Handle various date formats
    const formats = [
      "MM/YYYY", // e.g. "12/2022"
      "M/YYYY", // e.g. "6/2022"
      "YYYY-MM-DD", // ISO format
      "DD/MM/YYYY", // European format
      "MMMM YYYY", // e.g. "June 2024"
    ];

    // First try parsing as is
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date;
    }

    // If it's a month and year format like "June 2024"
    const monthYearMatch = dateStr.match(/^(\w+)\s+(\d{4})$/);
    if (monthYearMatch) {
      const [_, month, year] = monthYearMatch;
      const date = new Date(`${month} 1, ${year}`);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    // If it's "Present" or similar, return current date
    if (dateStr.toLowerCase() === "present") {
      return new Date();
    }

    // If no format matches, default to first day of current month
    console.warn(`Could not parse date: ${dateStr}, using current date`);
    return new Date();
  } catch (error) {
    console.error(`Error parsing date: ${dateStr}`, error);
    return new Date(); // Fallback to current date
  }
}

// Add interface for upload result type
interface UploadResult {
  key?: string;
  name: string;
  success: boolean;
  candidateId?: string;
  error?: string;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "User not found" }, { status: 401 });
  }

  const currentOrgId = user?.organizationId;

  if (!user?.organizationId) {
    console.error("❌ Upload failed: User not found or no organization");
    return new Response(JSON.stringify({ error: "User not found" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  console.log("✅ User authenticated:", { organizationId: currentOrgId });

  try {
    const formData = await request.formData();
    const files = formData.getAll("file") as File[];

    if (!files.length) {
      console.error("❌ Upload failed: No files provided");
      return Response.json({ error: "No files provided" }, { status: 400 });
    }
    console.log("📁 Processing files:", { count: files.length });

    // Initialize results array with proper type
    const results: UploadResult[] = [];

    for (const file of files) {
      try {
        console.log("📄 Processing file:", { name: file.name });
        const result = await processFile(file, user, currentOrgId);
        results.push(result);

        // Add 5 second delay between files, but not after the last one
        if (files.indexOf(file) < files.length - 1) {
          console.log("⏳ Rate limiting delay: waiting 5 seconds");
          await sleep(5000);
        }
      } catch (error) {
        console.error(`❌ Error processing file ${file.name}:`, error);
        results.push({
          name: file.name,
          success: false,
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    }

    const failedUploads = results.filter((result) => !result.success);
    const successfulUploads = results.filter((result) => result.success);

    console.log("📊 Upload process complete:", {
      total: results.length,
      successful: successfulUploads.length,
      failed: failedUploads.length,
    });

    if (failedUploads.length > 0 && successfulUploads.length === 0) {
      return Response.json(
        {
          success: false,
          error: "All uploads failed",
          details: failedUploads,
        },
        { status: 500 },
      );
    }

    return Response.json({
      success: true,
      uploaded: successfulUploads,
      failed: failedUploads.length > 0 ? failedUploads : undefined,
    });
  } catch (error) {
    console.error("❌ Upload error:", error);

    return Response.json(
      {
        success: false,
        error: "Failed to process upload",
        details:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    );
  }
}

// Update processFile function signature to include organizationId
async function processFile(
  file: File,
  user: any,
  organizationId: string | null,
): Promise<UploadResult> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const objectId = randomUUID();
  const key = `candidates/${objectId}`;

  // Upload file to S3
  console.log("☁️ Uploading to S3:", { key });
  const uploadParams = {
    Bucket: process.env.CLOUD_AWS_S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: file.type,
  };

  await s3Client.send(new PutObjectCommand(uploadParams));
  console.log("✅ S3 upload complete");

  // Convert PDF to text using the buffer
  console.log("🔄 Converting PDF to text");
  console.log("✅ Text extraction complete");

  const { text } = await convertPDFToText(buffer);

  // Process CV with generateObject
  console.log("🤖 Processing CV with AI");

  const { object: candidateData } = await generateObject({
    model: groq("deepseek-r1-distill-llama-70b"),
    prompt: `Extract the following information from the provided CV/resume text:

1. Identify and list all hard skills mentioned. Use accurate, specific skill names 
   (avoid overly general terms).
2. For each identified hard skill, analyze the candidate's work experience, 
   education, and achievements related to that skill.
3. Based on the evidence provided, assign a score between 1 and 10 that reflects 
   the candidate's proficiency and practical experience. For example, if the 
   candidate has demonstrable work experience with React working on actual jobs, 
   assign a high score (e.g., 9). Conversely, if the candidate mentions React 
   without any supporting experience or achievements, assign a lower score 
   (e.g., 4 or 5).
4. Make sure to also extract the candidates other info such as education,professional experience and certifications.

CV Text:
${text}`,
    schema: candidateSchema,
    temperature: 0.1,
  });

  console.log("✅ AI processing complete:", {
    name: candidateData.name,
    skillsCount: candidateData.skills.length,
  });

  // Create or update candidate in the database
  console.log("💾 Saving candidate to database");

  // Add validation before database operation
  if (!candidateData || typeof candidateData !== "object") {
    throw new Error(
      "Invalid candidate data: Payload cannot be null or undefined",
    );
  }

  // Add logging to help debug the payload
  console.log("📄 Candidate payload:", JSON.stringify(candidateData, null, 2));

  const savedCandidate = await prisma.candidate.upsert({
    where: {
      email: candidateData.email,
    },
    create: {
      name: candidateData.name,
      email: candidateData.email,
      organizationId: user.organizationId!,
      cvUrl: key,
      processing: false,
      education: {
        create:
          candidateData.education?.length > 0
            ? candidateData.education.map((edu) => ({
                degree: edu.degree,
                school: edu.school,
                startDate: parseDate(edu.startDate),
                endDate: edu.endDate ? parseDate(edu.endDate) : null,
                description: edu.description,
              }))
            : [],
      },
      skills: {
        create:
          candidateData.skills?.length > 0
            ? candidateData.skills.map((skill) => ({
                name: skill.name,
                type: "HARD" as const,
                proficiency: skill.proficiency,
              }))
            : [],
      },
      workExperience: {
        create:
          candidateData.workExperience?.length > 0
            ? candidateData.workExperience.map((exp) => ({
                company: exp.company,
                title: exp.title,
                startDate: parseDate(exp.startDate),
                endDate: exp.endDate ? parseDate(exp.endDate) : null,
                description: exp.description,
              }))
            : [],
      },
      achievements: {
        create:
          candidateData.achievements?.length > 0
            ? candidateData.achievements.map((achievement) => ({
                title: achievement.title,
                description: achievement.description,
              }))
            : [],
      },
    },
    update: {
      name: candidateData.name,
      email: candidateData.email,
      cvUrl: key,
      organizationId: user.organizationId!,
      processing: false,
      education: {
        deleteMany: {},
        create:
          candidateData.education?.length > 0
            ? candidateData.education.map((edu) => ({
                degree: edu.degree,
                school: edu.school,
                startDate: parseDate(edu.startDate),
                endDate: edu.endDate ? parseDate(edu.endDate) : null,
                description: edu.description,
              }))
            : [],
      },
      skills: {
        deleteMany: {},
        create:
          candidateData.skills?.length > 0
            ? candidateData.skills.map((skill) => ({
                name: skill.name,
                type: "HARD" as const,
                proficiency: skill.proficiency,
              }))
            : [],
      },
      workExperience: {
        deleteMany: {},
        create:
          candidateData.workExperience?.length > 0
            ? candidateData.workExperience.map((exp) => ({
                company: exp.company,
                title: exp.title,
                startDate: parseDate(exp.startDate),
                endDate: exp.endDate ? parseDate(exp.endDate) : null,
                description: exp.description,
              }))
            : [],
      },
      achievements: {
        deleteMany: {},
        create:
          candidateData.achievements?.length > 0
            ? candidateData.achievements.map((achievement) => ({
                title: achievement.title,
                description: achievement.description,
              }))
            : [],
      },
    },
  });

  console.log("✅ Candidate saved successfully:", savedCandidate.id);

  // Call matches API
  if (!savedCandidate.id) {
    throw new Error("Candidate ID is required for matching");
  }

  console.log("🎯 Starting match process");
  const matchesResponse = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/matches`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        candidateId: savedCandidate.id,
        organizationId: organizationId,
      }),
    },
  );

  if (!matchesResponse.ok) {
    console.error("❌ Match process failed:", await matchesResponse.text());
    throw new Error(`Failed to process matches: ${matchesResponse.statusText}`);
  }
  console.log("✅ Match process complete");

  return {
    key,
    name: file.name,
    success: true,
    candidateId: savedCandidate.id,
  };
}
