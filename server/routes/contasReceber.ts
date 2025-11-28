import express, { Router } from 'express';
import * as contasReceberController from '../controllers/contasReceberController';

const router: Router = express.Router();

/**
 * @swagger
 * /api/contas-receber:
 *   get:
 *     summary: Lista todas as contas a receber
 *     description: Retorna todas as contas a receber cadastradas no sistema, incluindo recebidas e pendentes
 *     tags: [Contas a Receber]
 *     responses:
 *       200:
 *         description: Lista de contas a receber retornada com sucesso
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
 *                         example: "CR001"
 *                       descricao:
 *                         type: string
 *                         example: "Venda cliente Maria"
 *                       valor:
 *                         type: number
 *                         example: 250.00
 *                       dataVencimento:
 *                         type: string
 *                         format: date
 *                         example: "2025-12-15"
 *                       status:
 *                         type: string
 *                         enum: [pendente, recebida, vencida]
 *                         example: "pendente"
 *       500:
 *         description: Erro ao buscar contas a receber
 */
router.get('/', contasReceberController.getAllContasReceber);

/**
 * @swagger
 * /api/contas-receber/resumo:
 *   get:
 *     summary: Obtém resumo das contas a receber
 *     description: Retorna estatísticas e totalizadores das contas a receber (total pendente, vencidas, recebidas no período, etc.)
 *     tags: [Contas a Receber]
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
 *                   example: 3500.00
 *                   description: Total de contas pendentes
 *                 totalVencidas:
 *                   type: number
 *                   example: 800.00
 *                   description: Total de contas vencidas
 *                 totalRecebidas:
 *                   type: number
 *                   example: 12500.00
 *                   description: Total recebido no período
 *                 quantidadePendente:
 *                   type: integer
 *                   example: 8
 *                 quantidadeVencidas:
 *                   type: integer
 *                   example: 2
 *       500:
 *         description: Erro ao buscar resumo
 */
router.get('/resumo', contasReceberController.getResumoContasReceber);

/**
 * @swagger
 * /api/contas-receber/{numero}:
 *   get:
 *     summary: Busca uma conta a receber por número
 *     tags: [Contas a Receber]
 *     parameters:
 *       - in: path
 *         name: numero
 *         required: true
 *         schema:
 *           type: string
 *         example: CR001
 *         description: Número da conta a receber
 *     responses:
 *       200:
 *         description: Conta a receber encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 numero:
 *                   type: string
 *                   example: "CR001"
 *                 descricao:
 *                   type: string
 *                   example: "Venda cliente Maria"
 *                 valor:
 *                   type: number
 *                   example: 250.00
 *                 categoria:
 *                   type: string
 *                   example: "Vendas"
 *                 cliente:
 *                   type: string
 *                   example: "C001"
 *       404:
 *         description: Conta a receber não encontrada
 *       500:
 *         description: Erro ao buscar conta a receber
 */
router.get('/:numero', contasReceberController.getContaReceberByNumero);

/**
 * @swagger
 * /api/contas-receber:
 *   post:
 *     summary: Cria uma nova conta a receber
 *     tags: [Contas a Receber]
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
 *                 example: "Venda cliente Maria"
 *               valor:
 *                 type: number
 *                 example: 250.00
 *               dataVencimento:
 *                 type: string
 *                 format: date
 *                 example: "2025-12-15"
 *               categoria:
 *                 type: string
 *                 example: "Vendas"
 *               cliente:
 *                 type: string
 *                 example: "C001"
 *               codigoVenda:
 *                 type: string
 *                 example: "VENDA20250117-001"
 *               observacoes:
 *                 type: string
 *                 example: "Pagamento parcelado 1/3"
 *     responses:
 *       201:
 *         description: Conta a receber criada com sucesso
 *       400:
 *         description: Erro na validação dos dados
 */
router.post('/', contasReceberController.createContaReceber);

/**
 * @swagger
 * /api/contas-receber/{numero}:
 *   put:
 *     summary: Atualiza uma conta a receber
 *     tags: [Contas a Receber]
 *     parameters:
 *       - in: path
 *         name: numero
 *         required: true
 *         schema:
 *           type: string
 *         example: CR001
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
 *         description: Conta a receber atualizada com sucesso
 *       404:
 *         description: Conta a receber não encontrada
 *       400:
 *         description: Erro na validação dos dados
 */
router.put('/:numero', contasReceberController.updateContaReceber);

/**
 * @swagger
 * /api/contas-receber/{numero}/receber:
 *   post:
 *     summary: Registra o recebimento de uma conta
 *     description: Marca uma conta como recebida e registra a data e forma de recebimento
 *     tags: [Contas a Receber]
 *     parameters:
 *       - in: path
 *         name: numero
 *         required: true
 *         schema:
 *           type: string
 *         example: CR001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dataRecebimento
 *               - formaRecebimento
 *             properties:
 *               dataRecebimento:
 *                 type: string
 *                 format: date
 *                 example: "2025-11-28"
 *               formaRecebimento:
 *                 type: string
 *                 enum: [dinheiro, pix, cartao_credito, cartao_debito, transferencia]
 *                 example: "pix"
 *               valorRecebido:
 *                 type: number
 *                 example: 250.00
 *                 description: Valor efetivamente recebido (opcional, usa o valor da conta se não informado)
 *               observacoes:
 *                 type: string
 *                 example: "Recebimento com desconto por antecipação"
 *     responses:
 *       200:
 *         description: Recebimento registrado com sucesso
 *       404:
 *         description: Conta a receber não encontrada
 *       400:
 *         description: Erro ao registrar recebimento
 */
router.post('/:numero/receber', contasReceberController.receberConta);

/**
 * @swagger
 * /api/contas-receber/{numero}:
 *   delete:
 *     summary: Remove uma conta a receber
 *     tags: [Contas a Receber]
 *     parameters:
 *       - in: path
 *         name: numero
 *         required: true
 *         schema:
 *           type: string
 *         example: CR001
 *     responses:
 *       200:
 *         description: Conta a receber removida com sucesso
 *       404:
 *         description: Conta a receber não encontrada
 *       500:
 *         description: Erro ao remover conta a receber
 */
router.delete('/:numero', contasReceberController.deleteContaReceber);

export default router;
