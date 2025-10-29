import { Request, Response } from 'express';
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

export const getAllEstoque = async (req: Request, res: Response) => {
  try {
    const estoque = await Estoque.find().sort({ dataCadastro: -1 });
    
    // Buscar dados dos produtos relacionados
    const Produto = require('../models/Produto').default;
    const estoqueComProdutos = await Promise.all(
      estoque.map(async (item) => {
        const produto = await Produto.findOne({ codigoProduto: item.codigoProduto });
        return {
          ...item.toObject(),
          nomeProduto: produto?.nome || 'Produto não encontrado',
          categoria: produto?.categoria || '',
          descricao: produto?.descricao || '',
          imagens: produto?.imagens || [],
          precoCusto: produto?.precoCusto || 0,
          precoVenda: produto?.precoVenda || 0,
          margemDeLucro: produto?.margemDeLucro || 0,
          precoPromocional: produto?.precoPromocional
        };
      })
    );
    
    res.json(estoqueComProdutos);
  } catch (error) {
    console.error('Erro ao buscar estoque:', error);
    res.status(500).json({ error: 'Erro ao buscar estoque' });
  }
};

export const getEstoqueById = async (req: Request, res: Response) => {
  try {
    const estoque = await Estoque.findById(req.params.id);
    if (!estoque) {
      return res.status(404).json({ error: 'Item não encontrado no estoque' });
    }
    res.json(estoque);
  } catch (error) {
    console.error('Erro ao buscar item do estoque:', error);
    res.status(500).json({ error: 'Erro ao buscar item do estoque' });
  }
};

export const getEstoqueByCodigo = async (req: Request, res: Response) => {
  try {
    const estoque = await Estoque.findOne({ codigoProduto: req.params.codigo });
    if (!estoque) {
      return res.status(404).json({ error: 'Item não encontrado no estoque' });
    }
    res.json(estoque);
  } catch (error) {
    console.error('Erro ao buscar item do estoque:', error);
    res.status(500).json({ error: 'Erro ao buscar item do estoque' });
  }
};

export const createEstoque = async (req: Request, res: Response) => {
  try {
    console.log('Dados recebidos para criar estoque:', JSON.stringify(req.body, null, 2));
    
    // Verificar se já existe estoque com a mesma combinação produto+cor+tamanho
    const estoqueExistente = await Estoque.findOne({
      codigoProduto: req.body.codigoProduto,
      cor: req.body.cor,
      tamanho: req.body.tamanho
    });

    if (estoqueExistente) {
      return res.status(400).json({
        error: 'Estoque duplicado',
        message: 'Já existe estoque para essa cor e tamanho deste produto',
        details: {
          codigoProduto: req.body.codigoProduto,
          cor: req.body.cor,
          tamanho: req.body.tamanho
        }
      });
    }
    
    // Limpa campos vazios - mantém mesma lógica
    const cleanData: any = {
      codigoProduto: req.body.codigoProduto,
      cor: req.body.cor,
      tamanho: req.body.tamanho,
      quantidade: req.body.quantidade,
      emPromocao: req.body.emPromocao || false,
      isNovidade: req.body.isNovidade || false
    };

    // Adiciona campos opcionais apenas se tiverem valor
    if (req.body.precoPromocional !== undefined && req.body.precoPromocional !== null) {
      cleanData.precoPromocional = req.body.precoPromocional;
    }
    if (req.body.logMovimentacao && Array.isArray(req.body.logMovimentacao)) {
      cleanData.logMovimentacao = req.body.logMovimentacao;
    }

    console.log('Dados limpos para salvar:', JSON.stringify(cleanData, null, 2));

    const estoque = new Estoque(cleanData);
    await estoque.save();
    res.status(201).json(estoque);
  } catch (error: any) {
    console.error('Erro completo ao criar estoque:', JSON.stringify({
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

export const updateEstoque = async (req: Request, res: Response) => {
  try {
    // Limpa campos vazios - mantém mesma lógica do create
    const cleanData: any = {
      codigoProduto: req.body.codigoProduto,
      cor: req.body.cor,
      tamanho: req.body.tamanho,
      quantidade: req.body.quantidade,
      emPromocao: req.body.emPromocao !== undefined ? req.body.emPromocao : false,
      isNovidade: req.body.isNovidade !== undefined ? req.body.isNovidade : false
    };

    // Adiciona campos opcionais apenas se tiverem valor
    if (req.body.precoPromocional !== undefined && req.body.precoPromocional !== null) {
      cleanData.precoPromocional = req.body.precoPromocional;
    }
    if (req.body.logMovimentacao && Array.isArray(req.body.logMovimentacao)) {
      cleanData.logMovimentacao = req.body.logMovimentacao;
    }

    const estoque = await Estoque.findByIdAndUpdate(
      req.params.id,
      cleanData,
      { new: true, runValidators: true }
    );
    if (!estoque) {
      return res.status(404).json({ error: 'Item não encontrado no estoque' });
    }
    res.json(estoque);
  } catch (error: any) {
    console.error('Erro ao atualizar estoque:', error);
    
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

export const deleteEstoque = async (req: Request, res: Response) => {
  try {
    const estoque = await Estoque.findByIdAndDelete(req.params.id);
    if (!estoque) {
      return res.status(404).json({ error: 'Item não encontrado no estoque' });
    }
    res.json({ message: 'Item removido do estoque com sucesso' });
  } catch (error) {
    console.error('Erro ao remover item do estoque:', error);
    res.status(500).json({ error: 'Erro ao remover item do estoque' });
  }
};

// Registrar entrada de estoque
export const registrarEntrada = async (req: Request, res: Response) => {
  try {
    const { codigoProduto, quantidade, origem, fornecedor, observacao } = req.body;

    if (!codigoProduto || !quantidade || !origem) {
      return res.status(400).json({ 
        error: 'Dados incompletos',
        message: 'codigoProduto, quantidade e origem são obrigatórios'
      });
    }

    const estoque = await Estoque.findOne({ codigoProduto });
    
    if (!estoque) {
      return res.status(404).json({ error: 'Produto não encontrado no estoque' });
    }

    // Atualizar quantidade
    estoque.quantidade += quantidade;

    // Adicionar log de movimentação
    estoque.logMovimentacao.push({
      tipo: 'entrada',
      quantidade,
      data: new Date().toISOString(),
      origem,
      fornecedor: fornecedor || undefined,
      observacao: observacao || undefined
    } as any);

    await estoque.save();
    
    res.json({
      message: 'Entrada registrada com sucesso',
      estoque
    });
  } catch (error) {
    console.error('Erro ao registrar entrada:', error);
    res.status(500).json({ error: 'Erro ao registrar entrada' });
  }
};

// Registrar saída de estoque
export const registrarSaida = async (req: Request, res: Response) => {
  try {
    const { codigoProduto, quantidade, origem, motivo, codigoVenda, observacao } = req.body;

    if (!codigoProduto || !quantidade) {
      return res.status(400).json({ 
        error: 'Dados incompletos',
        message: 'codigoProduto e quantidade são obrigatórios'
      });
    }

    const estoque = await Estoque.findOne({ codigoProduto });
    
    if (!estoque) {
      return res.status(404).json({ error: 'Produto não encontrado no estoque' });
    }

    // Verificar se há quantidade suficiente
    if (estoque.quantidade < quantidade) {
      return res.status(400).json({ 
        error: 'Quantidade insuficiente',
        message: `Há apenas ${estoque.quantidade} unidades disponíveis`
      });
    }

    // Atualizar quantidade
    estoque.quantidade -= quantidade;

    // Adicionar log de movimentação
    estoque.logMovimentacao.push({
      tipo: 'saida',
      quantidade,
      data: new Date().toISOString(),
      origem: origem || 'baixa no estoque',
      motivo: motivo || undefined,
      codigoVenda: codigoVenda || undefined,
      observacao: observacao || undefined
    } as any);

    await estoque.save();
    
    res.json({
      message: 'Saída registrada com sucesso',
      estoque
    });
  } catch (error) {
    console.error('Erro ao registrar saída:', error);
    res.status(500).json({ error: 'Erro ao registrar saída' });
  }
};

// Toggle status de novidade
export const toggleNovidade = async (req: Request, res: Response) => {
  try {
    const { codigo } = req.params;
    const { isNovidade } = req.body;

    const estoque = await Estoque.findOneAndUpdate(
      { codigoProduto: codigo },
      { isNovidade },
      { new: true }
    );

    if (!estoque) {
      return res.status(404).json({ error: 'Produto não encontrado no estoque' });
    }

    res.json({
      message: `Produto ${isNovidade ? 'marcado' : 'desmarcado'} como novidade`,
      estoque
    });
  } catch (error) {
    console.error('Erro ao atualizar status de novidade:', error);
    res.status(500).json({ error: 'Erro ao atualizar status de novidade' });
  }
};

// Toggle status de promoção
export const togglePromocao = async (req: Request, res: Response) => {
  try {
    const { codigo } = req.params;
    const { emPromocao, precoPromocional } = req.body;

    // Buscar todos os itens de estoque com esse código de produto
    const itensEstoque = await Estoque.find({ codigoProduto: codigo });
    
    if (!itensEstoque || itensEstoque.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado no estoque' });
    }

    // Validar preço promocional se estiver ativando a promoção
    if (emPromocao) {
      if (!precoPromocional || precoPromocional <= 0) {
        return res.status(400).json({ 
          error: 'Preço promocional inválido',
          message: 'O preço promocional deve ser maior que zero'
        });
      }
    }

    // Atualizar todos os itens de estoque com esse código de produto
    const updateData: any = { 
      emPromocao: emPromocao,
      precoPromocional: emPromocao ? precoPromocional : null
    };

    await Estoque.updateMany(
      { codigoProduto: codigo },
      { $set: updateData }
    );

    // Buscar os itens atualizados
    const estoqueAtualizado = await Estoque.find({ codigoProduto: codigo });

    res.json({
      message: `Promoção ${emPromocao ? 'ativada' : 'desativada'} com sucesso`,
      estoque: estoqueAtualizado
    });
  } catch (error) {
    console.error('Erro ao atualizar status de promoção:', error);
    res.status(500).json({ error: 'Erro ao atualizar status de promoção' });
  }
};
