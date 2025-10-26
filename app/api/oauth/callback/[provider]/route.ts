import { NextRequest, NextResponse } from "next/server";
import { connectJobWebsite } from "@/actions/job-website-integrations.server";

import { prisma } from "@/lib/db";

// OAuth configuration for each provider
const OAUTH_CONFIG = {
  linkedin: {
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    clientId: process.env.LINKEDIN_CLIENT_ID || "",
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET || "",
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/callback/linkedin`,
  },
  indeed: {
    tokenUrl: "https://secure.indeed.com/oauth/v2/tokens",
    clientId: process.env.INDEED_CLIENT_ID || "",
    clientSecret: process.env.INDEED_CLIENT_SECRET || "",
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/callback/indeed`,
  },
  glassdoor: {
    tokenUrl: "https://www.glassdoor.com/oauth/token",
    clientId: process.env.GLASSDOOR_CLIENT_ID || "",
    clientSecret: process.env.GLASSDOOR_CLIENT_SECRET || "",
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/callback/glassdoor`,
  },
  monster: {
    tokenUrl: "https://auth.monster.com/oauth/token",
    clientId: process.env.MONSTER_CLIENT_ID || "",
    clientSecret: process.env.MONSTER_CLIENT_SECRET || "",
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/callback/monster`,
  },
  ziprecruiter: {
    tokenUrl: "https://api.ziprecruiter.com/oauth/token",
    clientId: process.env.ZIPRECRUITER_CLIENT_ID || "",
    clientSecret: process.env.ZIPRECRUITER_CLIENT_SECRET || "",
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/callback/ziprecruiter`,
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Handle error from OAuth provider
  if (error) {
    console.error(`OAuth error from ${provider}:`, error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=oauth_error&provider=${provider}`,
    );
  }

  // Validate required parameters
  if (!code || !state) {
    console.error(`Missing required parameters for ${provider} OAuth callback`);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=missing_params&provider=${provider}`,
    );
  }

  try {
    // Verify the state parameter to prevent CSRF attacks
    const oauthState = await prisma.oAuthState.findUnique({
      where: { state },
    });

    if (!oauthState || new Date() > oauthState.expiresAt) {
      console.error(
        `Invalid or expired state parameter for ${provider} OAuth callback`,
      );
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=invalid_state&provider=${provider}`,
      );
    }

    // Get the OAuth configuration for the provider
    const config =
      OAUTH_CONFIG[provider.toLowerCase() as keyof typeof OAUTH_CONFIG];

    if (!config) {
      console.error(`OAuth configuration not found for provider: ${provider}`);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=invalid_provider&provider=${provider}`,
      );
    }

    // Exchange the authorization code for an access token
    const tokenResponse = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error(
        `Error exchanging code for token with ${provider}:`,
        errorData,
      );
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=token_exchange&provider=${provider}`,
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    // Calculate token expiry date if expires_in is provided
    const tokenExpiry = expires_in
      ? new Date(Date.now() + expires_in * 1000)
      : undefined;

    // Connect the job website using the obtained tokens
    const result = await connectJobWebsite({
      provider: oauthState.provider,
      accessToken: access_token,
      refreshToken: refresh_token,
    });

    // Clean up the OAuth state
    await prisma.oAuthState.delete({
      where: { id: oauthState.id },
    });

    if (result.success) {
      // Redirect to settings page with success message
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?success=true&provider=${provider}`,
      );
    } else {
      console.error(`Error connecting job website ${provider}:`, result.error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=connection_failed&provider=${provider}`,
      );
    }
  } catch (error) {
    console.error(`Error processing ${provider} OAuth callback:`, error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=server_error&provider=${provider}`,
    );
  }
}
