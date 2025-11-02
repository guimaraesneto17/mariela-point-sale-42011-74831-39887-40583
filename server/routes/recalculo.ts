import express from 'express';
import * as recalculoController from '../controllers/recalculoController';

const router = express.Router();

/**
 * @swagger
 * /api/recalculo/totais:
 *   post:
 *     tags:
 *       - Recálculo
 *     summary: Recalcula os totais de vendas e compras
 *     description: Recalcula os totais de vendas realizadas por vendedores e compras de clientes baseado nas vendas registradas
 *     responses:
 *       200:
 *         description: Totais recalculados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 totalVendas:
 *                   type: number
 *                 clientesAtualizados:
 *                   type: number
 *                 vendedoresAtualizados:
 *                   type: number
 *       500:
 *         description: Erro ao recalcular totais
 */
router.post('/totais', recalculoController.recalcularTotais);

export default router;
