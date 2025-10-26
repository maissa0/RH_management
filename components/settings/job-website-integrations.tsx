"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Check, X } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { 
  connectJobWebsite, 
  disconnectJobWebsite, 
  getJobWebsiteIntegrations,
  initiateOAuthFlow
} from "@/actions/job-website-integrations.server";
import { LinkedInOrganizationSelector } from "@/components/settings/linkedin-organization-selector";

// Define the provider information
const PROVIDERS = {
  "LINKEDIN": {
    name: "LinkedIn",
    logo: "/logos/linkedin.svg",
    color: "#0077B5",
    description: "Post jobs directly to LinkedIn and reach millions of professionals.",
  },
  "INDEED": {
    name: "Indeed",
    logo: "/logos/indeed.svg",
    color: "#003A9B",
    description: "Connect to Indeed to post jobs and reach millions of job seekers.",
  },
  "GLASSDOOR": {
    name: "Glassdoor",
    logo: "/logos/glassdoor.svg",
    color: "#0CAA41",
    description: "Post jobs on Glassdoor to reach qualified candidates.",
  },
  "MONSTER": {
    name: "Monster",
    logo: "/logos/monster.svg",
    color: "#6E00FF",
    description: "Connect to Monster to post jobs and find the right talent.",
  },
  "ZIPRECRUITER": {
    name: "ZipRecruiter",
    logo: "/logos/ziprecruiter.svg",
    color: "#1D9CEA",
    description: "Post to ZipRecruiter and distribute your jobs to 100+ job sites.",
  },
};

type IntegrationData = {
  id: string;
  provider: string;
  isActive: boolean;
  createdAt: Date;
  metadata?: any;
};

interface JobWebsiteIntegrationsSectionProps {
  organizationId: string | null;
}

export function JobWebsiteIntegrationsSection({ organizationId }: JobWebsiteIntegrationsSectionProps) {
  const [integrations, setIntegrations] = useState<IntegrationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (organizationId) {
      loadIntegrations();
    } else {
      setIsLoading(false);
    }
  }, [organizationId]);

  const loadIntegrations = async () => {
    if (!organizationId) return;
    
    setIsLoading(true);
    try {
      const result = await getJobWebsiteIntegrations();
      if (result.success) {
        setIntegrations(result.data || []);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to load integrations");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectWithOAuth = async (provider: string) => {
    if (!organizationId) return;
    
    setIsConnecting(true);
    try {
      const result = await initiateOAuthFlow(provider);
      
      if (result.success && result.data?.authUrl) {
        // Open the OAuth authorization URL in a new window
        window.open(result.data.authUrl, "_blank", "width=600,height=700");
        toast.info("Please complete the authentication in the opened window");
        
        // Close the dialog after initiating OAuth
        setIsDialogOpen(false);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to initiate OAuth flow");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (integrationId: string, providerName: string) => {
    try {
      const result = await disconnectJobWebsite(integrationId);
      if (result.success) {
        toast.success(`Disconnected from ${providerName}`);
        loadIntegrations();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to disconnect from job website");
    }
  };

  const handleToggleActive = async (integration: IntegrationData) => {
    try {
      const result = await connectJobWebsite({
        integrationId: integration.id,
        isActive: !integration.isActive,
      });
      
      if (result.success) {
        toast.success(`${integration.isActive ? "Disabled" : "Enabled"} ${PROVIDERS[integration.provider].name} integration`);
        loadIntegrations();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to update integration status");
    }
  };

  if (!organizationId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Job Website Integrations</CardTitle>
          <CardDescription>
            You need to be part of an organization to manage job website integrations.
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
            Connect to popular job websites to post your jobs directly from the platform.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 size-4" />
              Connect Website
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect to Job Website</DialogTitle>
              <DialogDescription>
                Select a job website to connect with. You&apos;ll be redirected to authenticate with the selected platform.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(PROVIDERS).map(([provider, info]) => {
                  const isConnected = integrations.some(i => i.provider === provider);
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
                          {isConnected ? "Already connected" : "Click to connect"}
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
              <CardTitle>No Integrations</CardTitle>
              <CardDescription>
                You haven&apos;t connected to any job websites yet. Click &quot;Connect Website&quot; to get started.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          integrations.map((integration) => {
            const provider = PROVIDERS[integration.provider];
            const isLinkedIn = integration.provider === "LINKEDIN";
            const metadata = integration.metadata as { linkedInOrgId?: string; linkedInOrgName?: string } | undefined;
            
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
                  
                  {isLinkedIn && integration.isActive && (
                    <div className="mt-4 pt-4 border-t">
                      <LinkedInOrganizationSelector 
                        integrationId={integration.id}
                        selectedOrgId={metadata?.linkedInOrgId}
                        selectedOrgName={metadata?.linkedInOrgName}
                        onOrganizationLinked={loadIntegrations}
                      />
                    </div>
                  )}
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