"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScheduleInterview } from "@/components/calendar/schedule-interview";
import { checkGoogleCalendarIntegration } from "@/actions/calendar-integrations.server";
import { toast } from "sonner";

interface PlanMeetingDialogProps {
  candidateId: string;
  candidateEmail?: string;
  candidateName?: string;
  jobTitle?: string;
}

export function PlanMeetingDialog({ 
  candidateId, 
  candidateEmail,
  candidateName,
  jobTitle,
}: PlanMeetingDialogProps) {
  const [open, setOpen] = useState(false);
  const [hasCalendarIntegration, setHasCalendarIntegration] = useState<boolean | null>(null);
  const [isCheckingIntegration, setIsCheckingIntegration] = useState(false);

  const handleOpenChange = async (isOpen: boolean) => {
    if (isOpen && hasCalendarIntegration === null) {
      setIsCheckingIntegration(true);
      try {
        const result = await checkGoogleCalendarIntegration();
        setHasCalendarIntegration(result.success && result.data.hasIntegration);
        
        if (!result.success || !result.data.hasIntegration) {
          toast.warning("Google Calendar integration not found. You can still schedule an interview, but it won't be added to your calendar automatically.");
        }
      } catch (error) {
        console.error("Error checking calendar integration:", error);
        setHasCalendarIntegration(false);
      } finally {
        setIsCheckingIntegration(false);
      }
    }
    
    setOpen(isOpen);
  };

  const handleScheduled = () => {
    setOpen(false);
    toast.success("Interview scheduled successfully!");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>Plan Meeting</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Schedule an Interview</DialogTitle>
        </DialogHeader>
        <ScheduleInterview 
          candidateEmail={candidateEmail}
          candidateName={candidateName}
          jobTitle={jobTitle}
          onScheduled={handleScheduled}
        />
      </DialogContent>
    </Dialog>
  );
}