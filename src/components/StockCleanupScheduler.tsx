import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
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
import { Trash2, Play, Clock, Package, AlertTriangle, CheckCircle2, RefreshCw, Eye, Sparkles, XCircle, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { stockCleanupAPI } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [progress, setProgress] = useState(0);
  const [progressStage, setProgressStage] = useState('');

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
    setProgress(0);
    setProgressStage('Analisando estoque...');
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 8, 90));
    }, 200);
    try {
      const result = await stockCleanupAPI.execute(true);
      clearInterval(progressInterval);
      setProgress(100);
      setProgressStage('Concluído!');
      setPreviewResult(result);
      setShowPreview(true);
    } catch (error: any) {
      clearInterval(progressInterval);
      setProgress(0);
      setProgressStage('');
      toast.error('Erro ao pré-visualizar limpeza', {
        description: error.message || 'Tente novamente',
      });
    } finally {
      setTimeout(() => {
        setIsExecuting(false);
        setProgress(0);
        setProgressStage('');
      }, 600);
    }
  };

  const handleExecute = async () => {
    setIsExecuting(true);
    setConfirmDialogOpen(false);
    setProgress(0);
    setProgressStage('Removendo registros...');
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 5, 85));
    }, 300);
    try {
      const result = await stockCleanupAPI.execute(false);
      clearInterval(progressInterval);
      setProgress(100);
      setProgressStage('Limpeza concluída!');
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
      clearInterval(progressInterval);
      setProgress(0);
      setProgressStage('');
      toast.error('Erro ao executar limpeza', {
        description: error.message || 'Tente novamente',
      });
    } finally {
      setTimeout(() => {
        setIsExecuting(false);
        setProgress(0);
        setProgressStage('');
      }, 800);
    }
  };

  return (
    <Card className="overflow-hidden border-border/60 shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="bg-gradient-to-r from-destructive/5 via-destructive/3 to-transparent pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2.5 text-lg">
              <motion.div
                animate={config.enabled ? { rotate: [0, -10, 10, -5, 5, 0] } : {}}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 5 }}
              >
                <Trash2 className="h-5 w-5 text-destructive" />
              </motion.div>
              Limpeza de Estoque e Produtos
            </CardTitle>
            <CardDescription>
              Remove automaticamente produtos com estoque zerado
            </CardDescription>
          </div>
          <Badge
            variant={config.enabled ? 'default' : 'secondary'}
            className={`text-xs transition-colors ${config.enabled ? 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30' : ''}`}
          >
            <span className={`inline-block h-1.5 w-1.5 rounded-full mr-1.5 ${config.enabled ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'}`} />
            {config.enabled ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Barra de progresso */}
        <AnimatePresence>
          {isExecuting && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  {progressStage}
                </span>
                <span className="font-mono text-xs font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Configuração do Scheduler */}
        <div className="space-y-4 rounded-lg border border-border/50 p-4 bg-muted/20">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Agendamento</span>
          </div>
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

          <AnimatePresence>
            {config.enabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3"
              >
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Execução Manual */}
        <div className="space-y-3 rounded-lg border border-border/50 p-4 bg-muted/20">
          <div className="flex items-center gap-2 mb-1">
            <Play className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Execução Manual</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreview}
                disabled={isExecuting}
                className="gap-2 transition-all"
              >
                {isExecuting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                Pré-visualizar
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirmDialogOpen(true)}
                disabled={isExecuting}
                className="gap-2 shadow-sm hover:shadow-md transition-all"
              >
                {isExecuting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Executar Agora
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Preview Results */}
        <AnimatePresence>
          {showPreview && previewResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">Pré-visualização</span>
                </div>
                <Badge variant="outline" className="text-xs border-yellow-500/40 text-yellow-700 dark:text-yellow-300">
                  Simulação
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md bg-background/80 p-3 text-center">
                  <div className="text-2xl font-bold">{previewResult.totalAnalisados}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Analisados</div>
                </div>
                <div className="rounded-md bg-destructive/10 p-3 text-center">
                  <div className="text-2xl font-bold text-destructive">{previewResult.totalRemovidos}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">A remover</div>
                </div>
              </div>

              {previewResult.removidos.length > 0 && (
                <div className="mt-2 space-y-1 max-h-40 overflow-y-auto rounded-md bg-background/60 p-3">
                  {previewResult.removidos.map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center gap-2 text-xs py-1 border-b border-border/30 last:border-0"
                    >
                      <Package className="h-3 w-3 text-destructive/70 shrink-0" />
                      <span className="font-mono font-medium">{item.codigoProduto}</span>
                      {item.nomeProduto && (
                        <span className="text-muted-foreground truncate">— {item.nomeProduto}</span>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Último resultado */}
        <AnimatePresence>
          {lastResult && !lastResult.dryRun && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 rounded-lg border border-green-500/30 bg-green-500/5 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-semibold text-green-700 dark:text-green-300">Última Execução</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(lastResult.executadoEm).toLocaleString('pt-BR')}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-md bg-background/80 p-2.5 text-center">
                  <BarChart3 className="h-3.5 w-3.5 mx-auto text-muted-foreground mb-1" />
                  <div className="text-lg font-bold">{lastResult.totalAnalisados}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Analisados</div>
                </div>
                <div className="rounded-md bg-background/80 p-2.5 text-center">
                  <Trash2 className="h-3.5 w-3.5 mx-auto text-destructive/70 mb-1" />
                  <div className={`text-lg font-bold ${lastResult.totalRemovidos > 0 ? 'text-destructive' : ''}`}>{lastResult.totalRemovidos}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Removidos</div>
                </div>
                <div className="rounded-md bg-background/80 p-2.5 text-center">
                  {lastResult.erros && lastResult.erros.length > 0 ? (
                    <>
                      <XCircle className="h-3.5 w-3.5 mx-auto text-destructive mb-1" />
                      <div className="text-lg font-bold text-destructive">{lastResult.erros.length}</div>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 mx-auto text-green-500 mb-1" />
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">0</div>
                    </>
                  )}
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Erros</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
