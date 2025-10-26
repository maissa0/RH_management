"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CandidateInfo } from "@/components/candidates/candidate-info";
import { CandidateResume } from "@/components/candidates/candidate-resume";
import { CandidateMatches } from "@/components/candidates/candidate-matches";
import { CandidateMeetings } from "@/components/candidates/candidate-meetings";
import type { Achievement, Candidate, CandidateSkill, Education, Match, MatchNote, WorkExperience } from "@prisma/client";
import type { JobPost } from "@prisma/client";

interface InterviewDetails {
  type: "ONLINE" | "IN_PERSON";
  date: string;
  time: string;
  location?: string;
  meetLink?: string;
}

interface CandidateDetailsProps {
  candidate: Candidate & {
    skills: CandidateSkill[];
    workExperience: WorkExperience[];
    education: Education[];
    achievements: Achievement[];
    matches: Array<Match & {
      post: Pick<JobPost, "id" | "title" | "description" | "status">;
      notes: MatchNote[];
      interviewDetails?: InterviewDetails;
    }>;
  };
}

export function CandidateDetails({ candidate }: CandidateDetailsProps) {
  // Transform workExperience into ResumeSection format
  const experience = candidate.workExperience.map(exp => ({
    title: exp.title,
    company: exp.company,
    period: `${exp.startDate.getFullYear()} - ${exp.endDate ? exp.endDate.getFullYear() : 'Present'}`,
    description: exp.description?.split('\n').filter(Boolean) || []
  }));

  // Transform education into ResumeSection format
  const education = candidate.education.map(edu => ({
    title: edu.degree,
    company: edu.school,
    period: `${edu.startDate.getFullYear()} - ${edu.endDate ? edu.endDate.getFullYear() : 'Present'}`,
    description: [edu.description].filter((item): item is string => Boolean(item))
  }));

  // Group skills by category
  const skillsByCategory = candidate.skills.reduce((acc, skill) => {
    const category = skill.type || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(skill.name);
    return acc;
  }, {} as Record<string, string[]>);

  const skills = Object.entries(skillsByCategory).map(([category, items]) => ({
    category,
    items
  }));

  // Transform achievements into certifications
  const certifications = candidate.achievements
    .filter(achievement => achievement.title.toLowerCase().includes('certification'))
    .map(cert => cert.title);

  return (
    <Tabs defaultValue="info" className="w-full">
      <TabsList>
        <TabsTrigger value="info">General Info</TabsTrigger>
        <TabsTrigger value="resume">Resume</TabsTrigger>
        <TabsTrigger value="matches">Matches</TabsTrigger>
        <TabsTrigger value="meetings">Meetings</TabsTrigger>
      </TabsList>

      <TabsContent value="info">
        <CandidateInfo candidate={candidate} />
      </TabsContent>

      <TabsContent value="resume">
        <CandidateResume
          cvUrl={candidate.cvUrl}
          experience={experience}
          education={education}
          skills={skills}
          certifications={certifications}
        />
      </TabsContent>

      <TabsContent value="matches">
        <CandidateMatches matches={candidate.matches} />
      </TabsContent>

      <TabsContent value="meetings">
        <CandidateMeetings
          candidateId={candidate.id}
          candidateName={candidate.name}
          candidateEmail={candidate.email}
          matches={candidate.matches}
        />
      </TabsContent>
    </Tabs>
  );
} 