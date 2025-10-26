import type { Candidate, CandidateSkill, Match } from "@prisma/client";

import { getCandidates } from "@/lib/candidates";
import { CandidateCard } from "@/components/candidates/candidate-card";

interface CandidatesListProps {
  searchParams: {
    skills?: string | string[];
    pdfUrl?: string | string[];
  };
}

type CandidateWithRelations = Candidate & {
  skills: CandidateSkill[];
  matches: Match[];
};

export async function CandidatesList({ searchParams }: CandidatesListProps) {
  const params = await searchParams;

  const selectedSkills =
    typeof params.skills === "string"
      ? params.skills.split(",").filter(Boolean)
      : [];

  const candidates: CandidateWithRelations[] = await getCandidates({
    skills: selectedSkills,
  });

  if (candidates.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <h3 className="mt-4 text-lg font-semibold">No candidates found</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">
            No candidates found matching the selected filters. Try adjusting
            your search criteria.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {candidates.map((candidate) => (
          <CandidateCard key={candidate.id} candidate={candidate} />
        ))}
      </div>
    </div>
  );
}
