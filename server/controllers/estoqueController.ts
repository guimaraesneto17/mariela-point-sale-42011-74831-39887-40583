import { Request, Response } from 'express';
import Estoque from '../models/Estoque';

export const getAllEstoque = async (req: Request, res: Response) => {
  try {
    const estoque = await Estoque.find().sort({ codigoProduto: 1 });
    res.json(estoque);
  } catch (error) {
    console.error('Erro ao buscar estoque:', error);
    res.status(500).json({ error: 'Erro ao buscar estoque' });
  }
};

export const getEstoqueById = async (req: Request, res: Response) => {
  try {
    const estoque = await Estoque.findById(req.params.id);
    if (!estoque) {
      return res.status(404).json({ error: 'Item de estoque não encontrado' });
    }
    res.json(estoque);
  } catch (error) {
    console.error('Erro ao buscar item de estoque:', error);
    res.status(500).json({ error: 'Erro ao buscar item de estoque' });
  }
};

export const getEstoqueByCodigo = async (req: Request, res: Response) => {
  try {
    const estoque = await Estoque.findOne({ codigoProduto: req.params.codigo });
    if (!estoque) {
      return res.status(404).json({ error: 'Item de estoque não encontrado' });
    }
    res.json(estoque);
  } catch (error) {
    console.error('Erro ao buscar item de estoque:', error);
    res.status(500).json({ error: 'Erro ao buscar item de estoque' });
  }
};

export const createEstoque = async (req: Request, res: Response) => {
  try {
    const estoque = new Estoque(req.body);
    await estoque.save();
    res.status(201).json(estoque);
  } catch (error) {
    console.error('Erro ao criar item de estoque:', error);
    res.status(400).json({ error: 'Erro ao criar item de estoque' });
  }
};

export const updateEstoque = async (req: Request, res: Response) => {
  try {
    const estoque = await Estoque.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!estoque) {
      return res.status(404).json({ error: 'Item de estoque não encontrado' });
    }
    res.json(estoque);
  } catch (error) {
    console.error('Erro ao atualizar item de estoque:', error);
    res.status(400).json({ error: 'Erro ao atualizar item de estoque' });
  }
};

export const registrarEntrada = async (req: Request, res: Response) => {
  try {
    const { codigoProduto, tamanho, quantidade, fornecedor, valorUnitario, observacao } = req.body;
    
    const estoque = await Estoque.findOne({ codigoProduto });
    if (!estoque) {
      return res.status(404).json({ error: 'Item de estoque não encontrado' });
    }

    estoque.quantidadeDisponivel += quantidade;
    estoque.logMovimentacao.push({
      tipo: 'entrada',
      quantidade,
      dataMovimentacao: new Date(),
      responsavel: fornecedor || 'Sistema',
      observacao: observacao || `Entrada de ${quantidade} unidades - Tamanho: ${tamanho}`,
    });

    await estoque.save();
    res.json(estoque);
  } catch (error) {
    console.error('Erro ao registrar entrada:', error);
    res.status(400).json({ error: 'Erro ao registrar entrada' });
  }
};

export const registrarSaida = async (req: Request, res: Response) => {
  try {
    const { codigoProduto, tamanho, quantidade, motivo, observacao } = req.body;
    
    const estoque = await Estoque.findOne({ codigoProduto });
    if (!estoque) {
      return res.status(404).json({ error: 'Item de estoque não encontrado' });
    }

    if (estoque.quantidadeDisponivel < quantidade) {
      return res.status(400).json({ error: 'Quantidade insuficiente em estoque' });
    }

    estoque.quantidadeDisponivel -= quantidade;
    estoque.logMovimentacao.push({
      tipo: 'saida',
      quantidade,
      dataMovimentacao: new Date(),
      responsavel: 'Sistema',
      observacao: observacao || `Saída de ${quantidade} unidades - ${motivo} - Tamanho: ${tamanho}`,
    });

    await estoque.save();
    res.json(estoque);
  } catch (error) {
    console.error('Erro ao registrar saída:', error);
    res.status(400).json({ error: 'Erro ao registrar saída' });
  }
};

export const toggleNovidade = async (req: Request, res: Response) => {
  try {
    const { codigo } = req.params;
    const { isNovidade } = req.body;
    
    const estoque = await Estoque.findOne({ codigoProduto: codigo });
    if (!estoque) {
      return res.status(404).json({ error: 'Item de estoque não encontrado' });
    }

    estoque.isNovidade = isNovidade;
    await estoque.save();
    
    res.json(estoque);
  } catch (error) {
    console.error('Erro ao atualizar novidade:', error);
    res.status(400).json({ error: 'Erro ao atualizar novidade' });
  }
};

export const deleteEstoque = async (req: Request, res: Response) => {
  try {
    const estoque = await Estoque.findByIdAndDelete(req.params.id);
    if (!estoque) {
      return res.status(404).json({ error: 'Item de estoque não encontrado' });
    }
    res.json({ message: 'Item de estoque removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover item de estoque:', error);
    res.status(500).json({ error: 'Erro ao remover item de estoque' });
  }
};
