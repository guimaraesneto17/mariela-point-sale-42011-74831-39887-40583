import { Request, Response } from 'express';
import Fornecedor from '../models/Fornecedor';

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

export const getAllFornecedores = async (req: Request, res: Response) => {
  try {
    const fornecedores = await Fornecedor.find().sort({ dataCadastro: -1 });
    res.json(fornecedores);
  } catch (error) {
    console.error('Erro ao buscar fornecedores:', error);
    res.status(500).json({ error: 'Erro ao buscar fornecedores' });
  }
};

export const getFornecedorByCodigo = async (req: Request, res: Response) => {
  try {
    const fornecedor = await Fornecedor.findOne({ codigoFornecedor: req.params.codigo });
    if (!fornecedor) {
      return res.status(404).json({ error: 'Fornecedor não encontrado' });
    }
    res.json(fornecedor);
  } catch (error) {
    console.error('Erro ao buscar fornecedor:', error);
    res.status(500).json({ error: 'Erro ao buscar fornecedor' });
  }
};

export const createFornecedor = async (req: Request, res: Response) => {
  try {
    const fornecedor = new Fornecedor(req.body);
    await fornecedor.save();
    res.status(201).json(fornecedor);
  } catch (error) {
    console.error('Erro ao criar fornecedor:', error);
    res.status(400).json(formatValidationError(error));
  }
};

export const updateFornecedor = async (req: Request, res: Response) => {
  try {
    const fornecedor = await Fornecedor.findOneAndUpdate(
      { codigoFornecedor: req.params.codigo },
      req.body,
      { new: true, runValidators: true }
    );
    if (!fornecedor) {
      return res.status(404).json({ error: 'Fornecedor não encontrado' });
    }
    res.json(fornecedor);
  } catch (error) {
    console.error('Erro ao atualizar fornecedor:', error);
    res.status(400).json(formatValidationError(error));
  }
};

export const deleteFornecedor = async (req: Request, res: Response) => {
  try {
    const fornecedor = await Fornecedor.findOneAndDelete({ codigoFornecedor: req.params.codigo });
    if (!fornecedor) {
      return res.status(404).json({ error: 'Fornecedor não encontrado' });
    }
    res.json({ message: 'Fornecedor removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover fornecedor:', error);
    res.status(500).json({ error: 'Erro ao remover fornecedor' });
  }
};
