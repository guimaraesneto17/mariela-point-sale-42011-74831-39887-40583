import { Request, Response } from 'express';
import Venda from '../models/Venda';
import Estoque from '../models/Estoque';
import Validations from '../utils/validations';

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

export const getAllVendas = async (req: Request, res: Response) => {
  try {
    const vendas = await Venda.find().sort({ dataVenda: -1 });
    res.json(vendas);
  } catch (error) {
    console.error('Erro ao buscar vendas:', error);
    res.status(500).json({ error: 'Erro ao buscar vendas' });
  }
};

export const getVendaByCodigo = async (req: Request, res: Response) => {
  try {
    const venda = await Venda.findOne({ codigoVenda: req.params.codigo });
    if (!venda) {
      return res.status(404).json({ error: 'Venda não encontrada' });
    }
    res.json(venda);
  } catch (error) {
    console.error('Erro ao buscar venda:', error);
    res.status(500).json({ error: 'Erro ao buscar venda' });
  }
};

export const createVenda = async (req: Request, res: Response) => {
  try {
    // Validar dados antes de criar
    const erros = Validations.venda(req.body);
    if (erros.length > 0) {
      return res.status(400).json({
        error: 'Erro de validação',
        message: 'Um ou mais campos estão inválidos',
        fields: erros.map(erro => ({ message: erro }))
      });
    }

    const venda = new Venda(req.body);
    
    // Processar baixa no estoque para cada item da venda
    for (const item of venda.itens) {
      try {
        const estoque = await Estoque.findOne({ codigoProduto: item.codigoProduto });
        
        if (estoque) {
          // Verificar se há quantidade suficiente
          if (estoque.quantidade < item.quantidade) {
            return res.status(400).json({
              error: 'Quantidade insuficiente no estoque',
              message: `Produto ${item.nomeProduto} possui apenas ${estoque.quantidade} unidades disponíveis`,
              produto: item.codigoProduto
            });
          }
          
          // Dar baixa no estoque
          estoque.quantidade -= item.quantidade;
          
          // Registrar movimentação
          estoque.logMovimentacao.push({
            tipo: 'saida',
            quantidade: item.quantidade,
            data: new Date(),
            origem: 'venda',
            codigoVenda: venda.codigoVenda
          } as any);
          
          await estoque.save();
        }
      } catch (estoqueError) {
        console.error(`Erro ao processar estoque do produto ${item.codigoProduto}:`, estoqueError);
        // Continua processando os outros itens mesmo se houver erro
      }
    }
    
    await venda.save();
    res.status(201).json(venda);
  } catch (error) {
    console.error('Erro ao criar venda:', error);
    res.status(400).json(formatValidationError(error));
  }
};

export const updateVenda = async (req: Request, res: Response) => {
  try {
    // Validar dados antes de atualizar
    const erros = Validations.venda(req.body);
    if (erros.length > 0) {
      return res.status(400).json({
        error: 'Erro de validação',
        message: 'Um ou mais campos estão inválidos',
        fields: erros.map(erro => ({ message: erro }))
      });
    }

    const venda = await Venda.findOneAndUpdate(
      { codigoVenda: req.params.codigo },
      req.body,
      { new: true, runValidators: true }
    );
    if (!venda) {
      return res.status(404).json({ error: 'Venda não encontrada' });
    }
    res.json(venda);
  } catch (error) {
    console.error('Erro ao atualizar venda:', error);
    res.status(400).json(formatValidationError(error));
  }
};

export const deleteVenda = async (req: Request, res: Response) => {
  try {
    const venda = await Venda.findOneAndDelete({ codigoVenda: req.params.codigo });
    if (!venda) {
      return res.status(404).json({ error: 'Venda não encontrada' });
    }
    res.json({ message: 'Venda removida com sucesso' });
  } catch (error) {
    console.error('Erro ao remover venda:', error);
    res.status(500).json({ error: 'Erro ao remover venda' });
  }
};
