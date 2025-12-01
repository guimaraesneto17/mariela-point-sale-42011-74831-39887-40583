import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/roles';
import {
  getAllCacheConfigs,
  upsertCacheConfig,
  deleteCacheConfig,
  clearAllCache,
  warmupCache,
} from '../controllers/cacheController';
import { getCacheStats, clearCache } from '../middleware/cache';
import { getRedisStats } from '../controllers/redisStatsController';

const router = express.Router();

/**
 * @swagger
 * /api/cache/configs:
 *   get:
 *     summary: Obter todas as configurações de cache
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de configurações
 */
router.get('/configs', authenticateToken, requireAdmin, getAllCacheConfigs);

/**
 * @swagger
 * /api/cache/configs:
 *   post:
 *     summary: Criar ou atualizar configuração de cache
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configuração atualizada
 */
router.post('/configs', authenticateToken, requireAdmin, upsertCacheConfig);

/**
 * @swagger
 * /api/cache/configs/:endpoint:
 *   delete:
 *     summary: Deletar configuração de cache
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configuração removida
 */
router.delete('/configs/:endpoint', authenticateToken, requireAdmin, deleteCacheConfig);

/**
 * @swagger
 * /api/cache/stats:
 *   get:
 *     summary: Obter estatísticas de cache
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas do cache
 */
router.get('/stats', authenticateToken, getCacheStats);

/**
 * @swagger
 * /api/cache/clear:
 *   post:
 *     summary: Limpar todo o cache
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache limpo
 */
router.post('/clear', authenticateToken, requireAdmin, clearAllCache);

/**
 * @swagger
 * /api/cache/warmup:
 *   post:
 *     summary: Fazer warming do cache
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Warming concluído
 */
router.post('/warmup', authenticateToken, requireAdmin, warmupCache);

/**
 * @swagger
 * /api/cache/redis-stats:
 *   get:
 *     summary: Obter estatísticas do Redis
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas do Redis
 */
router.get('/redis-stats', authenticateToken, getRedisStats);

export default router;
