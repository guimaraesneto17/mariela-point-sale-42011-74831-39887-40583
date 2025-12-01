import express from 'express';
import * as vitrineVirtualController from '../controllers/vitrineVirtualController';
import { cacheMiddleware, CACHE_TTL } from '../middleware/cache';

const router = express.Router();

/**
 * @swagger
 * /api/vitrine:
 *   get:
 *     summary: Lista todos os produtos da vitrine virtual (cached por 5 minutos)
 *     description: |
 *       Retorna uma view agregada da collection vitrineVirtual do MongoDB, formatada para exibição na vitrine.
 *       Utiliza cache de 5 minutos para melhorar performance em endpoint público.
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
router.get('/', cacheMiddleware(CACHE_TTL.VITRINE), vitrineVirtualController.getAllVitrineVirtual);

/**
 * @swagger
 * /api/vitrine/json:
 *   get:
 *     summary: JSON público da vitrine virtual (sem autenticação, cached)
 *     description: Endpoint público que retorna todos os produtos da vitrine em formato JSON, acessível sem autenticação, incluindo descrição detalhada
 *     tags: [Vitrine Virtual]
 *     responses:
 *       200:
 *         description: JSON da vitrine retornado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   code:
 *                     type: string
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   category:
 *                     type: string
 *                   image:
 *                     type: array
 *                     items:
 *                       type: string
 *                   price:
 *                     type: string
 *                   priceValue:
 *                     type: number
 *                   originalPrice:
 *                     type: string
 *                     nullable: true
 *                   originalPriceValue:
 *                     type: number
 *                     nullable: true
 *                   isOnSale:
 *                     type: boolean
 *                   isNew:
 *                     type: boolean
 *                   variants:
 *                     type: array
 *                     items:
 *                       type: object
 *                   totalAvailable:
 *                     type: number
 *                   statusProduct:
 *                     type: string
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Erro ao gerar JSON da vitrine
 */
router.get('/json', cacheMiddleware(CACHE_TTL.VITRINE), vitrineVirtualController.getAllVitrineVirtual);

/**
 * @swagger
 * /api/vitrine/novidades:
 *   get:
 *     summary: Lista as novidades da vitrine virtual (cached)
 *     description: Retorna apenas produtos marcados como novidade (isNew = true) com descrição detalhada
 *     tags: [Vitrine Virtual]
 *     responses:
 *       200:
 *         description: Lista de novidades retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   code:
 *                     type: string
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   category:
 *                     type: string
 *                   isNew:
 *                     type: boolean
 *                     example: true
 *       500:
 *         description: Erro ao buscar novidades
 */
router.get('/novidades', cacheMiddleware(CACHE_TTL.VITRINE), vitrineVirtualController.getNovidades);

/**
 * @swagger
 * /api/vitrine/promocoes:
 *   get:
 *     summary: Lista as promoções da vitrine virtual
 *     description: Retorna apenas produtos em promoção (isOnSale = true) com preço promocional e descrição detalhada
 *     tags: [Vitrine Virtual]
 *     responses:
 *       200:
 *         description: Lista de promoções retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   code:
 *                     type: string
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   category:
 *                     type: string
 *                   isOnSale:
 *                     type: boolean
 *                     example: true
 *                   price:
 *                     type: string
 *                   originalPrice:
 *                     type: string
 *       500:
 *         description: Erro ao buscar promoções
 */
router.get('/promocoes', cacheMiddleware(CACHE_TTL.VITRINE), vitrineVirtualController.getPromocoes);

/**
 * @swagger
 * /api/vitrine/codigo/{codigo}:
 *   get:
 *     summary: Busca um produto da vitrine por código do produto
 *     description: Retorna os detalhes completos de um produto específico da vitrine usando seu código, incluindo descrição
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
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 code:
 *                   type: string
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 category:
 *                   type: string
 *                 image:
 *                   type: array
 *                   items:
 *                     type: string
 *                 price:
 *                   type: string
 *                 priceValue:
 *                   type: number
 *                 variants:
 *                   type: array
 *                   items:
 *                     type: object
 *                 totalAvailable:
 *                   type: number
 *                 statusProduct:
 *                   type: string
 *       404:
 *         description: Produto não encontrado
 */
router.get('/codigo/:codigo', vitrineVirtualController.getVitrineVirtualByCodigo);

/**
 * @swagger
 * /api/vitrine/{id}:
 *   get:
 *     summary: Busca um produto da vitrine por ID sequencial
 *     description: Retorna os detalhes de um produto usando o ID gerado sequencialmente pela view, incluindo descrição
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
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 code:
 *                   type: string
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 category:
 *                   type: string
 *                 image:
 *                   type: array
 *                   items:
 *                     type: string
 *                 price:
 *                   type: string
 *                 variants:
 *                   type: array
 *                   items:
 *                     type: object
 *                 totalAvailable:
 *                   type: number
 *       404:
 *         description: Produto não encontrado
 */
router.get('/:id', vitrineVirtualController.getVitrineVirtualById);

export default router;
