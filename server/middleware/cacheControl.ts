import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para configurar cache headers otimizados para CDN
 */

export const cacheControl = (options: {
  maxAge?: number;
  sMaxAge?: number;
  staleWhileRevalidate?: number;
  staleIfError?: number;
  public?: boolean;
  immutable?: boolean;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const {
      maxAge = 0,
      sMaxAge,
      staleWhileRevalidate,
      staleIfError,
      public: isPublic = true,
      immutable = false,
    } = options;

    const directives: string[] = [];

    // Public/Private
    if (isPublic) {
      directives.push('public');
    } else {
      directives.push('private');
    }

    // Max age
    if (maxAge > 0) {
      directives.push(`max-age=${maxAge}`);
    }

    // Shared cache max age (CDN)
    if (sMaxAge !== undefined) {
      directives.push(`s-maxage=${sMaxAge}`);
    }

    // Stale while revalidate
    if (staleWhileRevalidate !== undefined) {
      directives.push(`stale-while-revalidate=${staleWhileRevalidate}`);
    }

    // Stale if error
    if (staleIfError !== undefined) {
      directives.push(`stale-if-error=${staleIfError}`);
    }

    // Immutable
    if (immutable) {
      directives.push('immutable');
    }

    // Set Cache-Control header
    res.setHeader('Cache-Control', directives.join(', '));

    next();
  };
};

/**
 * Presets de cache para diferentes tipos de conteúdo
 */
export const cachePresets = {
  // Imagens de produtos: cache agressivo com stale-while-revalidate
  images: cacheControl({
    maxAge: 31536000, // 1 ano
    sMaxAge: 31536000, // 1 ano no CDN
    staleWhileRevalidate: 86400, // 1 dia
    staleIfError: 604800, // 7 dias
    public: true,
    immutable: true,
  }),

  // Assets estáticos (JS, CSS): cache agressivo
  static: cacheControl({
    maxAge: 31536000, // 1 ano
    sMaxAge: 31536000,
    public: true,
    immutable: true,
  }),

  // API responses: cache curto com revalidação
  api: cacheControl({
    maxAge: 60, // 1 minuto
    sMaxAge: 300, // 5 minutos no CDN
    staleWhileRevalidate: 60,
    public: true,
  }),

  // Dados dinâmicos: sem cache
  dynamic: cacheControl({
    maxAge: 0,
    public: false,
  }),

  // HTML: cache curto com revalidação rápida
  html: cacheControl({
    maxAge: 300, // 5 minutos
    sMaxAge: 600, // 10 minutos no CDN
    staleWhileRevalidate: 300,
    public: true,
  }),
};

/**
 * Middleware para adicionar ETag para validação de cache
 */
export const addETag = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;

  res.send = function (data: any): Response {
    // Gerar ETag baseado no conteúdo
    if (data && typeof data === 'string') {
      const hash = require('crypto')
        .createHash('md5')
        .update(data)
        .digest('hex');
      
      res.setHeader('ETag', `"${hash}"`);

      // Verificar If-None-Match
      const ifNoneMatch = req.headers['if-none-match'];
      if (ifNoneMatch === `"${hash}"`) {
        res.status(304);
        return originalSend.call(this, '');
      }
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Middleware para adicionar headers de CDN otimizados
 */
export const cdnOptimization = (req: Request, res: Response, next: NextFunction) => {
  // Vary header para garantir que CDN armazene versões diferentes
  res.setHeader('Vary', 'Accept-Encoding, Accept');

  // Adicionar headers de timing para análise
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  next();
};

/**
 * Middleware combinado para otimização completa de CDN
 */
export const fullCDNOptimization = [cdnOptimization, addETag];
