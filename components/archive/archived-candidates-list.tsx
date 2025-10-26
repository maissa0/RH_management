"use client";

import { useEffect, useState } from "react";
import { Candidate } from "@prisma/client";
import { AnimatePresence, motion } from "framer-motion";
import { Archive, User } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ItemActionsMenu } from "@/components/ui/item-actions-menu";

interface ArchivedCandidatesListProps {
  initialCandidates: Candidate[];
}

export function ArchivedCandidatesList({ initialCandidates }: ArchivedCandidatesListProps) {
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);

  if (candidates.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-8 text-center">
        <Archive className="size-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-semibold">No archived candidates</h3>
        <p className="mb-4 mt-2 text-sm text-muted-foreground">
          Archived candidates will appear here.
        </p>
      </Card>
    );
  }

  const handleUnarchiveSuccess = (candidateId: string) => {
    // Remove the candidate from the list
    setCandidates(candidates.filter(candidate => candidate.id !== candidateId));
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <AnimatePresence>
        {candidates.map((candidate) => (
          <motion.div
            key={candidate.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardHeader className="relative pb-2">
                <div className="absolute right-4 top-4">
                  <ItemActionsMenu
                    id={candidate.id}
                    type="candidate"
                    isArchived={true}
                    onSuccess={() => handleUnarchiveSuccess(candidate.id)}
                  />
                </div>
                <CardTitle className="text-xl">{candidate.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{candidate.email}</p>
                  {candidate.address && (
                    <p className="text-sm text-muted-foreground">{candidate.address}</p>
                  )}
                  <div className="flex items-center gap-2 pt-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open(candidate.cvUrl, '_blank')}
                    >
                      View CV
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
} 