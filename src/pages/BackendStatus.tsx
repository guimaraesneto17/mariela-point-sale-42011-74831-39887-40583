import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, CheckCircle2, XCircle, Clock, RefreshCw, Database, Server, AlertCircle, Activity, History, Trash2 } from 'lucide-react';
import StorageCleanup from '@/components/StorageCleanup';
import { StorageAnalyticsDashboard } from "@/components/StorageAnalyticsDashboard";
import { ImageSEOAnalyzer } from "@/components/ImageSEOAnalyzer";
import WatermarkSettings from "@/components/WatermarkSettings";
import CleanupScheduler from "@/components/CleanupScheduler";
import EnvironmentVariablesAlert from "@/components/EnvironmentVariablesAlert";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { connectionLogger, ConnectionEvent, LatencyDataPoint } from '@/lib/connectionLogger';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://mariela-pdv-backend.onrender.com/api';

interface EndpointStatus {
  name: string;
  endpoint: string;
  status: 'checking' | 'success' | 'error' | 'slow';
  responseTime?: number;
  errorMessage?: string;
}

interface HealthResponse {
  status: string;
  database: {
    status: string;
    name: string;
    host: string;
  };
  uptime: number;
  memory: any;
}

export default function BackendStatus() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [latencyData, setLatencyData] = useState<LatencyDataPoint[]>([]);
  const [connectionLogs, setConnectionLogs] = useState<ConnectionEvent[]>([]);
  const [endpoints, setEndpoints] = useState<EndpointStatus[]>([
    { name: 'Produtos', endpoint: '/produtos', status: 'checking' },
    { name: 'Clientes', endpoint: '/clientes', status: 'checking' },
    { name: 'Vendas', endpoint: '/vendas', status: 'checking' },
    { name: 'Estoque', endpoint: '/estoque', status: 'checking' },
    { name: 'Fornecedores', endpoint: '/fornecedores', status: 'checking' },
    { name: 'Vendedores', endpoint: '/vendedores', status: 'checking' },
    { name: 'Caixa', endpoint: '/caixa', status: 'checking' },
    { name: 'Contas a Pagar', endpoint: '/contas-pagar', status: 'checking' },
    { name: 'Contas a Receber', endpoint: '/contas-receber', status: 'checking' },
    { name: 'Vitrine Virtual', endpoint: '/vitrine', status: 'checking' },
  ]);

  const checkEndpoint = async (endpoint: EndpointStatus): Promise<EndpointStatus> => {
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint.endpoint}`, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      if (response.ok) {
        return {
          ...endpoint,
          status: responseTime > 5000 ? 'slow' : 'success',
          responseTime,
        };
      } else {
        return {
          ...endpoint,
          status: 'error',
          responseTime,
          errorMessage: `HTTP ${response.status}`,
        };
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      let errorMessage = 'Erro desconhecido';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Timeout (>10s)';
      } else if (error.message?.includes('Failed to fetch')) {
        errorMessage = 'Falha na conexão';
      } else if (error.message?.includes('Network')) {
        errorMessage = 'Erro de rede';
      } else {
        errorMessage = error.message;
      }

      return {
        ...endpoint,
        status: 'error',
        errorMessage,
      };
    }
  };

  const checkHealth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();
      setHealthData(data);
    } catch (error) {
      console.error('Erro ao verificar health:', error);
      setHealthData(null);
    }
  };

  const runChecks = async () => {
    setChecking(true);
    setHealthData(null);

    // Verificar health primeiro
    await checkHealth();

    // Verificar todos os endpoints em paralelo
    const results = await Promise.all(
      endpoints.map(endpoint => checkEndpoint(endpoint))
    );

    setEndpoints(results);
    setChecking(false);
  };

  useEffect(() => {
    runChecks();
    loadHistoricalData();
  }, []);

  const loadHistoricalData = () => {
    setLatencyData(connectionLogger.getLatencyData());
    setConnectionLogs(connectionLogger.getLogs());
  };

  const clearHistoricalData = () => {
    connectionLogger.clearLogs();
    connectionLogger.clearLatencyData();
    loadHistoricalData();
  };

  const getEventIcon = (type: ConnectionEvent['type']) => {
    switch (type) {
      case 'online':
        return <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'offline':
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case 'slow':
        return <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
      case 'timeout':
        return <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />;
    }
  };

  const getEventBadge = (type: ConnectionEvent['type']) => {
    switch (type) {
      case 'online':
        return <Badge variant="default" className="bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400">Online</Badge>;
      case 'offline':
        return <Badge variant="destructive">Offline</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      case 'slow':
        return <Badge variant="secondary" className="bg-yellow-50 dark:bg-yellow-950 text-yellow-600 dark:text-yellow-400">Lento</Badge>;
      case 'timeout':
        return <Badge variant="secondary" className="bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400">Timeout</Badge>;
    }
  };

  const getStatusIcon = (status: EndpointStatus['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
      case 'slow':
        return <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
      case 'checking':
        return <RefreshCw className="h-5 w-5 text-muted-foreground animate-spin" />;
    }
  };

  const getStatusBadge = (status: EndpointStatus['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400">Online</Badge>;
      case 'error':
        return <Badge variant="destructive">Offline</Badge>;
      case 'slow':
        return <Badge variant="secondary" className="bg-yellow-50 dark:bg-yellow-950 text-yellow-600 dark:text-yellow-400">Lento</Badge>;
      case 'checking':
        return <Badge variant="outline">Verificando...</Badge>;
    }
  };

  const successCount = endpoints.filter(e => e.status === 'success').length;
  const errorCount = endpoints.filter(e => e.status === 'error').length;
  const slowCount = endpoints.filter(e => e.status === 'slow').length;

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Status do Backend</h1>
            <p className="text-muted-foreground">Validação de APIs e banco de dados</p>
          </div>
        </div>
        <Button onClick={runChecks} disabled={checking}>
          <RefreshCw className={`h-4 w-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
          Verificar Novamente
        </Button>
      </div>

      {/* Alertas de Variáveis de Ambiente */}
      <EnvironmentVariablesAlert />

      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Online
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{successCount}</div>
            <p className="text-xs text-muted-foreground">APIs funcionando</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              Lentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{slowCount}</div>
            <p className="text-xs text-muted-foreground">Resposta lenta (&gt;5s)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              Offline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{errorCount}</div>
            <p className="text-xs text-muted-foreground">APIs com erro</p>
          </CardContent>
        </Card>
      </div>

      {/* Status do MongoDB */}
      {healthData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              MongoDB
            </CardTitle>
            <CardDescription>Conexão com banco de dados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status:</span>
              {healthData.database.status === 'connected' ? (
                <Badge variant="default" className="bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400">
                  Conectado
                </Badge>
              ) : (
                <Badge variant="destructive">
                  {healthData.database.status}
                </Badge>
              )}
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Database:</span>
                <p className="font-medium">{healthData.database.name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Host:</span>
                <p className="font-medium">{healthData.database.host}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Uptime:</span>
                <p className="font-medium">{Math.floor(healthData.uptime / 60)}m</p>
              </div>
              <div>
                <span className="text-muted-foreground">Status Geral:</span>
                <p className="font-medium capitalize">{healthData.status}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            APIs do Sistema
          </CardTitle>
          <CardDescription>Status de cada endpoint da API</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {endpoints.map((endpoint, index) => (
              <div key={index}>
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    {getStatusIcon(endpoint.status)}
                    <div className="flex-1">
                      <p className="font-medium">{endpoint.name}</p>
                      <p className="text-xs text-muted-foreground">{endpoint.endpoint}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {endpoint.responseTime !== undefined && (
                      <span className="text-sm text-muted-foreground">
                        {endpoint.responseTime}ms
                      </span>
                    )}
                    {endpoint.errorMessage && (
                      <span className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {endpoint.errorMessage}
                      </span>
                    )}
                    {getStatusBadge(endpoint.status)}
                  </div>
                </div>
                {index < endpoints.length - 1 && <Separator className="my-1" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Latência */}
      {latencyData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Latência em Tempo Real
                </CardTitle>
                <CardDescription>Evolução do tempo de resposta das APIs</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={clearHistoricalData}>
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar Histórico
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={latencyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="label" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  label={{ 
                    value: 'ms', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { fill: 'hsl(var(--muted-foreground))' }
                  }}
                />
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="responseTime" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', r: 3 }}
                  activeDot={{ r: 5 }}
                  name="Latência"
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Média:</span>
                <p className="font-medium">
                  {Math.round(latencyData.reduce((acc, d) => acc + d.responseTime, 0) / latencyData.length)}ms
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Mínimo:</span>
                <p className="font-medium">
                  {Math.min(...latencyData.map(d => d.responseTime))}ms
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Máximo:</span>
                <p className="font-medium">
                  {Math.max(...latencyData.map(d => d.responseTime))}ms
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico de Eventos */}
      {connectionLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Conexão
            </CardTitle>
            <CardDescription>
              Registro de quedas, timeouts e mudanças de status ({connectionLogs.length} eventos)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {connectionLogs.map((log, index) => (
                <div key={index}>
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="mt-0.5">
                      {getEventIcon(log.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{log.message}</p>
                        {getEventBadge(log.type)}
                      </div>
                      {log.details && (
                        <p className="text-sm text-muted-foreground">{log.details}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(log.timestamp), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                      </p>
                    </div>
                    {log.responseTime && (
                      <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                        {log.responseTime}ms
                      </span>
                    )}
                  </div>
                  {index < connectionLogs.length - 1 && <Separator className="my-1" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics de Storage */}
      <StorageAnalyticsDashboard />

      {/* Análise de SEO de Imagens */}
      <ImageSEOAnalyzer />

      {/* Configurações de Watermark */}
      <WatermarkSettings />

      {/* Agendamento de Limpeza Automática */}
      <CleanupScheduler />

      {/* Gerenciamento de Storage */}
      <StorageCleanup />

      {/* Informações Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>Informações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Timeout configurado: 10 segundos por requisição</p>
          <p>• Conexão considerada lenta: &gt;5 segundos de resposta</p>
          <p>• Verificação automática: a cada 30 segundos no indicador</p>
          <p>• Histórico mantido: últimos 7 dias ou 100 eventos</p>
          <p>• Dados de latência: últimas 24 horas ou 50 pontos</p>
          <p>• URL da API: {API_BASE_URL}</p>
        </CardContent>
      </Card>
    </div>
  );
}
