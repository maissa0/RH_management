"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteJobPost } from "@/actions/delete-job-post.server";
import { JobPostWithDetails } from "@/actions/get-job-post-by-id.server";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Calendar,
  ChevronLeft,
  ExternalLink,
  Mail,
  Trash2,
  User as UserIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { JobPostEditDialog } from "./job-post-edit-dialog";
import { LinkedInApplications } from "@/components/job-posts/linkedin-applications";

interface JobPostDetailsProps {
  post: JobPostWithDetails;
}

export function JobPostDetails({ post }: JobPostDetailsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hardSkills = post.weights.filter((skill) => skill.type === "HARD");
  const softSkills = post.weights.filter((skill) => skill.type === "SOFT");

  const handleDelete = useCallback(async () => {
    try {
      setIsDeleting(true);
      setError(null);

      const response = await deleteJobPost(post.id);

      if (!response.success) {
        throw new Error(response.error);
      }

      toast({
        title: "Success",
        description: "Job post has been deleted successfully.",
      });

      router.push("/posts");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to delete job post",
      );
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete job post. Please try again.",
      });
    } finally {
      setIsDeleting(false);
    }
  }, [post.id, router, toast]);

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          className="gap-2"
          onClick={() => router.push("/posts")}
        >
          <ChevronLeft className="size-4" />
          Back to Jobs
        </Button>

        <div className="flex items-center gap-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="flex shrink-0 items-center gap-2 text-red-600"
                disabled={isDeleting}
              >
                <Trash2 className="size-4" />
                <p>Delete job post</p>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  job post and remove all associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <JobPostEditDialog post={post} />
          <Button variant="outline">
            <Link href={`/posts/${post.id}/studio`} className="flex items-center gap-2">
              <ExternalLink className="size-4" />
              <p>View in Studio</p>
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="overflow-hidden border-none bg-gradient-to-br from-card to-muted shadow-lg">
        <CardHeader className="space-y-6 border-b bg-card/50 px-8 pb-8 pt-6 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-8">
            <div className="space-y-2">
              <CardTitle className="flex items-center gap-4 text-4xl font-bold tracking-tight">
                {post.title}
                <Badge
                  variant={post.status === "ACTIVE" ? "default" : "secondary"}
                  className={cn(
                    "text-xs font-medium uppercase",
                    post.status === "ACTIVE" &&
                      "bg-green-500/15 text-green-600 dark:bg-green-500/25 dark:text-green-400",
                    post.status === "CLOSED" &&
                      "bg-red-500/15 text-red-600 dark:bg-red-500/25 dark:text-red-400",
                  )}
                >
                  {post.status.toLowerCase()}
                </Badge>
              </CardTitle>
              <CardDescription className="flex items-center gap-2 text-lg">
                Full-time, Remote
              </CardDescription>
            </div>

            <Avatar className="size-16 border-2 border-border shadow-md">
              <AvatarImage src={post.user.image ?? undefined} />
              <AvatarFallback className="text-lg">
                {post.user.name?.slice(0, 2).toUpperCase() ?? "AN"}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex flex-wrap gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="size-4" />
              <span>
                Posted on {format(new Date(post.createdAt), "MMMM d, yyyy")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <UserIcon className="size-4" />
              <span>Posted by {post.user.name}</span>
            </div>
            {post.user.email && (
              <div className="flex items-center gap-2">
                <Mail className="size-4" />
                <a
                  href={`mailto:${post.user.email}`}
                  className="transition-colors hover:text-foreground"
                >
                  {post.user.email}
                </a>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-10 px-8 py-10">
          <div className="prose prose-gray max-w-none dark:prose-invert">
            <h3 className="text-2xl font-semibold">Job Description</h3>
            <div
              className="mt-4"
              dangerouslySetInnerHTML={{ __html: post.description }}
            />
          </div>

          <Separator className="bg-border/60" />

          {hardSkills.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold">Required Hard Skills</h3>
              <div className="flex flex-wrap gap-2">
                {hardSkills.map((skill) => (
                  <motion.div
                    key={skill.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1.5 border bg-primary px-3 py-1.5 text-sm text-white hover:bg-primary dark:bg-primary dark:text-white dark:hover:bg-primary"
                    >
                      {skill.name}
                      <span className="rounded-full bg-red-600/20 px-1.5 py-0.5 text-xs dark:bg-red-400/20">
                        {skill.weight}/10
                      </span>
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {softSkills.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold">Preferred Soft Skills</h3>
              <div className="flex flex-wrap gap-2">
                {softSkills.map((skill) => (
                  <motion.div
                    key={skill.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1.5 border bg-primary px-3 py-1.5 text-sm text-white hover:bg-primary dark:bg-primary dark:text-primary dark:hover:bg-primary"
                    >
                      {skill.name}
                      <span className="rounded-full bg-red-600/20 px-1.5 py-0.5 text-xs dark:bg-red-400/20">
                        {skill.weight}/10
                      </span>
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-8">
        <LinkedInApplications jobPostId={post.id} />
      </div>
    </div>
  );
}
