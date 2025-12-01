import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import axiosInstance from "@/lib/api";
import { Activity, Database, CheckCircle2, XCircle, AlertCircle, RefreshCw } from "lucide-react";

interface RedisStats {
  enabled: boolean;
  connected: boolean;
  error?: string;
  memoryUsage?: number;
  totalKeys?: number;
  hitRate?: number;
  uptime?: number;
}

export function RedisMonitoring() {
  const [stats, setStats] = useState<RedisStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const loadStats = async () => {
    try {
      setRefreshing(true);
      const response = await axiosInstance.get<RedisStats>('/cache/redis-stats');
      setStats(response.data);
    } catch (error: any) {
      console.error('Erro ao carregar estatísticas do Redis:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar estatísticas",
        description: error.response?.data?.message || "Não foi possível obter informações do Redis",
      });
      setStats({
        enabled: false,
        connected: false,
        error: error.response?.data?.message || "Erro ao conectar",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 10000); // Auto-refresh a cada 10s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Redis Status
          </CardTitle>
          <CardDescription>Carregando informações...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  const getStatusIcon = () => {
    if (!stats.enabled) return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    if (stats.connected) return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusBadge = () => {
    if (!stats.enabled) return <Badge variant="secondary">Desabilitado</Badge>;
    if (stats.connected) return <Badge variant="default" className="bg-green-500">Conectado</Badge>;
    return <Badge variant="destructive">Desconectado</Badge>;
  };

  const formatUptime = (seconds?: number) => {
    if (!seconds) return "N/A";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return "N/A";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <CardTitle>Redis Cache Distribuído</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <Button
              variant="outline"
              size="sm"
              onClick={loadStats}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        <CardDescription>
          {stats.enabled 
            ? "Cache distribuído para múltiplas instâncias do servidor"
            : "REDIS_URL não configurado - usando cache em memória local"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {stats.error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive font-medium">Erro de Conexão</p>
            <p className="text-sm text-muted-foreground mt-1">{stats.error}</p>
          </div>
        )}

        {stats.enabled && stats.connected && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Uso de Memória</p>
              <p className="text-2xl font-bold">{formatBytes(stats.memoryUsage)}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total de Chaves</p>
              <p className="text-2xl font-bold">{stats.totalKeys?.toLocaleString() || 0}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Taxa de Acerto</p>
              <p className="text-2xl font-bold">{stats.hitRate?.toFixed(1) || 0}%</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Uptime</p>
              <p className="text-2xl font-bold">{formatUptime(stats.uptime)}</p>
            </div>
          </div>
        )}

        {!stats.enabled && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Para habilitar cache distribuído, configure a variável <code className="px-1 py-0.5 bg-muted rounded text-xs">REDIS_URL</code> no Render.com
            </p>
            <p className="text-xs text-muted-foreground">
              Exemplo: redis://default:password@redis-host:6379
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
