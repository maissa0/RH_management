import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { MatchStatus } from "@prisma/client";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { status } = body;
    const resolvedParams = await params;
    const { matchId } = resolvedParams;

    console.log("API: Received update request:", { 
      matchId, 
      status, 
      userId: user.id,
      body 
    });

    if (!matchId || !status || !Object.values(MatchStatus).includes(status)) {
      return NextResponse.json(
        { error: "Invalid request data", details: { matchId, status } },
        { status: 400 }
      );
    }

    try {
      const match = await prisma.match.update({
        where: {
          id: matchId,
          post: {
            organizationId: user.organizationId!,
            archivedAt: null,
            deletedAt: null,
          },
          candidate: {
            archivedAt: null,
            deletedAt: null,
          },
        },
        data: {
          status,
        },
        include: {
          candidate: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      console.log("API: Successfully updated match:", match);
      return NextResponse.json(match);
    } catch (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to update match in database" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[MATCH_PATCH]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 