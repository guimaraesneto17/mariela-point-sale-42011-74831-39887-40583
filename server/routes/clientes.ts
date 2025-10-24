import express from 'express';
import * as clienteController from '../controllers/clienteController';

const router = express.Router();

/**
 * @swagger
 * /api/clientes:
 *   get:
 *     summary: Lista todos os clientes
 *     tags: [Clientes]
 *     responses:
 *       200:
 *         description: Lista de clientes retornada com sucesso
 *       500:
 *         description: Erro ao buscar clientes
 */
router.get('/', clienteController.getAllClientes);

/**
 * @swagger
 * /api/clientes/{codigo}:
 *   get:
 *     summary: Busca um cliente por código
 *     tags: [Clientes]
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *         example: C001
 *         description: Código do cliente (formato C + 3 dígitos)
 *     responses:
 *       200:
 *         description: Cliente encontrado
 *       404:
 *         description: Cliente não encontrado
 *       500:
 *         description: Erro ao buscar cliente
 */
router.get('/:codigo', clienteController.getClienteByCodigo);

/**
 * @swagger
 * /api/clientes:
 *   post:
 *     summary: Cria um novo cliente
 *     tags: [Clientes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Cliente'
 *     responses:
 *       201:
 *         description: Cliente criado com sucesso
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
router.post('/', clienteController.createCliente);

/**
 * @swagger
 * /api/clientes/{codigo}:
 *   put:
 *     summary: Atualiza um cliente
 *     tags: [Clientes]
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *         example: C001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Cliente'
 *     responses:
 *       200:
 *         description: Cliente atualizado com sucesso
 *       404:
 *         description: Cliente não encontrado
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
router.put('/:codigo', clienteController.updateCliente);

/**
 * @swagger
 * /api/clientes/{codigo}:
 *   delete:
 *     summary: Remove um cliente
 *     tags: [Clientes]
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *         example: C001
 *     responses:
 *       200:
 *         description: Cliente removido com sucesso
 *       404:
 *         description: Cliente não encontrado
 *       500:
 *         description: Erro ao remover cliente
 */
router.delete('/:codigo', clienteController.deleteCliente);

export default router;
