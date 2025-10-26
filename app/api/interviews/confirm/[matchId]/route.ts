import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { matchId } = resolvedParams;

    // Update match status to INTERVIEWING when candidate confirms
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: "INTERVIEWING",
      },
    });

    return NextResponse.json({ success: true, data: updatedMatch });
  } catch (error) {
    console.error("Failed to confirm interview:", error);
    return NextResponse.json(
      { success: false, error: "Failed to confirm interview" },
      { status: 500 }
    );
  }
} 