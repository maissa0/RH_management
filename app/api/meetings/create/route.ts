import { NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const calendar = google.calendar('v3');

// Initialize OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`
);

export async function POST(request: Request) {
  try {
    console.log("Meeting creation request received");
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { date, time, attendees, title, description } = body;

    console.log("Creating calendar event with:", { date, time, attendees, title });

    // Get the user's access token
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        accounts: {
          where: { provider: "google" },
          select: {
            access_token: true,
            refresh_token: true,
            expires_at: true,
            providerAccountId: true,
          },
        },
      },
    });

    const googleAccount = user?.accounts[0];
    if (!googleAccount) {
      console.error("No Google account found for user");
      return NextResponse.json(
        { error: "Google Calendar not connected" },
        { status: 400 }
      );
    }

    // Check if token is expired
    const isTokenExpired = googleAccount.expires_at 
      ? googleAccount.expires_at * 1000 < Date.now()
      : true;

    if (isTokenExpired) {
      console.log("Token expired, attempting refresh...");
      if (!googleAccount.refresh_token) {
        console.error("No refresh token available");
        return NextResponse.json(
          { error: "Google Calendar authorization expired" },
          { status: 401 }
        );
      }

      // Set credentials for refresh
      oauth2Client.setCredentials({
        refresh_token: googleAccount.refresh_token,
      });

      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        // Update the token in the database
        await prisma.account.update({
          where: {
            provider_providerAccountId: {
              provider: "google",
              providerAccountId: googleAccount.providerAccountId,
            },
          },
          data: {
            access_token: credentials.access_token,
            expires_at: Math.floor((credentials.expiry_date || Date.now() + 3600000) / 1000),
          },
        });
        
        // Use new access token
        oauth2Client.setCredentials(credentials);
      } catch (refreshError) {
        console.error("Failed to refresh token:", refreshError);
        return NextResponse.json(
          { error: "Failed to refresh Google Calendar authorization" },
          { status: 401 }
        );
      }
    } else {
      // Set credentials with existing token
      oauth2Client.setCredentials({
        access_token: googleAccount.access_token,
        refresh_token: googleAccount.refresh_token,
      });
    }

    // Create event
    const startDateTime = new Date(`${date}T${time}`);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour duration

    const event = {
      summary: title || "Interview",
      description: description || "Job Interview",
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      attendees: attendees?.map((email: string) => ({ email })) || [],
      conferenceData: {
        createRequest: {
          requestId: `interview-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
      reminders: {
        useDefault: true,
      },
      guestsCanModify: false,
      guestsCanInviteOthers: false,
    };

    console.log("Creating event with:", event);

    try {
      const response = await calendar.events.insert({
        auth: oauth2Client,
        calendarId: 'primary',
        requestBody: event,
        conferenceDataVersion: 1,
        sendUpdates: 'all',
      });

      console.log("Calendar event created:", response.data);

      const meetLink = response.data.hangoutLink || 
        response.data.conferenceData?.entryPoints?.[0]?.uri;

      return NextResponse.json({
        success: true,
        meetLink,
        eventId: response.data.id,
      });
    } catch (calendarError: any) {
      console.error("Google Calendar API error:", calendarError.response?.data || calendarError);
      return NextResponse.json(
        { error: "Failed to create calendar event", details: calendarError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Failed to create meeting:", error);
    return NextResponse.json(
      { error: "Failed to create meeting" },
      { status: 500 }
    );
  }
} 