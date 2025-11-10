import express from 'express';
import * as categoriaFinanceiraController from '../controllers/categoriaFinanceiraController';

const router = express.Router();

/**
 * @swagger
 * /api/categorias-financeiras:
 *   get:
 *     summary: Lista todas as categorias financeiras
 *     tags: [Categorias Financeiras]
 *     parameters:
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [pagar, receber]
 *         description: Filtrar por tipo de categoria
 *     responses:
 *       200:
 *         description: Lista de categorias
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
 *     summary: Cria uma nova categoria
 *     tags: [Categorias Financeiras]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Categoria criada
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
 *     summary: Reordena categorias
 *     tags: [Categorias Financeiras]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Ordem atualizada
 */
router.post('/reorder', categoriaFinanceiraController.reorderCategorias);

export default router;
