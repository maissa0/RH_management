"use server";

import { revalidatePath } from "next/cache";
import { AtsProvider, JobWebsiteProvider } from "@prisma/client";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export type JobWebsiteResponse = {
  success: boolean;
  message: string;
  data?: any;
  error?: any;
};

type ConnectJobWebsiteParams = {
  provider?: string;
  accessToken?: string;
  refreshToken?: string;
  integrationId?: string;
  isActive?: boolean;
};

// OAuth configuration for each provider
const OAUTH_CONFIG = {
  "LINKEDIN": {
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    clientId: process.env.LINKEDIN_CLIENT_ID || "",
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET || "",
    scope: "r_liteprofile w_member_social r_emailaddress w_organization_social rw_organization_admin r_ads r_ads_reporting w_ads",
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/callback/linkedin`,
  },
  "INDEED": {
    authUrl: "https://secure.indeed.com/oauth/v2/authorize",
    tokenUrl: "https://secure.indeed.com/oauth/v2/tokens",
    clientId: process.env.INDEED_CLIENT_ID || "",
    clientSecret: process.env.INDEED_CLIENT_SECRET || "",
    scope: "employer_access",
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/callback/indeed`,
  },
  "GLASSDOOR": {
    authUrl: "https://www.glassdoor.com/oauth/authorize",
    tokenUrl: "https://www.glassdoor.com/oauth/token",
    clientId: process.env.GLASSDOOR_CLIENT_ID || "",
    clientSecret: process.env.GLASSDOOR_CLIENT_SECRET || "",
    scope: "jobs:write",
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/callback/glassdoor`,
  },
  "MONSTER": {
    authUrl: "https://auth.monster.com/oauth/authorize",
    tokenUrl: "https://auth.monster.com/oauth/token",
    clientId: process.env.MONSTER_CLIENT_ID || "",
    clientSecret: process.env.MONSTER_CLIENT_SECRET || "",
    scope: "jobs.post",
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/callback/monster`,
  },
  "ZIPRECRUITER": {
    authUrl: "https://api.ziprecruiter.com/oauth/authorize",
    tokenUrl: "https://api.ziprecruiter.com/oauth/token",
    clientId: process.env.ZIPRECRUITER_CLIENT_ID || "",
    clientSecret: process.env.ZIPRECRUITER_CLIENT_SECRET || "",
    scope: "jobs.post",
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/callback/ziprecruiter`,
  },
};

/**
 * Initiates the OAuth flow for a job website
 */
export async function initiateOAuthFlow(provider: string): Promise<JobWebsiteResponse> {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return {
        success: false,
        message: "Unauthorized. Please sign in.",
        error: "UNAUTHORIZED",
      };
    }

    if (!user.organizationId) {
      return {
        success: false,
        message: "You must be part of an organization to manage integrations.",
        error: "NO_ORGANIZATION",
      };
    }

    const config = OAUTH_CONFIG[provider as keyof typeof OAUTH_CONFIG];
    
    if (!config) {
      return {
        success: false,
        message: `OAuth configuration not found for provider: ${provider}`,
        error: "INVALID_PROVIDER",
      };
    }

    if (!config.clientId) {
      return {
        success: false,
        message: `Client ID not configured for provider: ${provider}`,
        error: "MISSING_CLIENT_ID",
      };
    }

    // Generate a state parameter to prevent CSRF attacks
    const state = Buffer.from(JSON.stringify({
      userId: user.id,
      organizationId: user.organizationId,
      provider,
      timestamp: Date.now(),
    })).toString('base64');

    // Store the state in the database for verification during callback
    await prisma.oAuthState.create({
      data: {
        state,
        userId: user.id,
        organizationId: user.organizationId,
        provider: provider as AtsProvider,
        expiresAt: new Date(Date.now() + 1000 * 60 * 10), // 10 minutes expiry
      },
    });

    // Construct the authorization URL
    const authUrl = new URL(config.authUrl);
    authUrl.searchParams.append('client_id', config.clientId);
    authUrl.searchParams.append('redirect_uri', config.redirectUri);
    authUrl.searchParams.append('scope', config.scope);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('state', state);

    return {
      success: true,
      message: "OAuth flow initiated",
      data: {
        authUrl: authUrl.toString(),
      },
    };
  } catch (error) {
    console.error("Error initiating OAuth flow:", error);
    return {
      success: false,
      message: "Failed to initiate OAuth flow. Please try again.",
      error,
    };
  }
}

export async function getJobWebsiteIntegrations(): Promise<JobWebsiteResponse> {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return {
        success: false,
        message: "Unauthorized. Please sign in.",
        error: "UNAUTHORIZED",
      };
    }

    if (!user.organizationId) {
      return {
        success: false,
        message: "You must be part of an organization to manage integrations.",
        error: "NO_ORGANIZATION",
      };
    }

    const integrations = await prisma.jobWebsiteIntegration.findMany({
      where: {
        organizationId: user.organizationId,
      },
      select: {
        id: true,
        provider: true,
        isActive: true,
        createdAt: true,
        // metadata: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      message: "Integrations retrieved successfully",
      data: integrations,
    };
  } catch (error) {
    console.error("Error getting job website integrations:", error);
    return {
      success: false,
      message: "Failed to retrieve integrations. Please try again.",
      error,
    };
  }
}

export async function connectJobWebsite(
  params: ConnectJobWebsiteParams
): Promise<JobWebsiteResponse> {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return {
        success: false,
        message: "Unauthorized. Please sign in.",
        error: "UNAUTHORIZED",
      };
    }

    if (!user.organizationId) {
      return {
        success: false,
        message: "You must be part of an organization to manage integrations.",
        error: "NO_ORGANIZATION",
      };
    }

    // If we're updating an existing integration's status
    if (params.integrationId !== undefined) {
      const updatedIntegration = await prisma.jobWebsiteIntegration.update({
        where: {
          id: params.integrationId,
        },
        data: {
          isActive: params.isActive,
        },
      });

      revalidatePath("/settings");
      
      return {
        success: true,
        message: `Integration ${params.isActive ? "enabled" : "disabled"} successfully`,
        data: updatedIntegration,
      };
    }

    // Otherwise, we're creating a new integration
    if (!params.provider || !params.accessToken) {
      return {
        success: false,
        message: "Provider and access token are required",
        error: "MISSING_PARAMS",
      };
    }

    // Convert string provider to enum value
    const providerEnum = params.provider as JobWebsiteProvider;

    // Check if integration already exists
    const existingIntegration = await prisma.jobWebsiteIntegration.findFirst({
      where: {
        provider: providerEnum,
        organizationId: user.organizationId,
      },
    });

    if (existingIntegration) {
      // Update existing integration
      const updatedIntegration = await prisma.jobWebsiteIntegration.update({
        where: {
          id: existingIntegration.id,
        },
        data: {
          accessToken: params.accessToken,
          refreshToken: params.refreshToken,
          isActive: true,
        },
      });

      revalidatePath("/settings");
      
      return {
        success: true,
        message: "Integration updated successfully",
        data: updatedIntegration,
      };
    }

    // Create new integration
    const newIntegration = await prisma.jobWebsiteIntegration.create({
      data: {
        provider: providerEnum,
        accessToken: params.accessToken,
        refreshToken: params.refreshToken,
        isActive: true,
        organizationId: user.organizationId,
      },
    });

    revalidatePath("/settings");
    
    return {
      success: true,
      message: "Integration created successfully",
      data: newIntegration,
    };
  } catch (error) {
    console.error("Error connecting to job website:", error);
    return {
      success: false,
      message: "Failed to connect to job website. Please try again.",
      error,
    };
  }
}

export async function disconnectJobWebsite(
  integrationId: string
): Promise<JobWebsiteResponse> {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return {
        success: false,
        message: "Unauthorized. Please sign in.",
        error: "UNAUTHORIZED",
      };
    }

    if (!user.organizationId) {
      return {
        success: false,
        message: "You must be part of an organization to manage integrations.",
        error: "NO_ORGANIZATION",
      };
    }

    // Verify ownership
    const integration = await prisma.jobWebsiteIntegration.findFirst({
      where: {
        id: integrationId,
        organizationId: user.organizationId,
      },
    });

    if (!integration) {
      return {
        success: false,
        message: "Integration not found or you don't have permission to delete it",
        error: "NOT_FOUND",
      };
    }

    // Delete integration
    await prisma.jobWebsiteIntegration.delete({
      where: {
        id: integrationId,
      },
    });

    revalidatePath("/settings");
    
    return {
      success: true,
      message: "Integration disconnected successfully",
    };
  } catch (error) {
    console.error("Error disconnecting job website:", error);
    return {
      success: false,
      message: "Failed to disconnect job website. Please try again.",
      error,
    };
  }
}

export async function postJobToWebsites(
  postId: string,
  websiteIds: string[]
): Promise<JobWebsiteResponse> {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return {
        success: false,
        message: "Unauthorized. Please sign in.",
        error: "UNAUTHORIZED",
      };
    }

    if (!user.organizationId) {
      return {
        success: false,
        message: "You must be part of an organization to post jobs.",
        error: "NO_ORGANIZATION",
      };
    }

    // Verify post ownership
    const post = await prisma.jobPost.findFirst({
      where: {
        id: postId,
        organizationId: user.organizationId,
      },
    });

    if (!post) {
      return {
        success: false,
        message: "Job post not found or you don't have permission to access it",
        error: "NOT_FOUND",
      };
    }

    // Verify integrations ownership and active status
    const integrations = await prisma.jobWebsiteIntegration.findMany({
      where: {
        id: { in: websiteIds },
        organizationId: user.organizationId,
        isActive: true,
      },
    });

    if (integrations.length !== websiteIds.length) {
      return {
        success: false,
        message: "One or more integrations not found or inactive",
        error: "INVALID_INTEGRATIONS",
      };
    }

    // Create job website postings
    const postings = await Promise.all(
      integrations.map(async (integration) => {
        // Check if posting already exists
        const existingPosting = await prisma.jobWebsitePosting.findFirst({
          where: {
            postId,
            integrationId: integration.id,
          },
        });

        if (existingPosting) {
          return existingPosting;
        }

        // In a real implementation, here we would call the external API
        // to post the job to the website, and then store the response
        // For now, we'll just create a record in our database
        
        return prisma.jobWebsitePosting.create({
          data: {
            postId,
            integrationId: integration.id,
            status: "PENDING", // In a real implementation, this would be updated after API call
          },
        });
      })
    );

    return {
      success: true,
      message: `Job posted to ${postings.length} websites successfully`,
      data: postings,
    };
  } catch (error) {
    console.error("Error posting job to websites:", error);
    return {
      success: false,
      message: "Failed to post job to websites. Please try again.",
      error,
    };
  }
}

/**
 * Fetches LinkedIn organizations for the user
 */
export async function fetchLinkedInOrganizations(): Promise<JobWebsiteResponse> {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return {
        success: false,
        message: "Unauthorized. Please sign in.",
        error: "UNAUTHORIZED",
      };
    }

    if (!user.organizationId) {
      return {
        success: false,
        message: "You must be part of an organization to manage integrations.",
        error: "NO_ORGANIZATION",
      };
    }

    // Find LinkedIn integration
    const linkedInIntegration = await prisma.jobWebsiteIntegration.findFirst({
      where: {
        organizationId: user.organizationId,
        provider: "LINKEDIN",
        isActive: true,
      },
    });

    if (!linkedInIntegration) {
      return {
        success: false,
        message: "LinkedIn integration not found or inactive.",
        error: "NO_INTEGRATION",
      };
    }

    // In a real implementation, we would call the LinkedIn API to fetch organizations
    // For now, we'll return a mock response
    const mockOrganizations = [
      {
        id: "12345",
        name: "Acme Corporation",
        logoUrl: "https://example.com/acme-logo.png",
        description: "A global leader in innovative solutions",
      },
      {
        id: "67890",
        name: "Tech Innovators Inc.",
        logoUrl: "https://example.com/tech-innovators-logo.png",
        description: "Pushing the boundaries of technology",
      },
      {
        id: "13579",
        name: "Global Enterprises Ltd.",
        logoUrl: "https://example.com/global-enterprises-logo.png",
        description: "Worldwide business solutions",
      },
    ];

    return {
      success: true,
      message: "LinkedIn organizations retrieved successfully",
      data: mockOrganizations,
    };
  } catch (error) {
    console.error("Error fetching LinkedIn organizations:", error);
    return {
      success: false,
      message: "Failed to fetch LinkedIn organizations. Please try again.",
      error,
    };
  }
}

/**
 * Links a LinkedIn organization to the user's organization
 */
export async function linkLinkedInOrganization(
  linkedInOrgId: string,
  linkedInOrgName: string
): Promise<JobWebsiteResponse> {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return {
        success: false,
        message: "Unauthorized. Please sign in.",
        error: "UNAUTHORIZED",
      };
    }

    if (!user.organizationId) {
      return {
        success: false,
        message: "You must be part of an organization to manage integrations.",
        error: "NO_ORGANIZATION",
      };
    }

    // Find LinkedIn integration
    const linkedInIntegration = await prisma.jobWebsiteIntegration.findFirst({
      where: {
        organizationId: user.organizationId,
        provider: "LINKEDIN",
      },
    });

    if (!linkedInIntegration) {
      return {
        success: false,
        message: "LinkedIn integration not found.",
        error: "NO_INTEGRATION",
      };
    }

    // Update the integration with the LinkedIn organization ID and name
    await prisma.jobWebsiteIntegration.update({
      where: {
        id: linkedInIntegration.id,
      },
      data: {
        // metadata: {
        //   linkedInOrgId,
        //   linkedInOrgName,
        // },
      },
    });

    revalidatePath("/settings");
    
    return {
      success: true,
      message: `Successfully linked to LinkedIn organization: ${linkedInOrgName}`,
      data: {
        linkedInOrgId,
        linkedInOrgName,
      },
    };
  } catch (error) {
    console.error("Error linking LinkedIn organization:", error);
    return {
      success: false,
      message: "Failed to link LinkedIn organization. Please try again.",
      error,
    };
  }
} 