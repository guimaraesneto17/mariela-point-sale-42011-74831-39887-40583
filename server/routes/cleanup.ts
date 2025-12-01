import express from 'express';
import { cleanupOrphanImages, getStorageStats, getStorageHistory } from '../controllers/cleanupController';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { cachePresets } from '../middleware/cacheControl';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Cleanup
 *   description: Limpeza e manutenção de imagens
 */

/**
 * @swagger
 * /api/cleanup/orphan-images:
 *   post:
 *     summary: Remove imagens órfãs do storage
 *     tags: [Cleanup]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dryRun
 *         schema:
 *           type: boolean
 *         description: Se true, apenas lista imagens órfãs sem deletar
 *     responses:
 *       200:
 *         description: Cleanup executado com sucesso
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro no servidor
 */
router.post(
  '/orphan-images',
  authenticateToken,
  requirePermission('produtos', 'delete'),
  cleanupOrphanImages
);

/**
 * @swagger
 * /api/cleanup/storage-stats:
 *   get:
 *     summary: Retorna estatísticas de uso do storage
 *     tags: [Cleanup]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas retornadas com sucesso
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro no servidor
 */
router.get(
  '/storage-stats',
  authenticateToken,
  requirePermission('produtos', 'view'),
  cachePresets.api, // Cache de 1 minuto com revalidação
  getStorageStats
);

/**
 * @swagger
 * /api/cleanup/storage-history:
 *   get:
 *     summary: Retorna histórico de estatísticas de storage
 *     tags: [Cleanup]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: number
 *         description: Número de dias de histórico (padrão 30)
 *     responses:
 *       200:
 *         description: Histórico retornado com sucesso
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro no servidor
 */
router.get(
  '/storage-history',
  authenticateToken,
  requirePermission('produtos', 'view'),
  cachePresets.api, // Cache de 1 minuto com revalidação
  getStorageHistory
);

export default router;
