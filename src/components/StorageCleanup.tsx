import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Image, Trash2, Search, AlertCircle, CheckCircle2, HardDrive } from 'lucide-react';
import { axiosInstance } from '@/lib/api';
import { toast } from 'sonner';

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
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null);
  const [showOrphanList, setShowOrphanList] = useState(false);

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
      // Recarregar estatísticas
      await loadStats();
    } catch (error: any) {
      toast.error('Erro ao executar limpeza', {
        description: error.response?.data?.message || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

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
            Carregar Estatísticas
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estatísticas de Storage */}
        {stats && (
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
              <p className="text-2xl font-bold">{stats.totalSizeMB} MB</p>
            </div>
          </div>
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
