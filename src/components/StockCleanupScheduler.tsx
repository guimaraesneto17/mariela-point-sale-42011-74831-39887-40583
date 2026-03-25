import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2, Play, Clock, Package, AlertTriangle, CheckCircle2, RefreshCw, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { stockCleanupAPI } from '@/lib/api';

interface CleanupResult {
  totalAnalisados: number;
  totalRemovidos: number;
  removidos: { codigoProduto: string; nomeProduto?: string }[];
  erros?: { codigoProduto: string; error: string }[];
  executadoEm: string;
  dryRun: boolean;
}

interface SchedulerConfig {
  enabled: boolean;
  intervalMinutes: number;
}

const STORAGE_KEY = 'stock-cleanup-scheduler-config';
const HISTORY_KEY = 'stock-cleanup-history';

export function StockCleanupScheduler() {
  const [config, setConfig] = useState<SchedulerConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : { enabled: false, intervalMinutes: 60 };
  });
  const [isExecuting, setIsExecuting] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [previewResult, setPreviewResult] = useState<CleanupResult | null>(null);
  const [lastResult, setLastResult] = useState<CleanupResult | null>(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  const [showPreview, setShowPreview] = useState(false);

  // Salvar config no localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  // Scheduler automático
  useEffect(() => {
    if (!config.enabled) return;

    const intervalMs = config.intervalMinutes * 60 * 1000;
    const intervalId = setInterval(async () => {
      try {
        const result = await stockCleanupAPI.execute(false);
        setLastResult(result);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(result));
        if (result.totalRemovidos > 0) {
          toast.info(`Limpeza automática: ${result.totalRemovidos} produto(s) removido(s)`);
        }
      } catch (error) {
        console.error('Erro na limpeza automática:', error);
      }
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [config.enabled, config.intervalMinutes]);

  const handlePreview = async () => {
    setIsExecuting(true);
    try {
      const result = await stockCleanupAPI.execute(true);
      setPreviewResult(result);
      setShowPreview(true);
    } catch (error: any) {
      toast.error('Erro ao pré-visualizar limpeza', {
        description: error.message || 'Tente novamente',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleExecute = async () => {
    setIsExecuting(true);
    setConfirmDialogOpen(false);
    try {
      const result = await stockCleanupAPI.execute(false);
      setLastResult(result);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(result));
      setPreviewResult(null);
      setShowPreview(false);
      
      if (result.totalRemovidos > 0) {
        toast.success(`Limpeza concluída: ${result.totalRemovidos} produto(s) e estoque(s) removido(s)`);
      } else {
        toast.info('Nenhum produto com estoque zerado encontrado');
      }
    } catch (error: any) {
      toast.error('Erro ao executar limpeza', {
        description: error.message || 'Tente novamente',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Limpeza de Estoque e Produtos
        </CardTitle>
        <CardDescription>
          Remove automaticamente produtos com estoque zerado (estoque e produto)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuração do Scheduler */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Execução Automática</Label>
              <p className="text-xs text-muted-foreground">
                Limpar automaticamente em intervalos regulares
              </p>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={(enabled) => setConfig(prev => ({ ...prev, enabled }))}
            />
          </div>

          {config.enabled && (
            <div className="flex items-center gap-3">
              <Label className="text-sm whitespace-nowrap">Intervalo:</Label>
              <Select
                value={String(config.intervalMinutes)}
                onValueChange={(value) => setConfig(prev => ({ ...prev, intervalMinutes: Number(value) }))}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutos</SelectItem>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                  <SelectItem value="120">2 horas</SelectItem>
                  <SelectItem value="360">6 horas</SelectItem>
                  <SelectItem value="720">12 horas</SelectItem>
                  <SelectItem value="1440">24 horas</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                Ativo
              </Badge>
            </div>
          )}
        </div>

        <Separator />

        {/* Execução Manual */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Execução Manual</Label>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreview}
              disabled={isExecuting}
              className="gap-2"
            >
              {isExecuting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
              Pré-visualizar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirmDialogOpen(true)}
              disabled={isExecuting}
              className="gap-2"
            >
              {isExecuting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Executar Agora
            </Button>
          </div>
        </div>

        {/* Preview Results */}
        {showPreview && previewResult && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <Label className="text-sm font-medium">Pré-visualização (sem exclusão)</Label>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                <p className="text-sm">
                  <span className="font-medium">{previewResult.totalAnalisados}</span> produtos analisados
                </p>
                <p className="text-sm">
                  <span className="font-medium text-destructive">{previewResult.totalRemovidos}</span> seriam removidos
                </p>
                {previewResult.removidos.length > 0 && (
                  <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                    {previewResult.removidos.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <Package className="h-3 w-3 text-muted-foreground" />
                        <span className="font-mono">{item.codigoProduto}</span>
                        {item.nomeProduto && (
                          <span className="text-muted-foreground">- {item.nomeProduto}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Último resultado */}
        {lastResult && !lastResult.dryRun && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <Label className="text-sm font-medium">Última Execução</Label>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Data:</span>{' '}
                  {new Date(lastResult.executadoEm).toLocaleString('pt-BR')}
                </p>
                <p>
                  <span className="text-muted-foreground">Analisados:</span>{' '}
                  {lastResult.totalAnalisados}
                </p>
                <p>
                  <span className="text-muted-foreground">Removidos:</span>{' '}
                  <span className={lastResult.totalRemovidos > 0 ? 'text-destructive font-medium' : ''}>
                    {lastResult.totalRemovidos}
                  </span>
                </p>
                {lastResult.erros && lastResult.erros.length > 0 && (
                  <p>
                    <span className="text-muted-foreground">Erros:</span>{' '}
                    <span className="text-destructive">{lastResult.erros.length}</span>
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Dialog de Confirmação */}
        <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Confirmar Limpeza de Estoque
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  Esta ação irá <strong>excluir permanentemente</strong> todos os produtos e seus registros de estoque que possuem quantidade igual a zero.
                </p>
                <p className="text-destructive font-medium">
                  Esta ação não pode ser desfeita!
                </p>
                <p className="text-sm">
                  Recomendamos usar "Pré-visualizar" primeiro para verificar quais itens serão removidos.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleExecute}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Confirmar Exclusão
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
