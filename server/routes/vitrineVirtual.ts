import express from 'express';
import * as vitrineVirtualController from '../controllers/vitrineVirtualController';

const router = express.Router();

/**
 * @swagger
 * /api/vitrine:
 *   get:
 *     summary: Lista todos os produtos da vitrine virtual
 *     tags: [Vitrine Virtual]
 *     responses:
 *       200:
 *         description: Lista de produtos retornada com sucesso
 *       500:
 *         description: Erro ao buscar produtos
 */
router.get('/', vitrineVirtualController.getAllVitrineVirtual);

/**
 * @swagger
 * /api/vitrine/novidades:
 *   get:
 *     summary: Lista as novidades da vitrine virtual
 *     tags: [Vitrine Virtual]
 *     responses:
 *       200:
 *         description: Lista de novidades retornada com sucesso
 *       500:
 *         description: Erro ao buscar novidades
 */
router.get('/novidades', vitrineVirtualController.getNovidades);

/**
 * @swagger
 * /api/vitrine/promocoes:
 *   get:
 *     summary: Lista as promoções da vitrine virtual
 *     tags: [Vitrine Virtual]
 *     responses:
 *       200:
 *         description: Lista de promoções retornada com sucesso
 *       500:
 *         description: Erro ao buscar promoções
 */
router.get('/promocoes', vitrineVirtualController.getPromocoes);

/**
 * @swagger
 * /api/vitrine/codigo/{codigo}:
 *   get:
 *     summary: Busca um produto da vitrine por código
 *     tags: [Vitrine Virtual]
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Produto encontrado
 *       404:
 *         description: Produto não encontrado
 */
router.get('/codigo/:codigo', vitrineVirtualController.getVitrineVirtualByCodigo);

/**
 * @swagger
 * /api/vitrine/{id}:
 *   get:
 *     summary: Busca um produto da vitrine por ID
 *     tags: [Vitrine Virtual]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Produto encontrado
 *       404:
 *         description: Produto não encontrado
 */
router.get('/:id', vitrineVirtualController.getVitrineVirtualById);

/**
 * @swagger
 * /api/vitrine:
 *   post:
 *     summary: Adiciona um produto à vitrine virtual
 *     tags: [Vitrine Virtual]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Produto adicionado com sucesso
 *       400:
 *         description: Erro ao adicionar produto
 */
router.post('/', vitrineVirtualController.createVitrineVirtual);

/**
 * @swagger
 * /api/vitrine/{id}:
 *   put:
 *     summary: Atualiza um produto da vitrine virtual
 *     tags: [Vitrine Virtual]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Produto atualizado com sucesso
 *       404:
 *         description: Produto não encontrado
 *       400:
 *         description: Erro ao atualizar produto
 */
router.put('/:id', vitrineVirtualController.updateVitrineVirtual);

/**
 * @swagger
 * /api/vitrine/{id}:
 *   delete:
 *     summary: Remove um produto da vitrine virtual
 *     tags: [Vitrine Virtual]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Produto removido com sucesso
 *       404:
 *         description: Produto não encontrado
 *       500:
 *         description: Erro ao remover produto
 */
router.delete('/:id', vitrineVirtualController.deleteVitrineVirtual);

export default router;
