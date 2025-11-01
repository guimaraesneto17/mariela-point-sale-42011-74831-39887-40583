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

/**
 * @swagger
 * /api/produtos/{codigo}/entrada:
 *   post:
 *     summary: Registra entrada no log de movimentação do produto
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
 *             type: object
 *             required:
 *               - quantidade
 *               - origem
 *             properties:
 *               cor:
 *                 type: string
 *               tamanho:
 *                 type: string
 *               quantidade:
 *                 type: integer
 *               origem:
 *                 type: string
 *                 enum: [venda, compra, entrada, baixa no estoque]
 *               fornecedor:
 *                 type: string
 *               observacao:
 *                 type: string
 *     responses:
 *       200:
 *         description: Entrada registrada com sucesso
 *       404:
 *         description: Produto não encontrado
 */
router.post('/:codigo/entrada', produtoController.registrarEntrada);

/**
 * @swagger
 * /api/produtos/{codigo}/saida:
 *   post:
 *     summary: Registra saída no log de movimentação do produto
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
 *             type: object
 *             required:
 *               - quantidade
 *             properties:
 *               cor:
 *                 type: string
 *               tamanho:
 *                 type: string
 *               quantidade:
 *                 type: integer
 *               origem:
 *                 type: string
 *                 enum: [venda, compra, entrada, baixa no estoque]
 *               motivo:
 *                 type: string
 *               codigoVenda:
 *                 type: string
 *               observacao:
 *                 type: string
 *     responses:
 *       200:
 *         description: Saída registrada com sucesso
 *       404:
 *         description: Produto não encontrado
 */
router.post('/:codigo/saida', produtoController.registrarSaida);

export default router;
