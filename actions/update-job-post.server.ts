"use server";

import { PostStatus, SkillType } from "@prisma/client";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { JobPostFormData } from "@/lib/validations/job-post";

export type UpdateJobPostResponse = {
  success: boolean;
  message: string;
  data?: any;
  error?: any;
};

export async function updateJobPost(
  postId: string,
  data: JobPostFormData,
): Promise<UpdateJobPostResponse> {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return {
        success: false,
        message: "Unauthorized. Please sign in.",
        error: "UNAUTHORIZED",
      };
    }

    // Check if user has an organization
    if (!user.organizationId) {
      return {
        success: false,
        message: "You must be part of an organization to update job posts.",
        error: "NO_ORGANIZATION",
      };
    }

    // Verify post ownership
    const existingPost = await prisma.jobPost.findUnique({
      where: { id: postId },
    });

    if (!existingPost || existingPost.organizationId !== user.organizationId) {
      return {
        success: false,
        message: "Job post not found or unauthorized to edit.",
        error: "NOT_FOUND",
      };
    }

    // Update post and skills in a transaction
    const updatedPost = await prisma.$transaction(async (tx) => {
      // Delete existing skills
      await tx.skillWeight.deleteMany({
        where: { postId },
      });

      // Update post and create new skills
      return tx.jobPost.update({
        where: { id: postId },
        data: {
          title: data.title,
          description: data.description,
          companyName: data.companyName,
          weights: {
            create: data.skills.map((skill) => ({
              name: skill.name,
              weight: skill.weight,
              type: skill.type as SkillType,
            })),
          },
        },
        include: {
          weights: true,
        },
      });
    });

    return {
      success: true,
      message: "Job post updated successfully",
      data: updatedPost,
    };
  } catch (error) {
    console.error("Error updating job post:", error);
    return {
      success: false,
      message: "Failed to update job post. Please try again.",
      error,
    };
  }
} 