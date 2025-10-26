"use server";

import { User } from "@prisma/client";
import { prisma } from "@/lib/db";

export type FetchUserDetailsResponse = {
  success: boolean;
  message: string;
  data?: User;
  error?: any;
};

export async function fetchUserDetails(userId: string): Promise<FetchUserDetailsResponse> {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return {
        success: false,
        message: "User not found",
        error: "USER_NOT_FOUND",
      };
    }

    return {
      success: true,
      message: "User details fetched successfully",
      data: user,
    };
  } catch (error) {
    console.error("Error fetching user details:", error);
    return {
      success: false,
      message: "Failed to fetch user details",
      error,
    };
  }
} 