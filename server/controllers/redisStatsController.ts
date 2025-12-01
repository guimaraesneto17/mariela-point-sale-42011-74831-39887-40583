import { Request, Response } from 'express';
import { getRedisClient, isRedisEnabled } from '../config/redis';

/**
 * Obter estatísticas do Redis
 */
export async function getRedisStats(req: Request, res: Response): Promise<void> {
  try {
    const enabled = isRedisEnabled();
    const client = getRedisClient();

    if (!enabled || !client) {
      res.json({
        enabled: false,
        connected: false,
        error: 'Redis não está habilitado ou configurado',
      });
      return;
    }

    try {
      // Obter informações do Redis
      const info = await client.info();
      const dbSize = await client.dbSize();
      
      // Parsear informações do Redis
      const memoryMatch = info.match(/used_memory:(\d+)/);
      const uptimeMatch = info.match(/uptime_in_seconds:(\d+)/);
      const hitsMatch = info.match(/keyspace_hits:(\d+)/);
      const missesMatch = info.match(/keyspace_misses:(\d+)/);

      const memoryUsage = memoryMatch ? parseInt(memoryMatch[1]) : 0;
      const uptime = uptimeMatch ? parseInt(uptimeMatch[1]) : 0;
      const hits = hitsMatch ? parseInt(hitsMatch[1]) : 0;
      const misses = missesMatch ? parseInt(missesMatch[1]) : 0;
      const hitRate = hits + misses > 0 ? (hits / (hits + misses)) * 100 : 0;

      res.json({
        enabled: true,
        connected: true,
        memoryUsage,
        totalKeys: dbSize,
        hitRate,
        uptime,
      });
    } catch (redisError: any) {
      console.error('Erro ao obter estatísticas do Redis:', redisError);
      res.json({
        enabled: true,
        connected: false,
        error: redisError.message || 'Erro ao conectar com Redis',
      });
    }
  } catch (error: any) {
    console.error('Erro ao processar estatísticas do Redis:', error);
    res.status(500).json({
      enabled: false,
      connected: false,
      error: error.message || 'Erro interno ao obter estatísticas',
    });
  }
}
