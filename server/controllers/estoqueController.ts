import { Request, Response } from 'express';
import Estoque from '../models/Estoque';

// Helper para formatar erros de validação do Mongoose
const formatValidationError = (error: any) => {
  if (error.name === 'ValidationError') {
    const errors = Object.keys(error.errors).map(key => ({
      field: key,
      message: error.errors[key].message,
      value: error.errors[key].value
    }));
    return {
      error: 'Erro de validação',
      message: 'Um ou mais campos estão inválidos',
      fields: errors
    };
  }
  
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return {
      error: 'Erro de duplicação',
      message: `O campo ${field} já existe no sistema`,
      fields: [{ field, message: 'Valor duplicado', value: error.keyValue[field] }]
    };
  }
  
  return {
    error: 'Erro ao processar requisição',
    message: error.message || 'Erro desconhecido'
  };
};

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
    res.status(400).json(formatValidationError(error));
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
    res.status(400).json(formatValidationError(error));
  }
};

export const registrarEntrada = async (req: Request, res: Response) => {
  try {
    const { codigoProduto, tamanho, quantidade, fornecedor, valorUnitario, observacao } = req.body;
    
    // Validação de campos obrigatórios
    if (!codigoProduto || !quantidade) {
      return res.status(400).json({
        error: 'Erro de validação',
        message: 'Campos obrigatórios não preenchidos',
        fields: [
          ...(!codigoProduto ? [{ field: 'codigoProduto', message: 'Código do produto é obrigatório' }] : []),
          ...(!quantidade ? [{ field: 'quantidade', message: 'Quantidade é obrigatória' }] : [])
        ]
      });
    }
    
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
    res.status(400).json(formatValidationError(error));
  }
};

export const registrarSaida = async (req: Request, res: Response) => {
  try {
    const { codigoProduto, tamanho, quantidade, motivo, observacao } = req.body;
    
    // Validação de campos obrigatórios
    if (!codigoProduto || !quantidade) {
      return res.status(400).json({
        error: 'Erro de validação',
        message: 'Campos obrigatórios não preenchidos',
        fields: [
          ...(!codigoProduto ? [{ field: 'codigoProduto', message: 'Código do produto é obrigatório' }] : []),
          ...(!quantidade ? [{ field: 'quantidade', message: 'Quantidade é obrigatória' }] : [])
        ]
      });
    }
    
    const estoque = await Estoque.findOne({ codigoProduto });
    if (!estoque) {
      return res.status(404).json({ error: 'Item de estoque não encontrado' });
    }

    if (estoque.quantidadeDisponivel < quantidade) {
      return res.status(400).json({
        error: 'Erro de validação',
        message: 'Quantidade insuficiente em estoque',
        fields: [{
          field: 'quantidade',
          message: `Quantidade disponível: ${estoque.quantidadeDisponivel}`,
          value: quantidade
        }]
      });
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
    res.status(400).json(formatValidationError(error));
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
    res.status(400).json(formatValidationError(error));
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
