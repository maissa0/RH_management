import { Skeleton } from "@/components/ui/skeleton";
import { DashboardHeader } from "@/components/dashboard/header";

export default function PostsLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <DashboardHeader
          heading="Job Posts"
          text="Create and manage your job posts to find the perfect candidates."
        />
        <Skeleton className="h-10 w-[140px] rounded-md" />{" "}
        {/* Create Post button skeleton */}
      </div>

      {/* Job Posts List Skeleton */}
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
    </div>
  );
}
