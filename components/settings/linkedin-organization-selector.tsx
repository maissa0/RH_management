"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Building2, Check } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { fetchLinkedInOrganizations, linkLinkedInOrganization } from "@/actions/job-website-integrations.server";

type LinkedInOrganization = {
  id: string;
  name: string;
  logoUrl?: string;
  description?: string;
};

interface LinkedInOrganizationSelectorProps {
  integrationId: string;
  selectedOrgId?: string;
  selectedOrgName?: string;
  onOrganizationLinked?: () => void;
}

export function LinkedInOrganizationSelector({
  integrationId,
  selectedOrgId,
  selectedOrgName,
  onOrganizationLinked
}: LinkedInOrganizationSelectorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [organizations, setOrganizations] = useState<LinkedInOrganization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<LinkedInOrganization | null>(
    selectedOrgId && selectedOrgName 
      ? { id: selectedOrgId, name: selectedOrgName } 
      : null
  );

  const loadOrganizations = async () => {
    setIsLoading(true);
    try {
      const result = await fetchLinkedInOrganizations();
      if (result.success) {
        setOrganizations(result.data || []);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error loading LinkedIn organizations:", error);
      toast.error("Failed to load LinkedIn organizations");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOrganization = async (org: LinkedInOrganization) => {
    try {
      const result = await linkLinkedInOrganization(org.id, org.name);
      if (result.success) {
        setSelectedOrg(org);
        toast.success(result.message);
        setIsDialogOpen(false);
        if (onOrganizationLinked) {
          onOrganizationLinked();
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error linking LinkedIn organization:", error);
      toast.error("Failed to link LinkedIn organization");
    }
  };

  useEffect(() => {
    if (isDialogOpen) {
      loadOrganizations();
    }
  }, [isDialogOpen]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium">LinkedIn Organization</h4>
          <p className="text-sm text-muted-foreground">
            Select the LinkedIn organization to use for job posting
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              {selectedOrg ? "Change Organization" : "Select Organization"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select LinkedIn Organization</DialogTitle>
              <DialogDescription>
                Choose the LinkedIn organization you want to use for posting jobs
              </DialogDescription>
            </DialogHeader>
            
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
              </div>
            ) : organizations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Building2 className="size-12 text-muted-foreground opacity-50" />
                <p className="text-center text-muted-foreground">
                  No LinkedIn organizations found
                </p>
              </div>
            ) : (
              <div className="grid gap-4 py-4">
                {organizations.map((org) => (
                  <Card 
                    key={org.id} 
                    className={`cursor-pointer transition-all hover:shadow-md ${selectedOrg?.id === org.id ? 'border-primary' : ''}`}
                    onClick={() => handleSelectOrganization(org)}
                  >
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="relative h-10 w-10 overflow-hidden rounded-md">
                            {org.logoUrl ? (
                              <Image
                                src={org.logoUrl}
                                alt={org.name}
                                fill
                                className="object-contain"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-primary/10">
                                <span className="text-primary font-bold">{org.name.charAt(0)}</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <CardTitle className="text-base">{org.name}</CardTitle>
                            {org.description && (
                              <CardDescription className="text-xs line-clamp-1">
                                {org.description}
                              </CardDescription>
                            )}
                          </div>
                        </div>
                        {selectedOrg?.id === org.id && <Check className="size-4 text-primary" />}
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {selectedOrg && (
        <Card>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center space-x-2">
              <div className="relative h-8 w-8 overflow-hidden rounded-md">
                {selectedOrg.logoUrl ? (
                  <Image
                    src={selectedOrg.logoUrl}
                    alt={selectedOrg.name}
                    fill
                    className="object-contain"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-primary/10">
                    <span className="text-primary font-bold">{selectedOrg.name.charAt(0)}</span>
                  </div>
                )}
              </div>
              <div>
                <CardTitle className="text-sm">{selectedOrg.name}</CardTitle>
                <CardDescription className="text-xs">
                  Selected LinkedIn Organization
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}
    </div>
  );
} 