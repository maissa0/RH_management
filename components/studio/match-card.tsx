"use client";

import { useState } from "react";
import type { Match as MatchWithCandidate } from "@/types";
import { Draggable } from "@hello-pangea/dnd";
import { GripVertical, Percent } from "lucide-react";

import { cn } from "@/lib/utils";
import { ItemActionsMenu } from "@/components/ui/item-actions-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Card, CardContent } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import { MatchDetailsModal } from "./match-details-modal";

interface MatchCardProps {
  match: MatchWithCandidate;
  index: number;
  selected: boolean;
  onSelect: (matchId: string, selected: boolean) => void;
}

export function MatchCard({
  match,
  index,
  selected,
  onSelect,
}: MatchCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Function to get score color class
  const getScoreColorClass = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 ring-green-200";
    if (score >= 60) return "text-yellow-600 bg-yellow-50 ring-yellow-200";
    return "text-gray-600 bg-gray-50 ring-gray-200";
  };

  return (
    <>
      <Draggable draggableId={match.id} index={index}>
        {(provided, snapshot) => (
          <Card
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={cn(
              "cursor-pointer border bg-background transition-all duration-200",
              "relative hover:bg-accent/5",
              "ring-1 ring-border/50",
              match.status === "HIRED"
                ? "border-l-4 border-l-green-500"
                : match.status === "REJECTED"
                  ? "border-l-4 border-l-red-500"
                  : "border-l-4 border-l-transparent",
              "hover:shadow-sm hover:ring-accent/20",
              snapshot.isDragging && "scale-[1.02] shadow-lg ring-accent/30",
              selected && "bg-primary/5 ring-2 ring-primary/40",
              "w-full",
            )}
            onClick={() => setIsModalOpen(true)}
          >
            {/* Selection checkbox - positioned in top-right corner */}
            <div
              className="absolute right-2 top-2 z-20"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(match.id, !selected);
                }}
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border-2 border-primary/50 bg-white shadow-sm transition-colors hover:bg-accent/20"
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "flex h-full w-full items-center justify-center",
                          selected && "bg-primary/10",
                        )}
                      >
                        <Checkbox
                          checked={selected}
                          onCheckedChange={(checked) =>
                            onSelect(match.id, checked as boolean)
                          }
                          className="size-5 border-2 border-primary"
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {selected
                          ? "Deselect candidate"
                          : "Select candidate for email"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Actions menu - moved to top-left */}

            <CardContent className="mt-6 flex flex-col gap-3 p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div
                  {...provided.dragHandleProps}
                  className="-ml-1 p-1 text-muted-foreground/50 hover:text-foreground/80"
                  onClick={(e) => e.stopPropagation()}
                >
                  <GripVertical className="size-4 sm:size-5" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold tracking-tight text-foreground">
                      {match.candidate.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1",
                          getScoreColorClass(match.score),
                        )}
                      >
                        <Percent className="mr-1 size-3" />
                        {Math.round(match.score)}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {match.candidate.email}
                  </p>
                </div>

                {match.status !== "NEW" && (
                  <div className="flex items-center gap-2">
                    {match.status === "HIRED" && (
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-green-200">
                        Hired
                      </span>
                    )}
                    {match.status === "REJECTED" && (
                      <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-red-200">
                        Rejected
                      </span>
                    )}
                  </div>
                )}

                {/* Selection indicator */}
                {selected && (
                  <div className="flex items-center justify-center">
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      Selected for email
                    </span>
                  </div>
                )}

                {/* Match score progress bar */}
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      match.score >= 80
                        ? "bg-green-500"
                        : match.score >= 60
                          ? "bg-yellow-500"
                          : "bg-gray-400",
                    )}
                    style={{ width: `${match.score}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </Draggable>

      <MatchDetailsModal
        match={match}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
