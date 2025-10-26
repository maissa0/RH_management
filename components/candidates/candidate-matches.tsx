import { useState } from "react";
import Link from "next/link";
import { submitFeedback as submitFeedbackAction } from "@/actions/matches";
import type { JobPost, Match as PrismaMatch, MatchNote, MatchStatus } from "@prisma/client";
import {
  AlertCircle,
  ArrowRight,
  ExternalLink,
  ThumbsDown,
  ThumbsUp,
  Calendar,
  Video,
  MapPin,
  Link as LinkIcon,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface InterviewDetails {
  type: "ONLINE" | "IN_PERSON";
  date: string;
  time: string;
  location?: string;
  meetLink?: string;
}

type Match = PrismaMatch & {
  post: Pick<JobPost, "id" | "title" | "description" | "status">;
  notes: MatchNote[];
  interviewDetails?: InterviewDetails;
}

interface CandidateMatchesProps {
  matches: Match[];
}

interface LoadingState {
  matchId: string;
  isLoading: boolean;
}

function getStatusColor(
  status: MatchStatus,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "NEW":
      return "secondary";
    case "CONTACTED":
      return "default";
    case "INTERVIEWING":
      return "secondary";
    case "HIRED":
      return "default";
    case "REJECTED":
      return "destructive";
    default:
      return "outline";
  }
}

function getScoreColor(
  score: number,
): "default" | "success" | "warning" | "destructive" {
  if (score >= 75) return "success";
  if (score >= 50) return "warning";
  return "destructive";
}

function getFeedbackColor(feedback: number | null, isLike: boolean): string {
  return cn("transition-colors", {
    "text-green-500": feedback === 1 && isLike,
    "text-red-500": feedback === -1 && !isLike,
    "text-gray-500": (feedback !== 1 && isLike) || (feedback !== -1 && !isLike),
    "hover:bg-green-50": isLike,
    "hover:bg-red-50": !isLike,
  });
}

function MatchMeetingDetails({ match }: { match: Match }) {
  if (!match.interviewDetails) return null;

  const { type, date, time, location, meetLink } = match.interviewDetails;

  return (
    <div className="mt-4 rounded-md bg-muted p-4">
      <h4 className="flex items-center gap-2 text-sm font-medium">
        <Calendar className="size-4" />
        Interview Details
      </h4>
      <div className="mt-2 space-y-2 text-sm">
        <div className="flex items-center gap-2">
          {type === "ONLINE" ? (
            <Video className="size-4 text-muted-foreground" />
          ) : (
            <MapPin className="size-4 text-muted-foreground" />
          )}
          <span>{type === "ONLINE" ? "Online Meeting" : "In-Person Interview"}</span>
        </div>
        <p className="flex items-center gap-2">
          <Calendar className="size-4 text-muted-foreground" />
          {format(new Date(date), "PPP")} at {time}
        </p>
        {location && (
          <p className="flex items-center gap-2">
            <MapPin className="size-4 text-muted-foreground" />
            {location}
          </p>
        )}
        {meetLink && (
          <Button
            variant="link"
            className="h-auto p-0"
          >
            <a
              href={meetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <LinkIcon className="size-4" />
              Join Meeting
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}

export function CandidateMatches({ matches }: CandidateMatchesProps) {
  const [loadingStates, setLoadingStates] = useState<LoadingState[]>([]);

  const isMatchLoading = (matchId: string) =>
    loadingStates.some((state) => state.matchId === matchId && state.isLoading);

  if (!matches.length) {
    return (
      <Alert variant="default">
        <AlertCircle className="size-5" />
        <AlertDescription>
          No matches found for this candidate yet. The matching process will run
          automatically for new job posts.
        </AlertDescription>
      </Alert>
    );
  }

  async function submitFeedback(matchId: string, feedback: 1 | -1) {
    try {
      setLoadingStates((prev) => [...prev, { matchId, isLoading: true }]);
      await submitFeedbackAction(matchId, feedback);
      toast.success("Feedback submitted successfully");
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      toast.error("Failed to submit feedback");
    } finally {
      setLoadingStates((prev) =>
        prev.filter((state) => state.matchId !== matchId),
      );
    }
  }

  return (
    <div className="grid gap-4">
      {matches.map((match) => (
        <Card key={match.id}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle>{match.post.title}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant={getStatusColor(match.status)}>
                  {match.status}
                </Badge>
                <Badge className={getScoreColor(match.score)} variant="outline">
                  {Math.round(match.score)}%
                </Badge>
                <span>
                  Updated {new Date(match.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <form action={() => submitFeedback(match.id, 1)}>
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  disabled={isMatchLoading(match.id)}
                  className={cn(
                    getFeedbackColor(match.feedback, true),
                    isMatchLoading(match.id) && "cursor-not-allowed opacity-50",
                  )}
                >
                  <ThumbsUp
                    className={cn(
                      "size-4",
                      isMatchLoading(match.id) && "animate-pulse",
                    )}
                  />
                </Button>
              </form>
              <form action={() => submitFeedback(match.id, -1)}>
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  disabled={isMatchLoading(match.id)}
                  className={cn(
                    getFeedbackColor(match.feedback, false),
                    isMatchLoading(match.id) && "cursor-not-allowed opacity-50",
                  )}
                >
                  <ThumbsDown
                    className={cn(
                      "size-4",
                      isMatchLoading(match.id) && "animate-pulse",
                    )}
                  />
                </Button>
              </form>
              <Link href={`/posts/${match.post.id}`} passHref>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="mr-2 size-4" />
                  View Post
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium">Match Score</h4>
                <Badge variant="secondary">{Math.round(match.score)}%</Badge>
                <Badge variant="outline">{match.post.status}</Badge>
              </div>
              {match.whyMatch && (
                <div>
                  <h4 className="text-sm font-medium">Why Match?</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {match.whyMatch}
                  </p>
                </div>
              )}
              <div>
                <h4 className="text-sm font-medium">Job Description</h4>
                <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                  {match.post.description}
                </p>
              </div>
              {match.notes.length > 0 && (
                <div className="rounded-md bg-muted p-4">
                  <h4 className="flex items-center gap-2 text-sm font-medium">
                    <ArrowRight className="size-4" />
                    Notes
                  </h4>
                  {match.notes.map((note) => (
                    <p
                      key={note.id}
                      className="mt-1 text-sm text-muted-foreground"
                    >
                      {note.content}
                    </p>
                  ))}
                </div>
              )}
              {match.interviewDetails && (
                <MatchMeetingDetails match={match} />
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
