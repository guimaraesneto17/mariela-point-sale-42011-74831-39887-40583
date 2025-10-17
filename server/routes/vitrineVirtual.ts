import express from 'express';
import VitrineVirtual from '../models/VitrineVirtual';

const router = express.Router();

/**
 * @swagger
 * /api/vitrine:
 *   get:
 *     summary: Lista todos os produtos da vitrine virtual
 *     tags: [Vitrine Virtual]
 *     responses:
 *       200:
 *         description: Lista de produtos
 *       500:
 *         description: Erro ao buscar produtos
 */
router.get('/', async (req, res) => {
  try {
    const produtos = await VitrineVirtual.find().sort({ registrationDate: -1 });
    res.json(produtos);
  } catch (error) {
    console.error('Erro ao buscar produtos da vitrine:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos da vitrine' });
  }
});

/**
 * @swagger
 * /api/vitrine/novidades:
 *   get:
 *     summary: Lista produtos novos da vitrine
 *     tags: [Vitrine Virtual]
 *     responses:
 *       200:
 *         description: Lista de novidades
 */
router.get('/novidades', async (req, res) => {
  try {
    const novidades = await VitrineVirtual.find({ 'tags.isNew': true }).sort({ registrationDate: -1 });
    res.json(novidades);
  } catch (error) {
    console.error('Erro ao buscar novidades:', error);
    res.status(500).json({ error: 'Erro ao buscar novidades' });
  }
});

/**
 * @swagger
 * /api/vitrine/promocoes:
 *   get:
 *     summary: Lista produtos em promoção
 *     tags: [Vitrine Virtual]
 *     responses:
 *       200:
 *         description: Lista de promoções
 */
router.get('/promocoes', async (req, res) => {
  try {
    const promocoes = await VitrineVirtual.find({ 'tags.isOnSale': true }).sort({ registrationDate: -1 });
    res.json(promocoes);
  } catch (error) {
    console.error('Erro ao buscar promoções:', error);
    res.status(500).json({ error: 'Erro ao buscar promoções' });
  }
});

/**
 * @swagger
 * /api/vitrine/{code}:
 *   get:
 *     summary: Busca um produto por código
 *     tags: [Vitrine Virtual]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Produto encontrado
 *       404:
 *         description: Produto não encontrado
 */
router.get('/:code', async (req, res) => {
  try {
    const produto = await VitrineVirtual.findOne({ code: req.params.code });
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    res.json(produto);
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({ error: 'Erro ao buscar produto' });
  }
});

/**
 * @swagger
 * /api/vitrine:
 *   post:
 *     summary: Cria um novo produto na vitrine
 *     tags: [Vitrine Virtual]
 *     responses:
 *       201:
 *         description: Produto criado
 *       400:
 *         description: Erro ao criar produto
 */
router.post('/', async (req, res) => {
  try {
    const produto = new VitrineVirtual(req.body);
    await produto.save();
    res.status(201).json(produto);
  } catch (error) {
    console.error('Erro ao criar produto na vitrine:', error);
    res.status(400).json({ error: 'Erro ao criar produto na vitrine' });
  }
});

/**
 * @swagger
 * /api/vitrine/{code}:
 *   put:
 *     summary: Atualiza um produto da vitrine
 *     tags: [Vitrine Virtual]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *     responses:
 *       200:
 *         description: Produto atualizado
 *       404:
 *         description: Produto não encontrado
 */
router.put('/:code', async (req, res) => {
  try {
    const produto = await VitrineVirtual.findOneAndUpdate(
      { code: req.params.code },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    res.json(produto);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(400).json({ error: 'Erro ao atualizar produto' });
  }
});

/**
 * @swagger
 * /api/vitrine/{code}:
 *   delete:
 *     summary: Remove um produto da vitrine
 *     tags: [Vitrine Virtual]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *     responses:
 *       200:
 *         description: Produto removido
 *       404:
 *         description: Produto não encontrado
 */
router.delete('/:code', async (req, res) => {
  try {
    const produto = await VitrineVirtual.findOneAndDelete({ code: req.params.code });
    
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    res.json({ message: 'Produto removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover produto:', error);
    res.status(500).json({ error: 'Erro ao remover produto' });
  }
});

export default router;
