import express from 'express';
import * as produtoController from '../controllers/produtoController';

const router = express.Router();

/**
 * @swagger
 * /api/produtos:
 *   get:
 *     summary: Lista todos os produtos
 *     tags: [Produtos]
 *     responses:
 *       200:
 *         description: Lista de produtos retornada com sucesso
 *       500:
 *         description: Erro ao buscar produtos
 */
router.get('/', produtoController.getAllProdutos);

/**
 * @swagger
 * /api/produtos/{id}:
 *   get:
 *     summary: Busca um produto por ID
 *     tags: [Produtos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Produto encontrado
 *       404:
 *         description: Produto não encontrado
 */
router.get('/:id', produtoController.getProdutoById);

/**
 * @swagger
 * /api/produtos:
 *   post:
 *     summary: Cria um novo produto e registro de estoque
 *     tags: [Produtos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Produto'
 *     responses:
 *       201:
 *         description: Produto criado com sucesso
 *       400:
 *         description: Erro ao criar produto
 */
router.post('/', produtoController.createProduto);

/**
 * PUT /api/produtos/:id
 * Atualiza um produto
 */
router.put('/:id', produtoController.updateProduto);

/**
 * DELETE /api/produtos/:id
 * Remove um produto
 */
router.delete('/:id', produtoController.deleteProduto);

export default router;
