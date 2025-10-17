import express from 'express';
import Venda from '../models/Venda';
import Estoque from '../models/Estoque';

const router = express.Router();

/**
 * @swagger
 * /api/vendas:
 *   get:
 *     summary: Lista todas as vendas
 *     tags: [Vendas]
 *     responses:
 *       200:
 *         description: Lista de vendas retornada com sucesso
 *       500:
 *         description: Erro ao buscar vendas
 */
router.get('/', async (req, res) => {
  try {
    const vendas = await Venda.find().sort({ data: -1 });
    res.json(vendas);
  } catch (error) {
    console.error('Erro ao buscar vendas:', error);
    res.status(500).json({ error: 'Erro ao buscar vendas' });
  }
});

/**
 * GET /api/vendas/:id
 * Busca uma venda por ID
 */
router.get('/:id', async (req, res) => {
  try {
    const venda = await Venda.findById(req.params.id);
    if (!venda) {
      return res.status(404).json({ error: 'Venda não encontrada' });
    }
    res.json(venda);
  } catch (error) {
    console.error('Erro ao buscar venda:', error);
    res.status(500).json({ error: 'Erro ao buscar venda' });
  }
});

/**
 * @swagger
 * /api/vendas:
 *   post:
 *     summary: Cria uma nova venda e atualiza o estoque automaticamente
 *     tags: [Vendas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Venda'
 *     responses:
 *       201:
 *         description: Venda criada e estoque atualizado com sucesso
 *       400:
 *         description: Erro ao criar venda ou estoque insuficiente
 */
router.post('/', async (req, res) => {
  try {
    // Validar estoque disponível para todos os itens
    for (const item of req.body.itens) {
      const estoque = await Estoque.findOne({ codigoProduto: item.codigoProduto });
      
      if (!estoque) {
        return res.status(400).json({ 
          error: `Produto ${item.codigoProduto} não encontrado no estoque` 
        });
      }
      
      if (estoque.quantidadeDisponivel < item.quantidade) {
        return res.status(400).json({ 
          error: `Estoque insuficiente para o produto ${item.nomeProduto}. Disponível: ${estoque.quantidadeDisponivel}` 
        });
      }
    }

    // Criar a venda
    const venda = new Venda(req.body);
    await venda.save();

    // Atualizar o estoque e registrar movimentação
    for (const item of req.body.itens) {
      const estoque = await Estoque.findOne({ codigoProduto: item.codigoProduto });
      
      if (estoque) {
        estoque.quantidadeDisponivel -= item.quantidade;
        estoque.logMovimentacao.push({
          tipo: 'saida',
          quantidade: item.quantidade,
          data: new Date(),
          codigoVenda: venda.codigoVenda,
          observacao: `Venda ${venda.codigoVenda}`
        });
        
        await estoque.save();
      }
    }

    res.status(201).json(venda);
  } catch (error) {
    console.error('Erro ao criar venda:', error);
    res.status(400).json({ error: 'Erro ao criar venda' });
  }
});

/**
 * DELETE /api/vendas/:id
 * Cancela uma venda e devolve os itens ao estoque
 */
router.delete('/:id', async (req, res) => {
  try {
    const venda = await Venda.findById(req.params.id);
    
    if (!venda) {
      return res.status(404).json({ error: 'Venda não encontrada' });
    }

    // Devolver itens ao estoque
    for (const item of venda.itens) {
      const estoque = await Estoque.findOne({ codigoProduto: item.codigoProduto });
      
      if (estoque) {
        estoque.quantidadeDisponivel += item.quantidade;
        estoque.logMovimentacao.push({
          tipo: 'entrada',
          quantidade: item.quantidade,
          data: new Date(),
          observacao: `Cancelamento da venda ${venda.codigoVenda}`
        });
        
        await estoque.save();
      }
    }

    await Venda.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Venda cancelada com sucesso' });
  } catch (error) {
    console.error('Erro ao cancelar venda:', error);
    res.status(500).json({ error: 'Erro ao cancelar venda' });
  }
});

export default router;
