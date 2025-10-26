"use client";

import { useState } from "react";
import { Archive, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { archiveJobPost } from "@/actions/archive-job-post.server";
import { archiveCandidate } from "@/actions/archive-candidate.server";

interface ArchiveActionButtonProps {
  ids: string[];
  type: "job" | "candidate";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg";
  disabled?: boolean;
  isArchived?: boolean; // Whether the items are already archived
  onSuccess?: () => void;
}

export function ArchiveActionButton({
  ids,
  type,
  variant = "default",
  size = "default",
  disabled = false,
  isArchived = false,
  onSuccess,
}: ArchiveActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleArchiveAction = async () => {
    if (ids.length === 0) {
      toast.error(`No ${type}s selected to ${isArchived ? 'unarchive' : 'archive'}`);
      return;
    }

    try {
      setIsLoading(true);
      
      const results = await Promise.all(
        ids.map(async (id) => {
          if (type === "job") {
            return await archiveJobPost(id);
          } else {
            return await archiveCandidate(id);
          }
        })
      );
      
      const successCount = results.filter(result => result.success).length;
      const failCount = results.length - successCount;
      
      if (successCount > 0) {
        toast.success(`Successfully ${isArchived ? 'unarchived' : 'archived'} ${successCount} ${type}${successCount > 1 ? 's' : ''}`);
        setIsOpen(false);
        
        if (onSuccess) {
          onSuccess();
        } else {
          // Default behavior: reload the page
          window.location.reload();
        }
      }
      
      if (failCount > 0) {
        toast.error(`Failed to ${isArchived ? 'unarchive' : 'archive'} ${failCount} ${type}${failCount > 1 ? 's' : ''}`);
      }
    } catch (error) {
      toast.error(`Failed to ${isArchived ? 'unarchive' : 'archive'} ${type}s`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          disabled={disabled || ids.length === 0}
        >
          {isArchived ? (
            <RefreshCw className="mr-2 size-4" />
          ) : (
            <Archive className="mr-2 size-4" />
          )}
          {isArchived ? 'Unarchive' : 'Archive'} {ids.length > 0 ? `(${ids.length})` : ""}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isArchived ? 'Unarchive' : 'Archive'} {ids.length} {type}{ids.length > 1 ? 's' : ''}</DialogTitle>
          <DialogDescription>
            {isArchived 
              ? `Are you sure you want to unarchive ${ids.length} ${type}${ids.length > 1 ? 's' : ''}? They will be visible in the main view again.`
              : `Are you sure you want to archive ${ids.length} ${type}${ids.length > 1 ? 's' : ''}? Archived items can be found in the Archive section.`
            }
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleArchiveAction} 
            disabled={isLoading}
            variant={isArchived ? "default" : "destructive"}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {isArchived ? 'Unarchiving...' : 'Archiving...'}
              </>
            ) : (
              <>{isArchived ? 'Unarchive' : 'Archive'}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 