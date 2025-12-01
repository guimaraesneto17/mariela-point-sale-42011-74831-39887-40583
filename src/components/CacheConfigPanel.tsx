import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { 
  Settings, 
  Save, 
  Trash2, 
  Plus, 
  RefreshCw,
  Database,
  Zap,
  Clock
} from "lucide-react";
import { axiosInstance } from "@/lib/api";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";

interface CacheConfig {
  _id: string;
  endpoint: string;
  ttl: number;
  enabled: boolean;
  compressionEnabled: boolean;
  compressionLevel: number;
  accessCount: number;
  lastModified: string;
}

export function CacheConfigPanel() {
  const [configs, setConfigs] = useState<CacheConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [redisEnabled, setRedisEnabled] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<CacheConfig | null>(null);

  // Form state
  const [formEndpoint, setFormEndpoint] = useState("");
  const [formTTL, setFormTTL] = useState(300000);
  const [formEnabled, setFormEnabled] = useState(true);
  const [formCompressionEnabled, setFormCompressionEnabled] = useState(true);
  const [formCompressionLevel, setFormCompressionLevel] = useState([6]);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get<{ configs: CacheConfig[]; redisEnabled: boolean }>('/cache/configs');
      setConfigs(response.data.configs);
      setRedisEnabled(response.data.redisEnabled);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações de cache');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  const handleSave = async () => {
    try {
      await axiosInstance.post('/cache/configs', {
        endpoint: formEndpoint,
        ttl: formTTL,
        enabled: formEnabled,
        compressionEnabled: formCompressionEnabled,
        compressionLevel: formCompressionLevel[0],
      });

      toast.success('Configuração salva com sucesso');
      setDialogOpen(false);
      resetForm();
      loadConfigs();
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast.error('Erro ao salvar configuração');
    }
  };

  const handleDelete = async (endpoint: string) => {
    try {
      await axiosInstance.delete(`/cache/configs/${encodeURIComponent(endpoint)}`);
      toast.success('Configuração removida');
      loadConfigs();
    } catch (error) {
      console.error('Erro ao deletar configuração:', error);
      toast.error('Erro ao remover configuração');
    }
  };

  const handleEdit = (config: CacheConfig) => {
    setEditingConfig(config);
    setFormEndpoint(config.endpoint);
    setFormTTL(config.ttl);
    setFormEnabled(config.enabled);
    setFormCompressionEnabled(config.compressionEnabled);
    setFormCompressionLevel([config.compressionLevel]);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingConfig(null);
    setFormEndpoint("");
    setFormTTL(300000);
    setFormEnabled(true);
    setFormCompressionEnabled(true);
    setFormCompressionLevel([6]);
  };

  const formatTTL = (ms: number) => {
    const seconds = ms / 1000;
    if (seconds < 60) return `${seconds}s`;
    const minutes = seconds / 60;
    if (minutes < 60) return `${minutes}m`;
    const hours = minutes / 60;
    return `${hours.toFixed(1)}h`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Configuração de Cache
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              Gerenciar TTL e compressão por endpoint
              {redisEnabled && (
                <Badge variant="secondary" className="gap-1">
                  <Database className="h-3 w-3" />
                  Redis Ativo
                </Badge>
              )}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadConfigs}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Configuração
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingConfig ? 'Editar' : 'Nova'} Configuração
                  </DialogTitle>
                  <DialogDescription>
                    Configure o comportamento do cache para um endpoint específico
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="endpoint">Endpoint</Label>
                    <Input
                      id="endpoint"
                      value={formEndpoint}
                      onChange={(e) => setFormEndpoint(e.target.value)}
                      placeholder="/api/produtos"
                      disabled={!!editingConfig}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ttl">TTL (Time to Live)</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        id="ttl"
                        type="number"
                        value={formTTL}
                        onChange={(e) => setFormTTL(parseInt(e.target.value) || 0)}
                      />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatTTL(formTTL)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Tempo em milissegundos (1000ms = 1s)
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="enabled" className="cursor-pointer">
                      Cache Habilitado
                    </Label>
                    <Switch
                      id="enabled"
                      checked={formEnabled}
                      onCheckedChange={setFormEnabled}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="compression" className="cursor-pointer">
                      Compressão Habilitada
                    </Label>
                    <Switch
                      id="compression"
                      checked={formCompressionEnabled}
                      onCheckedChange={setFormCompressionEnabled}
                    />
                  </div>

                  {formCompressionEnabled && (
                    <div className="space-y-2">
                      <Label>Nível de Compressão: {formCompressionLevel[0]}</Label>
                      <Slider
                        value={formCompressionLevel}
                        onValueChange={setFormCompressionLevel}
                        min={0}
                        max={9}
                        step={1}
                      />
                      <p className="text-xs text-muted-foreground">
                        0 = Sem compressão, 9 = Máxima compressão (mais lento)
                      </p>
                    </div>
                  )}

                  <Button onClick={handleSave} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Configuração
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : configs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Settings className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma configuração cadastrada</p>
            <p className="text-sm">Clique em "Nova Configuração" para começar</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Endpoint</TableHead>
                <TableHead>TTL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Compressão</TableHead>
                <TableHead className="text-right">Acessos</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {configs.map((config) => (
                <TableRow key={config._id}>
                  <TableCell className="font-mono text-sm">
                    {config.endpoint}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTTL(config.ttl)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={config.enabled ? "default" : "secondary"}>
                      {config.enabled ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {config.compressionEnabled ? (
                      <Badge variant="secondary" className="gap-1">
                        <Zap className="h-3 w-3" />
                        Nível {config.compressionLevel}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Desativada</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {config.accessCount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(config)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(config.endpoint)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
