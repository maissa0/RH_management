"use client";

import { useEffect, useState } from "react";
import { fetchJobPosts } from "@/actions/fetch-job-posts.server";
import { JobPost, SkillWeight, User } from "@prisma/client";
import { AnimatePresence, motion } from "framer-motion";
import { FileText } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { JobPostCard } from "./job-post-card";
import { JobPostDialog } from "./job-post-dialog";

type JobPostWithWeights = JobPost & {
  weights: SkillWeight[];
  user: User;
};

export function JobPostsList() {
  const [posts, setPosts] = useState<JobPostWithWeights[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    try {
      setIsLoading(true);
      const response = await fetchJobPosts();

      if (response.success && response.data) {
        setPosts(response.data);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Failed to fetch job posts. Please try again.");
      console.error("Error fetching posts:", error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return <JobPostsListSkeleton />;
  }

  if (posts.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-8 text-center">
        <FileText className="size-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-semibold">No job posts yet</h3>
        <p className="mb-4 mt-2 text-sm text-muted-foreground">
          Get started by creating your first job post to find the perfect
          candidates.
        </p>
        <JobPostDialog onSuccess={fetchPosts} />
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <AnimatePresence>
        {posts.map((post) => (
          <motion.div
            key={post.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <JobPostCard post={post} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function JobPostsListSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="h-48 w-full rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
