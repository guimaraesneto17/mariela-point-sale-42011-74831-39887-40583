import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bell, Database, Trash2, Flame, Settings, TrendingUp } from "lucide-react";

interface CacheEvent {
  type: string;
  event: string;
  payload: any;
  timestamp: string;
}

export function CacheNotifications() {
  const [events, setEvents] = useState<CacheEvent[]>([]);

  useEffect(() => {
    // Subscribe to cache events channel
    const channel = supabase.channel('cache-events-realtime');

    channel
      .on('broadcast', { event: 'cache_cleared' }, (payload) => {
        console.log('📡 Cache cleared event:', payload);
        toast.info('Cache Limpo', {
          description: 'O cache foi limpo por um administrador',
          icon: <Trash2 className="h-4 w-4" />,
        });
        setEvents(prev => [...prev, {
          type: 'broadcast',
          event: 'cache_cleared',
          payload: payload.payload,
          timestamp: new Date().toISOString(),
        }]);
      })
      .on('broadcast', { event: 'cache_warmed' }, (payload) => {
        console.log('📡 Cache warmed event:', payload);
        const data = payload.payload;
        toast.success('Cache Warming Concluído', {
          description: `${data.warmedCount} endpoints pré-carregados`,
          icon: <Flame className="h-4 w-4" />,
        });
        setEvents(prev => [...prev, {
          type: 'broadcast',
          event: 'cache_warmed',
          payload: data,
          timestamp: new Date().toISOString(),
        }]);
      })
      .on('broadcast', { event: 'config_updated' }, (payload) => {
        console.log('📡 Config updated event:', payload);
        const data = payload.payload;
        toast.info('Configuração Atualizada', {
          description: `Endpoint: ${data.endpoint}`,
          icon: <Settings className="h-4 w-4" />,
        });
        setEvents(prev => [...prev, {
          type: 'broadcast',
          event: 'config_updated',
          payload: data,
          timestamp: new Date().toISOString(),
        }]);
      })
      .on('broadcast', { event: 'pattern_invalidated' }, (payload) => {
        console.log('📡 Pattern invalidated event:', payload);
        const data = payload.payload;
        toast.warning('Cache Invalidado', {
          description: `${data.count} entradas removidas (padrão: ${data.pattern})`,
          icon: <Database className="h-4 w-4" />,
        });
        setEvents(prev => [...prev, {
          type: 'broadcast',
          event: 'pattern_invalidated',
          payload: data,
          timestamp: new Date().toISOString(),
        }]);
      })
      .on('broadcast', { event: 'performance_alert' }, (payload) => {
        console.log('📡 Performance alert:', payload);
        const data = payload.payload;
        if (data.type === 'hit_rate_drop') {
          toast.error('Alerta de Performance', {
            description: `Hit rate caiu para ${data.hitRate}`,
            icon: <TrendingUp className="h-4 w-4" />,
          });
        } else if (data.type === 'memory_high') {
          toast.warning('Alerta de Memória', {
            description: `Cache usando ${data.cacheSize} entradas`,
            icon: <Database className="h-4 w-4" />,
          });
        }
        setEvents(prev => [...prev, {
          type: 'broadcast',
          event: 'performance_alert',
          payload: data,
          timestamp: new Date().toISOString(),
        }]);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Inscrito no canal de eventos de cache');
        }
      });

    // Cleanup
    return () => {
      channel.unsubscribe();
    };
  }, []);

  // Opcional: Mostrar histórico de eventos em um painel
  // Por enquanto, apenas usamos toast notifications

  return null; // Componente invisible que apenas escuta eventos
}
