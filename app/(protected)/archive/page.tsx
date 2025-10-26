import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { DashboardHeader } from "@/components/dashboard/header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArchivedJobsList } from "@/components/archive/archived-jobs-list";
import { ArchivedCandidatesList } from "@/components/archive/archived-candidates-list";

export default async function ArchivePage() {
  const user = await getCurrentUser();

  if (!user?.organizationId) {
    return (
      <div className="flex flex-col gap-8">
        <DashboardHeader
          heading="Archive"
          text="You need to be part of an organization to view archived items."
        />
      </div>
    );
  }

  // Fetch archived job posts
  const archivedJobs = await prisma.jobPost.findMany({
    where: {
      organizationId: user.organizationId,
      archivedAt: {
        not: null,
      },
      deletedAt: null,
    },
    include: {
      weights: true,
      user: true,
    },
    orderBy: {
      archivedAt: "desc",
    },
  });

  // Fetch archived candidates
  const archivedCandidates = await prisma.candidate.findMany({
    where: {
      organizationId: user.organizationId,
      archivedAt: {
        not: null,
      },
      deletedAt: null,
    },
    orderBy: {
      archivedAt: "desc",
    },
  });

  return (
    <div className="flex flex-col gap-8">
      <DashboardHeader
        heading="Archive"
        text="View and manage your archived job posts and candidates."
      />

      <Tabs defaultValue="jobs" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="jobs">
            Job Posts ({archivedJobs.length})
          </TabsTrigger>
          <TabsTrigger value="candidates">
            Candidates ({archivedCandidates.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="jobs">
          <ArchivedJobsList initialJobs={archivedJobs} />
        </TabsContent>
        <TabsContent value="candidates">
          <ArchivedCandidatesList initialCandidates={archivedCandidates} />
        </TabsContent>
      </Tabs>
    </div>
  );
} 