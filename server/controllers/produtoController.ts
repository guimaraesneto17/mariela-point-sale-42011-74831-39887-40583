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
    const produto = new Produto(req.body);
    await produto.save();

    // Criar registro de estoque para o produto com quantidade inicial de 1
    const estoque = new Estoque({
      codigoProduto: produto.codigoProduto,
      quantidade: 1,
      quantidadeDisponivel: 1,
      tamanho: 'U',
      emPromocao: false,
      isNovidade: false
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
