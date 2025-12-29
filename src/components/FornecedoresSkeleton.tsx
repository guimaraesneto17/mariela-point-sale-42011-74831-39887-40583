import { ListHeaderSkeleton, SearchFilterSkeleton, FornecedoresCardSkeleton } from "@/components/skeletons";

export function FornecedoresSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <ListHeaderSkeleton />
      <SearchFilterSkeleton filterCount={1} />
      <FornecedoresCardSkeleton count={6} />
    </div>
  );
}
