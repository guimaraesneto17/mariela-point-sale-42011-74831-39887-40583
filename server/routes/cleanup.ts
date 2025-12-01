import express from 'express';
import { cleanupOrphanImages, getStorageStats } from '../controllers/cleanupController';
import { authenticateToken } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

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
  checkPermission('produtos', 'delete'),
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
  checkPermission('produtos', 'view'),
  getStorageStats
);

export default router;
