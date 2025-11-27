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
 * /api/produtos/novidades:
 *   get:
 *     summary: Lista produtos marcados como novidade
 *     description: Retorna todos os produtos que possuem ao menos uma variante marcada como novidade no estoque
 *     tags: [Produtos]
 *     responses:
 *       200:
 *         description: Lista de novidades retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   codigoProduto:
 *                     type: string
 *                     example: 'P001'
 *                   nome:
 *                     type: string
 *                     example: 'Vestido Floral'
 *                   categoria:
 *                     type: string
 *                     example: 'Vestido'
 *                   precoVenda:
 *                     type: number
 *                     example: 199.90
 *                   descricao:
 *                     type: string
 *                   imagens:
 *                     type: array
 *                     items:
 *                       type: string
 *       500:
 *         description: Erro ao buscar novidades
 */
router.get('/novidades', produtoController.getNovidades);

/**
 * @swagger
 * /api/produtos/{codigo}:
 *   get:
 *     summary: Busca um produto por código
 *     tags: [Produtos]
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *         example: P101
 *         description: Código do produto (formato P + 3 dígitos)
 *     responses:
 *       200:
 *         description: Produto encontrado
 *       404:
 *         description: Produto não encontrado
 */
router.get('/:codigo', produtoController.getProdutoByCodigo);

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
 *         description: Erro na validação dos dados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Erro de validação"
 *                 message:
 *                   type: string
 *                   example: "Um ou mais campos estão inválidos"
 *                 fields:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                         example: "codigoProduto"
 *                       message:
 *                         type: string
 *                         example: "Código deve seguir o formato P001, P002, etc."
 *                       value:
 *                         type: string
 *                         example: "P1"
 */
router.post('/', produtoController.createProduto);

/**
 * @swagger
 * /api/produtos/{codigo}:
 *   put:
 *     summary: Atualiza um produto
 *     tags: [Produtos]
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *         example: P101
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Produto'
 *     responses:
 *       200:
 *         description: Produto atualizado com sucesso
 *       404:
 *         description: Produto não encontrado
 *       400:
 *         description: Erro na validação dos dados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Erro de validação"
 *                 message:
 *                   type: string
 *                   example: "Um ou mais campos estão inválidos"
 *                 fields:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                       message:
 *                         type: string
 *                       value:
 *                         type: string
 */
router.put('/:codigo', produtoController.updateProduto);

/**
 * @swagger
 * /api/produtos/{codigo}:
 *   delete:
 *     summary: Remove um produto
 *     tags: [Produtos]
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *         example: P101
 *     responses:
 *       200:
 *         description: Produto removido com sucesso
 *       404:
 *         description: Produto não encontrado
 *       500:
 *         description: Erro ao remover produto
 */
router.delete('/:codigo', produtoController.deleteProduto);

export default router;
