import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Users, Clock } from "lucide-react";
import { format } from "date-fns";
import type { Candidate, CandidateSkill, Match } from "@prisma/client";

interface CandidateInfoProps {
  candidate: Candidate & {
    skills: CandidateSkill[];
    matches: Match[];
  };
}

export function CandidateInfo({ candidate }: CandidateInfoProps) {
  return (
    <div className="grid gap-6">
      <Card className={candidate.processing ? "opacity-70 pointer-events-none" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Basic Information</CardTitle>
            {candidate.processing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing CV...</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div>
            <h4 className="text-sm font-medium">Email</h4>
            <p className="text-sm text-muted-foreground">{candidate.email}</p>
          </div>
          {candidate.address && (
            <div>
              <h4 className="text-sm font-medium">Address</h4>
              <p className="text-sm text-muted-foreground">{candidate.address}</p>
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Added</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(candidate.createdAt), "MMM d, yyyy")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Matches</p>
                <p className="text-sm text-muted-foreground">
                  {candidate.matches.length} job{candidate.matches.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Last Update</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(candidate.updatedAt), "MMM d, yyyy")}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={candidate.processing ? "opacity-70 pointer-events-none" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Skills</CardTitle>
              <p className="text-sm text-muted-foreground">
                {candidate.skills.length} skill{candidate.skills.length !== 1 ? "s" : ""} identified
              </p>
            </div>
            {candidate.processing && (
              <Badge variant="outline" className="text-muted-foreground">
                Analyzing skills...
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {candidate.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {candidate.skills.map((skill) => (
                <Badge 
                  key={skill.id} 
                  variant={skill.type === "HARD" ? "secondary" : "outline"}
                >
                  {skill.name} ({skill.proficiency}/10)
                </Badge>
              ))}
            </div>
          ) : (
            <div className="flex h-20 items-center justify-center rounded-md border border-dashed">
              <div className="text-center text-sm text-muted-foreground">
                {candidate.processing 
                  ? "Extracting skills from CV..."
                  : "No skills found in CV"}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 