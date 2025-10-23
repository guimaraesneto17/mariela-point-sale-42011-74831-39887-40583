import { Request, Response } from 'express';
import VitrineVirtual from '../models/VitrineVirtual';

export const getAllVitrineVirtual = async (req: Request, res: Response) => {
  try {
    const produtos = await VitrineVirtual.find().sort({ dataCadastro: -1 });
    res.json(produtos);
  } catch (error) {
    console.error('Erro ao buscar vitrine virtual:', error);
    res.status(500).json({ error: 'Erro ao buscar vitrine virtual' });
  }
};

export const getVitrineVirtualById = async (req: Request, res: Response) => {
  try {
    const produto = await VitrineVirtual.findById(req.params.id);
    if (!produto) {
      return res.status(404).json({ error: 'Produto da vitrine não encontrado' });
    }
    res.json(produto);
  } catch (error) {
    console.error('Erro ao buscar produto da vitrine:', error);
    res.status(500).json({ error: 'Erro ao buscar produto da vitrine' });
  }
};

export const getNovidades = async (req: Request, res: Response) => {
  try {
    const novidades = await VitrineVirtual.find({ isNovidade: true }).sort({ dataCadastro: -1 });
    res.json(novidades);
  } catch (error) {
    console.error('Erro ao buscar novidades:', error);
    res.status(500).json({ error: 'Erro ao buscar novidades' });
  }
};

export const getPromocoes = async (req: Request, res: Response) => {
  try {
    const promocoes = await VitrineVirtual.find({ emPromocao: true }).sort({ dataCadastro: -1 });
    res.json(promocoes);
  } catch (error) {
    console.error('Erro ao buscar promoções:', error);
    res.status(500).json({ error: 'Erro ao buscar promoções' });
  }
};

export const getVitrineVirtualByCodigo = async (req: Request, res: Response) => {
  try {
    const produto = await VitrineVirtual.findOne({ codigoProduto: req.params.codigo });
    if (!produto) {
      return res.status(404).json({ error: 'Produto da vitrine não encontrado' });
    }
    res.json(produto);
  } catch (error) {
    console.error('Erro ao buscar produto da vitrine:', error);
    res.status(500).json({ error: 'Erro ao buscar produto da vitrine' });
  }
};

export const createVitrineVirtual = async (req: Request, res: Response) => {
  try {
    const produto = new VitrineVirtual(req.body);
    await produto.save();
    res.status(201).json(produto);
  } catch (error) {
    console.error('Erro ao criar produto na vitrine:', error);
    res.status(400).json({ error: 'Erro ao criar produto na vitrine' });
  }
};

export const updateVitrineVirtual = async (req: Request, res: Response) => {
  try {
    const produto = await VitrineVirtual.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!produto) {
      return res.status(404).json({ error: 'Produto da vitrine não encontrado' });
    }
    res.json(produto);
  } catch (error) {
    console.error('Erro ao atualizar produto na vitrine:', error);
    res.status(400).json({ error: 'Erro ao atualizar produto na vitrine' });
  }
};

export const deleteVitrineVirtual = async (req: Request, res: Response) => {
  try {
    const produto = await VitrineVirtual.findByIdAndDelete(req.params.id);
    if (!produto) {
      return res.status(404).json({ error: 'Produto da vitrine não encontrado' });
    }
    res.json({ message: 'Produto da vitrine removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover produto da vitrine:', error);
    res.status(500).json({ error: 'Erro ao remover produto da vitrine' });
  }
};
