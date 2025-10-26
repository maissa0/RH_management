"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface FiltersContextType {
  selectedSkills: string[];
  setSelectedSkills: (skills: string[]) => void;
}

const FiltersContext = createContext<FiltersContextType | undefined>(undefined);

export function FiltersProvider({ children }: { children: ReactNode }) {
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  return (
    <FiltersContext.Provider value={{ selectedSkills, setSelectedSkills }}>
      {children}
    </FiltersContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FiltersContext);
  if (context === undefined) {
    throw new Error("useFilters must be used within a FiltersProvider");
  }
  return context;
} 