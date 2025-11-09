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
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: ID sequencial gerado pela view
 *                   code:
 *                     type: string
 *                     description: Código do produto
 *                   title:
 *                     type: string
 *                     description: Nome do produto
 *                   description:
 *                     type: string
 *                     description: Descrição detalhada do produto
 *                   category:
 *                     type: string
 *                     description: Categoria do produto
 *                   image:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: URLs das imagens do produto
 *                   price:
 *                     type: string
 *                     description: Preço formatado (com ou sem promoção)
 *                   priceValue:
 *                     type: number
 *                     description: Valor numérico do preço
 *                   originalPrice:
 *                     type: string
 *                     nullable: true
 *                     description: Preço original formatado (apenas em promoção)
 *                   originalPriceValue:
 *                     type: number
 *                     nullable: true
 *                     description: Valor numérico do preço original
 *                   isOnSale:
 *                     type: boolean
 *                     description: Indica se está em promoção
 *                   isNew:
 *                     type: boolean
 *                     description: Indica se é novidade
 *                   variants:
 *                     type: array
 *                     description: Variantes disponíveis (cor, tamanho, quantidade)
 *                     items:
 *                       type: object
 *                       properties:
 *                         color:
 *                           type: string
 *                         size:
 *                           type: string
 *                         available:
 *                           type: number
 *                   totalAvailable:
 *                     type: number
 *                     description: Total de unidades disponíveis
 *                   statusProduct:
 *                     type: string
 *                     description: Status do produto (Disponível, Esgotado, Últimas unidades)
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                     description: Data da última atualização
 *       500:
 *         description: Erro ao buscar produtos
 */
router.get('/', vitrineVirtualController.getAllVitrineVirtual);

/**
 * @swagger
 * /api/vitrine/json:
 *   get:
 *     summary: JSON público da vitrine virtual (sem autenticação)
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
router.get('/json', vitrineVirtualController.getAllVitrineVirtual);

/**
 * @swagger
 * /api/vitrine/novidades:
 *   get:
 *     summary: Lista as novidades da vitrine virtual
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
router.get('/novidades', vitrineVirtualController.getNovidades);

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
router.get('/promocoes', vitrineVirtualController.getPromocoes);

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
