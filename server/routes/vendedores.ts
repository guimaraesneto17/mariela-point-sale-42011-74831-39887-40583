import express from 'express';
import * as vendedorController from '../controllers/vendedorController';

const router = express.Router();

/**
 * @swagger
 * /api/vendedores:
 *   get:
 *     summary: Lista todos os vendedores
 *     tags: [Vendedores]
 *     responses:
 *       200:
 *         description: Lista de vendedores retornada com sucesso
 *       500:
 *         description: Erro ao buscar vendedores
 */
router.get('/', vendedorController.getAllVendedores);

/**
 * @swagger
 * /api/vendedores/{id}:
 *   get:
 *     summary: Busca um vendedor por ID
 *     tags: [Vendedores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vendedor encontrado
 *       404:
 *         description: Vendedor não encontrado
 */
router.get('/:id', vendedorController.getVendedorById);

/**
 * @swagger
 * /api/vendedores:
 *   post:
 *     summary: Cria um novo vendedor
 *     tags: [Vendedores]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               codigoVendedor:
 *                 type: string
 *               nome:
 *                 type: string
 *     responses:
 *       201:
 *         description: Vendedor criado com sucesso
 *       400:
 *         description: Erro ao criar vendedor
 */
router.post('/', vendedorController.createVendedor);

/**
 * PUT /api/vendedores/:id
 * Atualiza um vendedor
 */
router.put('/:id', vendedorController.updateVendedor);

/**
 * DELETE /api/vendedores/:id
 * Remove um vendedor
 */
router.delete('/:id', vendedorController.deleteVendedor);

export default router;
