import { Request, Response } from 'express';
import Vendedor from '../models/Vendedor';

export const getAllVendedores = async (req: Request, res: Response) => {
  try {
    const vendedores = await Vendedor.find().sort({ nome: 1 });
    res.json(vendedores);
  } catch (error) {
    console.error('Erro ao buscar vendedores:', error);
    res.status(500).json({ error: 'Erro ao buscar vendedores' });
  }
};

export const getVendedorById = async (req: Request, res: Response) => {
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
};

export const createVendedor = async (req: Request, res: Response) => {
  try {
    const vendedor = new Vendedor(req.body);
    await vendedor.save();
    res.status(201).json(vendedor);
  } catch (error) {
    console.error('Erro ao criar vendedor:', error);
    res.status(400).json({ error: 'Erro ao criar vendedor' });
  }
};

export const updateVendedor = async (req: Request, res: Response) => {
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
};

export const deleteVendedor = async (req: Request, res: Response) => {
  try {
    const vendedor = await Vendedor.findByIdAndDelete(req.params.id);
    if (!vendedor) {
      return res.status(404).json({ error: 'Vendedor não encontrado' });
    }
    res.json({ message: 'Vendedor removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover vendedor:', error);
    res.status(500).json({ error: 'Erro ao remover vendedor' });
  }
};
