import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Clock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { connectionLogger } from '@/lib/connectionLogger';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://mariela-pdv-backend.onrender.com/api';
const CHECK_INTERVAL = 120000; // Verificar a cada 2 minutos

type ConnectionStatus = 'online' | 'offline' | 'slow';

export function ConnectionStatus() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<ConnectionStatus>('online');
  const [lastCheckTime, setLastCheckTime] = useState<number>(0);
  const [errorDetails, setErrorDetails] = useState<string>('');
  const previousStatus = useRef<ConnectionStatus>('online');

  const checkConnection = async () => {
    // Verificar se há token antes de fazer a chamada
    const token = localStorage.getItem('mariela_access_token');
    if (!token) {
      setStatus('offline');
      setErrorDetails('Não autenticado');
      return;
    }

    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      // Usar endpoint de health que é mais leve (dentro de /api)
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      setLastCheckTime(responseTime);
      setErrorDetails('');

      // Registrar latência
      connectionLogger.addLatencyPoint(responseTime);

      if (responseTime > 5000) {
        setStatus('slow');
        setErrorDetails('Conexão lenta detectada');
        
        if (previousStatus.current !== 'slow') {
          connectionLogger.logEvent({
            type: 'slow',
            message: 'Conexão lenta detectada',
            details: `Tempo de resposta: ${responseTime}ms`,
            responseTime,
          });
        }
      } else {
        if (previousStatus.current !== 'online') {
          connectionLogger.logEvent({
            type: 'online',
            message: 'Conexão restabelecida',
            details: `Tempo de resposta: ${responseTime}ms`,
            responseTime,
          });
        }
        setStatus('online');
      }
      
      previousStatus.current = status;
    } catch (error: any) {
      clearTimeout(timeoutId);
      setStatus('offline');
      setLastCheckTime(0);
      
      let errorMessage = '';
      let errorType: 'timeout' | 'error' = 'error';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Timeout na requisição (>10s)';
        errorType = 'timeout';
        setErrorDetails(errorMessage);
      } else if (error.message?.includes('Failed to fetch')) {
        errorMessage = 'Falha na conexão com servidor';
        setErrorDetails(errorMessage);
      } else if (error.message?.includes('Network')) {
        errorMessage = 'Erro de rede';
        setErrorDetails(errorMessage);
      } else {
        errorMessage = error.message || 'Erro desconhecido';
        setErrorDetails(errorMessage);
      }

      if (previousStatus.current !== 'offline') {
        connectionLogger.logEvent({
          type: errorType,
          message: 'Conexão perdida',
          details: errorMessage,
        });
      }
      
      previousStatus.current = 'offline';
    }
  };

  useEffect(() => {
    // Só verificar conexão se houver token de autenticação
    const token = localStorage.getItem('mariela_access_token');
    if (!token) {
      setStatus('offline');
      setErrorDetails('Não autenticado');
      return;
    }

    checkConnection();
    const interval = setInterval(() => {
      // Verificar token antes de cada check
      const currentToken = localStorage.getItem('mariela_access_token');
      if (currentToken) {
        checkConnection();
      }
    }, CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const getStatusConfig = () => {
    switch (status) {
      case 'online':
        return {
          icon: Wifi,
          text: 'Online',
          variant: 'default' as const,
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-950',
          tooltip: `Conexão estável (${lastCheckTime}ms) • Clique para detalhes`,
        };
      case 'slow':
        return {
          icon: Clock,
          text: 'Lento',
          variant: 'secondary' as const,
          color: 'text-yellow-600 dark:text-yellow-400',
          bgColor: 'bg-yellow-50 dark:bg-yellow-950',
          tooltip: `${errorDetails} (${lastCheckTime}ms) • Clique para detalhes`,
        };
      case 'offline':
        return {
          icon: WifiOff,
          text: 'Offline',
          variant: 'destructive' as const,
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-950',
          tooltip: `${errorDetails || 'Sem conexão'} • Clique para detalhes`,
        };
    }
  };

  const handleClick = () => {
    navigate('/backend-status');
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={config.variant}
            onClick={handleClick}
            className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 cursor-pointer transition-all hover:scale-105 ${config.bgColor} border-2`}
          >
            <Icon className={`h-4 w-4 ${config.color}`} />
            <span className="font-medium">{config.text}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
