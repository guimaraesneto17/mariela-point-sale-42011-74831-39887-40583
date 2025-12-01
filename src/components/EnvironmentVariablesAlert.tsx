import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Key, 
  Database,
  Server,
  Shield,
  RefreshCw
} from 'lucide-react';

interface EnvVariable {
  name: string;
  label: string;
  icon: any;
  required: boolean;
  type: 'url' | 'key' | 'config';
  checkFn?: () => Promise<boolean>;
}

interface VariableStatus {
  variable: EnvVariable;
  present: boolean;
  valid: boolean;
  value?: string;
  error?: string;
}

const CRITICAL_VARIABLES: EnvVariable[] = [
  {
    name: 'VITE_API_URL',
    label: 'Backend API URL',
    icon: Server,
    required: true,
    type: 'url',
    checkFn: async () => {
      const url = import.meta.env.VITE_API_URL;
      if (!url) return false;
      
      try {
        const response = await fetch(`${url}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
        return response.ok;
      } catch {
        return false;
      }
    }
  }
];

const EnvironmentVariablesAlert = () => {
  const [checking, setChecking] = useState(true);
  const [variables, setVariables] = useState<VariableStatus[]>([]);

  useEffect(() => {
    checkVariables();
  }, []);

  const checkVariables = async () => {
    setChecking(true);
    
    const results: VariableStatus[] = [];
    
    for (const variable of CRITICAL_VARIABLES) {
      const value = import.meta.env[variable.name];
      const present = !!value;
      
      let valid = false;
      let error: string | undefined;
      
      if (present && variable.checkFn) {
        try {
          valid = await variable.checkFn();
          if (!valid) {
            error = variable.type === 'url' 
              ? 'URL inválida ou inacessível'
              : variable.type === 'key'
              ? 'Chave inválida ou formato incorreto'
              : 'Valor inválido';
          }
        } catch (e: any) {
          valid = false;
          error = e.message || 'Erro ao validar';
        }
      } else if (present) {
        valid = true;
      }
      
      results.push({
        variable,
        present,
        valid,
        value: present ? value : undefined,
        error
      });
    }
    
    setVariables(results);
    setChecking(false);
  };

  const getStatusIcon = (status: VariableStatus) => {
    if (!status.present) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    if (!status.valid) {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
    return <CheckCircle2 className="h-5 w-5 text-green-500" />;
  };

  const getStatusBadge = (status: VariableStatus) => {
    if (!status.present) {
      return <Badge variant="destructive">Ausente</Badge>;
    }
    if (!status.valid) {
      return <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">Inválido</Badge>;
    }
    return <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">OK</Badge>;
  };

  const criticalIssues = variables.filter(v => v.variable.required && (!v.present || !v.valid));
  const warnings = variables.filter(v => !v.variable.required && (!v.present || !v.valid));
  const allOk = criticalIssues.length === 0 && warnings.length === 0;

  const maskValue = (value: string, type: string) => {
    if (type === 'key') {
      return value.substring(0, 20) + '...' + value.substring(value.length - 10);
    }
    return value;
  };

  return (
    <div className="space-y-4">
      {/* Alertas Críticos */}
      {criticalIssues.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Variáveis Críticas Ausentes ou Inválidas</AlertTitle>
          <AlertDescription>
            {criticalIssues.length} variável(is) crítica(s) precisa(m) de atenção. 
            O sistema pode não funcionar corretamente sem elas.
          </AlertDescription>
        </Alert>
      )}

      {/* Avisos */}
      {warnings.length > 0 && criticalIssues.length === 0 && (
        <Alert className="border-yellow-500/50 bg-yellow-500/10">
          <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <AlertTitle className="text-yellow-600 dark:text-yellow-400">Avisos de Configuração</AlertTitle>
          <AlertDescription className="text-yellow-600/80 dark:text-yellow-400/80">
            {warnings.length} variável(is) opcional(is) não está(ão) configurada(s).
          </AlertDescription>
        </Alert>
      )}

      {/* Tudo OK */}
      {allOk && !checking && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle className="text-green-600 dark:text-green-400">Configuração Completa</AlertTitle>
          <AlertDescription className="text-green-600/80 dark:text-green-400/80">
            Todas as variáveis de ambiente críticas estão configuradas corretamente.
          </AlertDescription>
        </Alert>
      )}

      {/* Card de Detalhes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Variáveis de Ambiente
              </CardTitle>
              <CardDescription>
                Status das variáveis críticas do sistema
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={checkVariables}
              disabled={checking}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
              Revalidar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Lista de Variáveis */}
          <div className="space-y-3">
            {checking ? (
              <div className="text-center py-8 text-muted-foreground">
                <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin" />
                <p>Verificando variáveis...</p>
              </div>
            ) : (
              variables.map((status, index) => {
                const Icon = status.variable.icon;
                
                return (
                  <div key={index} className="flex items-start justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-3 flex-1">
                      {getStatusIcon(status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{status.variable.label}</span>
                          {status.variable.required && (
                            <Badge variant="outline" className="text-xs">Obrigatório</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground font-mono mb-1">
                          {status.variable.name}
                        </p>
                        
                        {status.present && status.value && (
                          <p className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded mt-1">
                            {maskValue(status.value, status.variable.type)}
                          </p>
                        )}
                        
                        {status.error && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            ⚠️ {status.error}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="ml-3">
                      {getStatusBadge(status)}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Informações Adicionais */}
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <h4 className="font-medium text-sm">ℹ️ Como Configurar</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• <strong>VITE_API_URL</strong>: URL do backend MongoDB (ex: https://api.exemplo.com/api)</li>
              <li>• <strong>Backend (Render)</strong>: Configure MONGODB_URI, JWT_SECRET, REFRESH_TOKEN_SECRET e BLOB_READ_WRITE_TOKEN</li>
            </ul>
          </div>

          {/* Ações */}
          {(criticalIssues.length > 0 || warnings.length > 0) && (
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => window.open('https://docs.lovable.dev/features/cloud', '_blank')}
              >
                📖 Documentação
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => {
                  const envExample = `# Frontend (Lovable)
VITE_API_URL=https://seu-backend.onrender.com/api

# Backend (Render)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=(gerado automaticamente pelo Render)
REFRESH_TOKEN_SECRET=(gerado automaticamente pelo Render)
BLOB_READ_WRITE_TOKEN=vercel_blob_token
NODE_ENV=production
NPM_CONFIG_PRODUCTION=false`;
                  
                  navigator.clipboard.writeText(envExample);
                  alert('Template de .env copiado para área de transferência!');
                }}
              >
                📋 Copiar Template
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnvironmentVariablesAlert;
