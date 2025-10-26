"use client";

import { useState } from "react";
import { JobPostWithDetails } from "@/actions/get-job-post-by-id.server";
import { Edit } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { JobPostForm } from "./job-post-form";

interface JobPostEditDialogProps {
  post: JobPostWithDetails;
  onSuccess?: () => void;
}

export function JobPostEditDialog({ post, onSuccess }: JobPostEditDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Edit className="size-4" />
          Edit Post
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Job Post</DialogTitle>
          <DialogDescription>
            Update the job post details below. Changes will be reflected immediately.
          </DialogDescription>
        </DialogHeader>
        <JobPostForm post={post} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
} 