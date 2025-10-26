"use server";

import { prisma } from "@/lib/db";

export async function confirmInterview(matchId: string) {
  try {
    await prisma.match.update({
      where: { id: matchId },
      data: {
        status: "INTERVIEWING",
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to confirm interview:", error);
    return { success: false };
  }
} 