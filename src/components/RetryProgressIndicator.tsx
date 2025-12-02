import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface RetryProgressIndicatorProps {
  isRetrying: boolean;
  retryAttempt: number;
  maxRetries: number;
  error?: string;
  onRetry?: () => void;
}

export function RetryProgressIndicator({
  isRetrying,
  retryAttempt,
  maxRetries,
  error,
  onRetry,
}: RetryProgressIndicatorProps) {
  if (!isRetrying && !error) return null;

  const progress = (retryAttempt / maxRetries) * 100;

  return (
    <Card className="fixed bottom-20 right-4 z-50 p-4 max-w-sm bg-card/95 backdrop-blur-sm border-2 shadow-xl animate-slide-in">
      <div className="space-y-3">
        {isRetrying && (
          <>
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div className="flex-1">
                <p className="font-semibold text-sm text-foreground">
                  Tentando reconectar...
                </p>
                <p className="text-xs text-muted-foreground">
                  Tentativa {retryAttempt} de {maxRetries}
                </p>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </>
        )}

        {error && !isRetrying && (
          <>
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-sm text-foreground">
                  Falha na conexão
                </p>
                <p className="text-xs text-muted-foreground mt-1">{error}</p>
              </div>
            </div>
            {onRetry && (
              <Button
                onClick={onRetry}
                variant="outline"
                size="sm"
                className="w-full gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Tentar novamente
              </Button>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
