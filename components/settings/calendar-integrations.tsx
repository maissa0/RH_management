"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Check, X } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { signIn } from "next-auth/react";
import { 
  checkGoogleCalendarIntegration, 
  disconnectGoogleCalendar, 
  toggleGoogleCalendarActive 
} from "@/actions/calendar-integrations.server";

// Define the calendar provider information
const CALENDAR_PROVIDERS = {
  "GOOGLE": {
    name: "Google Calendar",
    logo: "/logos/google-calendar.svg",
    color: "#4285F4",
    description: "Connect to Google Calendar to schedule interviews and manage appointments.",
  },
};

type CalendarIntegrationData = {
  id: string;
  provider: string;
  isActive: boolean;
  createdAt: Date;
};

interface CalendarIntegrationsSectionProps {
  organizationId: string | null;
}

export function CalendarIntegrationsSection({ organizationId }: CalendarIntegrationsSectionProps) {
  const [integrations, setIntegrations] = useState<CalendarIntegrationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [googleAccount, setGoogleAccount] = useState<{
    id: string;
    hasCalendarScope: boolean;
  } | null>(null);

  useEffect(() => {
    if (organizationId) {
      loadIntegrations();
    } else {
      setIsLoading(false);
    }
  }, [organizationId]);

  const loadIntegrations = async () => {
    setIsLoading(true);
    try {
      // Check if the user has Google Calendar integration
      const result = await checkGoogleCalendarIntegration();
      
      if (result.success) {
        if (result.data.hasIntegration) {
          // Fetch account details
          const response = await fetch('/api/user/accounts');
          const data = await response.json();
          
          if (data.success) {
            const googleAcc = data.accounts.find((acc: any) => acc.provider === 'google');
            
            if (googleAcc) {
              setGoogleAccount({
                id: googleAcc.id,
                hasCalendarScope: true
              });
              
              setIntegrations([{
                id: googleAcc.id,
                provider: 'GOOGLE',
                isActive: true,
                createdAt: new Date(googleAcc.createdAt)
              }]);
            }
          }
        } else {
          // Check if user has Google account but without calendar scope
          const response = await fetch('/api/user/accounts');
          const data = await response.json();
          
          if (data.success) {
            const googleAcc = data.accounts.find((acc: any) => acc.provider === 'google');
            
            if (googleAcc) {
              setGoogleAccount({
                id: googleAcc.id,
                hasCalendarScope: false
              });
            }
          }
          
          setIntegrations([]);
        }
      } else {
        toast.error(result.message);
        setIntegrations([]);
      }
    } catch (error) {
      console.error("Error loading integrations:", error);
      toast.error("Failed to load integrations");
      setIntegrations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectWithOAuth = async (provider: string) => {
    if (!organizationId) return;
    
    setIsConnecting(true);
    try {
      if (provider === 'GOOGLE') {
        if (googleAccount) {
          // User already has Google account connected but without calendar scope
          // We need to re-authenticate with calendar scope
          toast.info("Reconnecting with Google to add calendar permissions");
          await signIn('google', { 
            callbackUrl: '/settings?tab=integrations',
            prompt: 'consent',
            scope: 'openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events'
          });
        } else {
          // User doesn't have Google account connected
          toast.info("Connecting to Google Calendar");
          await signIn('google', { 
            callbackUrl: '/settings?tab=integrations',
            scope: 'openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events'
          });
        }
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error connecting to calendar:", error);
      toast.error("Failed to initiate OAuth flow");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (integrationId: string, providerName: string) => {
    try {
      if (providerName === 'Google Calendar') {
        const result = await disconnectGoogleCalendar();
        if (result.success) {
          toast.success(result.message);
          // Reload integrations to reflect the changes
          await loadIntegrations();
        } else {
          toast.error(result.message || "Failed to disconnect Google Calendar");
        }
      }
    } catch (error) {
      console.error("Error disconnecting calendar:", error);
      toast.error(`Failed to disconnect from ${providerName}`);
    }
  };

  const handleToggleActive = async (integration: CalendarIntegrationData) => {
    try {
      if (integration.provider === 'GOOGLE') {
        const result = await toggleGoogleCalendarActive(!integration.isActive);
        if (result.success) {
          toast.success(result.message);
          await loadIntegrations();
        } else {
          toast.error(result.message);
        }
      }
    } catch (error) {
      toast.error("Failed to update integration status");
    }
  };

  if (!organizationId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Calendar Integrations</CardTitle>
          <CardDescription>
            You need to be part of an organization to manage calendar integrations.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Currently supporting Google Calendar integration.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 size-4" />
              Connect Calendar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect to Calendar</DialogTitle>
              <DialogDescription>
                Select a calendar service to connect with. You&apos;ll be redirected to authenticate.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-1 gap-4">
                {Object.entries(CALENDAR_PROVIDERS).map(([provider, info]) => {
                  const isConnected = integrations.some(i => i.provider === provider);
                  const isGoogleConnected = provider === 'GOOGLE' && googleAccount !== null;
                  
                  return (
                    <Card 
                      key={provider} 
                      className={`cursor-pointer transition-all hover:shadow-md ${isConnected ? 'opacity-50' : ''}`}
                      onClick={() => !isConnected && handleConnectWithOAuth(provider)}
                    >
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="relative h-8 w-8 overflow-hidden rounded-md">
                              {info.logo ? (
                                <Image
                                  src={info.logo}
                                  alt={info.name}
                                  fill
                                  className="object-contain"
                                />
                              ) : (
                                <div 
                                  className="h-full w-full flex items-center justify-center"
                                  style={{ backgroundColor: info.color }}
                                >
                                  <span className="text-white font-bold">{info.name.charAt(0)}</span>
                                </div>
                              )}
                            </div>
                            <CardTitle className="text-base">{info.name}</CardTitle>
                          </div>
                          {isConnected && <Check className="size-4 text-green-500" />}
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <p className="text-sm text-muted-foreground">{info.description}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {isConnected 
                            ? "Already connected" 
                            : isGoogleConnected 
                              ? "Connected to Google account, click to add calendar permissions" 
                              : "Click to connect"
                          }
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {integrations.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Calendar Integrations</CardTitle>
              <CardDescription>
                {googleAccount 
                  ? "Your Google account is connected, but calendar permissions are needed. Click \"Connect Calendar\" to add them."
                  : "You haven't connected any calendar services yet. Click \"Connect Calendar\" to get started."
                }
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          integrations.map((integration) => {
            const provider = CALENDAR_PROVIDERS[integration.provider as keyof typeof CALENDAR_PROVIDERS];
            return (
              <Card key={integration.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="relative h-8 w-8 overflow-hidden rounded-md">
                        {provider.logo ? (
                          <Image
                            src={provider.logo}
                            alt={provider.name}
                            fill
                            className="object-contain"
                          />
                        ) : (
                          <div 
                            className="h-full w-full flex items-center justify-center"
                            style={{ backgroundColor: provider.color }}
                          >
                            <span className="text-white font-bold">{provider.name.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                      <CardTitle>{provider.name}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={integration.isActive} 
                        onCheckedChange={() => handleToggleActive(integration)}
                      />
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDisconnect(integration.id, provider.name)}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{provider.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Connected on {new Date(integration.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
                <CardFooter>
                  <div className="flex items-center text-sm">
                    <span className={`mr-2 size-2 rounded-full ${integration.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                    {integration.isActive ? 'Active' : 'Inactive'}
                  </div>
                </CardFooter>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
} 