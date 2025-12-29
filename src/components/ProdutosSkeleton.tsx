import { ListHeaderSkeleton, SearchFilterSkeleton, ProdutosCardSkeleton } from "@/components/skeletons";

export function ProdutosSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <ListHeaderSkeleton />
      <SearchFilterSkeleton filterCount={3} />
      <ProdutosCardSkeleton count={8} />
    </div>
  );
}
