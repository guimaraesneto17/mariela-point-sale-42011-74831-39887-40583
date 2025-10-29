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

// Helpers para formato ISO sem milissegundos e validações conforme schema do MongoDB
const isoSeconds = (date?: string | Date) => {
  const d = date ? new Date(date) : new Date();
  return d.toISOString().split('.')[0] + 'Z';
};

const ALLOWED_TAMANHOS = ['PP', 'P', 'M', 'G', 'GG', 'U'] as const;
const ALLOWED_ORIGENS = ['venda', 'compra', 'entrada', 'baixa no estoque'] as const;
const CODIGO_PRODUTO_RE = /^P\d{3}$/;
const DATA_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
const CODIGO_VENDA_RE = /^VENDA\d{8}-\d{3}$/;
const FORNECEDOR_RE = /^F\d{3}$/;

type FieldIssue = { field: string; message: string; value?: any };

const validateEstoquePayload = (payload: any): FieldIssue[] => {
  const issues: FieldIssue[] = [];
  if (!CODIGO_PRODUTO_RE.test(payload?.codigoProduto || '')) {
    issues.push({ field: 'codigoProduto', message: 'Deve seguir o padrão P###', value: payload?.codigoProduto });
  }
  if (!payload?.cor || typeof payload.cor !== 'string') {
    issues.push({ field: 'cor', message: 'Cor é obrigatória', value: payload?.cor });
  }
  if (!ALLOWED_TAMANHOS.includes(payload?.tamanho)) {
    issues.push({ field: 'tamanho', message: `Deve ser um dos: ${ALLOWED_TAMANHOS.join(', ')}`, value: payload?.tamanho });
  }
  const q = Number(payload?.quantidade);
  if (!Number.isInteger(q) || q < 0) {
    issues.push({ field: 'quantidade', message: 'Deve ser inteiro >= 0', value: payload?.quantidade });
  }
  if (payload?.precoPromocional !== undefined && payload?.precoPromocional !== null) {
    const p = Number(payload.precoPromocional);
    if (Number.isNaN(p) || p < 0) {
      issues.push({ field: 'precoPromocional', message: 'Deve ser número >= 0 ou null', value: payload?.precoPromocional });
    }
  }
  if (payload?.logMovimentacao) {
    if (!Array.isArray(payload.logMovimentacao) || payload.logMovimentacao.length === 0) {
      issues.push({ field: 'logMovimentacao', message: 'Deve ser um array com pelo menos 1 item' });
    } else {
      payload.logMovimentacao.forEach((m: any, idx: number) => {
        if (!['entrada', 'saida'].includes(m?.tipo)) {
          issues.push({ field: `logMovimentacao[${idx}].tipo`, message: 'Deve ser "entrada" ou "saida"', value: m?.tipo });
        }
        const ds = isoSeconds(m?.data);
        if (!DATA_RE.test(ds)) {
          issues.push({ field: `logMovimentacao[${idx}].data`, message: 'Formato ISO sem milissegundos (YYYY-MM-DDTHH:MM:SSZ)', value: m?.data });
        }
        const mq = Number(m?.quantidade);
        if (!Number.isInteger(mq) || mq < 1) {
          issues.push({ field: `logMovimentacao[${idx}].quantidade`, message: 'Deve ser inteiro >= 1', value: m?.quantidade });
        }
        if (m?.origem !== undefined) {
          if (!ALLOWED_ORIGENS.includes(m.origem)) {
            issues.push({ field: `logMovimentacao[${idx}].origem`, message: `Deve ser um dos: ${ALLOWED_ORIGENS.join(', ')}`, value: m?.origem });
          }
        }
        if (m?.codigoVenda != null) {
          if (typeof m.codigoVenda !== 'string' || !CODIGO_VENDA_RE.test(m.codigoVenda)) {
            issues.push({ field: `logMovimentacao[${idx}].codigoVenda`, message: 'Padrão VENDA########-###', value: m?.codigoVenda });
          }
        }
        if (m?.fornecedor != null) {
          if (typeof m.fornecedor !== 'string' || !FORNECEDOR_RE.test(m.fornecedor)) {
            issues.push({ field: `logMovimentacao[${idx}].fornecedor`, message: 'Padrão F###', value: m?.fornecedor });
          }
        }
        if (m?.observacao != null && String(m.observacao).length > 300) {
          issues.push({ field: `logMovimentacao[${idx}].observacao`, message: 'Máximo 300 caracteres', value: m?.observacao });
        }
      });
    }
  }
  return issues;
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
      quantidade: Number.isInteger(Number(req.body.quantidade)) ? parseInt(req.body.quantidade, 10) : 1,
      emPromocao: req.body.emPromocao || false,
      isNovidade: req.body.isNovidade || false,
      dataCadastro: isoSeconds()
    };

    // Adiciona campos opcionais apenas se tiverem valor
    if (req.body.precoPromocional !== undefined && req.body.precoPromocional !== null) {
      cleanData.precoPromocional = req.body.precoPromocional;
    }
    if (req.body.logMovimentacao && Array.isArray(req.body.logMovimentacao)) {
      cleanData.logMovimentacao = req.body.logMovimentacao.map((m: any) => ({
        ...m,
        quantidade: Number.isInteger(Number(m.quantidade)) ? parseInt(m.quantidade, 10) : 1,
        data: isoSeconds(m.data)
      }));
    }

    // Pré-validação para logs claros antes do MongoDB
    const issues = validateEstoquePayload(cleanData);
    if (issues.length) {
      console.warn('Falha na validação pré-save do Estoque:', issues);
      return res.status(400).json({
        error: 'Erro de validação',
        message: 'Um ou mais campos estão inválidos',
        fields: issues
      });
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

    // Validação do MongoDB (schema da coleção)
    if (error?.message?.includes('Document failed validation') || error?.code === 121) {
      const mongoDetails = (error as any)?.errInfo?.details || (error as any)?.errorResponse?.errInfo?.details;
      console.error('Detalhes da validação do MongoDB:', JSON.stringify(mongoDetails, null, 2));
      return res.status(400).json({
        error: 'Erro de validação no MongoDB',
        message: 'Documento não passou na validação do schema',
        fields: mongoDetails?.schemaRulesNotSatisfied || mongoDetails || error?.errmsg || error?.message
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
      data: isoSeconds(),
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
      data: isoSeconds(),
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
