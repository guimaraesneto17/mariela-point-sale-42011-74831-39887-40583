import { Skeleton } from "@/components/ui/skeleton";

export function ListHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <Skeleton className="h-10 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-6 w-40 mt-2" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}
