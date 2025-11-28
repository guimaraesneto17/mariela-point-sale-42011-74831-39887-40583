import express from 'express';
import * as categoriaFinanceiraController from '../controllers/categoriaFinanceiraController';

const router = express.Router();

/**
 * @swagger
 * /api/categorias-financeiras:
 *   get:
 *     summary: Lista todas as categorias financeiras
 *     description: Retorna todas as categorias financeiras cadastradas, podendo filtrar por tipo (pagar ou receber)
 *     tags: [Categorias Financeiras]
 *     parameters:
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [pagar, receber]
 *         description: Filtrar por tipo de categoria
 *         example: pagar
 *     responses:
 *       200:
 *         description: Lista de categorias retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     example: "507f1f77bcf86cd799439011"
 *                   nome:
 *                     type: string
 *                     example: "Fornecedores"
 *                   tipo:
 *                     type: string
 *                     enum: [pagar, receber]
 *                     example: "pagar"
 *                   cor:
 *                     type: string
 *                     example: "#FF5733"
 *                   ordem:
 *                     type: integer
 *                     example: 1
 *                   ativa:
 *                     type: boolean
 *                     example: true
 *       500:
 *         description: Erro ao buscar categorias
 */
router.get('/', categoriaFinanceiraController.getAllCategorias);

/**
 * @swagger
 * /api/categorias-financeiras/{id}:
 *   get:
 *     summary: Busca uma categoria por ID
 *     tags: [Categorias Financeiras]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Categoria encontrada
 *       404:
 *         description: Categoria não encontrada
 */
router.get('/:id', categoriaFinanceiraController.getCategoriaById);

/**
 * @swagger
 * /api/categorias-financeiras:
 *   post:
 *     summary: Cria uma nova categoria financeira
 *     tags: [Categorias Financeiras]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - tipo
 *             properties:
 *               nome:
 *                 type: string
 *                 example: "Fornecedores"
 *                 description: Nome da categoria
 *               tipo:
 *                 type: string
 *                 enum: [pagar, receber]
 *                 example: "pagar"
 *                 description: Tipo da categoria (contas a pagar ou receber)
 *               cor:
 *                 type: string
 *                 example: "#FF5733"
 *                 description: Cor da categoria em hexadecimal
 *               ordem:
 *                 type: integer
 *                 example: 1
 *                 description: Ordem de exibição
 *     responses:
 *       201:
 *         description: Categoria criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 nome:
 *                   type: string
 *                 tipo:
 *                   type: string
 *                 cor:
 *                   type: string
 *       400:
 *         description: Erro na validação dos dados
 */
router.post('/', categoriaFinanceiraController.createCategoria);

/**
 * @swagger
 * /api/categorias-financeiras/{id}:
 *   put:
 *     summary: Atualiza uma categoria
 *     tags: [Categorias Financeiras]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Categoria atualizada
 */
router.put('/:id', categoriaFinanceiraController.updateCategoria);

/**
 * @swagger
 * /api/categorias-financeiras/{id}:
 *   delete:
 *     summary: Desativa uma categoria
 *     tags: [Categorias Financeiras]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Categoria desativada
 */
router.delete('/:id', categoriaFinanceiraController.deleteCategoria);

/**
 * @swagger
 * /api/categorias-financeiras/reorder:
 *   post:
 *     summary: Reordena categorias financeiras
 *     description: Atualiza a ordem de exibição das categorias
 *     tags: [Categorias Financeiras]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - categorias
 *             properties:
 *               categorias:
 *                 type: array
 *                 description: Array de IDs das categorias na nova ordem
 *                 items:
 *                   type: string
 *                 example: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"]
 *     responses:
 *       200:
 *         description: Ordem das categorias atualizada com sucesso
 *       400:
 *         description: Erro ao reordenar categorias
 */
router.post('/reorder', categoriaFinanceiraController.reorderCategorias);

export default router;
