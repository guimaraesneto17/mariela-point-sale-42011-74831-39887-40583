import express from 'express';
import * as vendaController from '../controllers/vendaController';
import { requirePermission } from '../middleware/permissions';

const router = express.Router();

/**
 * @swagger
 * /api/vendas:
 *   get:
 *     summary: Lista todas as vendas
 *     tags: [Vendas]
 *     responses:
 *       200:
 *         description: Lista de vendas retornada com sucesso
 *       500:
 *         description: Erro ao buscar vendas
 */
router.get('/', requirePermission('vendas', 'view'), vendaController.getAllVendas);

/**
 * @swagger
 * /api/vendas/{codigo}:
 *   get:
 *     summary: Busca uma venda por código
 *     tags: [Vendas]
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *         example: VENDA20250117-001
 *         description: Código da venda (formato VENDA + data + número sequencial)
 *     responses:
 *       200:
 *         description: Venda encontrada
 *       404:
 *         description: Venda não encontrada
 */
router.get('/:codigo', requirePermission('vendas', 'view'), vendaController.getVendaByCodigo);

/**
 * @swagger
 * /api/vendas:
 *   post:
 *     summary: Cria uma nova venda
 *     description: Registra uma nova venda no sistema, atualiza o estoque e pode gerar contas a receber se parcelado
 *     tags: [Vendas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - itens
 *               - formaPagamento
 *             properties:
 *               codigoVenda:
 *                 type: string
 *                 example: "VENDA20250117-001"
 *                 description: Código da venda (gerado automaticamente se não informado)
 *               cliente:
 *                 type: string
 *                 example: "C001"
 *                 description: Código do cliente
 *               vendedor:
 *                 type: string
 *                 example: "V001"
 *                 description: Código do vendedor
 *               itens:
 *                 type: array
 *                 description: Lista de produtos vendidos
 *                 items:
 *                   type: object
 *                   required:
 *                     - codigoProduto
 *                     - quantidade
 *                     - precoUnitario
 *                   properties:
 *                     codigoProduto:
 *                       type: string
 *                       example: "P001"
 *                     nomeProduto:
 *                       type: string
 *                       example: "Vestido Floral"
 *                     cor:
 *                       type: string
 *                       example: "Azul"
 *                     tamanho:
 *                       type: string
 *                       example: "M"
 *                     quantidade:
 *                       type: number
 *                       example: 2
 *                     precoUnitario:
 *                       type: number
 *                       example: 199.90
 *               valorTotal:
 *                 type: number
 *                 example: 399.80
 *                 description: Valor total da venda
 *               desconto:
 *                 type: number
 *                 example: 39.98
 *                 description: Valor de desconto aplicado
 *               formaPagamento:
 *                 type: string
 *                 enum: [dinheiro, pix, cartao_credito, cartao_debito, parcelado]
 *                 example: "parcelado"
 *               numeroParcelas:
 *                 type: number
 *                 example: 3
 *                 description: Número de parcelas (obrigatório se formaPagamento=parcelado)
 *               observacoes:
 *                 type: string
 *                 example: "Cliente pediu embalagem para presente"
 *     responses:
 *       201:
 *         description: Venda criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 codigoVenda:
 *                   type: string
 *                   example: "VENDA20250117-001"
 *                 valorTotal:
 *                   type: number
 *                   example: 399.80
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
 *                         example: "codigoVenda"
 *                       message:
 *                         type: string
 *                         example: "Código da venda é obrigatório"
 *                       value:
 *                         type: string
 *                         example: ""
 */
router.post('/', requirePermission('vendas', 'create'), vendaController.createVenda);

/**
 * @swagger
 * /api/vendas/{codigo}:
 *   put:
 *     summary: Atualiza uma venda
 *     tags: [Vendas]
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *         example: VENDA20250117-001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Venda'
 *     responses:
 *       200:
 *         description: Venda atualizada com sucesso
 *       404:
 *         description: Venda não encontrada
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
router.put('/:codigo', requirePermission('vendas', 'edit'), vendaController.updateVenda);

/**
 * @swagger
 * /api/vendas/{codigo}:
 *   delete:
 *     summary: Remove uma venda
 *     tags: [Vendas]
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *         example: VENDA20250117-001
 *     responses:
 *       200:
 *         description: Venda removida com sucesso
 *       404:
 *         description: Venda não encontrada
 *       500:
 *         description: Erro ao remover venda
 */
router.delete('/:codigo', requirePermission('vendas', 'delete'), vendaController.deleteVenda);

export default router;
