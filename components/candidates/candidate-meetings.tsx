"use client";

import { format } from "date-fns";
import { Calendar, Link as LinkIcon, MapPin, Video } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlanMeetingDialog } from "./plan-meeting-dialog";
import type { Match, JobPost } from "@prisma/client";

interface CandidateMeetingsProps {
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  matches: Array<Match & {
    post: Pick<JobPost, "title">;
  }>;
}

export function CandidateMeetings({
  candidateId,
  candidateName,
  candidateEmail,
  matches = []
}: CandidateMeetingsProps) {
  // Filter matches that have interview details
  const scheduledInterviews = matches.filter(
    (match) => match.status === "INTERVIEWING" && match.interviewDetails
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Scheduled Interviews</CardTitle>
        <PlanMeetingDialog
          candidateId={candidateId}
          candidateEmail={candidateEmail}
          candidateName={candidateName}
        />
      </CardHeader>
      <CardContent className="grid gap-4">
        {scheduledInterviews.length === 0 ? (
          <div className="flex h-24 items-center justify-center rounded-md border border-dashed">
            <p className="text-sm text-muted-foreground">
              No interviews scheduled yet
            </p>
          </div>
        ) : (
          scheduledInterviews.map((match) => {
            const details = match.interviewDetails as any;
            return (
              <div
                key={match.id}
                className="flex items-start justify-between rounded-lg border p-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">
                      Interview for {match.post.title}
                    </h4>
                    <Badge variant={details.type === "ONLINE" ? "default" : "secondary"}>
                      {details.type === "ONLINE" ? (
                        <Video className="mr-1 size-3" />
                      ) : (
                        <MapPin className="mr-1 size-3" />
                      )}
                      {details.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="size-4" />
                      <span>{format(new Date(details.date), "PPP")}</span>
                    </div>
                    <span>{details.time}</span>
                  </div>
                  {details.location && (
                    <p className="flex items-center gap-1 text-sm">
                      <MapPin className="size-4" />
                      {details.location}
                    </p>
                  )}
                  {details.meetLink && (
                    <Button
                      variant="link"
                      className="h-auto p-0 text-sm"
                    >
                      <a
                        href={details.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                      >
                        <LinkIcon className="size-4" />
                        Join Meeting
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
} 