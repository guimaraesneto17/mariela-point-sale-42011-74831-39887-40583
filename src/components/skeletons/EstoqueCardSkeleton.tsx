import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface EstoqueCardSkeletonProps {
  count?: number;
}

export function EstoqueCardSkeleton({ count = 8 }: EstoqueCardSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardHeader className="p-0 relative">
            <Skeleton className="h-48 w-full rounded-b-none" />
            <div className="absolute top-2 right-2 flex gap-1">
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-16" />
              <div className="flex gap-1">
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
            </div>
            <Skeleton className="h-6 w-full" />
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-24" />
              </div>
              <div className="flex gap-1">
                <Skeleton className="h-6 w-8 rounded-full" />
                <Skeleton className="h-6 w-8 rounded-full" />
                <Skeleton className="h-6 w-8 rounded-full" />
                <Skeleton className="h-6 w-8 rounded-full" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-9 flex-1" />
              <Skeleton className="h-9 w-9" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
