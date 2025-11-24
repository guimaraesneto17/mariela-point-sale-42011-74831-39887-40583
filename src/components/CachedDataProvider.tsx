import { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface CachedDataProviderProps {
  children: ReactNode;
  showRefreshButton?: boolean;
}

export function CachedDataProvider({ children, showRefreshButton = false }: CachedDataProviderProps) {
  const queryClient = useQueryClient();

  const handleRefreshAll = () => {
    queryClient.invalidateQueries();
    toast.success('Dados atualizados!');
  };

  return (
    <div className="relative">
      {showRefreshButton && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            onClick={handleRefreshAll}
            variant="outline"
            size="icon"
            className="rounded-full shadow-lg hover:shadow-xl transition-shadow"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      )}
      {children}
    </div>
  );
}
