import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Database, Layers, Loader2 } from "lucide-react";

interface PaginationControlsProps {
  totalLocal: number;
  totalServer?: number;
  loadMode: 'paginated' | 'all';
  onToggleMode: () => void;
  isLoading?: boolean;
  entityName: string;
  entityNamePlural: string;
  icon?: React.ReactNode;
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
}: PaginationControlsProps) => {
  const showServerTotal = totalServer !== undefined && totalServer !== totalLocal;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Badge variant="secondary" className="text-sm">
        {icon}
        {totalLocal} {totalLocal === 1 ? entityName : entityNamePlural}
        {showServerTotal && (
          <span className="text-muted-foreground ml-1">
            / {totalServer} total
          </span>
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
  );
};
