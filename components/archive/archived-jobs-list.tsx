"use client";

import { useEffect, useState } from "react";
import { JobPost, SkillWeight, User } from "@prisma/client";
import { AnimatePresence, motion } from "framer-motion";
import { Archive, FileText } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { ItemActionsMenu } from "@/components/ui/item-actions-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { JobPostCard } from "@/components/posts/job-post-card";

type JobPostWithWeights = JobPost & {
  weights: SkillWeight[];
  user: User;
};

interface ArchivedJobsListProps {
  initialJobs: JobPostWithWeights[];
}

export function ArchivedJobsList({ initialJobs }: ArchivedJobsListProps) {
  const [jobs, setJobs] = useState<JobPostWithWeights[]>(initialJobs);

  if (jobs.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-8 text-center">
        <Archive className="size-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-semibold">No archived job posts</h3>
        <p className="mb-4 mt-2 text-sm text-muted-foreground">
          Archived job posts will appear here.
        </p>
      </Card>
    );
  }

  const handleUnarchiveSuccess = (jobId: string) => {
    // Remove the job from the list
    setJobs(jobs.filter((job) => job.id !== jobId));
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <AnimatePresence>
        {jobs.map((job) => (
          <motion.div
            key={job.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="relative"
          >
            <JobPostCard post={job} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
