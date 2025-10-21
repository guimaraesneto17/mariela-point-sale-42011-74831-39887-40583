import express from 'express';
import * as fornecedorController from '../controllers/fornecedorController';

const router = express.Router();

/**
 * @swagger
 * /api/fornecedores:
 *   get:
 *     summary: Lista todos os fornecedores
 *     tags: [Fornecedores]
 *     responses:
 *       200:
 *         description: Lista de fornecedores retornada com sucesso
 *       500:
 *         description: Erro ao buscar fornecedores
 */
router.get('/', fornecedorController.getAllFornecedores);

/**
 * @swagger
 * /api/fornecedores/{id}:
 *   get:
 *     summary: Busca um fornecedor por ID
 *     tags: [Fornecedores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Fornecedor encontrado
 *       404:
 *         description: Fornecedor não encontrado
 */
router.get('/:id', fornecedorController.getFornecedorById);

/**
 * @swagger
 * /api/fornecedores:
 *   post:
 *     summary: Cria um novo fornecedor
 *     tags: [Fornecedores]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Fornecedor'
 *     responses:
 *       201:
 *         description: Fornecedor criado com sucesso
 *       400:
 *         description: Erro ao criar fornecedor
 */
router.post('/', fornecedorController.createFornecedor);

/**
 * @swagger
 * /api/fornecedores/{id}:
 *   put:
 *     summary: Atualiza um fornecedor
 *     tags: [Fornecedores]
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
 *             $ref: '#/components/schemas/Fornecedor'
 *     responses:
 *       200:
 *         description: Fornecedor atualizado com sucesso
 *       404:
 *         description: Fornecedor não encontrado
 *       400:
 *         description: Erro ao atualizar fornecedor
 */
router.put('/:id', fornecedorController.updateFornecedor);

/**
 * @swagger
 * /api/fornecedores/{id}:
 *   delete:
 *     summary: Remove um fornecedor
 *     tags: [Fornecedores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Fornecedor removido com sucesso
 *       404:
 *         description: Fornecedor não encontrado
 *       500:
 *         description: Erro ao remover fornecedor
 */
router.delete('/:id', fornecedorController.deleteFornecedor);

export default router;
