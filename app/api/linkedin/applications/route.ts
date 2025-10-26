import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function GET(request: NextRequest) {
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
        { success: false, error: "You must be part of an organization to access applications." },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const jobPostId = searchParams.get("jobPostId");

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

    // Check if job is posted to LinkedIn
    const jobPosting = await prisma.jobWebsitePosting.findFirst({
      where: {
        postId: jobPostId,
        integrationId: linkedInIntegration.id,
      },
    });

    if (!jobPosting) {
      return NextResponse.json(
        { success: false, error: "Job is not posted to LinkedIn" },
        { status: 404 }
      );
    }

    // In a real implementation, we would call the LinkedIn API to fetch applications
    // For now, we'll return mock data
    const mockApplications = [
      {
        id: "app-1",
        candidateName: "John Doe",
        candidateEmail: "john.doe@example.com",
        candidateLinkedInProfile: "https://www.linkedin.com/in/johndoe",
        resumeUrl: "https://example.com/resumes/johndoe.pdf",
        appliedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
        status: "NEW",
      },
      {
        id: "app-2",
        candidateName: "Jane Smith",
        candidateEmail: "jane.smith@example.com",
        candidateLinkedInProfile: "https://www.linkedin.com/in/janesmith",
        resumeUrl: "https://example.com/resumes/janesmith.pdf",
        appliedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        status: "NEW",
      },
      {
        id: "app-3",
        candidateName: "Bob Johnson",
        candidateEmail: "bob.johnson@example.com",
        candidateLinkedInProfile: "https://www.linkedin.com/in/bobjohnson",
        resumeUrl: "https://example.com/resumes/bobjohnson.pdf",
        appliedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
        status: "NEW",
      },
    ];

    return NextResponse.json({
      success: true,
      message: "LinkedIn applications retrieved successfully",
      data: {
        applications: mockApplications,
        jobPostingId: jobPosting.id,
        externalJobId: jobPosting.externalId,
        externalJobUrl: jobPosting.externalUrl,
      },
    });
  } catch (error) {
    console.error("Error fetching LinkedIn applications:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch LinkedIn applications" },
      { status: 500 }
    );
  }
} 