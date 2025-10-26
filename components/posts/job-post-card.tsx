"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { fetchUserDetails } from "@/actions/fetch-user-details.server";
import { JobPost, SkillWeight, User } from "@prisma/client";
import { format, formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import {
  ArrowRightCircle,
  Building2,
  Calendar,
  User as UserIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ItemActionsMenu } from "@/components/ui/item-actions-menu";

interface JobPostCardProps {
  post: JobPost & {
    weights: SkillWeight[];
    user: User;
  };
}

export function JobPostCard({ post }: JobPostCardProps) {
  const [fullUserDetails, setFullUserDetails] = useState<User | null>(null);
  const hardSkills = post.weights.filter((skill) => skill.type === "HARD");

  const truncatedName = post.user.name?.split(" ")[0] ?? "Anonymous";

  const handleHoverCardOpen = useCallback(async () => {
    if (!fullUserDetails) {
      const response = await fetchUserDetails(post.user.id);
      if (response.success && response.data) {
        setFullUserDetails(response.data);
      }
    }
  }, [fullUserDetails, post.user.id]);

  return (
    <div className="w-full">
      <Card className="group relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-green-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:to-green-900/20" />

        <CardHeader className="relative space-y-4 p-6">
          <div className="flex items-start justify-between">
            <div className="flex flex-col space-y-2">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-semibold text-foreground dark:text-white">
                  {post.title}
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="size-4" />
                  <span className="font-medium">{post.companyName}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant={post.status === "ACTIVE" ? "default" : "secondary"}
                className={cn(
                  "mt-1.5 w-fit text-xs font-medium uppercase",
                  post.status === "ACTIVE" &&
                    "bg-green-500/15 text-green-600 dark:bg-green-500/25 dark:text-green-400",
                  post.status === "CLOSED" &&
                    "bg-red-500/15 text-red-600 dark:bg-red-500/25 dark:text-red-400",
                )}
              >
                {post.status.toLowerCase()}
              </Badge>
              <ItemActionsMenu
                id={post.id}
                type="job"
                isArchived={post.archivedAt !== null}
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex flex-col gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="size-4" />
                <span>
                  Posted{" "}
                  {formatDistanceToNow(new Date(post.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <UserIcon className="size-4" />
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <button
                      onClick={handleHoverCardOpen}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      by {truncatedName}
                    </button>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <div className="flex justify-between space-x-4">
                      <Avatar>
                        <AvatarImage src={post.user.image ?? undefined} />
                        <AvatarFallback>
                          {truncatedName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold">
                          {post.user.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Posted on {format(new Date(post.createdAt), "PPP")}
                        </p>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>
            </div>

            <Link
              href={`/posts/${post.id}`}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all hover:-translate-y-0.5 hover:bg-muted group-hover:translate-x-1 dark:hover:bg-gray-700/50"
            >
              <span className="text-nowrap text-foreground dark:text-white">
                View job
              </span>
              <ArrowRightCircle className="size-4" />
            </Link>
          </div>
        </CardHeader>

        <CardContent className="relative space-y-6 p-6 pt-0">
          {hardSkills.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Hard Skills Required
              </h4>
              <div className="relative">
                <div className="flex max-h-[3.75rem] flex-wrap gap-2 overflow-hidden">
                  {hardSkills.map((skill) => (
                    <motion.div
                      key={skill.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1 bg-green-500/10 text-green-600 hover:bg-green-500/20 dark:bg-green-500/20 dark:text-green-400 dark:hover:bg-green-500/30"
                      >
                        {skill.name}
                        <span className="ml-1 text-xs opacity-50">
                          ({skill.weight})
                        </span>
                      </Badge>
                    </motion.div>
                  ))}
                </div>
                {hardSkills.length > 6 && (
                  <div className="absolute bottom-0 right-0 bg-gradient-to-l from-card px-2 py-1 text-xs text-muted-foreground">
                    +{hardSkills.length - 6} more
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>

        <div
          className="absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300 ease-in-out dark:bg-white"
          style={{
            width: "0%",
          }}
        />
      </Card>
    </div>
  );
}
