import express, { Router } from 'express';
import * as contasPagarController from '../controllers/contasPagarController';

const router: Router = express.Router();

/**
 * @swagger
 * /api/contas-pagar:
 *   get:
 *     summary: Lista todas as contas a pagar
 *     description: Retorna todas as contas a pagar cadastradas no sistema, incluindo pagas e pendentes
 *     tags: [Contas a Pagar]
 *     responses:
 *       200:
 *         description: Lista de contas a pagar retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 contas:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       numero:
 *                         type: string
 *                         example: "CP001"
 *                       descricao:
 *                         type: string
 *                         example: "Fornecedor XYZ - Tecidos"
 *                       valor:
 *                         type: number
 *                         example: 1500.00
 *                       dataVencimento:
 *                         type: string
 *                         format: date
 *                         example: "2025-12-30"
 *                       status:
 *                         type: string
 *                         enum: [pendente, paga, vencida]
 *                         example: "pendente"
 *       500:
 *         description: Erro ao buscar contas a pagar
 */
router.get('/', contasPagarController.getAllContasPagar);

/**
 * @swagger
 * /api/contas-pagar/resumo:
 *   get:
 *     summary: Obtém resumo das contas a pagar
 *     description: Retorna estatísticas e totalizadores das contas a pagar (total pendente, vencidas, pagas no período, etc.)
 *     tags: [Contas a Pagar]
 *     responses:
 *       200:
 *         description: Resumo retornado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalPendente:
 *                   type: number
 *                   example: 5000.00
 *                   description: Total de contas pendentes
 *                 totalVencidas:
 *                   type: number
 *                   example: 1200.00
 *                   description: Total de contas vencidas
 *                 totalPagas:
 *                   type: number
 *                   example: 8500.00
 *                   description: Total pago no período
 *                 quantidadePendente:
 *                   type: integer
 *                   example: 12
 *                 quantidadeVencidas:
 *                   type: integer
 *                   example: 3
 *       500:
 *         description: Erro ao buscar resumo
 */
router.get('/resumo', contasPagarController.getResumoContasPagar);

/**
 * @swagger
 * /api/contas-pagar/{numero}:
 *   get:
 *     summary: Busca uma conta a pagar por número
 *     tags: [Contas a Pagar]
 *     parameters:
 *       - in: path
 *         name: numero
 *         required: true
 *         schema:
 *           type: string
 *         example: CP001
 *         description: Número da conta a pagar
 *     responses:
 *       200:
 *         description: Conta a pagar encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 numero:
 *                   type: string
 *                   example: "CP001"
 *                 descricao:
 *                   type: string
 *                   example: "Fornecedor XYZ - Tecidos"
 *                 valor:
 *                   type: number
 *                   example: 1500.00
 *                 categoria:
 *                   type: string
 *                   example: "Compras"
 *                 fornecedor:
 *                   type: string
 *                   example: "F001"
 *       404:
 *         description: Conta a pagar não encontrada
 *       500:
 *         description: Erro ao buscar conta a pagar
 */
router.get('/:numero', contasPagarController.getContaPagarByNumero);

/**
 * @swagger
 * /api/contas-pagar:
 *   post:
 *     summary: Cria uma nova conta a pagar
 *     tags: [Contas a Pagar]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - descricao
 *               - valor
 *               - dataVencimento
 *               - categoria
 *             properties:
 *               descricao:
 *                 type: string
 *                 example: "Fornecedor XYZ - Tecidos"
 *               valor:
 *                 type: number
 *                 example: 1500.00
 *               dataVencimento:
 *                 type: string
 *                 format: date
 *                 example: "2025-12-30"
 *               categoria:
 *                 type: string
 *                 example: "Compras"
 *               fornecedor:
 *                 type: string
 *                 example: "F001"
 *               observacoes:
 *                 type: string
 *                 example: "Pagamento referente a compra de tecidos"
 *     responses:
 *       201:
 *         description: Conta a pagar criada com sucesso
 *       400:
 *         description: Erro na validação dos dados
 */
router.post('/', contasPagarController.createContaPagar);

/**
 * @swagger
 * /api/contas-pagar/{numero}:
 *   put:
 *     summary: Atualiza uma conta a pagar
 *     tags: [Contas a Pagar]
 *     parameters:
 *       - in: path
 *         name: numero
 *         required: true
 *         schema:
 *           type: string
 *         example: CP001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               descricao:
 *                 type: string
 *               valor:
 *                 type: number
 *               dataVencimento:
 *                 type: string
 *                 format: date
 *               categoria:
 *                 type: string
 *               observacoes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Conta a pagar atualizada com sucesso
 *       404:
 *         description: Conta a pagar não encontrada
 *       400:
 *         description: Erro na validação dos dados
 */
router.put('/:numero', contasPagarController.updateContaPagar);

/**
 * @swagger
 * /api/contas-pagar/{numero}/pagar:
 *   post:
 *     summary: Registra o pagamento de uma conta
 *     description: Marca uma conta como paga e registra a data e forma de pagamento
 *     tags: [Contas a Pagar]
 *     parameters:
 *       - in: path
 *         name: numero
 *         required: true
 *         schema:
 *           type: string
 *         example: CP001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dataPagamento
 *               - formaPagamento
 *             properties:
 *               dataPagamento:
 *                 type: string
 *                 format: date
 *                 example: "2025-11-28"
 *               formaPagamento:
 *                 type: string
 *                 enum: [dinheiro, pix, cartao_credito, cartao_debito, transferencia]
 *                 example: "pix"
 *               valorPago:
 *                 type: number
 *                 example: 1500.00
 *                 description: Valor efetivamente pago (opcional, usa o valor da conta se não informado)
 *               observacoes:
 *                 type: string
 *                 example: "Pagamento realizado com desconto"
 *     responses:
 *       200:
 *         description: Pagamento registrado com sucesso
 *       404:
 *         description: Conta a pagar não encontrada
 *       400:
 *         description: Erro ao registrar pagamento
 */
router.post('/:numero/pagar', contasPagarController.pagarConta);

/**
 * @swagger
 * /api/contas-pagar/{numero}:
 *   delete:
 *     summary: Remove uma conta a pagar
 *     tags: [Contas a Pagar]
 *     parameters:
 *       - in: path
 *         name: numero
 *         required: true
 *         schema:
 *           type: string
 *         example: CP001
 *     responses:
 *       200:
 *         description: Conta a pagar removida com sucesso
 *       404:
 *         description: Conta a pagar não encontrada
 *       500:
 *         description: Erro ao remover conta a pagar
 */
router.delete('/:numero', contasPagarController.deleteContaPagar);

export default router;
