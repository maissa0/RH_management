"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const COMMON_SKILLS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Node.js",
  "Python",
  "Java",
  "SQL",
  "AWS",
  "Docker",
] as const;

export function CandidateFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Preserve pdfUrl when updating skills
  const pdfUrl = searchParams.get("pdfUrl");
  const selectedSkills = searchParams.get("skills")?.split(",").filter(Boolean) || [];

  const createQueryString = useCallback(
    (skills: string[]) => {
      const params = new URLSearchParams(searchParams);
      if (skills.length > 0) {
        params.set("skills", skills.join(","));
      } else {
        params.delete("skills");
      }
      // Preserve pdfUrl if it exists
      if (pdfUrl) {
        params.set("pdfUrl", pdfUrl);
      }
      return params.toString();
    },
    [searchParams, pdfUrl]
  );

  const handleSkillToggle = (skill: string) => {
    const newSkills = selectedSkills.includes(skill)
      ? selectedSkills.filter((s) => s !== skill)
      : [...selectedSkills, skill];

    const queryString = createQueryString(newSkills);
    router.push(`${pathname}?${queryString}`);
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Skills Filter
            {selectedSkills.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedSkills.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          <DropdownMenuLabel>Filter by Skills</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {COMMON_SKILLS.map((skill) => (
            <DropdownMenuCheckboxItem
              key={skill}
              checked={selectedSkills.includes(skill)}
              onCheckedChange={() => handleSkillToggle(skill)}
            >
              {skill}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {selectedSkills.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {selectedSkills.map((skill) => (
            <Badge
              key={skill}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => handleSkillToggle(skill)}
            >
              {skill} ×
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
} 