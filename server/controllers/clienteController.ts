import { Request, Response } from 'express';
import Cliente from '../models/Cliente';

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

export const getAllClientes = async (req: Request, res: Response) => {
  try {
    const clientes = await Cliente.find().sort({ dataCadastro: -1 });
    res.json(clientes);
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    res.status(500).json({ error: 'Erro ao buscar clientes' });
  }
};

export const getClienteByCodigo = async (req: Request, res: Response) => {
  try {
    const cliente = await Cliente.findOne({ codigoCliente: req.params.codigo });
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    res.json(cliente);
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    res.status(500).json({ error: 'Erro ao buscar cliente' });
  }
};

export const createCliente = async (req: Request, res: Response) => {
  try {
    const cliente = new Cliente(req.body);
    await cliente.save();
    res.status(201).json(cliente);
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    res.status(400).json(formatValidationError(error));
  }
};

export const updateCliente = async (req: Request, res: Response) => {
  try {
    const cliente = await Cliente.findOneAndUpdate(
      { codigoCliente: req.params.codigo },
      req.body,
      { new: true, runValidators: true }
    );
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    res.json(cliente);
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    res.status(400).json(formatValidationError(error));
  }
};

export const deleteCliente = async (req: Request, res: Response) => {
  try {
    const cliente = await Cliente.findOneAndDelete({ codigoCliente: req.params.codigo });
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    res.json({ message: 'Cliente removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover cliente:', error);
    res.status(500).json({ error: 'Erro ao remover cliente' });
  }
};
