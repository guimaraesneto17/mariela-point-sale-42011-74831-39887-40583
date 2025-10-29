import { Request, Response } from 'express';
import Cliente from '../models/Cliente';
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
    console.log('Dados recebidos para criar cliente:', JSON.stringify(req.body, null, 2));
    
    // Limpa campos vazios (converte "" para undefined para não salvar no MongoDB)
    const cleanData: any = {
      codigoCliente: req.body.codigoCliente,
      nome: req.body.nome
    };

    // Adiciona campos opcionais apenas se tiverem valor
    if (req.body.telefone && req.body.telefone.trim() !== '') {
      cleanData.telefone = req.body.telefone.trim();
    }
    if (req.body.dataNascimento && req.body.dataNascimento.trim() !== '') {
      cleanData.dataNascimento = req.body.dataNascimento.trim();
    }
    if (req.body.observacao && req.body.observacao.trim() !== '') {
      cleanData.observacao = req.body.observacao.trim();
    }

    console.log('Dados limpos para salvar:', JSON.stringify(cleanData, null, 2));

    const cliente = new Cliente(cleanData);
    await cliente.save();
    res.status(201).json(cliente);
  } catch (error: any) {
    console.error('Erro completo ao criar cliente:', JSON.stringify({
      name: error.name,
      message: error.message,
      code: error.code,
      errors: error.errors,
      stack: error.stack
    }, null, 2));
    
    // Tratamento detalhado de erros de validação do MongoDB
    if (error.name === 'ValidationError') {
      const errors = Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message,
        value: error.errors[key].value,
        kind: error.errors[key].kind
      }));
      return res.status(400).json({
        error: 'Erro de validação',
        message: 'Um ou mais campos estão inválidos',
        fields: errors
      });
    }
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        error: 'Erro de duplicação',
        message: `O campo ${field} já existe no sistema`,
        fields: [{ field, message: 'Valor duplicado', value: error.keyValue[field] }]
      });
    }
    
    res.status(400).json({
      error: 'Erro ao processar requisição',
      message: error.message || 'Erro desconhecido',
      details: error.toString()
    });
  }
};

export const updateCliente = async (req: Request, res: Response) => {
  try {
    // Limpa campos vazios - mantém mesma lógica do create
    const cleanData: any = {
      nome: req.body.nome
    };

    // Adiciona campos opcionais apenas se tiverem valor
    if (req.body.telefone && req.body.telefone.trim() !== '') {
      cleanData.telefone = req.body.telefone.trim();
    }
    if (req.body.dataNascimento && req.body.dataNascimento.trim() !== '') {
      cleanData.dataNascimento = req.body.dataNascimento.trim();
    }
    if (req.body.observacao && req.body.observacao.trim() !== '') {
      cleanData.observacao = req.body.observacao.trim();
    }
    
    const cliente = await Cliente.findOneAndUpdate(
      { codigoCliente: req.params.codigo },
      cleanData,
      { new: true, runValidators: true }
    );
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    res.json(cliente);
  } catch (error: any) {
    console.error('Erro ao atualizar cliente:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message,
        value: error.errors[key].value,
        kind: error.errors[key].kind
      }));
      return res.status(400).json({
        error: 'Erro de validação',
        message: 'Um ou mais campos estão inválidos',
        fields: errors
      });
    }
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        error: 'Erro de duplicação',
        message: `O campo ${field} já existe no sistema`,
        fields: [{ field, message: 'Valor duplicado', value: error.keyValue[field] }]
      });
    }
    
    res.status(400).json({
      error: 'Erro ao processar requisição',
      message: error.message || 'Erro desconhecido',
      details: error.toString()
    });
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
