import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface SearchFilterSkeletonProps {
  filterCount?: number;
}

export function SearchFilterSkeleton({ filterCount = 1 }: SearchFilterSkeletonProps) {
  return (
    <Card className="p-4 md:p-6">
      <div className={`grid grid-cols-1 ${filterCount > 1 ? `md:grid-cols-${Math.min(filterCount, 4)}` : ''} gap-4`}>
        {Array.from({ length: filterCount }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </Card>
  );
}
