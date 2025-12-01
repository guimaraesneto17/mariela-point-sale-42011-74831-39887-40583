import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Image, Trash2, Search, AlertCircle, CheckCircle2, HardDrive, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { axiosInstance } from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StorageStats {
  totalImages: number;
  referencedImages: number;
  orphanImages: number;
  totalSizeBytes: number;
  totalSizeMB: string;
}

interface OrphanImage {
  path: string;
  url: string;
}

interface StorageHistory {
  timestamp: string;
  totalImages: number;
  totalSizeMB: number;
  referencedImages: number;
  orphanImages: number;
}

interface CleanupResult {
  success: boolean;
  dryRun?: boolean;
  totalStorageImages: number;
  totalReferencedImages: number;
  orphanImagesCount: number;
  deletedImagesCount?: number;
  failedDeletionsCount?: number;
  orphanImages?: OrphanImage[];
  deletedImages?: string[];
  failedDeletions?: { path: string; error: string }[];
}

export default function StorageCleanup() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [history, setHistory] = useState<StorageHistory[]>([]);
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null);
  const [showOrphanList, setShowOrphanList] = useState(false);

  useEffect(() => {
    loadStats();
    loadHistory();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get<{ success: boolean; stats: StorageStats }>('/cleanup/storage-stats');
      setStats(response.data.stats);
    } catch (error: any) {
      toast.error('Erro ao carregar estatísticas', {
        description: error.response?.data?.message || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await axiosInstance.get<{ success: boolean; history: StorageHistory[] }>('/cleanup/storage-history?days=30');
      setHistory(response.data.history);
    } catch (error: any) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const runDryRun = async () => {
    try {
      setLoading(true);
      setShowOrphanList(false);
      const response = await axiosInstance.post<CleanupResult>('/cleanup/orphan-images?dryRun=true');
      setCleanupResult(response.data);
      setShowOrphanList(true);
      toast.success('Análise concluída', {
        description: `${response.data.orphanImagesCount} imagens órfãs encontradas`,
      });
    } catch (error: any) {
      toast.error('Erro ao analisar imagens', {
        description: error.response?.data?.message || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const runCleanup = async () => {
    if (!confirm('Tem certeza que deseja deletar todas as imagens órfãs? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await axiosInstance.post<CleanupResult>('/cleanup/orphan-images');
      setCleanupResult(response.data);
      toast.success('Limpeza concluída', {
        description: `${response.data.deletedImagesCount} imagens deletadas`,
      });
      // Recarregar estatísticas e histórico
      await loadStats();
      await loadHistory();
    } catch (error: any) {
      toast.error('Erro ao executar limpeza', {
        description: error.response?.data?.message || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const getTrend = () => {
    if (history.length < 2) return null;
    
    const latest = history[history.length - 1];
    const previous = history[history.length - 2];
    const diff = latest.totalSizeMB - previous.totalSizeMB;
    
    if (Math.abs(diff) < 0.1) return null;
    
    return {
      direction: diff > 0 ? 'up' : 'down',
      value: Math.abs(diff).toFixed(2),
    };
  };

  const trend = getTrend();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Gerenciamento de Imagens
            </CardTitle>
            <CardDescription>
              Cleanup de imagens órfãs e estatísticas de storage
            </CardDescription>
          </div>
          <Button onClick={loadStats} disabled={loading} variant="outline" size="sm">
            <HardDrive className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estatísticas de Storage */}
        {stats && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total de Imagens</p>
                <p className="text-2xl font-bold">{stats.totalImages}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Referenciadas</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.referencedImages}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Órfãs</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {stats.orphanImages}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Tamanho Total</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{stats.totalSizeMB} MB</p>
                  {trend && (
                    <Badge 
                      variant={trend.direction === 'up' ? 'destructive' : 'default'} 
                      className={trend.direction === 'down' ? 'bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400' : ''}
                    >
                      {trend.direction === 'up' ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {trend.value} MB
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Gráfico de Evolução */}
            {history.length > 1 && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Evolução do Storage (últimos 30 dias)</h4>
                    <p className="text-xs text-muted-foreground">
                      Tamanho total em MB ao longo do tempo
                    </p>
                  </div>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={history}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="timestamp"
                        tickFormatter={(value) => format(new Date(value), 'dd/MM', { locale: ptBR })}
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        yAxisId="left"
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        label={{ 
                          value: 'MB', 
                          angle: -90, 
                          position: 'insideLeft',
                          style: { fill: 'hsl(var(--muted-foreground))' }
                        }}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        label={{ 
                          value: 'Imagens', 
                          angle: 90, 
                          position: 'insideRight',
                          style: { fill: 'hsl(var(--muted-foreground))' }
                        }}
                      />
                      <RechartsTooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        labelFormatter={(value) => format(new Date(value), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="totalSizeMB" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))', r: 3 }}
                        activeDot={{ r: 5 }}
                        name="Tamanho (MB)"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="totalImages" 
                        stroke="hsl(var(--chart-2))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--chart-2))', r: 3 }}
                        activeDot={{ r: 5 }}
                        name="Total de Imagens"
                        yAxisId="right"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </>
        )}

        <Separator />

        {/* Ações de Cleanup */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Limpeza de Imagens Órfãs</h4>
          <p className="text-sm text-muted-foreground">
            Imagens órfãs são arquivos no storage que não estão mais referenciados em nenhum produto.
            Use o dry-run para visualizar quais imagens serão removidas antes de executar a limpeza.
          </p>
          
          <div className="flex gap-3">
            <Button 
              onClick={runDryRun} 
              disabled={loading}
              variant="outline"
            >
              <Search className="h-4 w-4 mr-2" />
              Analisar (Dry Run)
            </Button>
            <Button 
              onClick={runCleanup} 
              disabled={loading}
              variant="destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Executar Limpeza
            </Button>
          </div>
        </div>

        {/* Resultado do Cleanup */}
        {cleanupResult && (
          <div className="space-y-4">
            <Separator />
            
            {cleanupResult.dryRun ? (
              <Alert>
                <Search className="h-4 w-4" />
                <AlertDescription>
                  <strong>Modo Dry Run:</strong> Nenhuma imagem foi deletada.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  <strong>Limpeza Executada:</strong> {cleanupResult.deletedImagesCount} imagens deletadas.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Total no Storage:</span>
                <p className="font-medium">{cleanupResult.totalStorageImages}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Referenciadas:</span>
                <p className="font-medium text-green-600 dark:text-green-400">
                  {cleanupResult.totalReferencedImages}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Órfãs:</span>
                <p className="font-medium text-orange-600 dark:text-orange-400">
                  {cleanupResult.orphanImagesCount}
                </p>
              </div>
            </div>

            {/* Lista de Imagens Órfãs */}
            {showOrphanList && cleanupResult.orphanImages && cleanupResult.orphanImages.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Imagens Órfãs Encontradas</h4>
                  <Badge variant="outline">{cleanupResult.orphanImages.length}</Badge>
                </div>
                <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded-lg p-3">
                  {cleanupResult.orphanImages.map((img, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 transition-colors"
                    >
                      <Image className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-mono truncate">{img.path}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Falhas na Deleção */}
            {cleanupResult.failedDeletions && cleanupResult.failedDeletions.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Falhas:</strong> {cleanupResult.failedDeletionsCount} imagens não puderam ser deletadas.
                  <div className="mt-2 max-h-[200px] overflow-y-auto space-y-1">
                    {cleanupResult.failedDeletions.map((fail, index) => (
                      <div key={index} className="text-xs font-mono">
                        {fail.path}: {fail.error}
                      </div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
