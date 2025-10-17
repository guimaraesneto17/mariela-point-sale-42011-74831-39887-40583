import express from 'express';
import Fornecedor from '../models/Fornecedor';

const router = express.Router();

/**
 * GET /api/fornecedores
 * Lista todos os fornecedores
 */
router.get('/', async (req, res) => {
  try {
    const fornecedores = await Fornecedor.find().sort({ dataCadastro: -1 });
    res.json(fornecedores);
  } catch (error) {
    console.error('Erro ao buscar fornecedores:', error);
    res.status(500).json({ error: 'Erro ao buscar fornecedores' });
  }
});

/**
 * GET /api/fornecedores/:id
 * Busca um fornecedor por ID
 */
router.get('/:id', async (req, res) => {
  try {
    const fornecedor = await Fornecedor.findById(req.params.id);
    if (!fornecedor) {
      return res.status(404).json({ error: 'Fornecedor não encontrado' });
    }
    res.json(fornecedor);
  } catch (error) {
    console.error('Erro ao buscar fornecedor:', error);
    res.status(500).json({ error: 'Erro ao buscar fornecedor' });
  }
});

/**
 * POST /api/fornecedores
 * Cria um novo fornecedor
 */
router.post('/', async (req, res) => {
  try {
    const fornecedor = new Fornecedor(req.body);
    await fornecedor.save();
    res.status(201).json(fornecedor);
  } catch (error) {
    console.error('Erro ao criar fornecedor:', error);
    res.status(400).json({ error: 'Erro ao criar fornecedor' });
  }
});

/**
 * PUT /api/fornecedores/:id
 * Atualiza um fornecedor
 */
router.put('/:id', async (req, res) => {
  try {
    const fornecedor = await Fornecedor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!fornecedor) {
      return res.status(404).json({ error: 'Fornecedor não encontrado' });
    }
    
    res.json(fornecedor);
  } catch (error) {
    console.error('Erro ao atualizar fornecedor:', error);
    res.status(400).json({ error: 'Erro ao atualizar fornecedor' });
  }
});

/**
 * DELETE /api/fornecedores/:id
 * Remove um fornecedor
 */
router.delete('/:id', async (req, res) => {
  try {
    const fornecedor = await Fornecedor.findByIdAndDelete(req.params.id);
    
    if (!fornecedor) {
      return res.status(404).json({ error: 'Fornecedor não encontrado' });
    }
    
    res.json({ message: 'Fornecedor removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover fornecedor:', error);
    res.status(500).json({ error: 'Erro ao remover fornecedor' });
  }
});

export default router;
