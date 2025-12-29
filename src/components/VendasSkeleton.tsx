import { ListHeaderSkeleton, SearchFilterSkeleton, VendasCardSkeleton } from "@/components/skeletons";

export function VendasSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <ListHeaderSkeleton />
      <SearchFilterSkeleton filterCount={2} />
      <VendasCardSkeleton count={5} />
    </div>
  );
}
