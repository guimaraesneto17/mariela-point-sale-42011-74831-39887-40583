import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Clock,
  Calendar,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Play,
  Settings,
  History,
  Database as DatabaseIcon,
  HardDrive,
  RefreshCw,
  ImageIcon,
  BarChart3,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  LogIn,
  Eye,
  TrendingDown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import axiosInstance from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';

interface CleanupConfig {
  id: string;
  enabled: boolean;
  schedule: string;
  last_execution: string | null;
  next_execution: string | null;
  auto_delete: boolean;
  updated_at: string;
}

interface CleanupHistory {
  id: string;
  execution_date: string;
  total_images_checked: number;
  orphan_images_found: number;
  images_deleted: number;
  images_failed: number;
  deleted_images: any;
  failed_images: any;
  execution_time_ms: number;
  storage_freed_bytes: number;
  status: 'success' | 'partial' | 'failed';
  error_message: string | null;
  triggered_by: string;
}

interface PreviewResult {
  totalStorageImages: number;
  totalReferencedImages: number;
  orphanImagesCount: number;
  orphanImages?: { url: string; pathname: string; size: number }[];
}

const SCHEDULE_PRESETS = [
  { label: 'Diariamente (meia-noite)', value: '0 0 * * *' },
  { label: 'Semanalmente (domingo)', value: '0 0 * * 0' },
  { label: 'Mensalmente (dia 1)', value: '0 0 1 * *' },
  { label: 'Personalizado', value: 'custom' }
];

const chartConfig = {
  orphan: { label: 'Imagens Órfãs', color: 'hsl(var(--destructive))' },
  deleted: { label: 'Deletadas', color: 'hsl(142 76% 36%)' },
  checked: { label: 'Verificadas', color: 'hsl(var(--primary))' },
};

const CleanupScheduler = () => {
  const { isAuthenticated } = useAuth();
  const [config, setConfig] = useState<CleanupConfig | null>(null);
  const [history, setHistory] = useState<CleanupHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState('0 0 1 * *');
  const [customSchedule, setCustomSchedule] = useState('');
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressStage, setProgressStage] = useState('');
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadConfig();
    loadHistory();
  }, []);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('cleanup_cron_config')
        .select('*')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setConfig(data);
        setSelectedSchedule(data.schedule);
      } else {
        const defaultConfig = {
          enabled: false,
          schedule: '0 0 1 * *',
          auto_delete: false,
          notifications_enabled: false,
        };
        const { data: newData, error: insertError } = await supabase
          .from('cleanup_cron_config')
          .insert(defaultConfig)
          .select()
          .single();

        if (insertError) throw insertError;
        setConfig(newData);
        setSelectedSchedule(newData.schedule);
      }
    } catch (error: any) {
      console.error('Erro ao carregar configuração:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('image_cleanup_history')
        .select('*')
        .order('execution_date', { ascending: false })
        .limit(20);

      if (error) throw error;
      setHistory((data || []) as CleanupHistory[]);
    } catch (error: any) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const updateConfig = async (updates: Partial<CleanupConfig>) => {
    if (!config) return;
    try {
      const { error } = await supabase
        .from('cleanup_cron_config')
        .update(updates)
        .eq('id', config.id);

      if (error) throw error;
      setConfig({ ...config, ...updates });
      toast.success('Configuração atualizada com sucesso');
    } catch (error: any) {
      console.error('Erro ao atualizar configuração:', error);
      toast.error('Erro ao atualizar configuração');
    }
  };

  const handlePreview = async () => {
    setPreviewing(true);
    setProgress(0);
    setProgressStage('Verificando imagens no storage...');
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 8, 90));
    }, 200);
    try {
      const { data } = await axiosInstance.post('/cleanup/orphan-images?dryRun=true');
      clearInterval(progressInterval);
      setProgress(100);
      setProgressStage('Concluído!');
      setPreviewResult({
        totalStorageImages: data.totalStorageImages || 0,
        totalReferencedImages: data.totalReferencedImages || 0,
        orphanImagesCount: data.orphanImagesCount || 0,
        orphanImages: data.orphanImages || [],
      });
      setShowPreview(true);
    } catch (error: any) {
      clearInterval(progressInterval);
      setProgress(0);
      setProgressStage('');
      const errorMessage = error?.response?.data?.message || error?.message || 'Tente novamente';
      toast.error('Erro ao pré-visualizar', { description: errorMessage });
    } finally {
      setTimeout(() => {
        setPreviewing(false);
        setProgress(0);
        setProgressStage('');
      }, 600);
    }
  };

  const executeCleanup = async () => {
    setExecuting(true);
    setProgress(0);
    setProgressStage('Verificando imagens órfãs...');
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 5, 85));
    }, 300);
    try {
      const { data } = await axiosInstance.post('/cleanup/orphan-images');
      clearInterval(progressInterval);
      setProgress(100);
      setProgressStage('Concluído!');
      const deleted = data.deletedImagesCount || data.deletedImages?.length || 0;
      toast.success(`Limpeza executada! ${deleted} imagens deletadas`);

      try {
        await supabase.from('image_cleanup_history').insert({
          status: 'success',
          total_images_checked: data.totalStorageImages || 0,
          orphan_images_found: data.orphanImagesCount || 0,
          images_deleted: deleted,
          images_failed: data.failedDeletionsCount || 0,
          deleted_images: data.deletedImages || [],
          failed_images: data.failedDeletions || [],
          storage_freed_bytes: 0,
          triggered_by: 'manual',
        });
      } catch (histErr) {
        console.warn('Erro ao salvar histórico:', histErr);
      }

      setPreviewResult(null);
      setShowPreview(false);
      loadHistory();
    } catch (error: any) {
      clearInterval(progressInterval);
      setProgress(0);
      setProgressStage('');
      console.error('Erro ao executar limpeza:', error);
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Falha na execução da limpeza';
      toast.error('Erro ao executar limpeza', { description: errorMessage });
    } finally {
      setTimeout(() => {
        setExecuting(false);
        setProgress(0);
        setProgressStage('');
      }, 800);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30"><CheckCircle2 className="h-3 w-3 mr-1" />Sucesso</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30"><AlertCircle className="h-3 w-3 mr-1" />Parcial</Badge>;
      case 'failed':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/30"><XCircle className="h-3 w-3 mr-1" />Falhou</Badge>;
      default:
        return null;
    }
  };

  // Prepare chart data from history (reversed to chronological order)
  const chartData = [...history].reverse().map((record) => ({
    date: format(new Date(record.execution_date), 'dd/MM', { locale: ptBR }),
    orphan: record.orphan_images_found,
    deleted: record.images_deleted,
    checked: record.total_images_checked,
  }));

  if (loading) {
    return (
      <Card className="overflow-hidden border-border/60">
        <CardContent className="p-6 flex items-center gap-3 text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Carregando configurações...
        </CardContent>
      </Card>
    );
  }

  const isWorking = executing || previewing;

  return (
    <div className="space-y-6">
      {/* Configuração */}
      <Card className="overflow-hidden border-border/60 shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent pb-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2.5 text-lg">
                <motion.div
                  animate={config?.enabled ? { rotate: [0, 360] } : {}}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                >
                  <Settings className="h-5 w-5 text-primary" />
                </motion.div>
                Agendamento Automático de Limpeza
              </CardTitle>
              <CardDescription>
                Configure a execução automática da limpeza de imagens órfãs
              </CardDescription>
            </div>
            <Badge
              variant={config?.enabled ? 'default' : 'secondary'}
              className={`text-xs transition-colors ${config?.enabled ? 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30' : ''}`}
            >
              <span className={`inline-block h-1.5 w-1.5 rounded-full mr-1.5 ${config?.enabled ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'}`} />
              {config?.enabled ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress bar */}
          <AnimatePresence>
            {isWorking && (
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

          {/* Auth warning */}
          <AnimatePresence>
            {!isAuthenticated && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive"
              >
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Autenticação necessária</p>
                  <p className="text-xs opacity-80">Faça login para executar a limpeza ou alterar configurações.</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-destructive/50 text-destructive hover:bg-destructive/10"
                  onClick={() => window.location.href = '/auth'}
                >
                  <LogIn className="h-4 w-4 mr-1" />
                  Login
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Settings section */}
          <div className="rounded-lg border border-border/50 p-4 bg-muted/20 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Configurações</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enabled" className="text-sm font-medium">Limpeza Automática</Label>
                <p className="text-xs text-muted-foreground">Ativar/desativar execução agendada</p>
              </div>
              <Switch
                id="enabled"
                checked={config?.enabled}
                onCheckedChange={(checked) => updateConfig({ enabled: checked })}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-delete" className="text-sm font-medium">Deletar Automaticamente</Label>
                <p className="text-xs text-muted-foreground">Se desativado, apenas reporta sem deletar</p>
              </div>
              <Switch
                id="auto-delete"
                checked={config?.auto_delete}
                onCheckedChange={(checked) => updateConfig({ auto_delete: checked })}
              />
            </div>
          </div>

          {/* Schedule section */}
          <div className="rounded-lg border border-border/50 p-4 bg-muted/20 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Frequência de Execução</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SCHEDULE_PRESETS.map((preset) => (
                <motion.div key={preset.value} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    variant={selectedSchedule === preset.value ? 'default' : 'outline'}
                    className="justify-start w-full text-xs h-9"
                    size="sm"
                    onClick={() => {
                      setSelectedSchedule(preset.value);
                      if (preset.value !== 'custom') {
                        updateConfig({ schedule: preset.value });
                      }
                    }}
                  >
                    <Calendar className="h-3.5 w-3.5 mr-2" />
                    {preset.label}
                  </Button>
                </motion.div>
              ))}
            </div>

            <AnimatePresence>
              {selectedSchedule === 'custom' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <Label htmlFor="custom-schedule" className="text-xs">Expressão Cron Personalizada</Label>
                  <div className="flex gap-2">
                    <Input
                      id="custom-schedule"
                      placeholder="0 0 1 * * (min hora dia mês dia_semana)"
                      value={customSchedule}
                      onChange={(e) => setCustomSchedule(e.target.value)}
                      className="text-sm"
                    />
                    <Button size="sm" onClick={() => updateConfig({ schedule: customSchedule })}>
                      Salvar
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Formato cron: minuto hora dia mês dia_da_semana
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Manual execution */}
          <div className="rounded-lg border border-border/50 p-4 bg-muted/20 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Play className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Execução Manual</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <Button
                  onClick={handlePreview}
                  disabled={isWorking || !isAuthenticated}
                  variant="outline"
                  size="sm"
                  className="gap-2 transition-all"
                >
                  {previewing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                  Pré-visualizar
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <Button
                  onClick={executeCleanup}
                  disabled={isWorking || !isAuthenticated}
                  variant="outline"
                  size="sm"
                  className="gap-2 transition-all"
                >
                  {executing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                  {executing ? 'Executando...' : 'Executar Agora'}
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

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-md bg-background/80 p-3 text-center">
                    <BarChart3 className="h-3.5 w-3.5 mx-auto text-muted-foreground mb-1" />
                    <div className="text-2xl font-bold">{previewResult.totalStorageImages}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">No Storage</div>
                  </div>
                  <div className="rounded-md bg-background/80 p-3 text-center">
                    <CheckCircle2 className="h-3.5 w-3.5 mx-auto text-green-600 dark:text-green-400 mb-1" />
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{previewResult.totalReferencedImages}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Referenciadas</div>
                  </div>
                  <div className="rounded-md bg-destructive/10 p-3 text-center">
                    <AlertCircle className="h-3.5 w-3.5 mx-auto text-destructive mb-1" />
                    <div className="text-2xl font-bold text-destructive">{previewResult.orphanImagesCount}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Órfãs (a remover)</div>
                  </div>
                </div>

                {previewResult.orphanImages && previewResult.orphanImages.length > 0 && (
                  <div className="mt-2 space-y-1 max-h-40 overflow-y-auto rounded-md bg-background/60 p-3">
                    {previewResult.orphanImages.map((item, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="flex items-center justify-between gap-2 text-xs py-1 border-b border-border/30 last:border-0"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <ImageIcon className="h-3 w-3 text-destructive/70 shrink-0" />
                          <span className="font-mono truncate">{item.pathname}</span>
                        </div>
                        <span className="text-muted-foreground shrink-0">{formatBytes(item.size)}</span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info section */}
          <div className="rounded-lg border border-border/50 p-4 bg-muted/20 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Informações</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md bg-background/80 p-3 text-center">
                <div className="text-xs text-muted-foreground mb-1">Última Execução</div>
                <div className="text-sm font-medium">
                  {config?.last_execution
                    ? format(new Date(config.last_execution), "dd/MM/yy HH:mm", { locale: ptBR })
                    : 'Nunca'}
                </div>
              </div>
              <div className="rounded-md bg-background/80 p-3 text-center">
                <div className="text-xs text-muted-foreground mb-1">Agendamento</div>
                <div className="text-sm font-medium font-mono">{config?.schedule}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trend Chart */}
      <AnimatePresence>
        {chartData.length >= 2 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="overflow-hidden border-border/60 shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader className="bg-gradient-to-r from-orange-500/5 via-orange-500/3 to-transparent pb-4">
                <CardTitle className="flex items-center gap-2.5 text-lg">
                  <TrendingDown className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  Tendência de Imagens Órfãs
                </CardTitle>
                <CardDescription>
                  Evolução de imagens órfãs encontradas e deletadas ao longo das execuções
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fillOrphan" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-orphan)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--color-orphan)" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="fillDeleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-deleted)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--color-deleted)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="orphan"
                      stroke="var(--color-orphan)"
                      fill="url(#fillOrphan)"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="deleted"
                      stroke="var(--color-deleted)"
                      fill="url(#fillDeleted)"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      <Card className="overflow-hidden border-border/60 shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader className="bg-gradient-to-r from-blue-500/5 via-blue-500/3 to-transparent pb-4">
          <CardTitle className="flex items-center gap-2.5 text-lg">
            <History className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Histórico de Execuções
          </CardTitle>
          <CardDescription>
            Registro completo de todas as limpezas executadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-muted-foreground"
            >
              <DatabaseIcon className="h-14 w-14 mx-auto mb-4 opacity-30" />
              <p>Nenhuma execução registrada ainda</p>
              <p className="text-xs mt-1">Execute a limpeza para ver o histórico aqui</p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {history.map((record, index) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div
                    className="p-4 rounded-lg border border-border/40 hover:border-border/80 hover:bg-muted/30 transition-all duration-200 cursor-pointer"
                    onClick={() => setExpandedHistory(expandedHistory === record.id ? null : record.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">
                            {format(new Date(record.execution_date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Executado por: <span className="font-medium">{record.triggered_by}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(record.status)}
                        {expandedHistory === record.id
                          ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        }
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <div className="rounded-md bg-background/80 p-2 text-center">
                        <BarChart3 className="h-3.5 w-3.5 mx-auto text-muted-foreground mb-0.5" />
                        <div className="text-base font-bold">{record.total_images_checked}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Verificadas</div>
                      </div>
                      <div className="rounded-md bg-yellow-500/5 p-2 text-center">
                        <AlertCircle className="h-3.5 w-3.5 mx-auto text-yellow-600 dark:text-yellow-400 mb-0.5" />
                        <div className="text-base font-bold text-yellow-600 dark:text-yellow-400">{record.orphan_images_found}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Órfãs</div>
                      </div>
                      <div className="rounded-md bg-green-500/5 p-2 text-center">
                        <Trash2 className="h-3.5 w-3.5 mx-auto text-green-600 dark:text-green-400 mb-0.5" />
                        <div className="text-base font-bold text-green-600 dark:text-green-400">{record.images_deleted}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Deletadas</div>
                      </div>
                      <div className="rounded-md bg-blue-500/5 p-2 text-center">
                        <HardDrive className="h-3.5 w-3.5 mx-auto text-blue-600 dark:text-blue-400 mb-0.5" />
                        <div className="text-base font-bold text-blue-600 dark:text-blue-400">{formatBytes(record.storage_freed_bytes)}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Liberado</div>
                      </div>
                    </div>

                    {record.images_failed > 0 && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-destructive rounded-md bg-destructive/5 p-2">
                        <AlertCircle className="h-4 w-4" />
                        <span>{record.images_failed} imagens falharam ao deletar</span>
                      </div>
                    )}

                    {/* Expanded details */}
                    <AnimatePresence>
                      {expandedHistory === record.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mt-4 pt-4 border-t space-y-4"
                        >
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Tempo de Execução:</span>
                            <Badge variant="outline" className="text-xs font-mono">{(record.execution_time_ms / 1000).toFixed(2)}s</Badge>
                          </div>

                          {record.deleted_images && Array.isArray(record.deleted_images) && record.deleted_images.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                <Trash2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                Imagens Deletadas ({record.deleted_images.length})
                              </h4>
                              <div className="max-h-40 overflow-y-auto rounded-md bg-background/60 border border-border/30 p-3">
                                <ul className="text-xs space-y-1 font-mono">
                                  {record.deleted_images.map((img: string, i: number) => (
                                    <motion.li
                                      key={i}
                                      initial={{ opacity: 0, x: -5 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: i * 0.02 }}
                                      className="text-green-600 dark:text-green-400 py-0.5 border-b border-border/20 last:border-0"
                                    >
                                      ✓ {img}
                                    </motion.li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}

                          {record.failed_images && Array.isArray(record.failed_images) && record.failed_images.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                <XCircle className="h-4 w-4 text-destructive" />
                                Falhas ({record.failed_images.length})
                              </h4>
                              <div className="max-h-40 overflow-y-auto rounded-md bg-destructive/5 border border-destructive/20 p-3">
                                <ul className="text-xs space-y-2 font-mono">
                                  {record.failed_images.map((fail: any, i: number) => (
                                    <li key={i} className="text-destructive py-1 border-b border-destructive/10 last:border-0">
                                      <div>✗ {fail.path}</div>
                                      <div className="text-muted-foreground ml-3">→ {fail.error}</div>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}

                          {record.error_message && (
                            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
                              <p className="text-sm text-destructive">
                                <strong>Erro:</strong> {record.error_message}
                              </p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Total stats */}
      <AnimatePresence>
        {history.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="overflow-hidden border-border/60 shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader className="bg-gradient-to-r from-green-500/5 via-green-500/3 to-transparent pb-4">
                <CardTitle className="flex items-center gap-2.5 text-lg">
                  <Sparkles className="h-5 w-5 text-green-600 dark:text-green-400" />
                  Estatísticas Totais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="rounded-lg bg-muted/30 border border-border/40 p-4 text-center">
                    <History className="h-5 w-5 mx-auto text-primary mb-2" />
                    <div className="text-2xl font-bold">{history.length}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Execuções</div>
                  </div>
                  <div className="rounded-lg bg-muted/30 border border-border/40 p-4 text-center">
                    <BarChart3 className="h-5 w-5 mx-auto text-blue-600 dark:text-blue-400 mb-2" />
                    <div className="text-2xl font-bold">
                      {history.reduce((sum, h) => sum + h.total_images_checked, 0)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">Verificadas</div>
                  </div>
                  <div className="rounded-lg bg-muted/30 border border-border/40 p-4 text-center">
                    <Trash2 className="h-5 w-5 mx-auto text-green-600 dark:text-green-400 mb-2" />
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {history.reduce((sum, h) => sum + h.images_deleted, 0)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">Deletadas</div>
                  </div>
                  <div className="rounded-lg bg-muted/30 border border-border/40 p-4 text-center">
                    <HardDrive className="h-5 w-5 mx-auto text-blue-600 dark:text-blue-400 mb-2" />
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {formatBytes(history.reduce((sum, h) => sum + h.storage_freed_bytes, 0))}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">Liberado</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CleanupScheduler;
