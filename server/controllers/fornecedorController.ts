import { Request, Response } from 'express';
import Fornecedor from '../models/Fornecedor';
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
    console.log('Dados recebidos para criar fornecedor:', JSON.stringify(req.body, null, 2));
    
    // Limpa campos vazios
    const cleanData: any = {
      codigoFornecedor: req.body.codigoFornecedor,
      nome: req.body.nome,
      endereco: {
        cidade: req.body.endereco?.cidade,
        estado: req.body.endereco?.estado
      }
    };

    // Adiciona campos opcionais apenas se tiverem valor
    if (req.body.cnpj && req.body.cnpj.trim() !== '') {
      cleanData.cnpj = req.body.cnpj.trim();
    }
    if (req.body.telefone && req.body.telefone.trim() !== '') {
      cleanData.telefone = req.body.telefone.trim();
    }
    if (req.body.instagram && req.body.instagram.trim() !== '') {
      cleanData.instagram = req.body.instagram.trim();
    }
    if (req.body.observacao && req.body.observacao.trim() !== '') {
      cleanData.observacao = req.body.observacao.trim();
    }
    
    // Adiciona campos opcionais do endereço
    if (req.body.endereco?.rua && req.body.endereco.rua.trim() !== '') {
      cleanData.endereco.rua = req.body.endereco.rua.trim();
    }
    if (req.body.endereco?.numero && req.body.endereco.numero.trim() !== '') {
      cleanData.endereco.numero = req.body.endereco.numero.trim();
    }
    if (req.body.endereco?.bairro && req.body.endereco.bairro.trim() !== '') {
      cleanData.endereco.bairro = req.body.endereco.bairro.trim();
    }
    if (req.body.endereco?.cep && req.body.endereco.cep.trim() !== '') {
      cleanData.endereco.cep = req.body.endereco.cep.trim();
    }

    console.log('Dados limpos para salvar:', JSON.stringify(cleanData, null, 2));

    const fornecedor = new Fornecedor(cleanData);
    await fornecedor.save();
    res.status(201).json(fornecedor);
  } catch (error: any) {
    console.error('Erro completo ao criar fornecedor:', JSON.stringify({
      name: error.name,
      message: error.message,
      code: error.code,
      errors: error.errors,
      stack: error.stack
    }, null, 2));
    
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

export const updateFornecedor = async (req: Request, res: Response) => {
  try {
    // Limpa campos vazios - mantém mesma lógica do create
    const cleanData: any = {
      nome: req.body.nome,
      endereco: {
        cidade: req.body.endereco?.cidade,
        estado: req.body.endereco?.estado
      }
    };

    // Adiciona campos opcionais apenas se tiverem valor
    if (req.body.cnpj && req.body.cnpj.trim() !== '') {
      cleanData.cnpj = req.body.cnpj.trim();
    }
    if (req.body.telefone && req.body.telefone.trim() !== '') {
      cleanData.telefone = req.body.telefone.trim();
    }
    if (req.body.instagram && req.body.instagram.trim() !== '') {
      cleanData.instagram = req.body.instagram.trim();
    }
    if (req.body.observacao && req.body.observacao.trim() !== '') {
      cleanData.observacao = req.body.observacao.trim();
    }
    
    // Adiciona campos opcionais do endereço
    if (req.body.endereco?.rua && req.body.endereco.rua.trim() !== '') {
      cleanData.endereco.rua = req.body.endereco.rua.trim();
    }
    if (req.body.endereco?.numero && req.body.endereco.numero.trim() !== '') {
      cleanData.endereco.numero = req.body.endereco.numero.trim();
    }
    if (req.body.endereco?.bairro && req.body.endereco.bairro.trim() !== '') {
      cleanData.endereco.bairro = req.body.endereco.bairro.trim();
    }
    if (req.body.endereco?.cep && req.body.endereco.cep.trim() !== '') {
      cleanData.endereco.cep = req.body.endereco.cep.trim();
    }
    
    const fornecedor = await Fornecedor.findOneAndUpdate(
      { codigoFornecedor: req.params.codigo },
      cleanData,
      { new: true, runValidators: true }
    );
    
    if (!fornecedor) {
      return res.status(404).json({ error: 'Fornecedor não encontrado' });
    }
    res.json(fornecedor);
  } catch (error: any) {
    console.error('Erro ao atualizar fornecedor:', error);
    
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
