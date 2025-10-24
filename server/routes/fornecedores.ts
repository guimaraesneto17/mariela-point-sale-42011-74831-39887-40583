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
 *       500:
 *         description: Erro ao buscar fornecedor
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
 *                         example: "nome"
 *                       message:
 *                         type: string
 *                         example: "Nome é obrigatório"
 *                       value:
 *                         type: string
 *                         example: ""
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
 *                         example: "telefone"
 *                       message:
 *                         type: string
 *                         example: "Telefone deve estar no formato (99) 99999-9999"
 *                       value:
 *                         type: string
 *                         example: "123456"
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
