import express from 'express';
import Vendedor from '../models/Vendedor';

const router = express.Router();

// GET /api/vendedores - Lista todos os vendedores
router.get('/', async (req, res) => {
  try {
    const vendedores = await Vendedor.find().sort({ nome: 1 });
    res.json(vendedores);
  } catch (error) {
    console.error('Erro ao buscar vendedores:', error);
    res.status(500).json({ error: 'Erro ao buscar vendedores' });
  }
});

// GET /api/vendedores/:id - Busca um vendedor por ID
router.get('/:id', async (req, res) => {
  try {
    const vendedor = await Vendedor.findById(req.params.id);
    if (!vendedor) {
      return res.status(404).json({ error: 'Vendedor não encontrado' });
    }
    res.json(vendedor);
  } catch (error) {
    console.error('Erro ao buscar vendedor:', error);
    res.status(500).json({ error: 'Erro ao buscar vendedor' });
  }
});

// POST /api/vendedores - Cria um novo vendedor
router.post('/', async (req, res) => {
  try {
    const vendedor = new Vendedor(req.body);
    await vendedor.save();
    res.status(201).json(vendedor);
  } catch (error) {
    console.error('Erro ao criar vendedor:', error);
    res.status(400).json({ error: 'Erro ao criar vendedor' });
  }
});

// PUT /api/vendedores/:id - Atualiza um vendedor
router.put('/:id', async (req, res) => {
  try {
    const vendedor = await Vendedor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!vendedor) {
      return res.status(404).json({ error: 'Vendedor não encontrado' });
    }
    res.json(vendedor);
  } catch (error) {
    console.error('Erro ao atualizar vendedor:', error);
    res.status(400).json({ error: 'Erro ao atualizar vendedor' });
  }
});

// DELETE /api/vendedores/:id - Deleta um vendedor
router.delete('/:id', async (req, res) => {
  try {
    const vendedor = await Vendedor.findByIdAndDelete(req.params.id);
    if (!vendedor) {
      return res.status(404).json({ error: 'Vendedor não encontrado' });
    }
    res.json({ message: 'Vendedor deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar vendedor:', error);
    res.status(500).json({ error: 'Erro ao deletar vendedor' });
  }
});

export default router;
