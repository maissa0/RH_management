import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardHeader } from "@/components/dashboard/header";

export default function CandidatesLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <DashboardHeader
          heading="Candidates"
          text="Upload and manage candidate CVs and profiles."
        />
        <Skeleton className="h-10 w-[120px]" />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-[300px]" />
          <Skeleton className="h-10 w-[120px]" />
        </div>

        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card
                key={i}
                className="group relative min-h-[19em] cursor-pointer overflow-hidden bg-card"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/5" />
                <CardHeader className="space-y-3 pb-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-[200px]" />
                      <Skeleton className="h-5 w-[180px]" />
                    </div>
                    <Skeleton className="h-10 w-[100px]" />
                  </div>
                  <div className="flex items-center gap-2.5 pt-2">
                    <Skeleton className="h-5 w-[100px]" />
                    <Skeleton className="h-5 w-[90px]" />
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2.5">
                  {Array.from({ length: 10 }).map((_, j) => (
                    <Skeleton key={j} className="h-5 w-[80px]" />
                  ))}
                </CardContent>
                <CardFooter className="mt-auto border-t bg-gradient-to-b from-muted/30 to-transparent py-4">
                  <div className="flex w-full justify-between">
                    <Skeleton className="h-4 w-[140px]" />
                    <Skeleton className="h-4 w-[140px]" />
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
