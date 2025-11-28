// Gerenciamento de logs de conexão e latência

export interface ConnectionEvent {
  timestamp: number;
  type: 'online' | 'offline' | 'slow' | 'timeout' | 'error';
  message: string;
  details?: string;
  responseTime?: number;
}

export interface LatencyDataPoint {
  timestamp: number;
  responseTime: number;
  label: string;
}

const CONNECTION_LOG_KEY = 'mariela_connection_log';
const LATENCY_DATA_KEY = 'mariela_latency_data';
const MAX_LOG_ENTRIES = 100;
const MAX_LATENCY_POINTS = 50;
const LOG_RETENTION_DAYS = 7;

export const connectionLogger = {
  // Adicionar evento de conexão ao log
  logEvent(event: Omit<ConnectionEvent, 'timestamp'>) {
    const logs = this.getLogs();
    const newEvent: ConnectionEvent = {
      ...event,
      timestamp: Date.now(),
    };

    logs.unshift(newEvent);

    // Limitar tamanho e remover eventos antigos
    const cutoffTime = Date.now() - (LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const filteredLogs = logs
      .filter(log => log.timestamp > cutoffTime)
      .slice(0, MAX_LOG_ENTRIES);

    localStorage.setItem(CONNECTION_LOG_KEY, JSON.stringify(filteredLogs));
  },

  // Obter todos os logs
  getLogs(): ConnectionEvent[] {
    try {
      const stored = localStorage.getItem(CONNECTION_LOG_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  // Adicionar ponto de latência
  addLatencyPoint(responseTime: number) {
    const data = this.getLatencyData();
    const now = Date.now();
    
    const newPoint: LatencyDataPoint = {
      timestamp: now,
      responseTime,
      label: new Date(now).toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
    };

    data.push(newPoint);

    // Manter apenas últimos pontos e últimas 24h
    const cutoffTime = now - (24 * 60 * 60 * 1000);
    const filteredData = data
      .filter(point => point.timestamp > cutoffTime)
      .slice(-MAX_LATENCY_POINTS);

    localStorage.setItem(LATENCY_DATA_KEY, JSON.stringify(filteredData));
  },

  // Obter dados de latência
  getLatencyData(): LatencyDataPoint[] {
    try {
      const stored = localStorage.getItem(LATENCY_DATA_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  // Limpar todos os logs
  clearLogs() {
    localStorage.removeItem(CONNECTION_LOG_KEY);
  },

  // Limpar dados de latência
  clearLatencyData() {
    localStorage.removeItem(LATENCY_DATA_KEY);
  },
};
