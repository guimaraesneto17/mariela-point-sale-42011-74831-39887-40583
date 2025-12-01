import express from 'express';
import caixaController from '../controllers/caixaController';
import { cacheMiddleware, invalidateCacheMiddleware, CACHE_TTL } from '../middleware/cache';

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
 *     summary: Buscar caixa aberto (cached por 1 minuto)
 *     description: |
 *       Retorna o caixa atualmente aberto. Esta rota é altamente acessada e 
 *       utiliza cache de 1 minuto para reduzir carga no MongoDB.
 *     tags: [Caixa]
 *     responses:
 *       200:
 *         description: Caixa aberto retornado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Caixa'
 */
router.get('/aberto', cacheMiddleware(CACHE_TTL.CAIXA_ABERTO), caixaController.getCaixaAberto);

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
 *     description: Abre um novo caixa para o dia. Apenas um caixa pode estar aberto por vez.
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
 *                 example: 200.00
 *                 description: Valor inicial em dinheiro no caixa (troco)
 *               responsavel:
 *                 type: string
 *                 example: "João Silva"
 *                 description: Nome do responsável pela abertura
 *     responses:
 *       201:
 *         description: Caixa aberto com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 codigoCaixa:
 *                   type: string
 *                   example: "CX20250128-001"
 *                 valorInicial:
 *                   type: number
 *                   example: 200.00
 *                 dataAbertura:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-01-28T08:00:00Z"
 *                 status:
 *                   type: string
 *                   example: "aberto"
 *       400:
 *         description: Já existe caixa aberto ou valor inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Já existe um caixa aberto"
 */
router.post('/abrir', caixaController.abrirCaixa);

/**
 * @swagger
 * /api/caixa/movimento:
 *   post:
 *     summary: Adicionar movimentação ao caixa (sangria/suprimento)
 *     description: Registra uma entrada (suprimento) ou saída (sangria) de valores no caixa aberto
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
 *                 example: "saida"
 *                 description: |
 *                   Tipo da movimentação:
 *                   - entrada: Suprimento (adiciona dinheiro ao caixa)
 *                   - saida: Sangria (remove dinheiro do caixa)
 *               valor:
 *                 type: number
 *                 minimum: 0
 *                 example: 500.00
 *                 description: Valor da movimentação
 *               observacao:
 *                 type: string
 *                 example: "Sangria para depósito bancário"
 *                 description: Observação sobre a movimentação
 *     responses:
 *       200:
 *         description: Movimentação adicionada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Movimentação registrada com sucesso"
 *                 caixa:
 *                   type: object
 *                   properties:
 *                     saldoAtual:
 *                       type: number
 *                       example: 1200.00
 *       400:
 *         description: Não há caixa aberto ou dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Não há caixa aberto"
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
 * /api/caixa/movimento/excluir:
 *   delete:
 *     summary: Excluir movimentação do caixa aberto
 *     tags: [Caixa]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - index
 *             properties:
 *               index:
 *                 type: number
 *                 description: Índice da movimentação a ser excluída
 *     responses:
 *       200:
 *         description: Movimentação excluída com sucesso
 *       400:
 *         description: Não há caixa aberto ou índice inválido
 */
router.delete('/movimento/excluir', caixaController.excluirMovimento);

/**
 * @swagger
 * /api/caixa/reabrir:
 *   post:
 *     summary: Reabrir um caixa fechado
 *     tags: [Caixa]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - codigoCaixa
 *             properties:
 *               codigoCaixa:
 *                 type: string
 *                 description: Código do caixa a ser reaberto
 *     responses:
 *       200:
 *         description: Caixa reaberto com sucesso
 *       400:
 *         description: Já existe caixa aberto ou caixa já está aberto
 *       404:
 *         description: Caixa não encontrado
 */
router.post('/reabrir', caixaController.reabrirCaixa);

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
