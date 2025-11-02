import express from 'express';
import caixaController from '../controllers/caixaController';

const router = express.Router();

/**
 * @swagger
 * /api/caixa:
 *   get:
 *     summary: Buscar todos os caixas
 *     tags: [Caixa]
 *     responses:
 *       200:
 *         description: Lista de caixas retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Caixa'
 */
router.get('/', caixaController.getAll);

/**
 * @swagger
 * /api/caixa/aberto:
 *   get:
 *     summary: Buscar caixa aberto
 *     tags: [Caixa]
 *     responses:
 *       200:
 *         description: Caixa aberto retornado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Caixa'
 */
router.get('/aberto', caixaController.getCaixaAberto);

/**
 * @swagger
 * /api/caixa/{codigo}:
 *   get:
 *     summary: Buscar caixa por código
 *     tags: [Caixa]
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Caixa encontrado
 *       404:
 *         description: Caixa não encontrado
 */
router.get('/:codigo', caixaController.getByCodigo);

/**
 * @swagger
 * /api/caixa/abrir:
 *   post:
 *     summary: Abrir novo caixa
 *     tags: [Caixa]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - valorInicial
 *             properties:
 *               valorInicial:
 *                 type: number
 *                 minimum: 0
 *                 description: Valor inicial em dinheiro no caixa
 *     responses:
 *       201:
 *         description: Caixa aberto com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Caixa'
 *       400:
 *         description: Já existe caixa aberto ou valor inválido
 */
router.post('/abrir', caixaController.abrirCaixa);

/**
 * @swagger
 * /api/caixa/movimento:
 *   post:
 *     summary: Adicionar movimentação ao caixa (entrada/saída)
 *     tags: [Caixa]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tipo
 *               - valor
 *             properties:
 *               tipo:
 *                 type: string
 *                 enum: [entrada, saida]
 *                 description: Tipo da movimentação (entrada para injeção, saida para sangria)
 *               valor:
 *                 type: number
 *                 minimum: 0
 *                 description: Valor da movimentação
 *               observacao:
 *                 type: string
 *                 description: Observação opcional sobre a movimentação
 *     responses:
 *       200:
 *         description: Movimentação adicionada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Caixa'
 *       400:
 *         description: Não há caixa aberto ou dados inválidos
 */
router.post('/movimento', caixaController.adicionarMovimento);

/**
 * @swagger
 * /api/caixa/sincronizar-vendas:
 *   post:
 *     summary: Sincronizar vendas em dinheiro com o caixa
 *     tags: [Caixa]
 *     description: Busca todas as vendas em dinheiro desde a abertura do caixa e as adiciona como movimentações
 *     responses:
 *       200:
 *         description: Vendas sincronizadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 caixa:
 *                   $ref: '#/components/schemas/Caixa'
 *       400:
 *         description: Não há caixa aberto
 */
router.post('/sincronizar-vendas', caixaController.sincronizarVendas);

/**
 * @swagger
 * /api/caixa/fechar:
 *   post:
 *     summary: Fechar o caixa aberto
 *     tags: [Caixa]
 *     description: Recalcula totais e fecha o caixa atual
 *     responses:
 *       200:
 *         description: Caixa fechado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Caixa'
 *       400:
 *         description: Não há caixa aberto para fechar
 */
router.post('/fechar', caixaController.fecharCaixa);

/**
 * @swagger
 * /api/caixa/{codigo}:
 *   delete:
 *     summary: Deletar um caixa
 *     tags: [Caixa]
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *         description: Código do caixa a ser deletado
 *     responses:
 *       200:
 *         description: Caixa deletado com sucesso
 *       404:
 *         description: Caixa não encontrado
 */
router.delete('/:codigo', caixaController.delete);

export default router;
