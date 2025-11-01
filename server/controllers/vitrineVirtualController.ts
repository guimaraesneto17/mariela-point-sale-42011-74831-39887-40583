import { Request, Response } from 'express';
import VitrineVirtual from '../models/VitrineVirtual';
import Estoque from '../models/Estoque';
import Produto from '../models/Produto';

// Helper para enriquecer dados da vitrine com informações de estoque e produto
const enrichVitrineItem = async (vitrineItem: any) => {
  const estoqueDocs = await Estoque.find({ codigoProduto: vitrineItem.codigoProduto });
  const produto = await Produto.findOne({ codigoProduto: vitrineItem.codigoProduto });
  
  // Agregar variantes do estoque
  const variantes: Array<{ cor: string; tamanho: string; quantidade: number }> = [];
  let emPromocao = false;
  let isNovidade = false;
  let precoPromocional: number | null = null;
  
  estoqueDocs.forEach((doc) => {
    emPromocao = emPromocao || !!doc.emPromocao;
    isNovidade = isNovidade || !!doc.isNovidade;
    if (doc.precoPromocional) precoPromocional = doc.precoPromocional;
    
    if (doc.variantes && doc.variantes.length > 0) {
      doc.variantes.forEach((v: any) => {
        const existing = variantes.find(x => x.cor === v.cor && x.tamanho === v.tamanho);
        if (existing) {
          existing.quantidade += Number(v.quantidade) || 0;
        } else {
          variantes.push({
            cor: v.cor,
            tamanho: v.tamanho,
            quantidade: Number(v.quantidade) || 0
          });
        }
      });
    }
  });
  
  // Calcular disponibilidade por tamanho
  const sizes = [...new Set(variantes.map(v => v.tamanho))].map(tamanho => ({
    size: tamanho,
    totalAvailable: variantes
      .filter(v => v.tamanho === tamanho)
      .reduce((sum, v) => sum + v.quantidade, 0)
  }));
  
  const totalAvailable = variantes.reduce((sum, v) => sum + v.quantidade, 0);
  
  // Determinar status do produto
  let statusProduct = 'Disponível';
  if (totalAvailable === 0) {
    statusProduct = 'Esgotado';
  } else if (totalAvailable < 5) {
    statusProduct = 'Últimas unidades';
  }
  
  return {
    id: produto?._id || vitrineItem._id,
    code: vitrineItem.codigoProduto,
    title: produto?.nome || vitrineItem.nome,
    category: produto?.categoria || vitrineItem.categoria,
    image: (produto?.imagens && produto.imagens[0]) || vitrineItem.imagens[0] || 'default.jpg',
    price: emPromocao && precoPromocional ? `R$ ${precoPromocional}` : `R$ ${produto?.precoVenda || vitrineItem.precoVenda}`,
    priceValue: emPromocao && precoPromocional ? precoPromocional : (produto?.precoVenda || vitrineItem.precoVenda),
    originalPrice: emPromocao && precoPromocional ? `R$ ${produto?.precoVenda || vitrineItem.precoVenda}` : null,
    originalPriceValue: emPromocao && precoPromocional ? (produto?.precoVenda || vitrineItem.precoVenda) : null,
    isOnSale: emPromocao,
    isNew: isNovidade,
    availability: {
      colors: [...new Set(variantes.map(v => v.cor))],
      sizes,
      totalAvailable
    },
    sizes: [...new Set(variantes.map(v => v.tamanho))],
    statusProduct,
    updatedAt: vitrineItem.dataAtualizacao || vitrineItem.dataCadastro
  };
};

export const getAllVitrineVirtual = async (req: Request, res: Response) => {
  try {
    const vitrineProdutos = await VitrineVirtual.find().sort({ dataCadastro: -1 });
    const produtosEnriquecidos = await Promise.all(
      vitrineProdutos.map(item => enrichVitrineItem(item))
    );
    res.json(produtosEnriquecidos);
  } catch (error) {
    console.error('Erro ao buscar vitrine virtual:', error);
    res.status(500).json({ error: 'Erro ao buscar vitrine virtual' });
  }
};

export const getVitrineVirtualById = async (req: Request, res: Response) => {
  try {
    const produto = await VitrineVirtual.findById(req.params.id);
    if (!produto) {
      return res.status(404).json({ error: 'Produto da vitrine não encontrado' });
    }
    const produtoEnriquecido = await enrichVitrineItem(produto);
    res.json(produtoEnriquecido);
  } catch (error) {
    console.error('Erro ao buscar produto da vitrine:', error);
    res.status(500).json({ error: 'Erro ao buscar produto da vitrine' });
  }
};

export const getNovidades = async (req: Request, res: Response) => {
  try {
    // Buscar produtos na vitrine que estão marcados como novidade no estoque
    const vitrineProdutos = await VitrineVirtual.find().sort({ dataCadastro: -1 });
    const produtosEnriquecidos = await Promise.all(
      vitrineProdutos.map(item => enrichVitrineItem(item))
    );
    // Filtrar apenas as novidades
    const novidades = produtosEnriquecidos.filter(p => p.isNew);
    res.json(novidades);
  } catch (error) {
    console.error('Erro ao buscar novidades:', error);
    res.status(500).json({ error: 'Erro ao buscar novidades' });
  }
};

export const getPromocoes = async (req: Request, res: Response) => {
  try {
    // Buscar produtos na vitrine que estão em promoção no estoque
    const vitrineProdutos = await VitrineVirtual.find().sort({ dataCadastro: -1 });
    const produtosEnriquecidos = await Promise.all(
      vitrineProdutos.map(item => enrichVitrineItem(item))
    );
    // Filtrar apenas as promoções
    const promocoes = produtosEnriquecidos.filter(p => p.isOnSale);
    res.json(promocoes);
  } catch (error) {
    console.error('Erro ao buscar promoções:', error);
    res.status(500).json({ error: 'Erro ao buscar promoções' });
  }
};

export const getVitrineVirtualByCodigo = async (req: Request, res: Response) => {
  try {
    const produto = await VitrineVirtual.findOne({ codigoProduto: req.params.codigo });
    if (!produto) {
      return res.status(404).json({ error: 'Produto da vitrine não encontrado' });
    }
    const produtoEnriquecido = await enrichVitrineItem(produto);
    res.json(produtoEnriquecido);
  } catch (error) {
    console.error('Erro ao buscar produto da vitrine:', error);
    res.status(500).json({ error: 'Erro ao buscar produto da vitrine' });
  }
};

export const createVitrineVirtual = async (req: Request, res: Response) => {
  try {
    const produto = new VitrineVirtual(req.body);
    await produto.save();
    res.status(201).json(produto);
  } catch (error) {
    console.error('Erro ao criar produto na vitrine:', error);
    res.status(400).json({ error: 'Erro ao criar produto na vitrine' });
  }
};

export const updateVitrineVirtual = async (req: Request, res: Response) => {
  try {
    const produto = await VitrineVirtual.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!produto) {
      return res.status(404).json({ error: 'Produto da vitrine não encontrado' });
    }
    res.json(produto);
  } catch (error) {
    console.error('Erro ao atualizar produto na vitrine:', error);
    res.status(400).json({ error: 'Erro ao atualizar produto na vitrine' });
  }
};

export const deleteVitrineVirtual = async (req: Request, res: Response) => {
  try {
    const produto = await VitrineVirtual.findByIdAndDelete(req.params.id);
    if (!produto) {
      return res.status(404).json({ error: 'Produto da vitrine não encontrado' });
    }
    res.json({ message: 'Produto da vitrine removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover produto da vitrine:', error);
    res.status(500).json({ error: 'Erro ao remover produto da vitrine' });
  }
};
