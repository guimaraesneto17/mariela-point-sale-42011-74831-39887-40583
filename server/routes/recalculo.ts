import express from 'express';
import * as recalculoController from '../controllers/recalculoController';

const router = express.Router();

/**
 * @swagger
 * /api/recalculo/totais:
 *   post:
 *     summary: Recalcula os totais de vendas e compras
 *     description: |
 *       Recalcula os totais agregados no sistema baseado nas vendas registradas:
 *       - Total de vendas realizadas por cada vendedor
 *       - Total de compras de cada cliente
 *       - Valor médio de compra por cliente
 *       
 *       **Importante:** Este endpoint é útil para corrigir inconsistências nos totais após:
 *       - Exclusão ou edição de vendas
 *       - Migração de dados
 *       - Correção de bugs
 *     tags: [Recálculo]
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
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Totais recalculados com sucesso"
 *                 totalVendas:
 *                   type: number
 *                   example: 45000.00
 *                   description: Valor total de vendas processadas
 *                 clientesAtualizados:
 *                   type: number
 *                   example: 35
 *                   description: Quantidade de clientes que tiveram totais atualizados
 *                 vendedoresAtualizados:
 *                   type: number
 *                   example: 5
 *                   description: Quantidade de vendedores que tiveram totais atualizados
 *       500:
 *         description: Erro ao recalcular totais
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Erro ao recalcular totais"
 */
router.post('/totais', recalculoController.recalcularTotais);

export default router;
