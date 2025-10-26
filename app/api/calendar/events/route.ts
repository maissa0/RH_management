import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Get the current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const timeMin = searchParams.get("timeMin");
    const timeMax = searchParams.get("timeMax");
    const maxResults = searchParams.get("maxResults") || "10";

    // Validate required parameters
    if (!timeMin || !timeMax) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters: timeMin and timeMax" },
        { status: 400 }
      );
    }

    // Find Google account with calendar scope
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
      return NextResponse.json(
        { success: false, error: "No calendar integration found" },
        { status: 404 }
      );
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    // Set credentials
    oauth2Client.setCredentials({
      access_token: googleAccount.access_token,
      refresh_token: googleAccount.refresh_token,
      expiry_date: googleAccount.expires_at ? googleAccount.expires_at * 1000 : undefined,
    });

    // Create calendar client
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // Fetch calendar events
    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin,
      timeMax,
      maxResults: parseInt(maxResults, 10),
      singleEvents: true,
      orderBy: "startTime",
    });

    // Filter out events without dateTime (all-day events)
    const events = response.data.items?.filter(
      (event) => event.start?.dateTime && event.end?.dateTime
    ) || [];

    return NextResponse.json({
      success: true,
      events,
    });
  } catch (error: any) {
    console.error("Error fetching calendar events:", error);
    
    // Handle token expiration
    if (error.message?.includes("invalid_grant") || error.message?.includes("token expired")) {
      return NextResponse.json(
        { success: false, error: "Authentication expired, please reconnect your Google Calendar" },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch calendar events" },
      { status: 500 }
    );
  }
} 