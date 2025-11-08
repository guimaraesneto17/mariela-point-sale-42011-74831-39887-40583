import express from 'express';
import * as vitrineVirtualController from '../controllers/vitrineVirtualController';

const router = express.Router();

/**
 * @swagger
 * /api/vitrine:
 *   get:
 *     summary: Lista todos os produtos da vitrine virtual
 *     description: Retorna uma view agregada combinando dados de Produto e Estoque, formatada para exibição na vitrine
 *     tags: [Vitrine Virtual]
 *     responses:
 *       200:
 *         description: Lista de produtos retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/VitrineVirtual'
 *       500:
 *         description: Erro ao buscar produtos
 */
router.get('/', vitrineVirtualController.getAllVitrineVirtual);

/**
 * @swagger
 * /api/vitrine/json:
 *   get:
 *     summary: JSON público da vitrine virtual (sem autenticação)
 *     description: Endpoint público que retorna todos os produtos da vitrine em formato JSON, acessível sem autenticação
 *     tags: [Vitrine Virtual]
 *     responses:
 *       200:
 *         description: JSON da vitrine retornado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/VitrineVirtual'
 *       500:
 *         description: Erro ao gerar JSON da vitrine
 */
router.get('/json', vitrineVirtualController.getAllVitrineVirtual);

/**
 * @swagger
 * /api/vitrine/novidades:
 *   get:
 *     summary: Lista as novidades da vitrine virtual
 *     description: Retorna apenas produtos marcados como novidade (isNew = true)
 *     tags: [Vitrine Virtual]
 *     responses:
 *       200:
 *         description: Lista de novidades retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/VitrineVirtual'
 *       500:
 *         description: Erro ao buscar novidades
 */
router.get('/novidades', vitrineVirtualController.getNovidades);

/**
 * @swagger
 * /api/vitrine/promocoes:
 *   get:
 *     summary: Lista as promoções da vitrine virtual
 *     description: Retorna apenas produtos em promoção (isOnSale = true) com preço promocional
 *     tags: [Vitrine Virtual]
 *     responses:
 *       200:
 *         description: Lista de promoções retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/VitrineVirtual'
 *       500:
 *         description: Erro ao buscar promoções
 */
router.get('/promocoes', vitrineVirtualController.getPromocoes);

/**
 * @swagger
 * /api/vitrine/codigo/{codigo}:
 *   get:
 *     summary: Busca um produto da vitrine por código do produto
 *     description: Retorna os detalhes completos de um produto específico da vitrine usando seu código
 *     tags: [Vitrine Virtual]
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^P\\d{3}$'
 *           example: 'P001'
 *         description: Código do produto (formato P + 3 dígitos)
 *     responses:
 *       200:
 *         description: Produto encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VitrineVirtual'
 *       404:
 *         description: Produto não encontrado
 */
router.get('/codigo/:codigo', vitrineVirtualController.getVitrineVirtualByCodigo);

/**
 * @swagger
 * /api/vitrine/{id}:
 *   get:
 *     summary: Busca um produto da vitrine por ID sequencial
 *     description: Retorna os detalhes de um produto usando o ID gerado sequencialmente pela view
 *     tags: [Vitrine Virtual]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *         description: ID sequencial do produto na vitrine
 *     responses:
 *       200:
 *         description: Produto encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VitrineVirtual'
 *       404:
 *         description: Produto não encontrado
 */
router.get('/:id', vitrineVirtualController.getVitrineVirtualById);

/**
 * @swagger
 * /api/vitrine:
 *   post:
 *     summary: Operação não disponível - Vitrine é somente leitura
 *     description: A Vitrine Virtual é uma view agregada de Produto + Estoque. Use as APIs de Produto e Estoque para modificar dados.
 *     tags: [Vitrine Virtual]
 *     responses:
 *       501:
 *         description: Vitrine Virtual é somente leitura
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 'Vitrine Virtual é somente leitura - use Estoque e Produto para modificar dados'
 */
router.post('/', vitrineVirtualController.createVitrineVirtual);

/**
 * @swagger
 * /api/vitrine/{id}:
 *   put:
 *     summary: Operação não disponível - Vitrine é somente leitura
 *     description: A Vitrine Virtual é uma view agregada de Produto + Estoque. Use as APIs de Produto e Estoque para modificar dados.
 *     tags: [Vitrine Virtual]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do produto na vitrine
 *     responses:
 *       501:
 *         description: Vitrine Virtual é somente leitura
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 'Vitrine Virtual é somente leitura - use Estoque e Produto para modificar dados'
 */
router.put('/:id', vitrineVirtualController.updateVitrineVirtual);

/**
 * @swagger
 * /api/vitrine/{id}:
 *   delete:
 *     summary: Operação não disponível - Vitrine é somente leitura
 *     description: A Vitrine Virtual é uma view agregada de Produto + Estoque. Use as APIs de Produto e Estoque para modificar dados.
 *     tags: [Vitrine Virtual]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do produto na vitrine
 *     responses:
 *       501:
 *         description: Vitrine Virtual é somente leitura
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 'Vitrine Virtual é somente leitura - use Estoque e Produto para modificar dados'
 */
router.delete('/:id', vitrineVirtualController.deleteVitrineVirtual);

export default router;
