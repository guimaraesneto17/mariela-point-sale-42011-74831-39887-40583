import { Request, Response, NextFunction } from 'express';

/**
 * Sistema de cache em memória para otimização de endpoints de leitura
 * 
 * Features:
 * - Cache por chave com TTL configurável
 * - Invalidação manual por padrão de chave
 * - Suporte a diferentes TTLs por tipo de dado
 * - Logging de hits/misses para análise de performance
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

  /**
   * Buscar item do cache
   */
  get(key: string): any | null {
    const entry = this.cache.get(key);
    
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
    return entry.data;
  }

  /**
   * Armazenar item no cache
   */
  set(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Invalidar cache por chave exata
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidar múltiplas chaves que correspondem ao padrão
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
      console.log(`🗑️ Cache: Invalidadas ${keysToDelete.length} entradas com padrão "${pattern}"`);
    }
  }

  /**
   * Limpar todo o cache
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    console.log('🗑️ Cache: Todos os registros foram limpos');
  }

  /**
   * Obter estatísticas do cache
   */
  getStats(): { size: number; hits: number; misses: number; hitRate: string } {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? ((this.hits / total) * 100).toFixed(2) : '0.00';
    
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: `${hitRate}%`,
    };
  }
}

// Instância singleton do cache
export const memoryCache = new MemoryCache();

// TTLs padrão por tipo de dado (em milissegundos)
export const CACHE_TTL = {
  PRODUTOS: 5 * 60 * 1000,        // 5 minutos - produtos mudam com frequência
  ESTOQUE: 3 * 60 * 1000,          // 3 minutos - estoque atualiza frequentemente
  VITRINE: 5 * 60 * 1000,          // 5 minutos - vitrine é leitura pesada
  CAIXA_ABERTO: 1 * 60 * 1000,     // 1 minuto - caixa é consultado constantemente
  CLIENTES: 10 * 60 * 1000,        // 10 minutos - clientes mudam menos
  VENDEDORES: 10 * 60 * 1000,      // 10 minutos - vendedores mudam raramente
  FORNECEDORES: 10 * 60 * 1000,    // 10 minutos - fornecedores mudam raramente
  CONTAS: 5 * 60 * 1000,           // 5 minutos - contas financeiras
};

/**
 * Middleware de cache para endpoints GET
 * Cacheia automaticamente a resposta por um período configurável
 */
export function cacheMiddleware(ttl: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Apenas cachear requisições GET
    if (req.method !== 'GET') {
      return next();
    }

    // Gerar chave única baseada na URL e query params
    const cacheKey = `${req.originalUrl}`;

    // Tentar buscar do cache
    const cachedData = memoryCache.get(cacheKey);
    if (cachedData) {
      console.log(`✅ Cache HIT: ${cacheKey}`);
      return res.json(cachedData);
    }

    console.log(`❌ Cache MISS: ${cacheKey}`);

    // Interceptar o método res.json para cachear a resposta
    const originalJson = res.json.bind(res);
    res.json = function(data: any) {
      // Armazenar no cache antes de enviar
      memoryCache.set(cacheKey, data, ttl);
      console.log(`💾 Cache STORED: ${cacheKey} (TTL: ${ttl / 1000}s)`);
      return originalJson(data);
    };

    next();
  };
}

/**
 * Middleware para invalidar cache após operações de escrita
 * Deve ser aplicado em rotas POST, PUT, PATCH, DELETE
 */
export function invalidateCacheMiddleware(patterns: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Interceptar o envio da resposta bem-sucedida
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    const invalidateCache = () => {
      patterns.forEach(pattern => memoryCache.invalidatePattern(pattern));
    };

    res.json = function(data: any) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        invalidateCache();
      }
      return originalJson(data);
    };

    res.send = function(data: any) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        invalidateCache();
      }
      return originalSend(data);
    };

    next();
  };
}

/**
 * Endpoint para visualizar estatísticas do cache (útil para debugging)
 */
export function getCacheStats(req: Request, res: Response) {
  const stats = memoryCache.getStats();
  res.json({
    message: 'Estatísticas do cache em memória',
    ...stats,
  });
}

/**
 * Endpoint para limpar todo o cache (útil para debugging)
 */
export function clearCache(req: Request, res: Response) {
  memoryCache.clear();
  res.json({ message: 'Cache limpo com sucesso' });
}
