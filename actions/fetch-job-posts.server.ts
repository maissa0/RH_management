"use server"

import { JobPost, SkillWeight, User } from "@prisma/client"
import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"

export type FetchJobPostsResponse = {
  success: boolean
  message: string
  data?: (JobPost & {
    weights: SkillWeight[]
    user: User
  })[]
  error?: any
}

export async function fetchJobPosts(): Promise<FetchJobPostsResponse> {
  try {
    const user = await getCurrentUser()

    if (!user?.id) {
      return {
        success: false,
        message: "Unauthorized. Please sign in.",
        error: "UNAUTHORIZED",
      }
    }

    // Check if user has an organization
    if (!user.organizationId) {
      return {
        success: false,
        message: "You must be part of an organization to view job posts.",
        error: "NO_ORGANIZATION",
      }
    }

    const posts = await prisma.jobPost.findMany({
      where: {
        organizationId: user.organizationId,
        archivedAt: null,
        deletedAt: null,
      },
      include: {
        weights: true,
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return {
      success: true,
      message: "Job posts fetched successfully",
      data: posts,
    }
  } catch (error) {
    console.error("Error fetching job posts:", error)
    return {
      success: false,
      message: "Failed to fetch job posts. Please try again.",
      error,
    }
  }
} 