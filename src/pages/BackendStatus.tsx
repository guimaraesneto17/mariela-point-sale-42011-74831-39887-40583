import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, CheckCircle2, XCircle, Clock, RefreshCw, Database, Server, AlertCircle } from 'lucide-react';

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
  }, []);

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

      {/* Informações Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>Informações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Timeout configurado: 10 segundos por requisição</p>
          <p>• Conexão considerada lenta: &gt;5 segundos de resposta</p>
          <p>• Verificação automática: a cada 30 segundos no indicador</p>
          <p>• URL da API: {API_BASE_URL}</p>
        </CardContent>
      </Card>
    </div>
  );
}
