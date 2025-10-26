"use client";

import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from "@/components/ui/popover";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Filter, X } from "lucide-react";

export interface MatchFilters {
  minScore: number;
  maxScore: number;
}

interface MatchFiltersProps {
  filters: MatchFilters;
  onFilterChange: (filters: MatchFilters) => void;
  onClearFilters: () => void;
}

export function MatchFilters({ 
  filters, 
  onFilterChange, 
  onClearFilters 
}: MatchFiltersProps) {
  const [localFilters, setLocalFilters] = useState<MatchFilters>(filters);
  const [isOpen, setIsOpen] = useState(false);
  
  const handleScoreChange = (value: number[]) => {
    setLocalFilters(prev => ({
      ...prev,
      minScore: value[0],
      maxScore: value[1]
    }));
  };
  
  const handleApplyFilters = () => {
    onFilterChange(localFilters);
    setIsOpen(false);
  };
  
  const handleClearFilters = () => {
    const defaultFilters = { minScore: 0, maxScore: 100 };
    setLocalFilters(defaultFilters);
    onClearFilters();
    setIsOpen(false);
  };
  
  const isFiltered = filters.minScore > 0 || filters.maxScore < 100;
  
  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className={`gap-2 ${isFiltered ? 'border-primary/50 bg-primary/5' : ''}`}
          >
            <Filter className="size-4" />
            Filters
            {isFiltered && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {filters.minScore}-{filters.maxScore}%
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Match Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Match Percentage</span>
                  <span className="text-xs text-muted-foreground">
                    {localFilters.minScore}% - {localFilters.maxScore}%
                  </span>
                </div>
                <Slider
                  defaultValue={[localFilters.minScore, localFilters.maxScore]}
                  min={0}
                  max={100}
                  step={5}
                  value={[localFilters.minScore, localFilters.maxScore]}
                  onValueChange={handleScoreChange}
                  className="py-2"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClearFilters}
              >
                Clear
              </Button>
              <Button 
                size="sm" 
                onClick={handleApplyFilters}
              >
                Apply Filters
              </Button>
            </CardFooter>
          </Card>
        </PopoverContent>
      </Popover>
      
      {isFiltered && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-9 px-2 text-muted-foreground" 
          onClick={onClearFilters}
        >
          <X className="size-3.5" />
        </Button>
      )}
    </div>
  );
} 