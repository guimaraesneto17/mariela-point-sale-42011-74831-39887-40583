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
 *         description: Lista de caixas
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
 *         description: Caixa aberto encontrado
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
 *             properties:
 *               valorInicial:
 *                 type: number
 *     responses:
 *       201:
 *         description: Caixa aberto com sucesso
 */
router.post('/abrir', caixaController.abrirCaixa);

/**
 * @swagger
 * /api/caixa/movimento:
 *   post:
 *     summary: Adicionar movimentação (entrada/saída)
 *     tags: [Caixa]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tipo:
 *                 type: string
 *                 enum: [entrada, saida]
 *               valor:
 *                 type: number
 *               observacao:
 *                 type: string
 *     responses:
 *       200:
 *         description: Movimentação adicionada
 */
router.post('/movimento', caixaController.adicionarMovimento);

/**
 * @swagger
 * /api/caixa/sincronizar-vendas:
 *   post:
 *     summary: Sincronizar vendas em dinheiro
 *     tags: [Caixa]
 *     responses:
 *       200:
 *         description: Vendas sincronizadas
 */
router.post('/sincronizar-vendas', caixaController.sincronizarVendas);

/**
 * @swagger
 * /api/caixa/fechar:
 *   post:
 *     summary: Fechar caixa aberto
 *     tags: [Caixa]
 *     responses:
 *       200:
 *         description: Caixa fechado com sucesso
 */
router.post('/fechar', caixaController.fecharCaixa);

/**
 * @swagger
 * /api/caixa/{codigo}:
 *   delete:
 *     summary: Deletar caixa
 *     tags: [Caixa]
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Caixa deletado
 */
router.delete('/:codigo', caixaController.delete);

export default router;
