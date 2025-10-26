import { ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function JobPostLoading() {
  return (
    <div className="container mx-auto max-w-5xl space-y-8 py-8">
      <div className="flex items-center justify-between">
        <Button variant="ghost" className="gap-2" disabled>
          <ChevronLeft className="size-4" />
          Back to Jobs
        </Button>

        <Skeleton className="h-6 w-20" />
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-[300px]" />
              <Skeleton className="h-5 w-[200px]" />
            </div>

            <Skeleton className="size-12 rounded-full" />
          </div>

          <div className="flex flex-wrap gap-6">
            <Skeleton className="h-5 w-[180px]" />
            <Skeleton className="h-5 w-[150px]" />
            <Skeleton className="h-5 w-[200px]" />
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          <Skeleton className="h-px w-full" />

          <div className="space-y-4">
            <Skeleton className="h-7 w-[200px]" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[90%]" />
              <Skeleton className="h-4 w-[95%]" />
              <Skeleton className="h-4 w-[85%]" />
            </div>
          </div>

          <Skeleton className="h-px w-full" />

          <div className="space-y-4">
            <Skeleton className="h-7 w-[250px]" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-24" />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Skeleton className="h-7 w-[250px]" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-24" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
