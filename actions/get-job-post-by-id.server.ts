import { prisma } from "@/lib/db";
import { JobPost, SkillWeight } from "@prisma/client";

export type JobPostWithDetails = JobPost & {
  weights: SkillWeight[];
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
};

interface JobPostResponse {
  success: boolean;
  data?: JobPostWithDetails;
  error?: string;
}

export async function getJobPostById(
  postId: string,
): Promise<JobPostResponse> {
  try {
    const post = await prisma.jobPost.findUnique({
      where: { id: postId },
      include: {
        weights: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!post) {
      return {
        success: false,
        error: "Job post not found",
      };
    }

    return {
      success: true,
      data: post as JobPostWithDetails,
    };
  } catch (error) {
    console.error("[GET_JOB_POST_BY_ID]", error);
    return {
      success: false,
      error: "Failed to fetch job post",
    };
  }
} 