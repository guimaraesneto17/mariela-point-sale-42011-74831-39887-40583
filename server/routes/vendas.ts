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
 * /api/vendas/{id}:
 *   get:
 *     summary: Busca uma venda por ID
 *     tags: [Vendas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Venda encontrada
 *       404:
 *         description: Venda não encontrada
 */
router.get('/:id', vendaController.getVendaById);

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
 * /api/vendas/{id}:
 *   put:
 *     summary: Atualiza uma venda
 *     tags: [Vendas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
router.put('/:id', vendaController.updateVenda);

/**
 * @swagger
 * /api/vendas/{id}:
 *   delete:
 *     summary: Remove uma venda
 *     tags: [Vendas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Venda removida com sucesso
 *       404:
 *         description: Venda não encontrada
 *       500:
 *         description: Erro ao remover venda
 */
router.delete('/:id', vendaController.deleteVenda);

export default router;
