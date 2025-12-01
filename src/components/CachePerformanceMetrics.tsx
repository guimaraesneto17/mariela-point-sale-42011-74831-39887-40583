import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, TrendingUp, Clock, Database, RefreshCw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://mariela-pdv-backend.onrender.com/api';

interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: string;
}

export function CachePerformanceMetrics() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  const loadStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('mariela_access_token');
      const response = await fetch(`${API_BASE_URL}/cache/stats`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas de cache:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async () => {
    try {
      setClearing(true);
      const token = localStorage.getItem('mariela_access_token');
      await fetch(`${API_BASE_URL}/cache/clear`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      toast.success('Cache limpo com sucesso');
      await loadStats();
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
      toast.error('Erro ao limpar cache');
    } finally {
      setClearing(false);
    }
  };

  useEffect(() => {
    loadStats();
    // Atualizar a cada 10 segundos
    const interval = setInterval(loadStats, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 animate-pulse" />
            Performance do Cache
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Carregando métricas...</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const hitRateValue = parseFloat(stats.hitRate.replace('%', ''));
  const total = stats.hits + stats.misses;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Performance do Cache
            </CardTitle>
            <CardDescription>
              Estatísticas em tempo real de otimização
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadStats}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={clearCache}
              disabled={clearing}
            >
              Limpar Cache
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Hit Rate Geral */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Taxa de Acertos (Hit Rate)</span>
            <Badge 
              variant={hitRateValue >= 70 ? "default" : hitRateValue >= 40 ? "secondary" : "destructive"}
              className={
                hitRateValue >= 70 
                  ? "bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400" 
                  : hitRateValue >= 40
                  ? "bg-yellow-50 dark:bg-yellow-950 text-yellow-600 dark:text-yellow-400"
                  : ""
              }
            >
              {stats.hitRate}
            </Badge>
          </div>
          <Progress value={hitRateValue} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {hitRateValue >= 70 
              ? "Excelente! O cache está otimizando muito bem as consultas."
              : hitRateValue >= 40
              ? "Bom desempenho. Há espaço para melhorias."
              : "Taxa baixa. Considere ajustar os TTLs do cache."}
          </p>
        </div>

        {/* Métricas Detalhadas */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium">Hits</span>
            </div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.hits}
            </p>
            <p className="text-xs text-muted-foreground">
              {total > 0 ? Math.round((stats.hits / total) * 100) : 0}% das requisições
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium">Misses</span>
            </div>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {stats.misses}
            </p>
            <p className="text-xs text-muted-foreground">
              {total > 0 ? Math.round((stats.misses / total) * 100) : 0}% das requisições
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Database className="h-4 w-4" />
              <span className="text-xs font-medium">Entradas</span>
            </div>
            <p className="text-2xl font-bold">
              {stats.size}
            </p>
            <p className="text-xs text-muted-foreground">
              Chaves em cache
            </p>
          </div>
        </div>

        {/* Resumo de Benefícios */}
        {stats.hits > 0 && (
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Benefícios do Cache
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Consultas evitadas ao MongoDB:</p>
                <p className="font-semibold">{stats.hits} consultas</p>
              </div>
              <div>
                <p className="text-muted-foreground">Tempo economizado estimado:</p>
                <p className="font-semibold">~{Math.round(stats.hits * 0.15)}s</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
