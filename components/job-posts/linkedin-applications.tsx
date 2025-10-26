"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Download, ExternalLink, UserPlus, Check } from "lucide-react";
import { format, parseISO } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type LinkedInApplication = {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidateLinkedInProfile: string;
  resumeUrl: string;
  appliedAt: string;
  status: string;
  imported?: boolean;
};

interface LinkedInApplicationsProps {
  jobPostId: string;
}

export function LinkedInApplications({ jobPostId }: LinkedInApplicationsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [isImporting, setIsImporting] = useState<Record<string, boolean>>({});
  const [applications, setApplications] = useState<LinkedInApplication[]>([]);
  const [jobPosting, setJobPosting] = useState<{
    jobPostingId: string;
    externalJobId: string;
    externalJobUrl: string;
  } | null>(null);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/linkedin/applications?jobPostId=${jobPostId}`);
      const data = await response.json();

      if (data.success) {
        setApplications(data.data.applications || []);
        setJobPosting({
          jobPostingId: data.data.jobPostingId,
          externalJobId: data.data.externalJobId,
          externalJobUrl: data.data.externalJobUrl,
        });
      } else {
        toast.error(data.error || "Failed to fetch LinkedIn applications");
      }
    } catch (error) {
      console.error("Error fetching LinkedIn applications:", error);
      toast.error("Failed to fetch LinkedIn applications");
    } finally {
      setIsLoading(false);
    }
  };

  const postJobToLinkedIn = async () => {
    setIsPosting(true);
    try {
      const response = await fetch("/api/linkedin/post-job", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobPostId }),
      });
      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        // Fetch applications after posting
        fetchApplications();
      } else {
        toast.error(data.error || "Failed to post job to LinkedIn");
      }
    } catch (error) {
      console.error("Error posting job to LinkedIn:", error);
      toast.error("Failed to post job to LinkedIn");
    } finally {
      setIsPosting(false);
    }
  };

  const importCandidate = async (application: LinkedInApplication) => {
    setIsImporting((prev) => ({ ...prev, [application.id]: true }));
    try {
      // In a real implementation, we would call an API to import the candidate
      // For now, we'll simulate a successful import
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Mark the application as imported
      setApplications((prev) =>
        prev.map((app) =>
          app.id === application.id ? { ...app, imported: true } : app
        )
      );
      
      toast.success(`Successfully imported ${application.candidateName}`);
    } catch (error) {
      console.error("Error importing candidate:", error);
      toast.error(`Failed to import ${application.candidateName}`);
    } finally {
      setIsImporting((prev) => ({ ...prev, [application.id]: false }));
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [jobPostId]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If job is not posted to LinkedIn yet
  if (!jobPosting) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>LinkedIn Applications</CardTitle>
          <CardDescription>
            Post this job to LinkedIn to receive applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Download className="size-12 text-muted-foreground opacity-50" />
            <p className="text-center text-muted-foreground">
              This job is not posted to LinkedIn yet
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full" 
            onClick={postJobToLinkedIn}
            disabled={isPosting}
          >
            {isPosting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Posting to LinkedIn...
              </>
            ) : (
              <>
                <ExternalLink className="mr-2 size-4" />
                Post to LinkedIn
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>LinkedIn Applications</CardTitle>
            <CardDescription>
              Applications received from LinkedIn
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.open(jobPosting.externalJobUrl, '_blank')}
          >
            <ExternalLink className="mr-2 size-4" />
            View on LinkedIn
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Download className="size-12 text-muted-foreground opacity-50" />
            <p className="text-center text-muted-foreground">
              No applications received yet
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <div key={application.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {application.candidateName.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">{application.candidateName}</h4>
                      <p className="text-sm text-muted-foreground">{application.candidateEmail}</p>
                      <div className="flex items-center mt-1">
                        <Badge variant="outline" className="text-xs">
                          Applied {format(parseISO(application.appliedAt), "MMM d, yyyy")}
                        </Badge>
                        <a 
                          href={application.candidateLinkedInProfile} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ml-2 text-xs text-primary hover:underline flex items-center"
                        >
                          <ExternalLink className="mr-1 size-3" />
                          LinkedIn Profile
                        </a>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant={application.imported ? "outline" : "default"}
                    size="sm"
                    onClick={() => !application.imported && importCandidate(application)}
                    disabled={isImporting[application.id] || application.imported}
                  >
                    {isImporting[application.id] ? (
                      <>
                        <Loader2 className="mr-1 size-3 animate-spin" />
                        Importing...
                      </>
                    ) : application.imported ? (
                      <>
                        <Check className="mr-1 size-3" />
                        Imported
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-1 size-3" />
                        Import Candidate
                      </>
                    )}
                  </Button>
                </div>
                
                <Separator className="my-3" />
                
                <div className="flex justify-between items-center">
                  <div className="text-sm">
                    <a 
                      href={application.resumeUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center"
                    >
                      <Download className="mr-1 size-3" />
                      Download Resume
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          className="w-full"
          onClick={fetchApplications}
        >
          <Loader2 className="mr-2 size-4" />
          Refresh Applications
        </Button>
      </CardFooter>
    </Card>
  );
} 