import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function CandidateDetailsSkeleton() {
  return (
    <Tabs defaultValue="info" className="w-full">
      <TabsList>
        <TabsTrigger value="info">General Info</TabsTrigger>
        <TabsTrigger value="resume">Resume</TabsTrigger>
        <TabsTrigger value="matches">Matches</TabsTrigger>
      </TabsList>

      <TabsContent value="info">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="grid gap-4">
              <div>
                <Skeleton className="mb-2 h-4 w-16" />
                <Skeleton className="h-4 w-48" />
              </div>
              <div>
                <Skeleton className="mb-2 h-4 w-16" />
                <Skeleton className="h-4 w-64" />
              </div>
              <div>
                <Skeleton className="mb-2 h-4 w-16" />
                <Skeleton className="h-6 w-24" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-24" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="resume">
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-8" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>

          <div className="flex justify-center">
            <Skeleton className="h-[calc(100vh-400px)] w-full max-w-2xl" />
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="matches">
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div>
                    <Skeleton className="mb-2 h-4 w-24" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <div>
                    <Skeleton className="mb-2 h-4 w-24" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}
