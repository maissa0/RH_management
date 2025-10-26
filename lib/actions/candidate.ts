"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function deleteCandidate(candidateId: string) {
  try {
    const user = await getCurrentUser();

    if (!user?.organizationId) {
      throw new Error("User not found or not part of an organization");
    }

    // Verify the candidate belongs to the user's organization
    const candidate = await prisma.candidate.findFirst({
      where: {
        id: candidateId,
        organizationId: user.organizationId,
      },
    });

    if (!candidate) {
      throw new Error("Candidate not found or unauthorized");
    }

    // Delete the candidate and all related records
    await prisma.candidate.delete({
      where: {
        id: candidateId,
      },
    });

    revalidatePath("/candidates");
    return { success: true };
  } catch (error) {
    console.error("Error deleting candidate:", error);
    return { success: false, error: "Failed to delete candidate" };
  }
} 