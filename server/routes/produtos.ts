import express from 'express';
import Produto from '../models/Produto';
import Estoque from '../models/Estoque';

const router = express.Router();

/**
 * GET /api/produtos
 * Lista todos os produtos
 */
router.get('/', async (req, res) => {
  try {
    const produtos = await Produto.find().sort({ dataCadastro: -1 });
    res.json(produtos);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

/**
 * GET /api/produtos/:id
 * Busca um produto por ID
 */
router.get('/:id', async (req, res) => {
  try {
    const produto = await Produto.findById(req.params.id);
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
 * POST /api/produtos
 * Cria um novo produto
 */
router.post('/', async (req, res) => {
  try {
    const produto = new Produto(req.body);
    await produto.save();

    // Criar registro de estoque para o produto
    const estoque = new Estoque({
      codigoProduto: produto.codigo,
      quantidadeDisponivel: 0,
      quantidadeMinima: 5,
      emPromocao: false
    });
    await estoque.save();

    res.status(201).json(produto);
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(400).json({ error: 'Erro ao criar produto' });
  }
});

/**
 * PUT /api/produtos/:id
 * Atualiza um produto
 */
router.put('/:id', async (req, res) => {
  try {
    const produto = await Produto.findByIdAndUpdate(
      req.params.id,
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
 * DELETE /api/produtos/:id
 * Remove um produto
 */
router.delete('/:id', async (req, res) => {
  try {
    const produto = await Produto.findById(req.params.id);
    
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    // Remover também o registro de estoque
    await Estoque.findOneAndDelete({ codigoProduto: produto.codigo });
    await Produto.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Produto removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover produto:', error);
    res.status(500).json({ error: 'Erro ao remover produto' });
  }
});

export default router;
