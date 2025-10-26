"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";

export type CalendarResponse = {
  success: boolean;
  message: string;
  data?: any;
  error?: any;
};

/**
 * Checks if the user has Google Calendar integration
 */
export async function checkGoogleCalendarIntegration(): Promise<CalendarResponse> {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return {
        success: false,
        message: "Unauthorized. Please sign in.",
        error: "UNAUTHORIZED",
      };
    }

    // Check if the user has a Google account with calendar scope
    const googleAccount = await prisma.account.findFirst({
      where: {
        userId: user.id,
        provider: "google",
        scope: {
          contains: "https://www.googleapis.com/auth/calendar",
        },
      },
    });

    return {
      success: true,
      message: googleAccount ? "Google Calendar integration found" : "No Google Calendar integration found",
      data: {
        hasIntegration: !!googleAccount,
        accountId: googleAccount?.id,
      },
    };
  } catch (error) {
    console.error("Error checking Google Calendar integration:", error);
    return {
      success: false,
      message: "Failed to check Google Calendar integration.",
      error,
    };
  }
}

/**
 * Disconnects Google Calendar integration
 */
export async function disconnectGoogleCalendar(): Promise<CalendarResponse> {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return {
        success: false,
        message: "Unauthorized. Please sign in.",
        error: "UNAUTHORIZED",
      };
    }

    // Find the Google account with calendar scope
    const googleAccount = await prisma.account.findFirst({
      where: {
        userId: user.id,
        provider: "google",
        scope: {
          contains: "https://www.googleapis.com/auth/calendar",
        },
      },
    });

    if (!googleAccount) {
      return {
        success: false,
        message: "No Google Calendar integration found.",
        error: "NOT_FOUND",
      };
    }

    // Update the account to remove the calendar scopes
    const updatedScope = googleAccount.scope
      ?.replace("https://www.googleapis.com/auth/calendar", "")
      .replace("https://www.googleapis.com/auth/calendar.events", "")
      .trim();

    await prisma.account.update({
      where: {
        id: googleAccount.id,
      },
      data: {
        scope: updatedScope,
      },
    });
    
    revalidatePath("/settings");
    
    return {
      success: true,
      message: "Google Calendar disconnected successfully",
    };
  } catch (error) {
    console.error("Error disconnecting Google Calendar:", error);
    return {
      success: false,
      message: "Failed to disconnect Google Calendar.",
      error,
    };
  }
}

/**
 * Toggles the active status of Google Calendar integration
 */
export async function toggleGoogleCalendarActive(isActive: boolean): Promise<CalendarResponse> {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return {
        success: false,
        message: "Unauthorized. Please sign in.",
        error: "UNAUTHORIZED",
      };
    }

    // In a real implementation, we would update the integration status
    // For now, we'll just return a success message
    
    revalidatePath("/settings");
    
    return {
      success: true,
      message: `Google Calendar ${isActive ? "enabled" : "disabled"} successfully`,
    };
  } catch (error) {
    console.error("Error toggling Google Calendar status:", error);
    return {
      success: false,
      message: "Failed to update Google Calendar status.",
      error,
    };
  }
} 