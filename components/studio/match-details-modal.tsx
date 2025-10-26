"use client";

import { useState } from "react";
import { sendMatchEmails } from "@/actions/send-match-emails";
import type { Match as MatchWithCandidate } from "@/types";
import { format } from "date-fns";
import { 
  BarChart, 
  Calendar, 
  Loader2, 
  Mail, 
  User,
  Video,
  MapPin,
  Link as LinkIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface MatchDetailsModalProps {
  match: MatchWithCandidate;
  isOpen: boolean;
  onClose: () => void;
}

export function MatchDetailsModal({
  match,
  isOpen,
  onClose,
}: MatchDetailsModalProps) {
  const [isSending, setIsSending] = useState(false);

  const handleSendEmail = async () => {
    if (isSending || match.emailSent) return;

    setIsSending(true);
    try {
      const response = await sendMatchEmails({
        matchIds: [match.id],
        postId: match.postId,
        interviewDetails: match.interviewDetails as any,
      });

      if (response.success) {
        toast.success(response.message);
        // Close the modal after successful send
        onClose();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error("Failed to send email:", error);
      toast.error("Failed to send email. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="h-[90vh] max-w-2xl overflow-hidden overflow-y-auto rounded-lg border bg-background shadow-lg">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-2xl font-semibold tracking-tight">
            Match Details
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Review candidate match information and actions
          </p>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <Card className="overflow-hidden border bg-muted/5 p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                  <User className="size-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight">
                    {match.candidate.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {match.candidate.email}
                  </p>
                </div>
              </div>
              <Badge
                variant={match.status === "HIRED" ? "success" : "secondary"}
                className="rounded-full px-3 py-1 text-xs font-medium"
              >
                {match.status}
              </Badge>
            </div>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BarChart className="size-5 text-primary" />
              <h4 className="font-medium">Match Score</h4>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300 ease-in-out"
                  style={{ width: `${Math.round(match.score)}%` }}
                />
              </div>
              <span className="min-w-12 text-sm font-medium tabular-nums">
                {Math.round(match.score)}%
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">Why Match</h4>
            <Card className="border bg-muted/5 p-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {match.whyMatch}
              </p>
            </Card>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="size-5 text-primary" />
                <h4 className="font-medium">Email Status</h4>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 rounded-full transition-all hover:bg-primary hover:text-primary-foreground"
                disabled={match.emailSent || isSending}
                onClick={handleSendEmail}
              >
                {isSending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="size-4" />
                    {match.emailSent ? "Email Sent" : "Send Email"}
                  </>
                )}
              </Button>
            </div>
            {match.emailSent && (
              <Card className="space-y-4 border bg-muted/5 p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Sent on{" "}
                    {match.emailSentAt
                      ? format(new Date(match.emailSentAt), "PPP")
                      : "N/A"}
                  </p>
                </div>
                {match.emailSubject && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Subject</p>
                    <p className="text-sm text-muted-foreground">
                      {match.emailSubject}
                    </p>
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Interview Details Section */}
          {match.interviewDetails && (
            <>
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar className="size-5 text-primary" />
                  <h4 className="font-medium">Interview Details</h4>
                </div>
                
                <Card className="space-y-4 border bg-muted/5 p-4">
                  <div className="flex items-center gap-2">
                    {(match.interviewDetails as any).type === "ONLINE" ? (
                      <Video className="size-4 text-muted-foreground" />
                    ) : (
                      <MapPin className="size-4 text-muted-foreground" />
                    )}
                    <p className="text-sm">
                      {(match.interviewDetails as any).type === "ONLINE" 
                        ? "Online Interview" 
                        : "In-Person Interview"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-muted-foreground" />
                    <p className="text-sm">
                      {format(new Date((match.interviewDetails as any).date), "PPP")} at{" "}
                      {(match.interviewDetails as any).time}
                    </p>
                  </div>

                  {(match.interviewDetails as any).location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="size-4 text-muted-foreground" />
                      <p className="text-sm">
                        {(match.interviewDetails as any).location}
                      </p>
                    </div>
                  )}

                  {(match.interviewDetails as any).meetLink && (
                    <div className="flex items-center gap-2">
                      <LinkIcon className="size-4 text-muted-foreground" />
                      <a
                        href={(match.interviewDetails as any).meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        Join Meeting
                      </a>
                    </div>
                  )}
                </Card>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
