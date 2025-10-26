"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";

export async function submitFeedback(matchId: string, feedback: 1 | -1) {
  try {
    await prisma.match.update({
      where: { id: matchId },
      data: { feedback },
    });

    revalidatePath("/candidates/[id]");
  } catch (error) {
    console.error("Failed to submit feedback:", error);
    throw new Error("Failed to submit feedback");
  }
}
