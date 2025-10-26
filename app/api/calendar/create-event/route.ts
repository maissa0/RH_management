import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    // Get the current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Parse the request body
    const eventData = await request.json();

    // Validate required fields
    if (!eventData.summary || !eventData.start?.dateTime || !eventData.end?.dateTime) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: summary, start.dateTime, end.dateTime" },
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

    // Prepare the event
    const event = {
      summary: eventData.summary,
      description: eventData.description || "",
      start: {
        dateTime: eventData.start.dateTime,
        timeZone: eventData.start.timeZone || "UTC",
      },
      end: {
        dateTime: eventData.end.dateTime,
        timeZone: eventData.end.timeZone || "UTC",
      },
      location: eventData.location || "",
      attendees: eventData.attendees || [],
      reminders: {
        useDefault: true,
      },
    };

    // Create the event
    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
      sendUpdates: "all", // Send email notifications to attendees
    });

    return NextResponse.json({
      success: true,
      event: response.data,
    });
  } catch (error: any) {
    console.error("Error creating calendar event:", error);
    
    // Handle token expiration
    if (error.message?.includes("invalid_grant") || error.message?.includes("token expired")) {
      return NextResponse.json(
        { success: false, error: "Authentication expired, please reconnect your Google Calendar" },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create calendar event" },
      { status: 500 }
    );
  }
} 