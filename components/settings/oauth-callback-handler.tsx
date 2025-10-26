"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface OAuthCallbackHandlerProps {
  success: boolean;
  error?: string;
  provider: string;
}

export function OAuthCallbackHandler({ success, error, provider }: OAuthCallbackHandlerProps) {
  const router = useRouter();
  const formattedProvider = provider.charAt(0).toUpperCase() + provider.slice(1).toLowerCase();

  useEffect(() => {
    if (success) {
      toast.success(`Successfully connected to ${formattedProvider}`);
      // Navigate to the integrations tab
      router.push("/settings?tab=integrations");
    } else if (error) {
      let errorMessage = `Failed to connect to ${formattedProvider}`;
      
      // Provide more specific error messages based on error code
      switch (error) {
        case "oauth_error":
          errorMessage = `${formattedProvider} authentication failed`;
          break;
        case "missing_params":
          errorMessage = `Missing required parameters for ${formattedProvider} authentication`;
          break;
        case "invalid_state":
          errorMessage = `Invalid or expired authentication session for ${formattedProvider}`;
          break;
        case "token_exchange":
          errorMessage = `Failed to exchange authorization code with ${formattedProvider}`;
          break;
        case "connection_failed":
          errorMessage = `Failed to save ${formattedProvider} connection`;
          break;
        case "server_error":
          errorMessage = `Server error while connecting to ${formattedProvider}`;
          break;
      }
      
      toast.error(errorMessage);
      // Navigate to the integrations tab
      router.push("/settings?tab=integrations");
    }
  }, [success, error, provider, formattedProvider, router]);

  // This component doesn't render anything visible
  return null;
} 