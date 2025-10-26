"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { sendMatchEmails } from "@/actions/send-match-emails";
import { sendDecisionEmail } from "@/actions/send-decision-emails";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { MatchStatus } from "@prisma/client";
import { ChevronLeft, Loader2, Mail, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

import { useMatches } from "@/hooks/use-matches";
import { Match, MatchWithCandidate } from "@/types";

import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { MatchColumn } from "./match-column";
import { InterviewSchedulerModal } from "./interview-scheduler-modal";
import { JobCandidateUpload } from "./job-candidate-upload";
import { AcceptanceNotesModal } from "./acceptance-notes-modal";
import { DecisionModal } from "./decision-modal";
import { MatchFilters, type MatchFilters as MatchFiltersType } from "./match-filters";
import { 
  Alert,
  AlertTitle,
  AlertDescription 
} from "@/components/ui/alert";

interface MatchStudioBoardProps {
  postId: string;
  jobTitle: string;
}

const COLUMN_TITLES: Partial<Record<MatchStatus, string>> = {
  NEW: "New Matches",
  CONTACTED: "Contacted",
  INTERVIEWING: "Interviewing",
  HIRED: "Final Decision",
};

// Statuses to show in the Kanban board
const VISIBLE_STATUSES = ["NEW", "CONTACTED", "INTERVIEWING", "HIRED"] as const;

// Import the InterviewFormValues type
type InterviewFormValues = {
  type: "ONLINE" | "IN_PERSON";
  date: Date;
  time: string;
  location?: string;
  useGoogleCalendar: boolean;
  meetLink?: string;
};

// Default filters
const DEFAULT_FILTERS: MatchFiltersType = {
  minScore: 0,
  maxScore: 100
};

export function MatchStudioBoard({ postId, jobTitle }: MatchStudioBoardProps) {
  const { matches, isLoading, updateMatchStatus, fetchMatches } =
    useMatches(postId);
  const [selectedMatchIds, setSelectedMatchIds] = useState<Set<string>>(
    new Set(),
  );
  const [columns, setColumns] = useState<Record<MatchStatus, string[]>>({
    NEW: [],
    CONTACTED: [],
    INTERVIEWING: [],
    HIRED: [],
    REJECTED: [],
  });
  const [isSending, setIsSending] = useState(false);
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [selectedForInterview, setSelectedForInterview] = useState<string[]>([]);
  
  // State for modals and loading
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [isAcceptanceModalOpen, setIsAcceptanceModalOpen] = useState(false);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [showRejectionSuccess, setShowRejectionSuccess] = useState(false);
  
  // Filters state
  const [filters, setFilters] = useState<MatchFiltersType>(DEFAULT_FILTERS);
  const [filteredMatches, setFilteredMatches] = useState<Match[] | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Apply filters to matches
  useEffect(() => {
    if (!matches) {
      setFilteredMatches(null);
      return;
    }

    const filtered = matches.filter(match => 
      match.score >= filters.minScore && 
      match.score <= filters.maxScore
    );
    
    setFilteredMatches(filtered);
  }, [matches, filters]);

  // Update columns based on filtered matches
  useEffect(() => {
    if (!filteredMatches) return;

    const newColumns = Object.values(MatchStatus).reduce(
      (acc, status) => {
        if (status === "REJECTED") {
          return acc;
        }

        acc[status] = filteredMatches
          .filter((match) =>
            status === "HIRED"
              ? match.status === "HIRED" || match.status === "REJECTED"
              : match.status === status,
          )
          .map((match) => match.id);
        return acc;
      },
      {} as Record<MatchStatus, string[]>,
    );

    setColumns(newColumns);
  }, [filteredMatches]);

  const onDragEnd = useCallback(
    async (result: DropResult) => {
      const { destination, source, draggableId } = result;

      if (!destination) {
        return;
      }

      const sourceStatus = source.droppableId as MatchStatus;
      const destinationStatus = destination.droppableId as MatchStatus;

      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      ) {
        return;
      }

      const match = matches?.find((m) => m.id === draggableId);
      if (!match) {
        console.error("Match not found:", draggableId);
        return;
      }

      let newStatus = destinationStatus;

      // If dragging to "Final Decision" column, show the decision modal
      if (destinationStatus === "HIRED" && sourceStatus !== "HIRED") {
        // First, update UI optimistically to show the card in the final decision column
        setColumns((prev) => {
          const newColumns = { ...prev };
          // Remove from source column
          newColumns[sourceStatus] = prev[sourceStatus].filter(
            (id) => id !== draggableId,
          );
          // Add to destination column
          newColumns[destinationStatus] = [
            ...prev[destinationStatus].slice(0, destination.index),
            draggableId,
            ...prev[destinationStatus].slice(destination.index),
          ];
          return newColumns;
        });
        
        // Store the current match for later use
        setCurrentMatch(match);
        
        // Show the decision modal
        setIsDecisionModalOpen(true);
        
        // Return early - we'll handle the status update after user interaction with the modal
        return;
      }

      // For other columns, update status normally
      setIsUpdatingStatus(true);
      
      // Optimistically update UI first
      setColumns((prev) => {
        const newColumns = { ...prev };
        // Remove from source column
        newColumns[sourceStatus] = prev[sourceStatus].filter(
          (id) => id !== draggableId,
        );
        // Add to destination column
        const targetColumn = newStatus === "REJECTED" ? "HIRED" : newStatus;
        newColumns[targetColumn] = [
          ...prev[targetColumn].slice(0, destination.index),
          draggableId,
          ...prev[targetColumn].slice(destination.index),
        ];
        return newColumns;
      });

      // Show loading toast
      const loadingToast = toast.loading("Updating status...");

      try {
        // Update backend
        await updateMatchStatus(draggableId, newStatus);
        // Dismiss loading toast and show success
        toast.dismiss(loadingToast);
        toast.success("Status updated successfully");
      } catch (error) {
        console.error("Failed to update match status:", error);
        // Dismiss loading toast and show error
        toast.dismiss(loadingToast);
        
        // Revert the columns to their previous state on error
        setColumns((prev) => {
          const newColumns = { ...prev };
          Object.values(MatchStatus).forEach((status) => {
            newColumns[status] = prev[status].filter(
              (id) => id !== draggableId,
            );
          });
          newColumns[match.status].push(draggableId);
          return newColumns;
        });
        toast.error("Failed to update match status. Please try again.");
      } finally {
        setIsUpdatingStatus(false);
      }
    },
    [matches, updateMatchStatus],
  );

  // Handle acceptance decision
  const handleAccept = useCallback(() => {
    if (!currentMatch) return;
    
    // Close the decision modal
    setIsDecisionModalOpen(false);
    
    // Show the acceptance notes modal
    setIsAcceptanceModalOpen(true);
  }, [currentMatch]);

  // Handle rejection decision
  const handleReject = useCallback(async () => {
    if (!currentMatch) return;
    
    try {
      // Send rejection email
      const result = await sendDecisionEmail({
        matchId: currentMatch.id,
        postId,
        isAccepted: false,
      });
      
      if (result.success) {
        // Show success message
        setShowRejectionSuccess(true);
        setTimeout(() => {
          setShowRejectionSuccess(false);
        }, 3000);
        
        // Update the UI to reflect the rejection
        await fetchMatches();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Failed to send rejection email:", error);
      toast.error("Failed to send rejection email. Please try again.");
      throw error; // Re-throw to be caught by the DecisionModal
    }
  }, [currentMatch, postId, fetchMatches]);

  // Handle successful acceptance email sending
  const handleAcceptanceSuccess = useCallback(async () => {
    // Refresh the matches to update the UI
    await fetchMatches();
  }, [fetchMatches]);

  const handleMatchSelect = useCallback(
    (matchId: string, selected: boolean) => {
      setSelectedMatchIds((prev) => {
        const next = new Set(prev);
        if (selected) {
          next.add(matchId);
        } else {
          next.delete(matchId);
        }
        return next;
      });
    },
    [],
  );

  const handleScheduleInterview = useCallback(async (values: InterviewFormValues, matchId: string) => {
    setIsSending(true);
    try {
      // Generate Google Meet link if online interview
      let meetLink;
      if (values.type === "ONLINE") {
        const response = await fetch("/api/meetings/create", {
          method: "POST",
          body: JSON.stringify({
            date: values.date,
            time: values.time,
          }),
        });
        const data = await response.json();
        meetLink = data.meetLink;
      }

      // Send email with interview details for single candidate
      const response = await sendMatchEmails({
        matchIds: [matchId], // Send to single candidate
        postId,
        interviewDetails: {
          ...values,
          meetLink,
        },
      });

      if (response.success) {
        toast.success(response.message);
        // Don't clear all selections, just remove the processed one
        setSelectedMatchIds((prev) => {
          const next = new Set(prev);
          next.delete(matchId);
          return next;
        });
        await fetchMatches();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error("Failed to schedule interview:", error);
      toast.error("Failed to schedule interview. Please try again.");
    } finally {
      setIsSending(false);
    }
  }, [postId, fetchMatches]);

  const handleSendEmails = useCallback(() => {
    const selectedCount = selectedMatchIds.size;
    if (selectedCount === 0) {
      toast.error("Please select at least one candidate");
      return;
    }
    
    // Check if any selected matches are not in NEW status
    const nonNewMatches = filteredMatches?.filter(
      m => selectedMatchIds.has(m.id) && m.status !== "NEW"
    );
    
    if (nonNewMatches && nonNewMatches.length > 0) {
      toast.warning(`${nonNewMatches.length} selected candidate(s) are already in progress. Only candidates in the 'New Matches' column will receive initial contact emails.`);
    }
    
    // Only schedule interviews for NEW status matches
    const newMatchIds = filteredMatches
      ?.filter(m => m.status === "NEW" && selectedMatchIds.has(m.id))
      .map(m => m.id) || [];
      
    if (newMatchIds.length === 0) {
      toast.error("Please select at least one candidate from the 'New Matches' column");
      return;
    }
    
    // Convert selected matches to array and set for interview scheduling
    setSelectedForInterview(newMatchIds);
    setIsSchedulerOpen(true);
  }, [selectedMatchIds, filteredMatches]);
  
  const handleBulkSendEmails = useCallback(async (values: InterviewFormValues) => {
    setIsSending(true);
    
    // Show loading toast
    const loadingToast = toast.loading(`Sending emails to ${selectedForInterview.length} candidates...`);
    
    try {
      // Generate Google Meet link if online interview
      let meetLink;
      if (values.type === "ONLINE") {
        const response = await fetch("/api/meetings/create", {
          method: "POST",
          body: JSON.stringify({
            date: values.date,
            time: values.time,
          }),
        });
        const data = await response.json();
        meetLink = data.meetLink;
      }

      // Send emails to all selected candidates
      const response = await sendMatchEmails({
        matchIds: selectedForInterview,
        postId,
        interviewDetails: {
          ...values,
          meetLink,
        },
      });

      if (response.success) {
        // Dismiss loading toast and show success
        toast.dismiss(loadingToast);
        toast.success(`Successfully sent emails to ${selectedForInterview.length} candidates`);
        
        // Clear selections
        setSelectedMatchIds(new Set());
        setSelectedForInterview([]);
        setIsSchedulerOpen(false);
        
        // Refresh matches
        await fetchMatches();
      } else {
        // Dismiss loading toast and show error
        toast.dismiss(loadingToast);
        toast.error(response.message);
      }
    } catch (error) {
      console.error("Failed to send emails:", error);
      // Dismiss loading toast and show error
      toast.dismiss(loadingToast);
      toast.error("Failed to send emails. Please try again.");
    } finally {
      setIsSending(false);
    }
  }, [selectedForInterview, postId, fetchMatches]);
  
  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: MatchFiltersType) => {
    setFilters(newFilters);
  }, []);
  
  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const selectedMatches = filteredMatches?.filter(
    (m) => selectedMatchIds.has(m.id),
  );

  const selectedMatchesForInterview = (filteredMatches as MatchWithCandidate[] | undefined)?.filter(
    (m) => selectedForInterview.includes(m.id)
  ) ?? [];
  
  // Calculate match counts for each status
  const matchCounts = filteredMatches ? VISIBLE_STATUSES.reduce((acc, status) => {
    acc[status] = filteredMatches.filter(m => 
      status === "HIRED" 
        ? m.status === "HIRED" || m.status === "REJECTED"
        : m.status === status
    ).length;
    return acc;
  }, {} as Record<string, number>) : {};
  
  // Calculate total counts (before filtering)
  const totalCounts = matches ? VISIBLE_STATUSES.reduce((acc, status) => {
    acc[status] = matches.filter(m => 
      status === "HIRED" 
        ? m.status === "HIRED" || m.status === "REJECTED"
        : m.status === status
    ).length;
    return acc;
  }, {} as Record<string, number>) : {};

  if (isLoading) {
    return <Skeleton className="h-[600px] w-full" />;
  }

  return (
    <>
      {showRejectionSuccess && (
        <Alert className="mb-4 bg-red-50 border-red-200">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Candidate Rejected</AlertTitle>
          <AlertDescription className="text-red-700">
            A rejection email has been sent to the candidate.
          </AlertDescription>
        </Alert>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="space-y-6 max-w-full overflow-hidden">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <Button variant="ghost" size="sm" className="gap-2">
                <Link
                  href={`/posts/${postId}`}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="size-4" />
                  Back to Job
                </Link>
              </Button>
              <h1 className="text-xl font-semibold">{jobTitle}</h1>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <MatchFilters 
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
              />
              <JobCandidateUpload jobPostId={postId} onUploadComplete={fetchMatches} />
              {selectedMatches && selectedMatches.length > 0 ? (
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={handleSendEmails}
                  disabled={isSending}
                >
                  {isSending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="size-4" />
                      Send Emails ({selectedMatches.length})
                    </>
                  )}
                </Button>
              ) : (
                <div className="text-sm text-muted-foreground italic">
                  Select candidates using checkboxes to send emails
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-4">
            {VISIBLE_STATUSES.map((status) => (
              <Droppable key={status} droppableId={status} type="match">
                {(provided) => (
                  <MatchColumn
                    title={COLUMN_TITLES[status]!}
                    matches={
                      filteredMatches?.filter((m) =>
                        status === "HIRED"
                          ? m.status === "HIRED" || m.status === "REJECTED"
                          : m.status === status,
                      ) ?? []
                    }
                    provided={provided}
                    selectedMatches={selectedMatchIds}
                    onMatchSelect={handleMatchSelect}
                    totalCount={totalCounts[status]}
                  />
                )}
              </Droppable>
            ))}
          </div>
        </div>
      </DragDropContext>

      {isSchedulerOpen && selectedMatchesForInterview.length > 0 && (
        <InterviewSchedulerModal
          isOpen={isSchedulerOpen}
          onClose={() => setIsSchedulerOpen(false)}
          matches={selectedMatchesForInterview}
          onSchedule={handleScheduleInterview}
          onBulkSchedule={handleBulkSendEmails}
          isSending={isSending}
        />
      )}

      {isDecisionModalOpen && currentMatch && (
        <DecisionModal
          match={currentMatch}
          postId={postId}
          isOpen={isDecisionModalOpen}
          onClose={() => setIsDecisionModalOpen(false)}
          onAccept={handleAccept}
          onReject={handleReject}
        />
      )}

      {isAcceptanceModalOpen && currentMatch && (
        <AcceptanceNotesModal
          match={currentMatch}
          postId={postId}
          isOpen={isAcceptanceModalOpen}
          onClose={() => setIsAcceptanceModalOpen(false)}
          onSuccess={handleAcceptanceSuccess}
        />
      )}
    </>
  );
}
