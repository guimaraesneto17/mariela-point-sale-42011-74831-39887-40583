import express from 'express';
import Estoque from '../models/Estoque';

const router = express.Router();

/**
 * @swagger
 * /api/estoque:
 *   get:
 *     summary: Lista todo o estoque
 *     tags: [Estoque]
 *     responses:
 *       200:
 *         description: Lista de estoque retornada com sucesso
 *       500:
 *         description: Erro ao buscar estoque
 */
router.get('/', async (req, res) => {
  try {
    const estoque = await Estoque.find().sort({ codigoProduto: 1 });
    res.json(estoque);
  } catch (error) {
    console.error('Erro ao buscar estoque:', error);
    res.status(500).json({ error: 'Erro ao buscar estoque' });
  }
});

/**
 * GET /api/estoque/baixo
 * Lista produtos com estoque abaixo do mínimo
 */
router.get('/baixo', async (req, res) => {
  try {
    const estoque = await Estoque.find({
      $expr: { $lt: ['$quantidadeDisponivel', '$quantidadeMinima'] }
    }).sort({ quantidadeDisponivel: 1 });
    
    res.json(estoque);
  } catch (error) {
    console.error('Erro ao buscar estoque baixo:', error);
    res.status(500).json({ error: 'Erro ao buscar estoque baixo' });
  }
});

/**
 * GET /api/estoque/:codigoProduto
 * Busca estoque de um produto específico
 */
router.get('/:codigoProduto', async (req, res) => {
  try {
    const estoque = await Estoque.findOne({ codigoProduto: req.params.codigoProduto });
    if (!estoque) {
      return res.status(404).json({ error: 'Estoque não encontrado para este produto' });
    }
    res.json(estoque);
  } catch (error) {
    console.error('Erro ao buscar estoque:', error);
    res.status(500).json({ error: 'Erro ao buscar estoque' });
  }
});

/**
 * @swagger
 * /api/estoque/entrada:
 *   post:
 *     summary: Registra entrada de produtos no estoque
 *     tags: [Estoque]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - codigoProduto
 *               - quantidade
 *             properties:
 *               codigoProduto:
 *                 type: string
 *               quantidade:
 *                 type: number
 *               fornecedor:
 *                 type: string
 *               observacao:
 *                 type: string
 *     responses:
 *       200:
 *         description: Entrada registrada com sucesso
 *       404:
 *         description: Produto não encontrado no estoque
 *       400:
 *         description: Erro ao registrar entrada
 */
router.post('/entrada', async (req, res) => {
  try {
    const { codigoProduto, quantidade, fornecedor, observacao } = req.body;

    const estoque = await Estoque.findOne({ codigoProduto });
    
    if (!estoque) {
      return res.status(404).json({ error: 'Produto não encontrado no estoque' });
    }

    estoque.quantidadeDisponivel += quantidade;
    estoque.logMovimentacao.push({
      tipo: 'entrada',
      quantidade,
      data: new Date(),
      fornecedor,
      observacao
    });

    await estoque.save();
    res.json(estoque);
  } catch (error) {
    console.error('Erro ao registrar entrada:', error);
    res.status(400).json({ error: 'Erro ao registrar entrada' });
  }
});

/**
 * PUT /api/estoque/:codigoProduto
 * Atualiza configurações do estoque (mínimo, promoção, etc)
 */
router.put('/:codigoProduto', async (req, res) => {
  try {
    const estoque = await Estoque.findOneAndUpdate(
      { codigoProduto: req.params.codigoProduto },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!estoque) {
      return res.status(404).json({ error: 'Estoque não encontrado' });
    }
    
    res.json(estoque);
  } catch (error) {
    console.error('Erro ao atualizar estoque:', error);
    res.status(400).json({ error: 'Erro ao atualizar estoque' });
  }
});

export default router;
