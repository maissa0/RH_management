import type { Match as MatchWithCandidate } from "@/types";
import { DroppableProvided } from "@hello-pangea/dnd";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { MatchCard } from "./match-card";

interface MatchColumnProps {
  title: string;
  matches: MatchWithCandidate[];
  provided: DroppableProvided;
  selectedMatches: Set<string>;
  onMatchSelect: (matchId: string, selected: boolean) => void;
  totalCount?: number; // Total count before filtering
}

export function MatchColumn({
  title,
  matches,
  provided,
  selectedMatches,
  onMatchSelect,
  totalCount,
}: MatchColumnProps) {
  const isFiltered = totalCount !== undefined && totalCount !== matches.length;
  
  return (
    <Card className="h-full w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          {title}
          <span className="rounded-full bg-secondary px-2 py-1 text-xs">
            {matches.length}
            {isFiltered && (
              <span className="text-muted-foreground"> / {totalCount}</span>
            )}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          {...provided.droppableProps}
          ref={provided.innerRef}
          className="min-h-[300px] space-y-2"
        >
          {matches.length > 0 ? (
            matches.map((match, index) => (
              <MatchCard
                key={match.id}
                match={match}
                index={index}
                selected={selectedMatches.has(match.id)}
                onSelect={onMatchSelect}
              />
            ))
          ) : (
            <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
              {isFiltered ? "No matches match the current filters" : "No matches in this column"}
            </div>
          )}
          {provided.placeholder}
        </div>
      </CardContent>
    </Card>
  );
}
