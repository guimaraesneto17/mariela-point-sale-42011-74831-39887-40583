import { Request, Response, NextFunction } from 'express';
import { getRedisClient, isRedisEnabled } from '../config/redis';
import CacheConfig from '../models/CacheConfig';
import { incrementAccessCount } from '../controllers/cacheController';

/**
 * Sistema de cache híbrido (Memória + Redis) para otimização de endpoints
 * 
 * Features:
 * - Cache em memória para fallback
 * - Redis para cache distribuído
 * - TTL configurável por endpoint
 * - Invalidação manual e automática
 * - Métricas de performance
 * - Eventos em tempo real via Supabase
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache: Map<string, CacheEntry> = new Map();
  private hits: number = 0;
  private misses: number = 0;
  private totalRequests: number = 0;
  private compressedResponses: number = 0;
  private bytesServedFromCache: number = 0;

  /**
   * Criar chave com namespace
   */
  private createKey(namespace: string, key: string): string {
    return `${namespace}:${key}`;
  }

  /**
   * Buscar item do cache (memória ou Redis)
   */
  async get(key: string, namespace?: string): Promise<any | null> {
    const cacheKey = namespace ? this.createKey(namespace, key) : key;
    this.totalRequests++;
    
    // Tentar Redis primeiro se disponível
    const redisClient = getRedisClient();
    if (redisClient) {
      try {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
          this.hits++;
          const parsed = JSON.parse(cachedData);
          this.bytesServedFromCache += cachedData.length;
          console.log(`✅ Redis Cache HIT: ${cacheKey}`);
          return parsed;
        }
      } catch (error) {
        console.error('Erro ao buscar do Redis:', error);
      }
    }

    // Fallback para cache em memória
    const entry = this.cache.get(cacheKey);
    
    if (!entry) {
      this.misses++;
      return null;
    }

    // Verificar se expirou
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    const estimatedSize = JSON.stringify(entry.data).length;
    this.bytesServedFromCache += estimatedSize;
    
    return entry.data;
  }

  /**
   * Armazenar item no cache (memória e Redis)
   */
  async set(key: string, data: any, ttl: number, namespace?: string): Promise<void> {
    const cacheKey = namespace ? this.createKey(namespace, key) : key;
    
    // Salvar em memória
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl,
    });

    // Salvar no Redis se disponível
    const redisClient = getRedisClient();
    if (redisClient) {
      try {
        const serialized = JSON.stringify(data);
        await redisClient.setEx(cacheKey, Math.floor(ttl / 1000), serialized);
        console.log(`💾 Redis Cache STORED: ${cacheKey} (TTL: ${ttl / 1000}s)`);
      } catch (error) {
        console.error('Erro ao salvar no Redis:', error);
      }
    }
  }

  /**
   * Invalidar cache por chave exata
   */
  async invalidate(key: string, namespace?: string): Promise<void> {
    const cacheKey = namespace ? this.createKey(namespace, key) : key;
    this.cache.delete(cacheKey);

    // Invalidar no Redis
    const redisClient = getRedisClient();
    if (redisClient) {
      try {
        await redisClient.del(cacheKey);
      } catch (error) {
        console.error('Erro ao invalidar no Redis:', error);
      }
    }
  }

  /**
   * Invalidar múltiplas chaves que correspondem ao padrão
   */
  async invalidatePattern(pattern: string): Promise<void> {
    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];

    // Invalidar memória
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));

    // Invalidar Redis
    const redisClient = getRedisClient();
    if (redisClient) {
      try {
        const keys = await redisClient.keys(`*${pattern}*`);
        if (keys.length > 0) {
          await redisClient.del(keys);
        }
      } catch (error) {
        console.error('Erro ao invalidar padrão no Redis:', error);
      }
    }
    
    if (keysToDelete.length > 0) {
      console.log(`🗑️ Cache: Invalidadas ${keysToDelete.length} entradas com padrão "${pattern}"`);
      
      // Publicar evento
      await publishCacheEvent('pattern_invalidated', {
        pattern,
        count: keysToDelete.length,
      });
    }
  }

  /**
   * Limpar cache por namespace
   */
  async clearNamespace(namespace: string): Promise<number> {
    const prefix = `${namespace}:`;
    let cleared = 0;

    // Limpar memória
    for (const key of Array.from(this.cache.keys())) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        cleared++;
      }
    }

    // Limpar Redis
    const redisClient = getRedisClient();
    if (redisClient) {
      try {
        const keys = await redisClient.keys(`${prefix}*`);
        if (keys.length > 0) {
          await redisClient.del(keys);
          cleared += keys.length;
        }
      } catch (error) {
        console.error('Erro ao limpar namespace no Redis:', error);
      }
    }

    console.log(`🗑️ Cache: ${cleared} entradas do namespace "${namespace}" foram limpas`);
    
    // Publicar evento
    await publishCacheEvent('namespace_cleared', {
      namespace,
      count: cleared,
    });

    return cleared;
  }

  /**
   * Limpar todo o cache
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    this.totalRequests = 0;
    this.compressedResponses = 0;
    this.bytesServedFromCache = 0;
    console.log('🗑️ Cache: Todos os registros foram limpos');
  }
  
  /**
   * Registrar resposta comprimida
   */
  recordCompression(): void {
    this.compressedResponses++;
  }

  /**
   * Obter estatísticas do cache
   */
  getStats(): { 
    size: number; 
    hits: number; 
    misses: number; 
    hitRate: string;
    totalRequests: number;
    compressedResponses: number;
    compressionRate: string;
    bytesServedFromCache: number;
    requestsSavedByCache: number;
    redisEnabled: boolean;
  } {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? ((this.hits / total) * 100).toFixed(2) : '0.00';
    const compressionRate = this.totalRequests > 0 
      ? ((this.compressedResponses / this.totalRequests) * 100).toFixed(2) 
      : '0.00';
    
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: `${hitRate}%`,
      totalRequests: this.totalRequests,
      compressedResponses: this.compressedResponses,
      compressionRate: `${compressionRate}%`,
      bytesServedFromCache: this.bytesServedFromCache,
      requestsSavedByCache: this.hits,
      redisEnabled: isRedisEnabled(),
    };
  }
}

// Instância singleton do cache
export const memoryCache = new MemoryCache();

// TTLs padrão por tipo de dado (em milissegundos)
export const CACHE_TTL = {
  PRODUTOS: 5 * 60 * 1000,
  ESTOQUE: 3 * 60 * 1000,
  VITRINE: 5 * 60 * 1000,
  CAIXA_ABERTO: 1 * 60 * 1000,
  CLIENTES: 10 * 60 * 1000,
  VENDEDORES: 10 * 60 * 1000,
  FORNECEDORES: 10 * 60 * 1000,
  CONTAS: 5 * 60 * 1000,
};

// Namespaces por módulo
export const CACHE_NAMESPACES = {
  PRODUTOS: 'produtos',
  ESTOQUE: 'estoque',
  VENDAS: 'vendas',
  CLIENTES: 'clientes',
  FORNECEDORES: 'fornecedores',
  VENDEDORES: 'vendedores',
  CAIXA: 'caixa',
  FINANCEIRO: 'financeiro',
  VITRINE: 'vitrine',
  RELATORIOS: 'relatorios',
};

/**
 * Extrair namespace do caminho da requisição
 */
function extractNamespace(path: string): string | undefined {
  // Remover /api/ do início
  const cleanPath = path.replace(/^\/api\//, '');
  
  // Mapear endpoints para namespaces
  if (cleanPath.startsWith('produtos')) return CACHE_NAMESPACES.PRODUTOS;
  if (cleanPath.startsWith('estoque')) return CACHE_NAMESPACES.ESTOQUE;
  if (cleanPath.startsWith('vendas')) return CACHE_NAMESPACES.VENDAS;
  if (cleanPath.startsWith('clientes')) return CACHE_NAMESPACES.CLIENTES;
  if (cleanPath.startsWith('fornecedores')) return CACHE_NAMESPACES.FORNECEDORES;
  if (cleanPath.startsWith('vendedores')) return CACHE_NAMESPACES.VENDEDORES;
  if (cleanPath.startsWith('caixa')) return CACHE_NAMESPACES.CAIXA;
  if (cleanPath.startsWith('contas')) return CACHE_NAMESPACES.FINANCEIRO;
  if (cleanPath.startsWith('categorias-financeiras')) return CACHE_NAMESPACES.FINANCEIRO;
  if (cleanPath.startsWith('vitrine-virtual')) return CACHE_NAMESPACES.VITRINE;
  
  return undefined;
}

/**
 * Obter TTL configurado para um endpoint
 */
async function getConfiguredTTL(endpoint: string, defaultTTL: number): Promise<number> {
  try {
    const config = await CacheConfig.findOne({ endpoint, enabled: true });
    return config ? config.ttl : defaultTTL;
  } catch (error) {
    return defaultTTL;
  }
}

/**
 * Middleware de cache para endpoints GET
 */
export function cacheMiddleware(defaultTTL: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = `${req.originalUrl}`;
    const endpoint = req.path;
    const namespace = extractNamespace(req.path);

    // Verificar se cache está habilitado para este endpoint
    try {
      const config = await CacheConfig.findOne({ endpoint });
      if (config && !config.enabled) {
        console.log(`⏭️  Cache desabilitado para: ${endpoint}`);
        return next();
      }
    } catch (error) {
      console.error('Erro ao verificar configuração de cache:', error);
    }

    // Incrementar contador de acesso
    incrementAccessCount(endpoint).catch(console.error);

    // Tentar buscar do cache com namespace
    const cachedData = await memoryCache.get(cacheKey, namespace);
    if (cachedData) {
      console.log(`✅ Cache HIT: ${namespace ? namespace + ':' : ''}${cacheKey}`);
      
      if (res.getHeader('content-encoding') === 'gzip') {
        memoryCache.recordCompression();
      }
      
      return res.json(cachedData);
    }

    console.log(`❌ Cache MISS: ${namespace ? namespace + ':' : ''}${cacheKey}`);

    // Interceptar res.json para cachear
    const originalJson = res.json.bind(res);
    res.json = function(data: any) {
      // Obter TTL configurado
      getConfiguredTTL(endpoint, defaultTTL).then(ttl => {
        memoryCache.set(cacheKey, data, ttl, namespace).catch(console.error);
        console.log(`💾 Cache STORED: ${namespace ? namespace + ':' : ''}${cacheKey} (TTL: ${ttl / 1000}s)`);
      });
      
      if (res.getHeader('content-encoding') === 'gzip') {
        memoryCache.recordCompression();
      }
      
      return originalJson(data);
    };

    next();
  };
}

/**
 * Middleware para invalidar cache após operações de escrita
 */
export function invalidateCacheMiddleware(patterns: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    const invalidateCache = async () => {
      for (const pattern of patterns) {
        await memoryCache.invalidatePattern(pattern);
      }
    };

    res.json = function(data: any) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        invalidateCache().catch(console.error);
      }
      return originalJson(data);
    };

    res.send = function(data: any) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        invalidateCache().catch(console.error);
      }
      return originalSend(data);
    };

    next();
  };
}

/**
 * Endpoint para visualizar estatísticas do cache
 */
export function getCacheStats(req: Request, res: Response) {
  const stats = memoryCache.getStats();
  res.json({
    message: 'Estatísticas do cache',
    ...stats,
  });
}

/**
 * Endpoint para limpar todo o cache
 */
export function clearCache(req: Request, res: Response) {
  memoryCache.clear();
  res.json({ message: 'Cache limpo com sucesso' });
}

/**
 * Publicar eventos de cache via Supabase Realtime
 * Para notificações em tempo real no frontend
 */
export async function publishCacheEvent(event: string, data: any): Promise<void> {
  try {
    // Aqui você pode integrar com Supabase Realtime ou outro sistema de eventos
    // Por enquanto, apenas log
    console.log(`📡 Cache Event: ${event}`, data);
    
    // TODO: Implementar publicação via Supabase Realtime quando necessário
    // const channel = supabase.channel('cache-events');
    // await channel.send({
    //   type: 'broadcast',
    //   event,
    //   payload: data,
    // });
  } catch (error) {
    console.error('Erro ao publicar evento de cache:', error);
  }
}
