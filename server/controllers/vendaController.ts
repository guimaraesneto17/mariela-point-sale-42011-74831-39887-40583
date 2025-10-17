import { Request, Response } from 'express';
import Venda from '../models/Venda';

export const getAllVendas = async (req: Request, res: Response) => {
  try {
    const vendas = await Venda.find().sort({ dataVenda: -1 });
    res.json(vendas);
  } catch (error) {
    console.error('Erro ao buscar vendas:', error);
    res.status(500).json({ error: 'Erro ao buscar vendas' });
  }
};

export const getVendaById = async (req: Request, res: Response) => {
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
};

export const createVenda = async (req: Request, res: Response) => {
  try {
    const venda = new Venda(req.body);
    await venda.save();
    res.status(201).json(venda);
  } catch (error) {
    console.error('Erro ao criar venda:', error);
    res.status(400).json({ error: 'Erro ao criar venda' });
  }
};

export const updateVenda = async (req: Request, res: Response) => {
  try {
    const venda = await Venda.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!venda) {
      return res.status(404).json({ error: 'Venda não encontrada' });
    }
    res.json(venda);
  } catch (error) {
    console.error('Erro ao atualizar venda:', error);
    res.status(400).json({ error: 'Erro ao atualizar venda' });
  }
};

export const deleteVenda = async (req: Request, res: Response) => {
  try {
    const venda = await Venda.findByIdAndDelete(req.params.id);
    if (!venda) {
      return res.status(404).json({ error: 'Venda não encontrada' });
    }
    res.json({ message: 'Venda removida com sucesso' });
  } catch (error) {
    console.error('Erro ao remover venda:', error);
    res.status(500).json({ error: 'Erro ao remover venda' });
  }
};
