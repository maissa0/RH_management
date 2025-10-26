"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function CandidateSearch() {
  return (
    <div className="relative flex-1">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search candidates..."
        className="pl-8"
        onChange={(e) => {
          // TODO: Implement search functionality
          console.log(e.target.value);
        }}
      />
    </div>
  );
} 