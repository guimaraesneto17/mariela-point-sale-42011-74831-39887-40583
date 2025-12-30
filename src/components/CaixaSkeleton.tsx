import { Skeleton } from "@/components/ui/skeleton";
import { 
  CaixaResumoCardSkeleton, 
  CaixaInfoCardSkeleton, 
  CaixaMovimentosTableSkeleton,
  CaixaAcoesCardSkeleton 
} from "@/components/skeletons/CaixaCardSkeletons";

export function CaixaSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <CaixaResumoCardSkeleton />
        <CaixaResumoCardSkeleton />
        <CaixaResumoCardSkeleton />
      </div>

      {/* Info do Caixa */}
      <CaixaInfoCardSkeleton />

      {/* Ações */}
      <CaixaAcoesCardSkeleton />

      {/* Tabela de Movimentações */}
      <CaixaMovimentosTableSkeleton rows={6} />
    </div>
  );
}
