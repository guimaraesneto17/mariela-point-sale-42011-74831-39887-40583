import { ListHeaderSkeleton, SearchFilterSkeleton, VendedoresCardSkeleton } from "@/components/skeletons";

export function VendedoresSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <ListHeaderSkeleton />
      <SearchFilterSkeleton filterCount={1} />
      <VendedoresCardSkeleton count={6} />
    </div>
  );
}
