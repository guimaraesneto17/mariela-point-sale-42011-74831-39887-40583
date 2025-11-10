import { Request, Response } from 'express';
import CategoriaFinanceira from '../models/CategoriaFinanceira';

export const getAllCategorias = async (req: Request, res: Response) => {
  try {
    const { tipo } = req.query;
    const filter: any = { ativo: true };
    
    if (tipo && (tipo === 'pagar' || tipo === 'receber')) {
      filter.$or = [{ tipo }, { tipo: 'ambos' }];
    }
    
    const categorias = await CategoriaFinanceira.find(filter)
      .populate('categoriaPai')
      .sort({ ordem: 1, nome: 1 });
    
    res.json(categorias);
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({ error: 'Erro ao buscar categorias' });
  }
};

export const getCategoriaById = async (req: Request, res: Response) => {
  try {
    const categoria = await CategoriaFinanceira.findById(req.params.id)
      .populate('categoriaPai');
    
    if (!categoria) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }
    
    res.json(categoria);
  } catch (error) {
    console.error('Erro ao buscar categoria:', error);
    res.status(500).json({ error: 'Erro ao buscar categoria' });
  }
};

export const createCategoria = async (req: Request, res: Response) => {
  try {
    const categoria = new CategoriaFinanceira(req.body);
    await categoria.save();
    res.status(201).json(categoria);
  } catch (error: any) {
    console.error('Erro ao criar categoria:', error);
    res.status(400).json({ error: 'Erro ao criar categoria' });
  }
};

export const updateCategoria = async (req: Request, res: Response) => {
  try {
    const categoria = await CategoriaFinanceira.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!categoria) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }
    
    res.json(categoria);
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    res.status(400).json({ error: 'Erro ao atualizar categoria' });
  }
};

export const deleteCategoria = async (req: Request, res: Response) => {
  try {
    // Soft delete - apenas marca como inativa
    const categoria = await CategoriaFinanceira.findByIdAndUpdate(
      req.params.id,
      { ativo: false },
      { new: true }
    );
    
    if (!categoria) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }
    
    res.json({ message: 'Categoria desativada com sucesso', categoria });
  } catch (error) {
    console.error('Erro ao desativar categoria:', error);
    res.status(500).json({ error: 'Erro ao desativar categoria' });
  }
};

export const reorderCategorias = async (req: Request, res: Response) => {
  try {
    const { categorias } = req.body; // Array de { id, ordem }
    
    const updates = categorias.map((cat: any) => 
      CategoriaFinanceira.findByIdAndUpdate(cat.id, { ordem: cat.ordem })
    );
    
    await Promise.all(updates);
    res.json({ message: 'Ordem atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao reordenar categorias:', error);
    res.status(500).json({ error: 'Erro ao reordenar categorias' });
  }
};
