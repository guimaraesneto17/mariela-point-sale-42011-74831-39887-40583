import { Request, Response } from 'express';
import Vendedor from '../models/Vendedor';
import User from '../models/User';
import Validations from '../utils/validations';
import bcrypt from 'bcryptjs';

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
    
    // Validar campos obrigatórios
    if (!req.body.email) {
      return res.status(400).json({
        error: 'Erro de validação',
        message: 'Email é obrigatório',
        fields: [{ field: 'email', message: 'Email é obrigatório' }]
      });
    }

    if (!req.body.senha) {
      return res.status(400).json({
        error: 'Erro de validação',
        message: 'Senha é obrigatória',
        fields: [{ field: 'senha', message: 'Senha é obrigatória' }]
      });
    }

    // Verificar se já existe um vendedor com o mesmo email
    const vendedorExistente = await Vendedor.findOne({ email: req.body.email });
    if (vendedorExistente) {
      return res.status(400).json({
        error: 'Erro de duplicação',
        message: 'Email já está em uso',
        fields: [{ field: 'email', message: 'Email já cadastrado' }]
      });
    }

    // Verificar se já existe um usuário com o mesmo email
    const userExistente = await User.findOne({ email: req.body.email });
    if (userExistente) {
      return res.status(400).json({
        error: 'Erro de duplicação',
        message: 'Email já está em uso no sistema',
        fields: [{ field: 'email', message: 'Email já cadastrado' }]
      });
    }
    
    // Limpa campos vazios (converte "" para undefined para não salvar no MongoDB)
    const cleanData: any = {
      codigoVendedor: req.body.codigoVendedor,
      nome: req.body.nome,
      email: req.body.email.toLowerCase().trim(),
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

    // Criar vendedor
    const vendedor = new Vendedor(cleanData);
    await vendedor.save();

    // Criar usuário vinculado com role "vendedor"
    const hashedPassword = await bcrypt.hash(req.body.senha, 10);
    const user = new User({
      email: req.body.email.toLowerCase().trim(),
      password: hashedPassword,
      nome: req.body.nome,
      role: 'vendedor',
      ativo: req.body.ativo !== undefined ? req.body.ativo : true,
      codigoVendedor: req.body.codigoVendedor
    });
    await user.save();

    console.log('Vendedor e usuário criados com sucesso');
    
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
    // Limpa campos vazios - mantém mesma lógica do create
    const cleanData: any = {
      nome: req.body.nome,
      ativo: req.body.ativo !== undefined ? req.body.ativo : true,
      vendasRealizadas: req.body.vendasRealizadas !== undefined ? req.body.vendasRealizadas : 0
    };

    // Email pode ser atualizado se fornecido
    if (req.body.email && req.body.email.trim() !== '') {
      cleanData.email = req.body.email.toLowerCase().trim();
      
      // Verificar se email já está em uso por outro vendedor
      const vendedorComEmail = await Vendedor.findOne({ 
        email: cleanData.email,
        codigoVendedor: { $ne: req.params.codigo }
      });
      if (vendedorComEmail) {
        return res.status(400).json({
          error: 'Erro de duplicação',
          message: 'Email já está em uso',
          fields: [{ field: 'email', message: 'Email já cadastrado' }]
        });
      }
    }

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
    
    const vendedor = await Vendedor.findOneAndUpdate(
      { codigoVendedor: req.params.codigo },
      cleanData,
      { new: true, runValidators: true }
    );
    if (!vendedor) {
      return res.status(404).json({ error: 'Vendedor não encontrado' });
    }

    // Atualizar usuário vinculado se existir
    const user = await User.findOne({ codigoVendedor: req.params.codigo });
    if (user) {
      user.nome = req.body.nome;
      user.ativo = req.body.ativo !== undefined ? req.body.ativo : true;
      if (cleanData.email) {
        user.email = cleanData.email;
      }
      // Se senha foi fornecida, atualizar
      if (req.body.senha && req.body.senha.trim() !== '') {
        user.password = await bcrypt.hash(req.body.senha, 10);
      }
      await user.save();
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

    // Remover usuário vinculado se existir
    await User.findOneAndDelete({ codigoVendedor: req.params.codigo });

    res.json({ message: 'Vendedor removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover vendedor:', error);
    res.status(500).json({ error: 'Erro ao remover vendedor' });
  }
};

