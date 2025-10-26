import { NextRequest, NextResponse } from "next/server";
import { JobWebsiteProvider } from "@prisma/client";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    if (!user.organizationId) {
      return NextResponse.json(
        { success: false, error: "You must be part of an organization to post jobs." },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { jobPostId } = body;

    if (!jobPostId) {
      return NextResponse.json(
        { success: false, error: "Job post ID is required" },
        { status: 400 }
      );
    }

    // Verify job post ownership
    const jobPost = await prisma.jobPost.findFirst({
      where: {
        id: jobPostId,
        organizationId: user.organizationId,
      },
    });

    if (!jobPost) {
      return NextResponse.json(
        { success: false, error: "Job post not found or you don't have permission to access it" },
        { status: 404 }
      );
    }

    // Find LinkedIn integration
    const linkedInIntegration = await prisma.jobWebsiteIntegration.findFirst({
      where: {
        organizationId: user.organizationId,
        provider: "LINKEDIN",
        isActive: true,
      },
    });

    if (!linkedInIntegration) {
      return NextResponse.json(
        { success: false, error: "LinkedIn integration not found or inactive" },
        { status: 404 }
      );
    }

    // Check if LinkedIn organization is selected
    // @ts-ignore
    const metadata = linkedInIntegration.metadata as { linkedInOrgId?: string; linkedInOrgName?: string } | null;
    
    if (!metadata?.linkedInOrgId) {
      return NextResponse.json(
        { success: false, error: "LinkedIn organization not selected. Please select an organization in the settings." },
        { status: 400 }
      );
    }

    // Check if job is already posted to LinkedIn
    const existingPosting = await prisma.jobWebsitePosting.findFirst({
      where: {
        postId: jobPostId,
        integration: {
          provider: "LINKEDIN",
        },
      },
    });

    if (existingPosting) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Job is already posted to LinkedIn",
          data: {
            postingId: existingPosting.id,
            externalUrl: existingPosting.externalUrl,
          }
        },
        { status: 400 }
      );
    }

    // In a real implementation, we would call the LinkedIn API to post the job
    // For now, we'll create a mock response
    const mockExternalId = `linkedin-${Date.now()}`;
    const mockExternalUrl = `https://www.linkedin.com/jobs/view/${mockExternalId}`;

    // Create job website posting record
    const posting = await prisma.jobWebsitePosting.create({
      data: {
        postId: jobPostId,
        integrationId: linkedInIntegration.id,
        externalId: mockExternalId,
        externalUrl: mockExternalUrl,
        status: "POSTED",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Job posted to LinkedIn successfully",
      data: {
        postingId: posting.id,
        externalId: posting.externalId,
        externalUrl: posting.externalUrl,
      },
    });
  } catch (error) {
    console.error("Error posting job to LinkedIn:", error);
    return NextResponse.json(
      { success: false, error: "Failed to post job to LinkedIn" },
      { status: 500 }
    );
  }
} 