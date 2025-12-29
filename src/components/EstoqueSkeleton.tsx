import { ListHeaderSkeleton, SearchFilterSkeleton, EstoqueCardSkeleton } from "@/components/skeletons";

export function EstoqueSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <ListHeaderSkeleton />
      <SearchFilterSkeleton filterCount={4} />
      <EstoqueCardSkeleton count={8} />
    </div>
  );
}
