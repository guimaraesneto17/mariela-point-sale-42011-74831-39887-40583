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
 * /api/fornecedores/{codigo}:
 *   get:
 *     summary: Busca um fornecedor por código
 *     tags: [Fornecedores]
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *         example: F001
 *         description: Código do fornecedor (formato F + 3 dígitos)
 *     responses:
 *       200:
 *         description: Fornecedor encontrado
 *       404:
 *         description: Fornecedor não encontrado
 */
router.get('/:codigo', fornecedorController.getFornecedorByCodigo);

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
 * /api/fornecedores/{codigo}:
 *   put:
 *     summary: Atualiza um fornecedor
 *     tags: [Fornecedores]
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *         example: F001
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
router.put('/:codigo', fornecedorController.updateFornecedor);

/**
 * @swagger
 * /api/fornecedores/{codigo}:
 *   delete:
 *     summary: Remove um fornecedor
 *     tags: [Fornecedores]
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *         example: F001
 *     responses:
 *       200:
 *         description: Fornecedor removido com sucesso
 *       404:
 *         description: Fornecedor não encontrado
 *       500:
 *         description: Erro ao remover fornecedor
 */
router.delete('/:codigo', fornecedorController.deleteFornecedor);

export default router;
