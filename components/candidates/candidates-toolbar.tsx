"use client";

import { useState } from "react";
import { Filter, RefreshCw, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ArchiveActionButton } from "@/components/ui/archive-action-button";

interface CandidatesToolbarProps {
  selectedIds: string[];
  onRefresh: () => void;
  onClearSelection: () => void;
  onUploadClick?: () => void;
}

export function CandidatesToolbar({
  selectedIds,
  onRefresh,
  onClearSelection,
  onUploadClick,
}: CandidatesToolbarProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  };

  const handleArchiveSuccess = () => {
    onClearSelection();
    onRefresh();
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`mr-2 size-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
        <Button variant="outline" size="sm">
          <Filter className="mr-2 size-4" />
          Filter
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {selectedIds.length > 0 && (
          <ArchiveActionButton
            ids={selectedIds}
            type="candidate"
            variant="outline"
            size="sm"
            onSuccess={handleArchiveSuccess}
          />
        )}
        <Button size="sm" onClick={onUploadClick}>
          <Upload className="mr-2 size-4" />
          Upload CVs
        </Button>
      </div>
    </div>
  );
} 