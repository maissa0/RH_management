import { notFound, redirect } from "next/navigation";
import { getJobPostById } from "@/actions/get-job-post-by-id.server";

import { getCurrentUser } from "@/lib/session";
import { MatchStudioBoard } from "@/components/studio/match-studio-board";

interface MatchStudioPageProps {
  params: Promise<{
    postId: string;
  }>;
}

export default async function MatchStudioPage({
  params,
}: MatchStudioPageProps) {
  const user = await getCurrentUser();

  const { postId } = await params;

  if (!user) {
    redirect("/sign-in");
  }

  const response = await getJobPostById(postId);

  if (!response.success || !response.data) {
    notFound();
  }

  return <MatchStudioBoard postId={postId} jobTitle={response.data.title} />;
}
