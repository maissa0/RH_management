"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

interface ArchiveJobPostResponse {
  success: boolean;
  message: string;
}

export async function archiveJobPost(
  postId: string
): Promise<ArchiveJobPostResponse> {
  try {
    const user = await getCurrentUser();

    if (!user || !user.organizationId) {
      return {
        success: false,
        message: "You must be logged in and part of an organization to archive job posts.",
      };
    }

    // Check if the job post exists and belongs to the user's organization
    const jobPost = await prisma.jobPost.findUnique({
      where: {
        id: postId,
        organizationId: user.organizationId,
      },
    });

    if (!jobPost) {
      return {
        success: false,
        message: "Job post not found or you don't have permission to archive it.",
      };
    }

    // Update the job post to set archivedAt
    await prisma.jobPost.update({
      where: {
        id: postId,
      },
      data: {
        archivedAt: jobPost.archivedAt ? null : new Date(), // Toggle archive status
      },
    });

    revalidatePath("/posts");
    revalidatePath("/archive");
    revalidatePath(`/posts/${postId}`);

    return {
      success: true,
      message: jobPost.archivedAt ? "Job post unarchived successfully." : "Job post archived successfully.",
    };
  } catch (error) {
    console.error("Error archiving job post:", error);
    return {
      success: false,
      message: "Failed to archive job post. Please try again.",
    };
  }
} 