import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function VendasSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-center flex-1">
          <Skeleton className="h-10 w-48 mx-auto mb-2" />
          <Skeleton className="h-4 w-64 mx-auto" />
          <Skeleton className="h-6 w-40 mx-auto mt-2" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      {/* Search Card */}
      <Card className="p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </Card>

      {/* Sales Cards */}
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="p-4 md:p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>

              <div className="border-t pt-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>

              <div className="border-t pt-4">
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
