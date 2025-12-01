import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flame, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { axiosInstance } from "@/lib/api";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface WarmupResult {
  warmedEndpoints: string[];
  failedEndpoints: { endpoint: string; error: string }[];
}

export function CacheWarming() {
  const [warming, setWarming] = useState(false);
  const [lastResult, setLastResult] = useState<WarmupResult | null>(null);

  const handleWarmup = async () => {
    try {
      setWarming(true);
      const response = await axiosInstance.post<WarmupResult>('/cache/warmup');
      setLastResult(response.data);
      
      if (response.data.failedEndpoints.length === 0) {
        toast.success(`Cache warming concluído! ${response.data.warmedEndpoints.length} endpoints carregados`);
      } else {
        toast.warning(`Warming parcial: ${response.data.warmedEndpoints.length} OK, ${response.data.failedEndpoints.length} falhas`);
      }
    } catch (error) {
      console.error('Erro ao fazer warming:', error);
      toast.error('Erro ao fazer warming do cache');
    } finally {
      setWarming(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Cache Warming
            </CardTitle>
            <CardDescription>
              Pré-carregar endpoints mais acessados para melhor performance
            </CardDescription>
          </div>
          <Button
            onClick={handleWarmup}
            disabled={warming}
            className="gap-2"
          >
            {warming ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Aquecendo...
              </>
            ) : (
              <>
                <Flame className="h-4 w-4" />
                Iniciar Warming
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Alert>
            <AlertDescription className="text-sm">
              O cache warming pré-carrega os 10 endpoints mais acessados, reduzindo o tempo de resposta 
              para as primeiras requisições após reiniciar o servidor.
            </AlertDescription>
          </Alert>

          {lastResult && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold">Último Resultado:</h4>
                <Badge variant="secondary">
                  {lastResult.warmedEndpoints.length + lastResult.failedEndpoints.length} endpoints processados
                </Badge>
              </div>

              {lastResult.warmedEndpoints.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Carregados com Sucesso ({lastResult.warmedEndpoints.length})
                  </p>
                  <div className="space-y-1">
                    {lastResult.warmedEndpoints.map((endpoint, idx) => (
                      <div 
                        key={idx}
                        className="text-xs font-mono bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 px-3 py-2 rounded border border-green-200 dark:border-green-900"
                      >
                        {endpoint}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {lastResult.failedEndpoints.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Falhas ({lastResult.failedEndpoints.length})
                  </p>
                  <div className="space-y-1">
                    {lastResult.failedEndpoints.map((failed, idx) => (
                      <div 
                        key={idx}
                        className="text-xs bg-red-50 dark:bg-red-950/20 px-3 py-2 rounded border border-red-200 dark:border-red-900"
                      >
                        <div className="font-mono text-red-700 dark:text-red-300">
                          {failed.endpoint}
                        </div>
                        <div className="text-red-600 dark:text-red-400 mt-1">
                          {failed.error}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!lastResult && (
            <div className="text-center py-6 text-muted-foreground">
              <Flame className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Clique em "Iniciar Warming" para pré-carregar o cache</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
