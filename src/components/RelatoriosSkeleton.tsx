import { Skeleton } from "@/components/ui/skeleton";
import {
  RelatorioTabsSkeleton,
  RelatorioFiltersSkeleton,
  RelatorioChartSkeleton,
  RelatorioPieChartSkeleton,
  RelatorioTableSkeleton,
  RelatorioSummaryCardSkeleton
} from "@/components/skeletons/RelatoriosCardSkeletons";

export function RelatoriosSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      {/* Tabs */}
      <RelatorioTabsSkeleton />

      {/* Filters */}
      <RelatorioFiltersSkeleton />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <RelatorioSummaryCardSkeleton />
        <RelatorioSummaryCardSkeleton />
        <RelatorioSummaryCardSkeleton />
        <RelatorioSummaryCardSkeleton />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <RelatorioChartSkeleton />
        <RelatorioPieChartSkeleton />
      </div>

      {/* Table */}
      <RelatorioTableSkeleton rows={10} />
    </div>
  );
}
