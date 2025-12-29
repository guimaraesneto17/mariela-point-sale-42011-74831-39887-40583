import { ListHeaderSkeleton, SearchFilterSkeleton, ClientesCardSkeleton } from "@/components/skeletons";

export function ClientesSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <ListHeaderSkeleton />
      <SearchFilterSkeleton filterCount={1} />
      <ClientesCardSkeleton count={6} />
    </div>
  );
}
