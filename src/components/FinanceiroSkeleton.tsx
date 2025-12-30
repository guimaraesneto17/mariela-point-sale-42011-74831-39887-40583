import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FinanceSummaryCardSkeleton, 
  FinanceAccountCardSkeleton, 
  FinanceTabsSkeleton,
  FinanceFiltersSkeleton 
} from "@/components/skeletons/FinanceiroCardSkeletons";

export function FinanceiroSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-36" />
        </div>
      </div>

      {/* Notifications Banner */}
      <Skeleton className="h-12 w-full rounded-lg" />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <FinanceSummaryCardSkeleton key={i} />
        ))}
      </div>

      {/* Tabs */}
      <FinanceTabsSkeleton />

      {/* Dashboard Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart Card */}
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-3 pt-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <Skeleton 
                    className="w-full rounded-t" 
                    style={{ height: `${30 + (i * 10)}%` }} 
                  />
                  <Skeleton className="h-3 w-10" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Accounts */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-5 w-5 rounded-full" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Accounts List Section */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-9 w-32" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <FinanceFiltersSkeleton />

          {/* Account Cards */}
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <FinanceAccountCardSkeleton key={i} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
