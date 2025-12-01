import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  Database,
  HardDrive
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  deleted_images: any; // JSONB from database
  failed_images: any; // JSONB from database
  execution_time_ms: number;
  storage_freed_bytes: number;
  status: 'success' | 'partial' | 'failed';
  error_message: string | null;
  triggered_by: string;
}

const SCHEDULE_PRESETS = [
  { label: 'Diariamente (meia-noite)', value: '0 0 * * *' },
  { label: 'Semanalmente (domingo)', value: '0 0 * * 0' },
  { label: 'Mensalmente (dia 1)', value: '0 0 1 * *' },
  { label: 'Personalizado', value: 'custom' }
];

const CleanupScheduler = () => {
  const [config, setConfig] = useState<CleanupConfig | null>(null);
  const [history, setHistory] = useState<CleanupHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState('0 0 1 * *');
  const [customSchedule, setCustomSchedule] = useState('');
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
    loadHistory();
  }, []);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('cleanup_cron_config')
        .select('*')
        .single();

      if (error) throw error;

      setConfig(data);
      setSelectedSchedule(data.schedule);
    } catch (error: any) {
      console.error('Erro ao carregar configuração:', error);
      toast.error('Erro ao carregar configuração');
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

  const executeCleanup = async () => {
    setExecuting(true);
    try {
      const { data, error } = await supabase.functions.invoke('cleanup-orphan-images', {
        headers: {
          'x-triggered-by': 'manual'
        }
      });

      if (error) throw error;

      toast.success(`Limpeza executada! ${data.imagesDeleted} imagens deletadas`);
      loadHistory();
    } catch (error: any) {
      console.error('Erro ao executar limpeza:', error);
      toast.error('Erro ao executar limpeza');
    } finally {
      setExecuting(false);
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
        return <Badge className="bg-green-500/10 text-green-600 dark:text-green-400"><CheckCircle2 className="h-3 w-3 mr-1" />Sucesso</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"><AlertCircle className="h-3 w-3 mr-1" />Parcial</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/10 text-red-600 dark:text-red-400"><XCircle className="h-3 w-3 mr-1" />Falhou</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return <Card><CardContent className="p-6">Carregando...</CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      {/* Configuração do Cron */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Agendamento Automático de Limpeza
              </CardTitle>
              <CardDescription>
                Configure a execução automática da limpeza de imagens órfãs
              </CardDescription>
            </div>
            <Button 
              onClick={executeCleanup} 
              disabled={executing}
              variant="outline"
              size="sm"
            >
              <Play className="h-4 w-4 mr-2" />
              {executing ? 'Executando...' : 'Executar Agora'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Ativo/Inativo */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enabled" className="text-base">
                Limpeza Automática
              </Label>
              <p className="text-sm text-muted-foreground">
                Ativar/desativar execução agendada
              </p>
            </div>
            <Switch
              id="enabled"
              checked={config?.enabled}
              onCheckedChange={(checked) => updateConfig({ enabled: checked })}
            />
          </div>

          <Separator />

          {/* Modo de Operação */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-delete" className="text-base">
                Deletar Automaticamente
              </Label>
              <p className="text-sm text-muted-foreground">
                Se desativado, apenas reporta sem deletar
              </p>
            </div>
            <Switch
              id="auto-delete"
              checked={config?.auto_delete}
              onCheckedChange={(checked) => updateConfig({ auto_delete: checked })}
            />
          </div>

          <Separator />

          {/* Agendamento */}
          <div className="space-y-3">
            <Label>Frequência de Execução</Label>
            <div className="grid grid-cols-2 gap-3">
              {SCHEDULE_PRESETS.map((preset) => (
                <Button
                  key={preset.value}
                  variant={selectedSchedule === preset.value ? 'default' : 'outline'}
                  className="justify-start"
                  onClick={() => {
                    setSelectedSchedule(preset.value);
                    if (preset.value !== 'custom') {
                      updateConfig({ schedule: preset.value });
                    }
                  }}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  {preset.label}
                </Button>
              ))}
            </div>

            {selectedSchedule === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="custom-schedule">Expressão Cron Personalizada</Label>
                <div className="flex gap-2">
                  <Input
                    id="custom-schedule"
                    placeholder="0 0 1 * * (formato: min hora dia mês dia_semana)"
                    value={customSchedule}
                    onChange={(e) => setCustomSchedule(e.target.value)}
                  />
                  <Button onClick={() => updateConfig({ schedule: customSchedule })}>
                    Salvar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Formato cron: minuto hora dia mês dia_da_semana
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Informações */}
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Última Execução:</span>
              <span className="font-medium">
                {config?.last_execution 
                  ? format(new Date(config.last_execution), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                  : 'Nunca'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Agendamento Atual:</span>
              <span className="font-medium font-mono">{config?.schedule}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Execuções */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Histórico de Execuções
          </CardTitle>
          <CardDescription>
            Registro completo de todas as limpezas executadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma execução registrada ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((record, index) => (
                <div key={record.id}>
                  <div 
                    className="p-4 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setExpandedHistory(expandedHistory === record.id ? null : record.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {format(new Date(record.execution_date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Executado por: <span className="font-medium">{record.triggered_by}</span>
                        </p>
                      </div>
                      {getStatusBadge(record.status)}
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Verificadas</p>
                        <p className="font-bold text-lg">{record.total_images_checked}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Órfãs</p>
                        <p className="font-bold text-lg text-yellow-600 dark:text-yellow-400">{record.orphan_images_found}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Deletadas</p>
                        <p className="font-bold text-lg text-green-600 dark:text-green-400">{record.images_deleted}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Espaço Liberado</p>
                        <p className="font-bold text-lg text-blue-600 dark:text-blue-400">
                          {formatBytes(record.storage_freed_bytes)}
                        </p>
                      </div>
                    </div>

                    {record.images_failed > 0 && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                        <AlertCircle className="h-4 w-4" />
                        <span>{record.images_failed} imagens falharam ao deletar</span>
                      </div>
                    )}

                    {/* Detalhes Expandidos */}
                    {expandedHistory === record.id && (
                      <div className="mt-4 pt-4 border-t space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Tempo de Execução:</span>
                          <span className="font-medium">{(record.execution_time_ms / 1000).toFixed(2)}s</span>
                        </div>

                        {record.deleted_images && Array.isArray(record.deleted_images) && record.deleted_images.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                              <Trash2 className="h-4 w-4" />
                              Imagens Deletadas ({record.deleted_images.length})
                            </h4>
                            <div className="max-h-40 overflow-y-auto bg-muted rounded-lg p-3">
                              <ul className="text-xs space-y-1 font-mono">
                                {record.deleted_images.map((img: string, i: number) => (
                                  <li key={i} className="text-green-600 dark:text-green-400">✓ {img}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}

                        {record.failed_images && Array.isArray(record.failed_images) && record.failed_images.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                              <XCircle className="h-4 w-4 text-red-500" />
                              Falhas ({record.failed_images.length})
                            </h4>
                            <div className="max-h-40 overflow-y-auto bg-muted rounded-lg p-3">
                              <ul className="text-xs space-y-2 font-mono">
                                {record.failed_images.map((fail: any, i: number) => (
                                  <li key={i} className="text-red-600 dark:text-red-400">
                                    <div>✗ {fail.path}</div>
                                    <div className="text-muted-foreground ml-3">→ {fail.error}</div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}

                        {record.error_message && (
                          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                            <p className="text-sm text-red-600 dark:text-red-400">
                              <strong>Erro:</strong> {record.error_message}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {index < history.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estatísticas Totais */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-primary" />
              Estatísticas Totais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Total de Execuções</p>
                <p className="text-2xl font-bold">{history.length}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Imagens Verificadas</p>
                <p className="text-2xl font-bold">
                  {history.reduce((sum, h) => sum + h.total_images_checked, 0)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Imagens Deletadas</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {history.reduce((sum, h) => sum + h.images_deleted, 0)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Espaço Total Liberado</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatBytes(history.reduce((sum, h) => sum + h.storage_freed_bytes, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CleanupScheduler;
