import { getCurrentUser } from "@/lib/session";
import { CandidateFilters } from "@/components/candidates/candidate-filters";
import { CandidateSearch } from "@/components/candidates/candidate-search";
import { CandidateUploadDialog } from "@/components/candidates/candidate-upload-dialog";
import { CandidatesList } from "@/components/candidates/candidates-list";
import { DashboardHeader } from "@/components/dashboard/header";

interface CandidatesPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CandidatesPage({
  searchParams,
}: CandidatesPageProps) {
  const user = await getCurrentUser();
  const resolvedSearchParams = await searchParams;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <DashboardHeader
          heading="Candidates"
          text="Upload and manage candidate CVs and profiles."
        />
        <CandidateUploadDialog />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <CandidateSearch />
          <CandidateFilters />
        </div>
        <CandidatesList searchParams={resolvedSearchParams} />
      </div>
    </div>
  );
}
