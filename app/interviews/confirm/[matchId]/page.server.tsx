import InterviewConfirmationPage from "./page";

interface PageProps {
  params: {
    matchId: string;
  };
}

export default async function InterviewConfirmationPageWrapper({
  params,
}: PageProps) {
  // In Next.js 15, params need to be passed as a Promise that can be awaited
  return <InterviewConfirmationPage params={Promise.resolve(params)} />;
} 