"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { confirmInterview } from "@/actions/confirm-interview";

interface MatchData {
  id: string;
  post: {
    title: string;
    companyName: string;
  };
  interviewDetails: {
    type: "ONLINE" | "IN_PERSON";
    date: string;
    time: string;
    location?: string;
    meetLink?: string;
  } | null;
}

interface InterviewConfirmationFormProps {
  match: MatchData;
}

export function InterviewConfirmationForm({
  match,
}: InterviewConfirmationFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Guard against invalid data
  if (!match || !match.post) {
    return (
      <div className="container mx-auto max-w-2xl py-12">
        <div className="rounded-lg border bg-card p-8 shadow">
          <h1 className="text-2xl font-semibold">Invalid Match Data</h1>
          <p className="mt-2 text-muted-foreground">
            Sorry, we couldn&apos;t load the interview details.
          </p>
        </div>
      </div>
    );
  }

  async function handleConfirm(formData: FormData) {
    setIsPending(true);
    try {
      const result = await confirmInterview(match.id);
      
      if (result.success) {
        toast.success("Interview confirmed successfully!");
        setIsConfirmed(true);
      } else {
        toast.error("Failed to confirm interview. Please try again.");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  if (isConfirmed) {
    return (
      <div className="container mx-auto max-w-2xl py-12">
        <div className="rounded-lg border bg-card p-8 shadow">
          <div className="flex flex-col items-center text-center">
            <CheckCircle className="h-16 w-16 text-primary mb-4" />
            <h1 className="text-2xl font-semibold">Interview Confirmed!</h1>
            <p className="mt-2 text-muted-foreground">
              Your interview for the {match.post.title} position at{" "}
              {match.post.companyName} has been confirmed.
            </p>

            <div className="mt-6 w-full rounded-md bg-muted p-4">
              <h2 className="font-medium text-center mb-4">Interview Details</h2>
              <div className="space-y-2 text-sm">
                <p>
                  Type: {match.interviewDetails?.type === "ONLINE" ? "Online Meeting" : "In-Person"}
                </p>
                <p>Date: {format(new Date(match.interviewDetails?.date!), "PPP")}</p>
                <p>Time: {match.interviewDetails?.time}</p>
                {match.interviewDetails?.location && (
                  <p>Location: {match.interviewDetails.location}</p>
                )}
                {match.interviewDetails?.meetLink && (
                  <p>
                    Meeting Link:{" "}
                    <a
                      href={match.interviewDetails.meetLink}
                      className="text-primary hover:underline"
                    >
                      Join Meeting
                    </a>
                  </p>
                )}
              </div>
            </div>

            <p className="mt-6 text-sm text-muted-foreground">
              A confirmation email has been sent to your email address.
              Please make sure to add this to your calendar.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!match.interviewDetails) {
    return (
      <div className="container mx-auto max-w-2xl py-12">
        <div className="rounded-lg border bg-card p-8 shadow">
          <h1 className="text-2xl font-semibold">Interview Details Not Found</h1>
          <p className="mt-2 text-muted-foreground">
            Sorry, we couldn&apos;t find the interview details for this confirmation.
          </p>
        </div>
      </div>
    );
  }

  const { type, date, time, location, meetLink } = match.interviewDetails;

  return (
    <div className="container mx-auto max-w-2xl py-12">
      <div className="rounded-lg border bg-card p-8 shadow">
        <h1 className="text-2xl font-semibold">Interview Confirmation</h1>
        <p className="mt-2 text-muted-foreground">
          Please confirm your interview for the {match.post.title} position at{" "}
          {match.post.companyName}.
        </p>

        <div className="mt-6 space-y-4">
          <div className="rounded-md bg-muted p-4">
            <h2 className="font-medium">Interview Details</h2>
            <div className="mt-2 space-y-2 text-sm">
              <p>
                Type: {type === "ONLINE" ? "Online Meeting" : "In-Person"}
              </p>
              <p>Date: {format(new Date(date), "PPP")}</p>
              <p>Time: {time}</p>
              {location && <p>Location: {location}</p>}
              {meetLink && (
                <p>
                  Meeting Link:{" "}
                  <a
                    href={meetLink}
                    className="text-primary hover:underline"
                  >
                    Join Meeting
                  </a>
                </p>
              )}
            </div>
          </div>

          <form action={handleConfirm}>
            <Button 
              type="submit" 
              className="w-full"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirming...
                </>
              ) : (
                "Confirm Interview"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
} 