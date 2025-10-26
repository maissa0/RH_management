"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

interface ArchiveCandidateResponse {
  success: boolean;
  message: string;
}

export async function archiveCandidate(
  candidateId: string
): Promise<ArchiveCandidateResponse> {
  try {
    const user = await getCurrentUser();

    if (!user || !user.organizationId) {
      return {
        success: false,
        message: "You must be logged in and part of an organization to archive candidates.",
      };
    }

    // Check if the candidate exists and belongs to the user's organization
    const candidate = await prisma.candidate.findUnique({
      where: {
        id: candidateId,
        organizationId: user.organizationId,
      },
    });

    if (!candidate) {
      return {
        success: false,
        message: "Candidate not found or you don't have permission to archive it.",
      };
    }

    // Update the candidate to set archivedAt
    await prisma.candidate.update({
      where: {
        id: candidateId,
      },
      data: {
        archivedAt: candidate.archivedAt ? null : new Date(), // Toggle archive status
      },
    });

    revalidatePath("/candidates");
    revalidatePath("/archive");

    return {
      success: true,
      message: candidate.archivedAt ? "Candidate unarchived successfully." : "Candidate archived successfully.",
    };
  } catch (error) {
    console.error("Error archiving candidate:", error);
    return {
      success: false,
      message: "Failed to archive candidate. Please try again.",
    };
  }
} 