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
    variantes: [] as Array<{ cor: string; tamanhos: string[]; quantidade: number; imagens?: string[] }>,
    emPromocao: false,
    isNovidade: false,
    precoPromocional: null as number | null,
    logPromocao: [] as any[],
    logMovimentacao: [] as any[],
    ativo: true,
    dataCadastro: docs[0].dataCadastro,
    dataAtualizacao: docs[0].dataAtualizacao,
    _id: docs[0]._id,
  };

  docs.forEach((doc) => {
    acc.emPromocao = acc.emPromocao || !!doc.emPromocao;
    acc.isNovidade = acc.isNovidade || !!doc.isNovidade;
    acc.ativo = acc.ativo && (doc.ativo !== false);
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
          return c && t ? [{ cor: c, tamanhos: [t], quantidade: q, imagens: [] }] : [];
        })();

    variantes.forEach((v: any) => {
      // Garantir que tamanhos é array
      const vTamanhos = Array.isArray(v.tamanhos) ? v.tamanhos : (v.tamanho ? [v.tamanho] : []);
      
      const existing = acc.variantes.find((x: any) => x.cor === v.cor);
      if (existing) {
        existing.quantidade += Number(v.quantidade) || 0;
        // Mesclar tamanhos únicos
        vTamanhos.forEach((t: string) => {
          if (!existing.tamanhos.includes(t)) {
            existing.tamanhos.push(t);
          }
        });
        // Mesclar imagens se houver
        if (v.imagens && Array.isArray(v.imagens) && v.imagens.length > 0) {
          existing.imagens = existing.imagens || [];
          v.imagens.forEach((img: string) => {
            if (!existing.imagens!.includes(img)) {
              existing.imagens!.push(img);
            }
          });
        }
      } else {
        acc.variantes.push({ 
          cor: v.cor, 
          tamanhos: vTamanhos,
          quantidade: Number(v.quantidade) || 0,
          imagens: v.imagens || []
        });
      }
    });

    // Agregar logs de promoção
    if (Array.isArray(doc.logPromocao)) acc.logPromocao.push(...doc.logPromocao);
    
    // Agregar logs de movimentação
    if (Array.isArray(doc.logMovimentacao)) acc.logMovimentacao.push(...doc.logMovimentacao);
  });

  // Ordenar movimentações por data (mais recente primeiro)
  if (acc.logMovimentacao.length > 0) {
    acc.logMovimentacao.sort((a: any, b: any) => {
      const dateA = new Date(a.data).getTime();
      const dateB = new Date(b.data).getTime();
      return dateB - dateA;
    });
  }

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

      // Novo modelo: cada variante possui UMA cor e UMA lista de tamanhos
      if (!v.tamanhos || !Array.isArray(v.tamanhos) || v.tamanhos.length === 0) {
        issues.push({ field: `variantes[${idx}].tamanhos`, message: 'Deve informar ao menos um tamanho', value: v.tamanhos });
      } else {
        v.tamanhos.forEach((t: any, tIdx: number) => {
          if (typeof t !== 'string' || !t.trim()) {
            issues.push({ field: `variantes[${idx}].tamanhos[${tIdx}]`, message: 'Cada tamanho deve ser uma string não vazia', value: t });
          }
        });
      }

      const q = Number(v.quantidade);
      if (!Number.isInteger(q) || q < 0) {
        issues.push({ field: `variantes[${idx}].quantidade`, message: 'Deve ser inteiro >= 0', value: v.quantidade });
      }
      // Validar imagens se fornecidas
      if (v.imagens !== undefined) {
        if (!Array.isArray(v.imagens)) {
          issues.push({ field: `variantes[${idx}].imagens`, message: 'Deve ser um array', value: v.imagens });
        } else {
          v.imagens.forEach((img: any, imgIdx: number) => {
            if (typeof img !== 'string') {
              issues.push({ field: `variantes[${idx}].imagens[${imgIdx}]`, message: 'Deve ser uma string (URL)', value: img });
            }
          });
        }
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

    console.log('📦 Total de produtos agregados:', aggregated.length);
    if (aggregated.length > 0 && aggregated[0].logMovimentacao) {
      console.log('📝 Primeiro produto tem', aggregated[0].logMovimentacao.length, 'movimentações');
    }

    // Enriquecer com dados do produto e filtrar sem estoque
    const Produto = require('../models/Produto').default;
    const estoqueComProdutos = await Promise.all(
      aggregated.map(async (item: any) => {
        const produto = await Produto.findOne({ codigoProduto: item.codigoProduto });
        const quantidadeTotal = item.variantes.reduce((sum: number, v: any) => sum + (Number(v.quantidade) || 0), 0);
        if (quantidadeTotal === 0) return null;
        
        console.log(`📝 Produto ${item.codigoProduto} tem ${item.logMovimentacao?.length || 0} movimentações`);
        
        return {
          ...item,
          quantidadeTotal,
          nomeProduto: produto?.nome || 'Produto não encontrado',
          categoria: produto?.categoria || '',
          descricao: produto?.descricao || '',
          precoCusto: produto?.precoCusto || 0,
          precoVenda: produto?.precoVenda || 0,
          margemDeLucro: produto?.margemDeLucro || 0,
          precoPromocional: produto?.precoPromocional ?? item.precoPromocional,
          // Garantir que logMovimentacao e logPromocao sejam incluídos
          logMovimentacao: item.logMovimentacao || [],
          logPromocao: item.logPromocao || []
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

    // Suporta tanto o formato antigo (cor/tamanho) quanto o novo (variantes[])
    const variantesPayload = Array.isArray(req.body.variantes) ? req.body.variantes : [];
    const primeiraVariante = variantesPayload[0] || {};

    const cor = req.body.cor ?? primeiraVariante.cor;
    const tamanhos: string[] = Array.isArray(primeiraVariante.tamanhos)
      ? primeiraVariante.tamanhos
      : primeiraVariante.tamanho
        ? [primeiraVariante.tamanho]
        : req.body.tamanho
          ? [req.body.tamanho]
          : [];

    const quantidadeVariante = Number(
      primeiraVariante.quantidade ?? req.body.quantidade ?? 1
    );
    const imagens = primeiraVariante.imagens ?? req.body.imagens ?? [];
    const { codigoProduto } = req.body;

    // Verificar se já existe estoque para este produto
    let estoque = await Estoque.findOne({ codigoProduto });

    if (estoque) {
      // Remover variantes com quantidade <= 0 (legado)
      const originalLen = Array.isArray(estoque.variantes) ? estoque.variantes.length : 0;
      estoque.variantes = (estoque.variantes || []).filter((v: any) => Number(v.quantidade) > 0);
      const cleaned = originalLen !== estoque.variantes.length;

      // Novo modelo: uma variante por cor, com lista de tamanhos
      const varianteExistente = estoque.variantes.find(
        (v: any) => v.cor === cor
      );

      if (varianteExistente) {
        // Mesclar tamanhos (evita duplicados)
        if (!Array.isArray(varianteExistente.tamanhos)) {
          varianteExistente.tamanhos = [];
        }
        tamanhos.forEach((t) => {
          if (t && !varianteExistente.tamanhos.includes(t)) {
            varianteExistente.tamanhos.push(t);
          }
        });

        // Somar quantidade
        varianteExistente.quantidade = Number(varianteExistente.quantidade || 0) + (quantidadeVariante || 0);

        // Mesclar imagens
        if (!Array.isArray(varianteExistente.imagens)) {
          varianteExistente.imagens = [];
        }
        (imagens as string[]).forEach((img) => {
          if (img && !varianteExistente.imagens!.includes(img)) {
            varianteExistente.imagens!.push(img);
          }
        });
      } else {
        estoque.variantes.push({ cor, tamanhos, quantidade: quantidadeVariante, imagens });
      }

      // Atualizar quantidade total com base nas variantes
      estoque.quantidade = estoque.variantes.reduce(
        (total: number, v: any) => total + (Number(v.quantidade) || 0),
        0
      );

      await estoque.save();
      return res.status(201).json(estoque);
    }

    // Criar novo registro de estoque
    const cleanData: any = {
      codigoProduto,
      quantidade: quantidadeVariante || 0,
      variantes: [{ cor, tamanhos, quantidade: quantidadeVariante, imagens }],
      emPromocao: req.body.emPromocao || false,
      isNovidade: req.body.isNovidade || false,
      dataCadastro: isoSeconds(),
    };

    if (req.body.precoPromocional !== undefined && req.body.precoPromocional !== null) {
      cleanData.precoPromocional = req.body.precoPromocional;
    }

    const issues = validateEstoquePayload(cleanData);
    if (issues.length) {
      console.warn('Falha na validação pré-save do Estoque:', issues);
      return res.status(400).json({
        error: 'Erro de validação',
        message: 'Um ou mais campos estão inválidos',
        fields: issues,
      });
    }

    console.log('Dados limpos para salvar:', JSON.stringify(cleanData, null, 2));

    estoque = new Estoque(cleanData);
    await estoque.save();
    res.status(201).json(estoque);
  } catch (error: any) {
    console.error('Erro completo ao criar estoque:', JSON.stringify(
      {
        name: error.name,
        message: error.message,
        code: error.code,
        errors: error.errors,
      },
      null,
      2
    ));

    if (error.name === 'ValidationError') {
      const errors = Object.keys(error.errors).map((key) => ({
        field: key,
        message: error.errors[key].message,
        value: error.errors[key].value,
      }));
      return res.status(400).json({
        error: 'Erro de validação',
        message: 'Um ou mais campos estão inválidos',
        fields: errors,
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        error: 'Erro de duplicação',
        message: 'Produto já existe no estoque',
      });
    }

    res.status(400).json({
      error: 'Erro ao processar requisição',
      message: error.message || 'Erro desconhecido',
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
    if (req.body.logPromocao && Array.isArray(req.body.logPromocao)) {
      cleanData.logPromocao = req.body.logPromocao;
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

    if (!codigoProduto || !cor || !tamanho || !quantidade) {
      return res.status(400).json({ 
        error: 'Dados incompletos',
        message: 'codigoProduto, cor, tamanho e quantidade são obrigatórios'
      });
    }

    if (!origem || !['venda', 'compra', 'entrada', 'baixa no estoque'].includes(origem)) {
      return res.status(400).json({ 
        error: 'Dados inválidos',
        message: 'Origem é obrigatória e deve ser um valor válido'
      });
    }

    const estoque = await Estoque.findOne({ codigoProduto });
    
    if (!estoque) {
      return res.status(404).json({ error: 'Produto não encontrado no estoque' });
    }

    // Se estava inativo, reativar
    if (!estoque.ativo) {
      estoque.ativo = true;
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
    const logEntry: any = {
      tipo: 'entrada',
      data: isoSeconds(),
      quantidade: parseInt(quantidade, 10),
      origem,
      cor,
      tamanho,
      fornecedor: fornecedor || null,
      observacao: observacao || null
    };

    if (!estoque.logMovimentacao) {
      estoque.logMovimentacao = [];
    }
    estoque.logMovimentacao.push(logEntry);

    console.log(`✅ Log de entrada registrado para ${codigoProduto}:`, logEntry);

    // Se estava inativo e agora tem estoque, marcar como ativo
    if (!estoque.ativo && estoque.quantidade > 0) {
      estoque.ativo = true;
    }

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
    
    // Adicionar log de movimentação ANTES de remover a variante
    const logEntry: any = {
      tipo: 'saida',
      data: isoSeconds(),
      quantidade: parseInt(quantidade, 10),
      origem: origem || 'baixa no estoque',
      cor,
      tamanho,
      motivo: motivo || null,
      codigoVenda: codigoVenda || null,
      observacao: observacao || null
    };

    if (!estoque.logMovimentacao) {
      estoque.logMovimentacao = [];
    }
    estoque.logMovimentacao.push(logEntry);
    
    console.log(`✅ Log de saída registrado para ${codigoProduto}:`, logEntry);

    // Se a variante ficou com quantidade 0, remove ela do array
    if (variante.quantidade === 0) {
      estoque.variantes = estoque.variantes.filter(
        (v: any) => !(v.cor === cor && v.tamanho === tamanho)
      );
    }
    
    // Recalcular quantidade total
    estoque.quantidade = estoque.variantes.reduce((total: number, v: any) => total + (v.quantidade || 0), 0);

    // Se não há mais variantes ou quantidade zerou, marcar como inativo ao invés de deletar
    if (estoque.variantes.length === 0 || estoque.quantidade === 0) {
      estoque.ativo = false;
      await estoque.save();
      return res.json({
        message: 'Saída registrada com sucesso. Produto marcado como inativo (sem estoque disponível)',
        estoque,
        inativo: true
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
    const { emPromocao, precoPromocional, tipoDeDesconto, valorDesconto, observacao } = req.body;

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

    // Se está ativando a promoção, adicionar log
    if (emPromocao) {
      const logEntry = {
        dataInicio: isoSeconds(),
        precoPromocional,
        ativo: true,
        observacao: observacao || null,
        tipoDeDesconto: tipoDeDesconto || null,
        valorDesconto: valorDesconto || null
      };

      await Estoque.updateMany(
        { codigoProduto: codigo },
        { 
          $set: updateData,
          $push: { logPromocao: logEntry }
        }
      );
    } else {
      // Se está desativando, marcar a última promoção como inativa
      await Estoque.updateMany(
        { codigoProduto: codigo },
        { $set: updateData }
      );

      // Atualizar o último logPromocao para inativo e adicionar dataFim
      const estoques = await Estoque.find({ codigoProduto: codigo });
      for (const estoque of estoques) {
        if (estoque.logPromocao && Array.isArray(estoque.logPromocao) && estoque.logPromocao.length > 0) {
          const lastIndex = estoque.logPromocao.length - 1;
          estoque.logPromocao[lastIndex].ativo = false;
          estoque.logPromocao[lastIndex].dataFim = isoSeconds();
          await estoque.save();
        }
      }
    }

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

// Atualizar imagens de uma variante específica
export const updateVariantImages = async (req: Request, res: Response) => {
  try {
    const { codigo } = req.params;
    const { cor, tamanho, imagens } = req.body;

    // Novo comportamento: cor é obrigatória, tamanho é opcional
    if (!cor) {
      return res.status(400).json({
        error: 'Campos obrigatórios faltando',
        message: 'O campo cor é obrigatório',
      });
    }

    if (!Array.isArray(imagens)) {
      return res.status(400).json({
        error: 'Formato inválido',
        message: 'O campo imagens deve ser um array',
      });
    }

    // Buscar o produto no estoque
    const estoque = await Estoque.findOne({ codigoProduto: codigo });

    if (!estoque) {
      return res.status(404).json({ error: 'Produto não encontrado no estoque' });
    }

    // Buscar a variante pela cor (modelo novo) ou cor+tamanho (modelo legado)
    let varianteIndex = estoque.variantes?.findIndex((v: any) => v.cor === cor);

    if ((varianteIndex === -1 || varianteIndex === undefined) && tamanho) {
      varianteIndex = estoque.variantes?.findIndex(
        (v: any) => v.cor === cor && (v as any).tamanho === tamanho
      );
    }

    if (varianteIndex === -1 || varianteIndex === undefined) {
      return res.status(404).json({
        error: 'Variante não encontrada',
        message: tamanho
          ? `Variante com cor "${cor}" e tamanho "${tamanho}" não foi encontrada`
          : `Variante com cor "${cor}" não foi encontrada`,
      });
    }

    // Atualizar as imagens da variante
    if (estoque.variantes) {
      estoque.variantes[varianteIndex].imagens = imagens;
    }

    await estoque.save();

    res.json({
      message: 'Imagens da variante atualizadas com sucesso',
      estoque,
      variante: estoque.variantes?.[varianteIndex],
    });
  } catch (error) {
    console.error('Erro ao atualizar imagens da variante:', error);
    res.status(500).json({ error: 'Erro ao atualizar imagens da variante' });
  }
};
