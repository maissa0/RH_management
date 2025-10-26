"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, GraduationCap, Award, AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface ResumeSection {
  title: string;
  company?: string;
  period: string;
  description: string[];
}

interface CandidateResumeProps {
  cvUrl: string;
  experience?: ResumeSection[];
  education?: ResumeSection[];
  skills?: Array<{
    category: string;
    items: string[];
  }>;
  certifications?: string[];
}

export function CandidateResume({ 
  experience = [], 
  education = [], 
  skills = [],
  certifications = []
}: CandidateResumeProps) {
  return (
    <ScrollArea className="h-[calc(100vh-300px)]">
      <div className="grid gap-6 p-6">
        {/* Experience Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              <CardTitle>Professional Experience</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6">
            {experience.length > 0 ? (
              experience.map((job, index) => (
                <div key={index} className="grid gap-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{job.title}</h4>
                      <p className="text-sm text-muted-foreground">{job.company}</p>
                    </div>
                    <Badge variant="outline">{job.period}</Badge>
                  </div>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {job.description.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                  {index < experience.length - 1 && <Separator className="mt-4" />}
                </div>
              ))
            ) : (
              <div className="flex h-24 items-center justify-center rounded-md border border-dashed">
                <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-5 w-5" />
                  <p>No work experience found</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Education Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              <CardTitle>Education</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6">
            {education.length > 0 ? (
              education.map((edu, index) => (
                <div key={index} className="grid gap-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{edu.title}</h4>
                      <p className="text-sm text-muted-foreground">{edu.company}</p>
                    </div>
                    <Badge variant="outline">{edu.period}</Badge>
                  </div>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {edu.description.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                  {index < education.length - 1 && <Separator className="mt-4" />}
                </div>
              ))
            ) : (
              <div className="flex h-24 items-center justify-center rounded-md border border-dashed">
                <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-5 w-5" />
                  <p>No education history found</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Skills Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              <CardTitle>Skills & Certifications</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6">
            {/* Skills */}
            {skills.length > 0 ? (
              <div className="grid gap-4">
                {skills.map((category, index) => (
                  <div key={index}>
                    <h4 className="text-sm font-medium mb-2">{category.category}</h4>
                    <div className="flex flex-wrap gap-2">
                      {category.items.map((skill, i) => (
                        <Badge key={i} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-24 items-center justify-center rounded-md border border-dashed">
                <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-5 w-5" />
                  <p>No skills found</p>
                </div>
              </div>
            )}

            {/* Certifications */}
            {certifications.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-2">Certifications</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {certifications.map((cert, index) => (
                      <li key={index}>{cert}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
