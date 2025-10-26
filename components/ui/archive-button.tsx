"use client";

import { useState } from "react";
import { Archive, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
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

interface ArchiveButtonProps {
  id: string;
  type: "job" | "candidate";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  onSuccess?: () => void;
}

export function ArchiveButton({
  id,
  type,
  variant = "ghost",
  size = "icon",
  className,
  onSuccess,
}: ArchiveButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleArchive = async () => {
    try {
      setIsLoading(true);
      
      let result;
      if (type === "job") {
        result = await archiveJobPost(id);
      } else {
        result = await archiveCandidate(id);
      }
      
      if (result.success) {
        toast.success(result.message);
        setIsOpen(false);
        
        if (onSuccess) {
          onSuccess();
        } else {
          // Default behavior: reload the page
          window.location.reload();
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(`Failed to archive ${type}`);
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
          className={cn("text-muted-foreground hover:text-foreground", className)}
        >
          <Archive className="size-4" />
          <span className="sr-only">Archive {type}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Archive {type === "job" ? "Job Post" : "Candidate"}</DialogTitle>
          <DialogDescription>
            Are you sure you want to archive this {type === "job" ? "job post" : "candidate"}? 
            Archived items can be found in the Archive section and can be restored later.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleArchive} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Archiving...
              </>
            ) : (
              <>Archive</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 