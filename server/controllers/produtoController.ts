import { Request, Response } from 'express';
import Produto from '../models/Produto';
import Estoque from '../models/Estoque';
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

export const getAllProdutos = async (req: Request, res: Response) => {
  try {
    const produtos = await Produto.find().sort({ dataCadastro: -1 });
    res.json(produtos);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
};

export const getProdutoByCodigo = async (req: Request, res: Response) => {
  try {
    const produto = await Produto.findOne({ codigoProduto: req.params.codigo });
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    res.json(produto);
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({ error: 'Erro ao buscar produto' });
  }
};

export const createProduto = async (req: Request, res: Response) => {
  try {
    console.log('Dados recebidos para criar produto:', JSON.stringify(req.body, null, 2));
    
    // Limpa campos vazios
    const cleanData: any = {
      codigoProduto: req.body.codigoProduto,
      nome: req.body.nome,
      categoria: req.body.categoria,
      precoCusto: req.body.precoCusto,
      margemDeLucro: req.body.margemDeLucro,
      precoVenda: req.body.precoVenda
    };

    // Adiciona campos opcionais apenas se tiverem valor
    if (req.body.descricao && req.body.descricao.trim() !== '') {
      cleanData.descricao = req.body.descricao.trim();
    }
    if (req.body.precoPromocional !== undefined && req.body.precoPromocional !== null) {
      cleanData.precoPromocional = req.body.precoPromocional;
    }
    if (req.body.imagens && Array.isArray(req.body.imagens) && req.body.imagens.length > 0) {
      cleanData.imagens = req.body.imagens;
    }
    if (req.body.fornecedor && req.body.fornecedor.codigoFornecedor) {
      cleanData.fornecedor = {
        codigoFornecedor: req.body.fornecedor.codigoFornecedor,
        nome: req.body.fornecedor.nome
      };
    }

    // Adicionar primeiro registro ao histórico de preços
    cleanData.historicoPrecosn = [{
      data: new Date(),
      precoCusto: req.body.precoCusto,
      precoVenda: req.body.precoVenda,
      margemDeLucro: req.body.margemDeLucro
    }];

    console.log('Dados limpos para salvar:', JSON.stringify(cleanData, null, 2));

    const produto = new Produto(cleanData);
    await produto.save();
    res.status(201).json(produto);
  } catch (error: any) {
    console.error('Erro completo ao criar produto:', JSON.stringify({
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

export const updateProduto = async (req: Request, res: Response) => {
  try {
    // Buscar produto atual para comparar preços
    const produtoAtual = await Produto.findOne({ codigoProduto: req.params.codigo });
    if (!produtoAtual) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    // Limpa campos vazios - mantém mesma lógica do create
    const cleanData: any = {
      nome: req.body.nome,
      categoria: req.body.categoria,
      precoCusto: req.body.precoCusto,
      margemDeLucro: req.body.margemDeLucro,
      precoVenda: req.body.precoVenda
    };

    // Adiciona campos opcionais apenas se tiverem valor
    if (req.body.descricao && req.body.descricao.trim() !== '') {
      cleanData.descricao = req.body.descricao.trim();
    }
    if (req.body.precoPromocional !== undefined && req.body.precoPromocional !== null) {
      cleanData.precoPromocional = req.body.precoPromocional;
    }
    if (req.body.imagens && Array.isArray(req.body.imagens) && req.body.imagens.length > 0) {
      cleanData.imagens = req.body.imagens;
    }
    // Permite definir fornecedor ou remover (null)
    if (req.body.fornecedor && req.body.fornecedor.codigoFornecedor) {
      cleanData.fornecedor = {
        codigoFornecedor: req.body.fornecedor.codigoFornecedor,
        nome: req.body.fornecedor.nome
      };
    } else if (req.body.fornecedor === null) {
      cleanData.fornecedor = null;
    }

    // Se os preços mudaram, adicionar ao histórico
    if (
      produtoAtual.precoCusto !== req.body.precoCusto ||
      produtoAtual.precoVenda !== req.body.precoVenda ||
      produtoAtual.margemDeLucro !== req.body.margemDeLucro
    ) {
      const novoRegistroHistorico = {
        data: new Date(),
        precoCusto: req.body.precoCusto,
        precoVenda: req.body.precoVenda,
        margemDeLucro: req.body.margemDeLucro
      };
      
      cleanData.$push = {
        historicoPrecosn: novoRegistroHistorico
      };
    }
    
    const produto = await Produto.findOneAndUpdate(
      { codigoProduto: req.params.codigo },
      cleanData,
      { new: true, runValidators: true }
    );
    
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    res.json(produto);
  } catch (error: any) {
    console.error('Erro ao atualizar produto:', error);
    
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

export const deleteProduto = async (req: Request, res: Response) => {
  try {
    const produto = await Produto.findOne({ codigoProduto: req.params.codigo });
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    // Marcar todos os registros de estoque como inativos ao invés de deletar
    await Estoque.updateMany(
      { codigoProduto: produto.codigoProduto },
      { $set: { ativo: false } }
    );
    await Produto.findOneAndDelete({ codigoProduto: req.params.codigo });
    
    res.json({ message: 'Produto removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover produto:', error);
    res.status(500).json({ error: 'Erro ao remover produto' });
  }
};
