import { Request, Response } from 'express';
import Produto from '../models/Produto';
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

export const getAllProdutos = async (req: Request, res: Response) => {
  try {
    const produtos = await Produto.find().sort({ dataCadastro: -1 });
    res.json(produtos);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
};

export const getProdutoByCodigo = async (req: Request, res: Response) => {
  try {
    const produto = await Produto.findOne({ codigo: req.params.codigo });
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    res.json(produto);
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({ error: 'Erro ao buscar produto' });
  }
};

export const createProduto = async (req: Request, res: Response) => {
  try {
    const { precoCusto, precoVenda, margemDeLucro, tamanho = 'U', ...produtoData } = req.body;
    
    // Criar produto sem campos de preço
    const produto = new Produto({
      ...produtoData,
      ativo: true
    });
    await produto.save();

    // Criar registro de estoque com os dados de preço
    const estoque = new Estoque({
      codigoProduto: produto.codigoProduto,
      quantidade: 1,
      tamanho: tamanho,
      precoCusto: precoCusto,
      precoVenda: precoVenda,
      margemDeLucro: margemDeLucro,
      emPromocao: false,
      isNovidade: false,
      logMovimentacao: [{
        tipo: 'entrada',
        quantidade: 1,
        data: new Date(),
        origem: 'entrada',
        observacao: 'Cadastro inicial do produto'
      }]
    });
    await estoque.save();

    res.status(201).json(produto);
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(400).json(formatValidationError(error));
  }
};

export const updateProduto = async (req: Request, res: Response) => {
  try {
    const { precoCusto, precoVenda, margemDeLucro, ...produtoData } = req.body;
    
    const produto = await Produto.findOneAndUpdate(
      { codigo: req.params.codigo },
      produtoData,
      { new: true, runValidators: true }
    );
    
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    // Atualizar também os preços no estoque
    if (precoCusto !== undefined || precoVenda !== undefined || margemDeLucro !== undefined) {
      await Estoque.updateMany(
        { codigoProduto: produto.codigo },
        { 
          $set: {
            ...(precoCusto !== undefined && { precoCusto }),
            ...(precoVenda !== undefined && { precoVenda }),
            ...(margemDeLucro !== undefined && { margemDeLucro })
          }
        }
      );
    }
    
    res.json(produto);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(400).json(formatValidationError(error));
  }
};

export const deleteProduto = async (req: Request, res: Response) => {
  try {
    const produto = await Produto.findOne({ codigo: req.params.codigo });
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    // Remover também todos os registros de estoque
    await Estoque.deleteMany({ codigoProduto: produto.codigo });
    await Produto.findOneAndDelete({ codigo: req.params.codigo });
    
    res.json({ message: 'Produto removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover produto:', error);
    res.status(500).json({ error: 'Erro ao remover produto' });
  }
};
