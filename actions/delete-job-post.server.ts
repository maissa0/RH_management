"use server";

// Remove the import and define the type inline
export type DeleteJobPostResponse = {
  success: boolean;
  data?: boolean;
  error?: string;
};

import { prisma } from "@/lib/db";

export async function deleteJobPost(
  postId: string,
): Promise<DeleteJobPostResponse> {
  try {
    await prisma.jobPost.delete({
      where: { id: postId },
    });

    return {
      success: true,
      data: true,
    };
  } catch (error) {
    console.error("[DELETE_JOB_POST]", error);
    return {
      success: false,
      error: "Failed to delete job post",
    };
  }
}
