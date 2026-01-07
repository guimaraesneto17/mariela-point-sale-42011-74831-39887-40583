import express from 'express';
import * as vendedorController from '../controllers/vendedorController';
import { 
  validatePaginationParams, 
  validateCodeParam, 
  validateEntity, 
  sanitizeBody,
  CODE_PATTERNS 
} from '../middleware/validation';

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
router.get('/', validatePaginationParams, vendedorController.getAllVendedores);

/**
 * @swagger
 * /api/vendedores/{codigo}:
 *   get:
 *     summary: Busca um vendedor por código
 *     tags: [Vendedores]
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *         example: V001
 *         description: Código do vendedor (formato V + 3 dígitos)
 *     responses:
 *       200:
 *         description: Vendedor encontrado
 *       404:
 *         description: Vendedor não encontrado
 *       500:
 *         description: Erro ao buscar fornecedor
 */
router.get('/:codigo', validateCodeParam(CODE_PATTERNS.vendedor, 'codigoVendedor'), vendedorController.getVendedorByCodigo);

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
router.post('/', sanitizeBody, validateEntity('vendedor'), vendedorController.createVendedor);

/**
 * @swagger
 * /api/vendedores/{codigo}:
 *   put:
 *     summary: Atualiza um vendedor
 *     tags: [Vendedores]
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *         example: V001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Vendedor'
 *     responses:
 *       200:
 *         description: Vendedor atualizado com sucesso
 *       404:
 *         description: Vendedor não encontrado
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
router.put('/:codigo', sanitizeBody, validateCodeParam(CODE_PATTERNS.vendedor, 'codigoVendedor'), vendedorController.updateVendedor);

/**
 * @swagger
 * /api/vendedores/{codigo}:
 *   delete:
 *     summary: Remove um vendedor
 *     tags: [Vendedores]
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *         example: V001
 *     responses:
 *       200:
 *         description: Vendedor removido com sucesso
 *       404:
 *         description: Vendedor não encontrado
 *       500:
 *         description: Erro ao remover vendedor
 */
router.delete('/:codigo', validateCodeParam(CODE_PATTERNS.vendedor, 'codigoVendedor'), vendedorController.deleteVendedor);

export default router;
