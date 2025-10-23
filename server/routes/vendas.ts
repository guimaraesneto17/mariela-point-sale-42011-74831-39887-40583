import express from 'express';
import * as vendaController from '../controllers/vendaController';

const router = express.Router();

/**
 * @swagger
 * /api/vendas:
 *   get:
 *     summary: Lista todas as vendas
 *     tags: [Vendas]
 *     responses:
 *       200:
 *         description: Lista de vendas retornada com sucesso
 *       500:
 *         description: Erro ao buscar vendas
 */
router.get('/', vendaController.getAllVendas);

/**
 * @swagger
 * /api/vendas/{codigo}:
 *   get:
 *     summary: Busca uma venda por código
 *     tags: [Vendas]
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *         example: VENDA20250117-001
 *         description: Código da venda (formato VENDA + data + número sequencial)
 *     responses:
 *       200:
 *         description: Venda encontrada
 *       404:
 *         description: Venda não encontrada
 */
router.get('/:codigo', vendaController.getVendaByCodigo);

/**
 * @swagger
 * /api/vendas:
 *   post:
 *     summary: Cria uma nova venda
 *     tags: [Vendas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Venda'
 *     responses:
 *       201:
 *         description: Venda criada com sucesso
 *       400:
 *         description: Erro ao criar venda
 */
router.post('/', vendaController.createVenda);

/**
 * @swagger
 * /api/vendas/{codigo}:
 *   put:
 *     summary: Atualiza uma venda
 *     tags: [Vendas]
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *         example: VENDA20250117-001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Venda'
 *     responses:
 *       200:
 *         description: Venda atualizada com sucesso
 *       404:
 *         description: Venda não encontrada
 *       400:
 *         description: Erro ao atualizar venda
 */
router.put('/:codigo', vendaController.updateVenda);

/**
 * @swagger
 * /api/vendas/{codigo}:
 *   delete:
 *     summary: Remove uma venda
 *     tags: [Vendas]
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *         example: VENDA20250117-001
 *     responses:
 *       200:
 *         description: Venda removida com sucesso
 *       404:
 *         description: Venda não encontrada
 *       500:
 *         description: Erro ao remover venda
 */
router.delete('/:codigo', vendaController.deleteVenda);

export default router;
