import express from 'express';
import { executeStockCleanup } from '../controllers/stockCleanupController';
import { requirePermission } from '../middleware/permissions';

const router = express.Router();

/**
 * @swagger
 * /api/stock-cleanup/execute:
 *   post:
 *     summary: Executa limpeza de estoque e produtos com quantidade zero
 *     tags: [Stock Cleanup]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dryRun
 *         schema:
 *           type: boolean
 *         description: Se true, apenas lista itens que seriam removidos sem deletar
 *     responses:
 *       200:
 *         description: Limpeza executada com sucesso
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro no servidor
 */
router.post(
  '/execute',
  requirePermission('estoque', 'delete'),
  executeStockCleanup
);

export default router;
