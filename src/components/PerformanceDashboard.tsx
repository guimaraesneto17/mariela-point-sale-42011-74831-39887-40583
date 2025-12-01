import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Zap, Database, TrendingUp, Activity } from "lucide-react";
import { axiosInstance } from "@/lib/api";
import { toast } from "sonner";

interface PerformanceStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: string;
  totalRequests: number;
  compressedResponses: number;
  compressionRate: string;
  bytesServedFromCache: number;
  requestsSavedByCache: number;
}

export function PerformanceDashboard() {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    try {
      setRefreshing(true);
      const response = await axiosInstance.get<PerformanceStats>('/cache/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      toast.error('Erro ao carregar estatísticas de performance');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
    // Auto-refresh a cada 10 segundos
    const interval = setInterval(loadStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Performance Dashboard
          </CardTitle>
          <CardDescription>Carregando métricas...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-24 bg-muted rounded-lg"></div>
            <div className="h-24 bg-muted rounded-lg"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  // Calcular economia de requisições
  const totalRequestsWithoutCache = stats.totalRequests + stats.requestsSavedByCache;
  const requestReduction = totalRequestsWithoutCache > 0
    ? ((stats.requestsSavedByCache / totalRequestsWithoutCache) * 100).toFixed(1)
    : '0.0';

  // Estimar economia de banda (assumindo que compressão reduz ~70%)
  const estimatedUncompressedBytes = stats.bytesServedFromCache / 0.3; // Se comprimido é 30% do original
  const bandwidthSaved = estimatedUncompressedBytes * 0.7; // 70% economizado

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Performance Dashboard
            </CardTitle>
            <CardDescription>
              Métricas em tempo real do sistema de cache e compressão
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadStats}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cache Performance */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Database className="h-4 w-4 text-blue-500" />
            Cache Performance
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Hit Rate</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-green-600">{stats.hitRate}</p>
                <Badge variant="secondary" className="text-xs">
                  {stats.hits} hits
                </Badge>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Cache Size</p>
              <p className="text-2xl font-bold">{stats.size}</p>
              <p className="text-xs text-muted-foreground">registros</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Requisições Totais</p>
              <p className="text-2xl font-bold">{stats.totalRequests}</p>
              <p className="text-xs text-muted-foreground">desde boot</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Dados em Cache</p>
              <p className="text-2xl font-bold">{formatBytes(stats.bytesServedFromCache)}</p>
              <p className="text-xs text-muted-foreground">servidos</p>
            </div>
          </div>
        </div>

        {/* Compression Performance */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Zap className="h-4 w-4 text-yellow-500" />
            Compressão Gzip
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Taxa de Compressão</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-yellow-600">{stats.compressionRate}</p>
                <Badge variant="secondary" className="text-xs">
                  {stats.compressedResponses} respostas
                </Badge>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Banda Economizada</p>
              <p className="text-2xl font-bold text-green-600">{formatBytes(bandwidthSaved)}</p>
              <p className="text-xs text-muted-foreground">~70% redução</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Dados Transferidos</p>
              <p className="text-2xl font-bold">{formatBytes(estimatedUncompressedBytes)}</p>
              <p className="text-xs text-muted-foreground">comprimidos</p>
            </div>
          </div>
        </div>

        {/* Overall Impact */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <TrendingUp className="h-4 w-4 text-purple-500" />
            Impacto Geral
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-900">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Requisições Economizadas</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-green-600">
                      {stats.requestsSavedByCache}
                    </p>
                    <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                      -{requestReduction}%
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    De {totalRequestsWithoutCache} requisições totais
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-900">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Benefício Total</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-blue-600">
                      {formatBytes(stats.bytesServedFromCache + bandwidthSaved)}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cache + Compressão combinados
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="rounded-lg bg-muted/50 p-4 space-y-2">
          <p className="text-sm font-medium">📊 Resumo de Performance</p>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Cache reduz requisições ao banco de dados em <strong>{stats.hitRate}</strong></p>
            <p>• Compressão Gzip reduz tráfego de rede em <strong>~70%</strong></p>
            <p>• Sistema economizou <strong>{stats.requestsSavedByCache}</strong> consultas ao banco</p>
            <p>• Total de <strong>{formatBytes(stats.bytesServedFromCache + bandwidthSaved)}</strong> em dados otimizados</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
