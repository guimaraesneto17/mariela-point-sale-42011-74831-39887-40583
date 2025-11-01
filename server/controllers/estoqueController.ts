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

const ALLOWED_ORIGENS = ['venda', 'compra', 'entrada', 'baixa no estoque'] as const;
const CODIGO_PRODUTO_RE = /^P\d{3}$/;
const DATA_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
const CODIGO_VENDA_RE = /^VENDA\d{8}-\d{3}$/;
const FORNECEDOR_RE = /^F\d{3}$/;

type FieldIssue = { field: string; message: string; value?: any };

// Agrega múltiplos documentos (legado) de um mesmo produto em um único registro com variantes
const aggregateEstoqueByCodigo = (docs: any[]) => {
  if (!docs || docs.length === 0) return null;
  const acc: any = {
    codigoProduto: docs[0].codigoProduto,
    variantes: [] as Array<{ cor: string; tamanho: string; quantidade: number }>,
    emPromocao: false,
    isNovidade: false,
    precoPromocional: null as number | null,
    logMovimentacao: [] as any[],
    dataCadastro: docs[0].dataCadastro,
    dataAtualizacao: docs[0].dataAtualizacao,
    _id: docs[0]._id,
  };

  docs.forEach((doc) => {
    acc.emPromocao = acc.emPromocao || !!doc.emPromocao;
    acc.isNovidade = acc.isNovidade || !!doc.isNovidade;
    if (doc.precoPromocional != null) acc.precoPromocional = doc.precoPromocional;
    if (doc.dataAtualizacao && (!acc.dataAtualizacao || doc.dataAtualizacao > acc.dataAtualizacao)) {
      acc.dataAtualizacao = doc.dataAtualizacao;
    }

    const variantes = Array.isArray(doc.variantes) && doc.variantes.length
      ? doc.variantes
      : (() => {
          const cores = Array.isArray(doc.cor) ? doc.cor : (doc.cor ? [doc.cor] : []);
          const tamanhos = Array.isArray(doc.tamanho) ? doc.tamanho : (doc.tamanho ? [doc.tamanho] : []);
          const c = cores[0];
          const t = tamanhos[0];
          const q = Number(doc.quantidade) || 0;
          return c && t ? [{ cor: c, tamanho: t, quantidade: q }] : [];
        })();

    variantes.forEach((v: any) => {
      const existing = acc.variantes.find((x: any) => x.cor === v.cor && x.tamanho === v.tamanho);
      if (existing) existing.quantidade += Number(v.quantidade) || 0;
      else acc.variantes.push({ cor: v.cor, tamanho: v.tamanho, quantidade: Number(v.quantidade) || 0 });
    });

    if (Array.isArray(doc.logMovimentacao)) acc.logMovimentacao.push(...doc.logMovimentacao);
  });

  return acc;
};

const validateEstoquePayload = (payload: any): FieldIssue[] => {
  const issues: FieldIssue[] = [];
  if (!CODIGO_PRODUTO_RE.test(payload?.codigoProduto || '')) {
    issues.push({ field: 'codigoProduto', message: 'Deve seguir o padrão P###', value: payload?.codigoProduto });
  }
  
  // Validar quantidade total
  const qtdTotal = Number(payload?.quantidade);
  if (!Number.isInteger(qtdTotal) || qtdTotal < 0) {
    issues.push({ field: 'quantidade', message: 'Quantidade total deve ser inteiro >= 0', value: payload?.quantidade });
  }
  
  // Validar variantes
  if (!payload?.variantes || !Array.isArray(payload.variantes) || payload.variantes.length === 0) {
    issues.push({ field: 'variantes', message: 'Deve ter pelo menos uma variante', value: payload?.variantes });
  } else {
    payload.variantes.forEach((v: any, idx: number) => {
      if (!v.cor || typeof v.cor !== 'string') {
        issues.push({ field: `variantes[${idx}].cor`, message: 'Cor é obrigatória', value: v.cor });
      }
      if (!v.tamanho || typeof v.tamanho !== 'string') {
        issues.push({ field: `variantes[${idx}].tamanho`, message: 'Tamanho é obrigatório', value: v.tamanho });
      }
      const q = Number(v.quantidade);
      if (!Number.isInteger(q) || q < 0) {
        issues.push({ field: `variantes[${idx}].quantidade`, message: 'Deve ser inteiro >= 0', value: v.quantidade });
      }
    });
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
    const docs = await Estoque.find().sort({ dataCadastro: -1 });

    // Agrupar por código do produto e agregar variantes/quantidades
    const groups = docs.reduce((map, doc: any) => {
      const key = doc.codigoProduto as string;
      const list = map.get(key) || [];
      list.push(doc);
      map.set(key, list);
      return map;
    }, new Map<string, any[]>());

    const aggregated = Array.from<any[]>(groups.values()).map((docsArr) => aggregateEstoqueByCodigo(docsArr));

    // Enriquecer com dados do produto e filtrar sem estoque
    const Produto = require('../models/Produto').default;
    const estoqueComProdutos = await Promise.all(
      aggregated.map(async (item: any) => {
        const produto = await Produto.findOne({ codigoProduto: item.codigoProduto });
        const quantidadeTotal = item.variantes.reduce((sum: number, v: any) => sum + (Number(v.quantidade) || 0), 0);
        if (quantidadeTotal === 0) return null;
        return {
          ...item,
          quantidadeTotal,
          nomeProduto: produto?.nome || 'Produto não encontrado',
          categoria: produto?.categoria || '',
          descricao: produto?.descricao || '',
          imagens: produto?.imagens || [],
          precoCusto: produto?.precoCusto || 0,
          precoVenda: produto?.precoVenda || 0,
          margemDeLucro: produto?.margemDeLucro || 0,
          precoPromocional: produto?.precoPromocional ?? item.precoPromocional
        };
      })
    );

    res.json(estoqueComProdutos.filter(Boolean));
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
    const docs = await Estoque.find({ codigoProduto: req.params.codigo });
    if (!docs || docs.length === 0) {
      return res.status(404).json({ error: 'Item não encontrado no estoque' });
    }

    const item = aggregateEstoqueByCodigo(docs);

    // Buscar dados do produto relacionado
    const Produto = require('../models/Produto').default;
    const produto = await Produto.findOne({ codigoProduto: req.params.codigo });

    res.json({
      ...item,
      nomeProduto: produto?.nome || 'Produto não encontrado',
      categoria: produto?.categoria || '',
      descricao: produto?.descricao || '',
      imagens: produto?.imagens || [],
      precoCusto: produto?.precoCusto || 0,
      precoVenda: produto?.precoVenda || 0,
      margemDeLucro: produto?.margemDeLucro || 0
    });
  } catch (error) {
    console.error('Erro ao buscar item do estoque:', error);
    res.status(500).json({ error: 'Erro ao buscar item do estoque' });
  }
};

export const createEstoque = async (req: Request, res: Response) => {
  try {
    console.log('Dados recebidos para criar estoque:', JSON.stringify(req.body, null, 2));
    
    const { codigoProduto, cor, tamanho, quantidade = 1 } = req.body;
    
    // Verificar se já existe estoque para este produto
    let estoque = await Estoque.findOne({ codigoProduto });

    if (estoque) {
      // Verificar se já existe essa variante
      const varianteExistente = estoque.variantes.find(
        (v: any) => v.cor === cor && v.tamanho === tamanho
      );
      
      if (varianteExistente) {
        return res.status(400).json({
          error: 'Estoque duplicado',
          message: 'Já existe estoque para essa cor e tamanho deste produto'
        });
      }
      
      // Adicionar nova variante
      estoque.variantes.push({ cor, tamanho, quantidade });
      
      // Atualizar quantidade total
      estoque.quantidade = estoque.variantes.reduce((total: number, v: any) => total + (v.quantidade || 0), 0);
      
      // Adicionar log de movimentação
      if (req.body.logMovimentacao && Array.isArray(req.body.logMovimentacao)) {
        estoque.logMovimentacao.push(...req.body.logMovimentacao.map((m: any) => ({
          ...m,
          cor,
          tamanho,
          quantidade: Number.isInteger(Number(m.quantidade)) ? parseInt(m.quantidade, 10) : 1,
          data: isoSeconds(m.data)
        })));
      }
      
      await estoque.save();
      return res.status(201).json(estoque);
    }
    
    // Criar novo registro de estoque
    const cleanData: any = {
      codigoProduto,
      quantidade: quantidade || 0,
      variantes: [{ cor, tamanho, quantidade }],
      emPromocao: req.body.emPromocao || false,
      isNovidade: req.body.isNovidade || false,
      dataCadastro: isoSeconds()
    };

    if (req.body.precoPromocional !== undefined && req.body.precoPromocional !== null) {
      cleanData.precoPromocional = req.body.precoPromocional;
    }
    
    if (req.body.logMovimentacao && Array.isArray(req.body.logMovimentacao)) {
      cleanData.logMovimentacao = req.body.logMovimentacao.map((m: any) => ({
        ...m,
        cor,
        tamanho,
        quantidade: Number.isInteger(Number(m.quantidade)) ? parseInt(m.quantidade, 10) : 1,
        data: isoSeconds(m.data)
      }));
    }

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

    estoque = new Estoque(cleanData);
    await estoque.save();
    res.status(201).json(estoque);
  } catch (error: any) {
    console.error('Erro completo ao criar estoque:', JSON.stringify({
      name: error.name,
      message: error.message,
      code: error.code,
      errors: error.errors
    }, null, 2));
    
    if (error.name === 'ValidationError') {
      const errors = Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message,
        value: error.errors[key].value
      }));
      return res.status(400).json({
        error: 'Erro de validação',
        message: 'Um ou mais campos estão inválidos',
        fields: errors
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        error: 'Erro de duplicação',
        message: 'Produto já existe no estoque'
      });
    }
    
    res.status(400).json({
      error: 'Erro ao processar requisição',
      message: error.message || 'Erro desconhecido'
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
    const { codigoProduto, cor, tamanho, quantidade, origem, fornecedor, observacao } = req.body;

    if (!codigoProduto || !cor || !tamanho || !quantidade || !origem) {
      return res.status(400).json({ 
        error: 'Dados incompletos',
        message: 'codigoProduto, cor, tamanho, quantidade e origem são obrigatórios'
      });
    }

    const estoque = await Estoque.findOne({ codigoProduto });
    
    if (!estoque) {
      return res.status(404).json({ error: 'Produto não encontrado no estoque' });
    }

    // Encontrar a variante
    const variante = estoque.variantes.find((v: any) => v.cor === cor && v.tamanho === tamanho);
    
    if (!variante) {
      return res.status(404).json({ error: 'Variante não encontrada no estoque' });
    }

    // Atualizar quantidade
    variante.quantidade += quantidade;
    
    // Recalcular quantidade total
    estoque.quantidade = estoque.variantes.reduce((total: number, v: any) => total + (v.quantidade || 0), 0);

    // Adicionar log de movimentação
    estoque.logMovimentacao.push({
      tipo: 'entrada',
      cor,
      tamanho,
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
    const { codigoProduto, cor, tamanho, quantidade, origem, motivo, codigoVenda, observacao } = req.body;

    if (!codigoProduto || !cor || !tamanho || !quantidade) {
      return res.status(400).json({ 
        error: 'Dados incompletos',
        message: 'codigoProduto, cor, tamanho e quantidade são obrigatórios'
      });
    }

    const estoque = await Estoque.findOne({ codigoProduto });
    
    if (!estoque) {
      return res.status(404).json({ error: 'Produto não encontrado no estoque' });
    }

    // Encontrar a variante
    const variante = estoque.variantes.find((v: any) => v.cor === cor && v.tamanho === tamanho);
    
    if (!variante) {
      return res.status(404).json({ error: 'Variante não encontrada no estoque' });
    }

    // Verificar se há quantidade suficiente
    if (variante.quantidade < quantidade) {
      return res.status(400).json({ 
        error: 'Quantidade insuficiente',
        message: `Há apenas ${variante.quantidade} unidades disponíveis para ${cor} - ${tamanho}`
      });
    }

    // Atualizar quantidade
    variante.quantidade -= quantidade;
    
    // Adicionar log de movimentação
    estoque.logMovimentacao.push({
      tipo: 'saida',
      cor,
      tamanho,
      quantidade,
      data: isoSeconds(),
      origem: origem || 'baixa no estoque',
      motivo: motivo || undefined,
      codigoVenda: codigoVenda || undefined,
      observacao: observacao || undefined
    } as any);

    // Se a variante ficou com quantidade 0, remove ela do array
    if (variante.quantidade === 0) {
      estoque.variantes = estoque.variantes.filter(
        (v: any) => !(v.cor === cor && v.tamanho === tamanho)
      );
    }
    
    // Recalcular quantidade total
    estoque.quantidade = estoque.variantes.reduce((total: number, v: any) => total + (v.quantidade || 0), 0);

    // Se não há mais variantes, exclui o documento inteiro
    if (estoque.variantes.length === 0) {
      await Estoque.findByIdAndDelete(estoque._id);
      return res.json({
        message: 'Saída registrada com sucesso. Produto removido do estoque (sem variantes disponíveis)',
        removido: true
      });
    }

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
