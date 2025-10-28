import { Request, Response } from 'express';
import Vendedor from '../models/Vendedor';
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

export const getAllVendedores = async (req: Request, res: Response) => {
  try {
    const vendedores = await Vendedor.find().sort({ nome: 1 });
    res.json(vendedores);
  } catch (error) {
    console.error('Erro ao buscar vendedores:', error);
    res.status(500).json({ error: 'Erro ao buscar vendedores' });
  }
};

export const getVendedorByCodigo = async (req: Request, res: Response) => {
  try {
    const vendedor = await Vendedor.findOne({ codigoVendedor: req.params.codigo });
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
    console.log('Dados recebidos para criar vendedor:', JSON.stringify(req.body, null, 2));
    
    // Limpa campos vazios (converte "" para undefined para não salvar no MongoDB)
    const cleanData: any = {
      codigoVendedor: req.body.codigoVendedor,
      nome: req.body.nome,
      dataCadastro: new Date().toISOString(),
      ativo: req.body.ativo !== undefined ? req.body.ativo : true,
      vendasRealizadas: req.body.vendasRealizadas || 0
    };

    // Adiciona campos opcionais apenas se tiverem valor
    if (req.body.telefone && req.body.telefone.trim() !== '') {
      cleanData.telefone = req.body.telefone.trim();
    }
    if (req.body.dataNascimento && req.body.dataNascimento.trim() !== '') {
      cleanData.dataNascimento = req.body.dataNascimento.trim();
    }
    if (req.body.metaMensal !== undefined && req.body.metaMensal !== null) {
      cleanData.metaMensal = req.body.metaMensal;
    }
    if (req.body.observacao && req.body.observacao.trim() !== '') {
      cleanData.observacao = req.body.observacao.trim();
    }

    console.log('Dados limpos para salvar:', JSON.stringify(cleanData, null, 2));

    const vendedor = new Vendedor(cleanData);
    await vendedor.save();
    res.status(201).json(vendedor);
  } catch (error: any) {
    console.error('Erro completo ao criar vendedor:', JSON.stringify({
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

export const updateVendedor = async (req: Request, res: Response) => {
  try {
    // Limpa campos vazios
    const cleanData: any = {
      dataAtualizacao: new Date().toISOString()
    };

    if (req.body.nome && req.body.nome.trim() !== '') {
      cleanData.nome = req.body.nome.trim();
    }
    if (req.body.telefone && req.body.telefone.trim() !== '') {
      cleanData.telefone = req.body.telefone.trim();
    }
    if (req.body.dataNascimento && req.body.dataNascimento.trim() !== '') {
      cleanData.dataNascimento = req.body.dataNascimento.trim();
    }
    if (req.body.ativo !== undefined) {
      cleanData.ativo = req.body.ativo;
    }
    if (req.body.metaMensal !== undefined && req.body.metaMensal !== null) {
      cleanData.metaMensal = req.body.metaMensal;
    }
    if (req.body.vendasRealizadas !== undefined && req.body.vendasRealizadas !== null) {
      cleanData.vendasRealizadas = req.body.vendasRealizadas;
    }
    if (req.body.observacao && req.body.observacao.trim() !== '') {
      cleanData.observacao = req.body.observacao.trim();
    }
    
    const vendedor = await Vendedor.findOneAndUpdate(
      { codigoVendedor: req.params.codigo },
      cleanData,
      { new: true, runValidators: true }
    );
    if (!vendedor) {
      return res.status(404).json({ error: 'Vendedor não encontrado' });
    }
    res.json(vendedor);
  } catch (error: any) {
    console.error('Erro ao atualizar vendedor:', error);
    
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

export const deleteVendedor = async (req: Request, res: Response) => {
  try {
    const vendedor = await Vendedor.findOneAndDelete({ codigoVendedor: req.params.codigo });
    if (!vendedor) {
      return res.status(404).json({ error: 'Vendedor não encontrado' });
    }
    res.json({ message: 'Vendedor removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover vendedor:', error);
    res.status(500).json({ error: 'Erro ao remover vendedor' });
  }
};
