"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

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

interface JobPostDialogProps {
  onSuccess?: () => void;
}

export function JobPostDialog({ onSuccess }: JobPostDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 size-4" />
          Create New Post
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Job Post</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new job post. Add relevant
            skills and their importance to find the best candidates.
          </DialogDescription>
        </DialogHeader>
        <JobPostForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
