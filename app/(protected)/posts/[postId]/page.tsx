import { notFound, redirect } from "next/navigation";
import { getJobPostById } from "@/actions/get-job-post-by-id.server";

import { getCurrentUser } from "@/lib/session";
import { JobPostDetails } from "@/components/posts/job-post-details";

interface JobPostPageProps {
  params: Promise<{
    postId: string;
  }>;
}

export default async function JobPostPage({ params }: JobPostPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const parameters = await params;

  const response = await getJobPostById(parameters.postId);

  if (!response.success || !response.data) {
    notFound();
  }

  return (
    <div className="w-full">
      <JobPostDetails post={response.data} />
    </div>
  );
}
