import { Request, Response } from 'express';
import Produto from '../models/Produto';
import Estoque from '../models/Estoque';

export const getAllProdutos = async (req: Request, res: Response) => {
  try {
    const produtos = await Produto.find().sort({ dataCadastro: -1 });
    res.json(produtos);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
};

export const getProdutoById = async (req: Request, res: Response) => {
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
    res.status(400).json({ error: 'Erro ao criar produto' });
  }
};

export const updateProduto = async (req: Request, res: Response) => {
  try {
    const { precoCusto, precoVenda, margemDeLucro, ...produtoData } = req.body;
    
    const produto = await Produto.findByIdAndUpdate(
      req.params.id,
      produtoData,
      { new: true, runValidators: true }
    );
    
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    // Atualizar também os preços no estoque
    if (precoCusto !== undefined || precoVenda !== undefined || margemDeLucro !== undefined) {
      await Estoque.updateMany(
        { codigoProduto: produto.codigoProduto },
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
    res.status(400).json({ error: 'Erro ao atualizar produto' });
  }
};

export const deleteProduto = async (req: Request, res: Response) => {
  try {
    const produto = await Produto.findById(req.params.id);
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    // Remover também o registro de estoque
    await Estoque.findOneAndDelete({ codigoProduto: produto.codigoProduto });
    await Produto.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Produto removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover produto:', error);
    res.status(500).json({ error: 'Erro ao remover produto' });
  }
};
