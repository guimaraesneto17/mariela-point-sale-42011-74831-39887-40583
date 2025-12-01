import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { HardDrive, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import axiosInstance from "@/lib/api";

import { useNavigate } from "react-router-dom";

interface StorageStats {
  totalImages: number;
  referencedImages: number;
  orphanImages: number;
  totalSizeBytes: number;
  totalSizeMB: string;
  usagePercentage: number;
  limitMB: number;
}

interface StorageAlert {
  level: 'warning' | 'critical' | 'danger';
  message: string;
  percentage: number;
}

export const StorageNotifications = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [storageAlert, setStorageAlert] = useState<StorageAlert | null>(null);
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      checkStorageUsage();
      // Verificar a cada 5 minutos
      const interval = setInterval(checkStorageUsage, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  const checkStorageUsage = async () => {
    try {
      const response = await axiosInstance.get<{
        success: boolean;
        stats: Omit<StorageStats, 'usagePercentage' | 'limitMB'>;
      }>('/cleanup/storage-stats');

      if (response.data.success) {
        const rawStats = response.data.stats;
        // Limite de 1GB (pode ser configurado)
        const limitMB = 1024;
        const currentMB = parseFloat(rawStats.totalSizeMB);
        const usagePercentage = (currentMB / limitMB) * 100;

        const fullStats: StorageStats = {
          ...rawStats,
          usagePercentage,
          limitMB,
        };

        setStats(fullStats);

        // Determinar nível de alerta
        if (usagePercentage >= 95) {
          setStorageAlert({
            level: 'danger',
            message: 'Espaço de armazenamento quase esgotado! Execute limpeza imediatamente.',
            percentage: usagePercentage,
          });
        } else if (usagePercentage >= 90) {
          setStorageAlert({
            level: 'critical',
            message: 'Armazenamento crítico! Recomenda-se limpeza urgente de imagens órfãs.',
            percentage: usagePercentage,
          });
        } else if (usagePercentage >= 80) {
          setStorageAlert({
            level: 'warning',
            message: 'Armazenamento elevado. Considere executar limpeza de imagens órfãs.',
            percentage: usagePercentage,
          });
        } else {
          setStorageAlert(null);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar uso de armazenamento:', error);
    }
  };

  if (!isAdmin || !storageAlert) {
    return null;
  }

  const getBorderColor = () => {
    switch (storageAlert.level) {
      case 'danger':
        return 'border-red-500/50';
      case 'critical':
        return 'border-orange-500/50';
      case 'warning':
        return 'border-yellow-500/50';
    }
  };

  const getBackgroundColor = () => {
    switch (storageAlert.level) {
      case 'danger':
        return 'bg-gradient-to-br from-red-500/10 to-red-500/5';
      case 'critical':
        return 'bg-gradient-to-br from-orange-500/10 to-orange-500/5';
      case 'warning':
        return 'bg-gradient-to-br from-yellow-500/10 to-yellow-500/5';
    }
  };

  const getIconColor = () => {
    switch (storageAlert.level) {
      case 'danger':
        return 'text-red-600';
      case 'critical':
        return 'text-orange-600';
      case 'warning':
        return 'text-yellow-600';
    }
  };

  const getTextColor = () => {
    switch (storageAlert.level) {
      case 'danger':
        return 'text-red-900 dark:text-red-400';
      case 'critical':
        return 'text-orange-900 dark:text-orange-400';
      case 'warning':
        return 'text-yellow-900 dark:text-yellow-400';
    }
  };

  const getProgressColor = () => {
    switch (storageAlert.level) {
      case 'danger':
        return 'bg-red-600';
      case 'critical':
        return 'bg-orange-600';
      case 'warning':
        return 'bg-yellow-600';
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-6">
      <Alert className={`${getBorderColor()} ${getBackgroundColor()}`}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full flex items-center justify-between p-0 h-auto hover:bg-transparent"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className={`h-5 w-5 ${getIconColor()}`} />
              <AlertTitle className={`mb-0 ${getTextColor()}`}>
                Alerta de Armazenamento
              </AlertTitle>
            </div>
            <ChevronDown className={`h-5 w-5 ${getIconColor()} transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-4">
          <AlertDescription className="space-y-4">
            <div className="space-y-2">
              <p className={`font-medium ${getTextColor()}`}>{storageAlert.message}</p>
              
              {stats && (
                <>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>Uso de armazenamento</span>
                      <span className="font-bold">{storageAlert.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-primary/20">
                      <div 
                        className={`h-full transition-all ${getProgressColor()}`}
                        style={{ width: `${storageAlert.percentage}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{stats.totalSizeMB} MB usado</span>
                      <span>{stats.limitMB} MB limite</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 bg-background/50 rounded-lg border border-border/50">
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Total de Imagens</span>
                      </div>
                      <p className="text-lg font-bold mt-1">{stats.totalImages}</p>
                    </div>

                    <div className="p-3 bg-background/50 rounded-lg border border-border/50">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <span className="text-xs text-muted-foreground">Imagens Órfãs</span>
                      </div>
                      <p className="text-lg font-bold mt-1">{stats.orphanImages}</p>
                    </div>
                  </div>

                  {stats.orphanImages > 0 && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate('/backend-status')}
                        className="flex-1"
                      >
                        Ver Detalhes
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </AlertDescription>
        </CollapsibleContent>
      </Alert>
    </Collapsible>
  );
};
