import { Badge } from '@/components/ui/badge';
import { Database, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useCacheStatus } from '@/hooks/usePrefetch';
import { QUERY_KEYS } from '@/hooks/useQueryCache';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

/**
 * Indicador visual do estado do cache
 * Mostra quais dados estão em cache e quando foram atualizados
 */
export function CacheIndicator() {
  const { isCached, getCacheAge, isStale } = useCacheStatus();

  const formatCacheAge = (age: number | null) => {
    if (!age) return 'N/A';
    const seconds = Math.floor(age / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  const cacheEntries = [
    { name: 'Clientes', key: QUERY_KEYS.CLIENTES as readonly string[] },
    { name: 'Vendas', key: QUERY_KEYS.VENDAS as readonly string[] },
    { name: 'Produtos', key: QUERY_KEYS.PRODUTOS as readonly string[] },
    { name: 'Estoque', key: QUERY_KEYS.ESTOQUE as readonly string[] },
    { name: 'Vendedores', key: QUERY_KEYS.VENDEDORES as readonly string[] },
    { name: 'Fornecedores', key: QUERY_KEYS.FORNECEDORES as readonly string[] },
    { name: 'Contas a Pagar', key: QUERY_KEYS.CONTAS_PAGAR as readonly string[] },
    { name: 'Contas a Receber', key: QUERY_KEYS.CONTAS_RECEBER as readonly string[] },
  ];

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/15">
              <Database className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Status do Cache</p>
        </TooltipContent>
      </Tooltip>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h4 className="font-semibold">Status do Cache</h4>
            <Badge variant="outline" className="text-xs">
              {cacheEntries.filter(e => isCached(e.key)).length}/{cacheEntries.length}
            </Badge>
          </div>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {cacheEntries.map(({ name, key }) => {
              const cached = isCached(key);
              const age = getCacheAge(key);
              const stale = isStale(key);

              return (
                <div 
                  key={name} 
                  className="flex items-center justify-between p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {cached ? (
                      stale ? (
                        <Clock className="h-4 w-4 text-orange-500" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium">{name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {cached && (
                      <>
                        <Badge variant="secondary" className="text-xs">
                          {formatCacheAge(age)}
                        </Badge>
                        {stale && (
                          <Badge variant="outline" className="text-xs text-orange-500">
                            Stale
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t text-xs text-muted-foreground">
            <p>💾 Cache persistido no localStorage</p>
            <p>🔄 Atualização automática a cada 5 minutos</p>
            <p>⚡ Prefetch em navegação</p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
