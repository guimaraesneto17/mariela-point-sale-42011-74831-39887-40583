import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Database, Layers, Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationControlsProps {
  totalLocal: number;
  totalServer?: number;
  loadMode: 'paginated' | 'all';
  onToggleMode: () => void;
  isLoading?: boolean;
  entityName: string;
  entityNamePlural: string;
  icon?: React.ReactNode;
  // Novas props para navegação de páginas
  currentPage?: number;
  totalPages?: number;
  limit?: number;
  onPageChange?: (page: number) => void;
}

export const PaginationControls = ({
  totalLocal,
  totalServer,
  loadMode,
  onToggleMode,
  isLoading,
  entityName,
  entityNamePlural,
  icon,
  currentPage = 1,
  totalPages = 1,
  limit = 50,
  onPageChange,
}: PaginationControlsProps) => {
  const showServerTotal = totalServer !== undefined && totalServer !== totalLocal;
  const showPageNavigation = loadMode === 'paginated' && totalPages > 1 && onPageChange;
  
  // Calcular range de itens exibidos
  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, totalServer || totalLocal);

  return (
    <div className="flex flex-col gap-2 mt-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="secondary" className="text-sm">
          {icon}
          {loadMode === 'paginated' && totalServer && totalServer > limit ? (
            <span>{startItem}-{endItem} de {totalServer} {totalServer === 1 ? entityName : entityNamePlural}</span>
          ) : (
            <>
              {totalLocal} {totalLocal === 1 ? entityName : entityNamePlural}
              {showServerTotal && (
                <span className="text-muted-foreground ml-1">
                  / {totalServer} total
                </span>
              )}
            </>
          )}
        </Badge>

        <Button
          variant="outline"
          size="sm"
          onClick={onToggleMode}
          disabled={isLoading}
          className="gap-2 h-7 text-xs"
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : loadMode === 'paginated' ? (
            <Database className="h-3 w-3" />
          ) : (
            <Layers className="h-3 w-3" />
          )}
          {loadMode === 'paginated' ? 'Carregar Tudo' : 'Paginar'}
        </Button>

        {loadMode === 'all' && totalServer && totalServer > 100 && (
          <Badge variant="outline" className="text-xs text-amber-600 dark:text-amber-400">
            {totalServer} itens carregados
          </Badge>
        )}
      </div>

      {/* Navegação de páginas */}
      {showPageNavigation && (
        <div className="flex items-center gap-1 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={isLoading || currentPage === 1}
            className="h-7 w-7 p-0"
            title="Primeira página"
          >
            <ChevronsLeft className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={isLoading || currentPage === 1}
            className="h-7 w-7 p-0"
            title="Página anterior"
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>

          {/* Botões de página */}
          <div className="flex items-center gap-1">
            {generatePageButtons(currentPage, totalPages).map((page, index) => (
              page === '...' ? (
                <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground text-xs">...</span>
              ) : (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(page as number)}
                  disabled={isLoading}
                  className="h-7 min-w-[28px] px-2 text-xs"
                >
                  {page}
                </Button>
              )
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={isLoading || currentPage === totalPages}
            className="h-7 w-7 p-0"
            title="Próxima página"
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={isLoading || currentPage === totalPages}
            className="h-7 w-7 p-0"
            title="Última página"
          >
            <ChevronsRight className="h-3 w-3" />
          </Button>

          <Badge variant="secondary" className="text-xs ml-2 font-medium">
            {currentPage}-{totalPages}
          </Badge>
        </div>
      )}
    </div>
  );
};

// Função auxiliar para gerar botões de página com ellipsis
function generatePageButtons(currentPage: number, totalPages: number): (number | string)[] {
  const pages: (number | string)[] = [];
  
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Sempre mostrar primeira página
    pages.push(1);
    
    if (currentPage > 3) {
      pages.push('...');
    }
    
    // Páginas ao redor da atual
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    
    for (let i = start; i <= end; i++) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }
    
    if (currentPage < totalPages - 2) {
      pages.push('...');
    }
    
    // Sempre mostrar última página
    if (!pages.includes(totalPages)) {
      pages.push(totalPages);
    }
  }
  
  return pages;
}
