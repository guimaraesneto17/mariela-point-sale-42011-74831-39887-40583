import { Request, Response } from 'express';
import CacheConfig from '../models/CacheConfig';
import { memoryCache, publishCacheEvent } from '../middleware/cache';
import { getRedisClient, isRedisEnabled } from '../config/redis';

/**
 * Obter todas as configurações de cache
 */
export async function getAllCacheConfigs(req: Request, res: Response) {
  try {
    const configs = await CacheConfig.find().sort({ accessCount: -1 });
    res.json({
      success: true,
      configs,
      redisEnabled: isRedisEnabled(),
    });
  } catch (error) {
    console.error('Erro ao obter configurações de cache:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter configurações de cache',
    });
  }
}

/**
 * Criar ou atualizar configuração de cache
 */
export async function upsertCacheConfig(req: Request, res: Response) {
  try {
    const { endpoint, ttl, enabled, compressionEnabled, compressionLevel } = req.body;

    if (!endpoint) {
      return res.status(400).json({
        success: false,
        message: 'Endpoint é obrigatório',
      });
    }

    const config = await CacheConfig.findOneAndUpdate(
      { endpoint },
      {
        endpoint,
        ttl: ttl || 300000,
        enabled: enabled !== undefined ? enabled : true,
        compressionEnabled: compressionEnabled !== undefined ? compressionEnabled : true,
        compressionLevel: compressionLevel || 6,
        lastModified: new Date(),
      },
      { upsert: true, new: true }
    );

    // Publicar evento de atualização de configuração
    await publishCacheEvent('config_updated', {
      endpoint,
      config,
    });

    res.json({
      success: true,
      message: 'Configuração atualizada com sucesso',
      config,
    });
  } catch (error) {
    console.error('Erro ao atualizar configuração de cache:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar configuração de cache',
    });
  }
}

/**
 * Deletar configuração de cache
 */
export async function deleteCacheConfig(req: Request, res: Response) {
  try {
    const { endpoint } = req.params;

    await CacheConfig.deleteOne({ endpoint });

    // Publicar evento de remoção de configuração
    await publishCacheEvent('config_deleted', { endpoint });

    res.json({
      success: true,
      message: 'Configuração removida com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar configuração de cache:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar configuração de cache',
    });
  }
}

/**
 * Limpar cache (memória + Redis)
 */
export async function clearAllCache(req: Request, res: Response) {
  try {
    // Limpar cache em memória
    memoryCache.clear();

    // Limpar Redis se disponível
    const redisClient = getRedisClient();
    if (redisClient) {
      await redisClient.flushDb();
      console.log('🗑️ Redis: Cache limpo');
    }

    // Publicar evento de limpeza de cache
    await publishCacheEvent('cache_cleared', {
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'Cache limpo com sucesso',
    });
  } catch (error) {
    console.error('Erro ao limpar cache:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao limpar cache',
    });
  }
}

/**
 * Warm up do cache - pré-carregar endpoints mais acessados
 */
export async function warmupCache(req: Request, res: Response) {
  try {
    const configs = await CacheConfig.find({ enabled: true })
      .sort({ accessCount: -1 })
      .limit(10);

    const warmedEndpoints: string[] = [];
    const failedEndpoints: { endpoint: string; error: string }[] = [];

    for (const config of configs) {
      try {
        const response = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3001'}${config.endpoint}`, {
          headers: {
            'Authorization': req.headers.authorization || '',
          },
        });

        if (response.ok) {
          warmedEndpoints.push(config.endpoint);
          console.log(`🔥 Cache warming: ${config.endpoint}`);
        } else {
          failedEndpoints.push({
            endpoint: config.endpoint,
            error: `Status ${response.status}`,
          });
        }
      } catch (error: any) {
        failedEndpoints.push({
          endpoint: config.endpoint,
          error: error.message,
        });
      }
    }

    // Publicar evento de warming
    await publishCacheEvent('cache_warmed', {
      warmedCount: warmedEndpoints.length,
      failedCount: failedEndpoints.length,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'Cache warming concluído',
      warmedEndpoints,
      failedEndpoints,
    });
  } catch (error) {
    console.error('Erro ao fazer warming do cache:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao fazer warming do cache',
    });
  }
}

/**
 * Incrementar contador de acesso
 */
export async function incrementAccessCount(endpoint: string): Promise<void> {
  try {
    await CacheConfig.findOneAndUpdate(
      { endpoint },
      { $inc: { accessCount: 1 } },
      { upsert: true }
    );
  } catch (error) {
    console.error('Erro ao incrementar contador de acesso:', error);
  }
}
