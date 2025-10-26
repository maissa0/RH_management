import { getCurrentUser } from "@/lib/session";
import { DashboardHeader } from "@/components/dashboard/header";
import { JobPostDialog } from "@/components/posts/job-post-dialog";
import { JobPostsList } from "@/components/posts/job-posts-list";

export default async function PostsPage() {
  const user = await getCurrentUser();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <DashboardHeader
          heading="Job Posts"
          text="Create and manage your job posts to find the perfect candidates."
        />
        <JobPostDialog />
      </div>

      <JobPostsList />
    </div>
  );
}
