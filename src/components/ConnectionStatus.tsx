import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Clock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://mariela-pdv-backend.onrender.com/api';
const CHECK_INTERVAL = 30000; // Verificar a cada 30 segundos

type ConnectionStatus = 'online' | 'offline' | 'slow';

export function ConnectionStatus() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<ConnectionStatus>('online');
  const [lastCheckTime, setLastCheckTime] = useState<number>(0);
  const [errorDetails, setErrorDetails] = useState<string>('');

  const checkConnection = async () => {
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos para check

    try {
      const response = await fetch(`${API_BASE_URL}/produtos`, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      setLastCheckTime(responseTime);
      setErrorDetails('');

      // Se demorar mais de 5 segundos, considerar como lento
      if (responseTime > 5000) {
        setStatus('slow');
        setErrorDetails('Conexão lenta detectada');
      } else {
        setStatus('online');
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      setStatus('offline');
      setLastCheckTime(0);
      
      // Capturar detalhes do erro
      if (error.name === 'AbortError') {
        setErrorDetails('Timeout na requisição (>10s)');
      } else if (error.message?.includes('Failed to fetch')) {
        setErrorDetails('Falha na conexão com servidor');
      } else if (error.message?.includes('Network')) {
        setErrorDetails('Erro de rede');
      } else {
        setErrorDetails(error.message || 'Erro desconhecido');
      }
    }
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, CHECK_INTERVAL);
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
