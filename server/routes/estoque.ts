import express from 'express';
import * as estoqueController from '../controllers/estoqueController';

const router = express.Router();

/**
 * @swagger
 * /api/estoque:
 *   get:
 *     summary: Lista todo o estoque
 *     tags: [Estoque]
 *     responses:
 *       200:
 *         description: Lista de estoque retornada com sucesso
 *       500:
 *         description: Erro ao buscar estoque
 */
router.get('/', estoqueController.getAllEstoque);

/**
 * @swagger
 * /api/estoque/codigo/{codigo}:
 *   get:
 *     summary: Busca um item de estoque por código de produto
 *     tags: [Estoque]
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item de estoque encontrado
 *       404:
 *         description: Item de estoque não encontrado
 */
router.get('/codigo/:codigo', estoqueController.getEstoqueByCodigo);

/**
 * @swagger
 * /api/estoque/{id}:
 *   get:
 *     summary: Busca um item de estoque por ID
 *     tags: [Estoque]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item de estoque encontrado
 *       404:
 *         description: Item de estoque não encontrado
 */
router.get('/:id', estoqueController.getEstoqueById);

/**
 * @swagger
 * /api/estoque:
 *   post:
 *     summary: Cria um novo item de estoque
 *     tags: [Estoque]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Estoque'
 *     responses:
 *       201:
 *         description: Item de estoque criado com sucesso
 *       400:
 *         description: Erro ao criar item de estoque
 */
router.post('/', estoqueController.createEstoque);

/**
 * @swagger
 * /api/estoque/entrada:
 *   post:
 *     summary: Registra entrada de produtos no estoque
 *     tags: [Estoque]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - codigoProduto
 *               - quantidade
 *             properties:
 *               codigoProduto:
 *                 type: string
 *               tamanho:
 *                 type: string
 *               quantidade:
 *                 type: number
 *               fornecedor:
 *                 type: string
 *               valorUnitario:
 *                 type: number
 *               observacao:
 *                 type: string
 *     responses:
 *       200:
 *         description: Entrada registrada com sucesso
 *       404:
 *         description: Produto não encontrado no estoque
 *       400:
 *         description: Erro ao registrar entrada
 */
router.post('/entrada', estoqueController.registrarEntrada);

/**
 * POST /api/estoque/saida
 * Registra uma saída de estoque
 */
router.post('/saida', estoqueController.registrarSaida);

/**
 * PUT /api/estoque/:id
 * Atualiza um item de estoque
 */
router.put('/:id', estoqueController.updateEstoque);

/**
 * DELETE /api/estoque/:id
 * Remove um item de estoque
 */
router.delete('/:id', estoqueController.deleteEstoque);

export default router;
