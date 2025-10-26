"use client";

import { useState } from "react";
import { Filter, Plus, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { JobPostDialog } from "@/components/posts/job-post-dialog";
import { ArchiveActionButton } from "@/components/ui/archive-action-button";

interface JobPostsToolbarProps {
  selectedIds: string[];
  onRefresh: () => void;
  onClearSelection: () => void;
}

export function JobPostsToolbar({
  selectedIds,
  onRefresh,
  onClearSelection,
}: JobPostsToolbarProps) {
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
            type="job"
            variant="outline"
            size="sm"
            onSuccess={handleArchiveSuccess}
          />
        )}
        <JobPostDialog onSuccess={onRefresh} />
      </div>
    </div>
  );
} 