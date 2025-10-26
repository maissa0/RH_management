import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch the user's connected accounts
    const accounts = await prisma.account.findMany({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
        provider: true,
        scope: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      accounts,
    });
  } catch (error) {
    console.error("Error fetching user accounts:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch accounts" },
      { status: 500 }
    );
  }
} 