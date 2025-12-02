import React, { Component, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

/**
 * Error Boundary específico para erros de API
 * Captura erros durante chamadas de API e oferece opção de retry
 */
export class ApiErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('API Error Boundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isNetworkError = this.state.error?.message.includes('Network') || 
                            this.state.error?.message.includes('fetch');
      const isTimeoutError = this.state.error?.message.includes('timeout');

      return (
        <Card className="border-destructive/50 m-4">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro ao carregar dados</AlertTitle>
              <AlertDescription className="mt-2 space-y-2">
                {isNetworkError && (
                  <p>Não foi possível conectar ao servidor. Verifique sua conexão com a internet.</p>
                )}
                {isTimeoutError && (
                  <p>A requisição demorou muito tempo. O servidor pode estar ocupado.</p>
                )}
                {!isNetworkError && !isTimeoutError && (
                  <p>{this.state.error?.message || 'Ocorreu um erro inesperado'}</p>
                )}
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={this.handleReset}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Tentar novamente
                  </Button>
                  <Button
                    onClick={() => window.location.reload()}
                    variant="ghost"
                    size="sm"
                  >
                    Recarregar página
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
