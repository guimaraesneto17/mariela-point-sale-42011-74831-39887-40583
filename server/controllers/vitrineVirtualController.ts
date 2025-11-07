import { Request, Response } from 'express';
import Estoque from '../models/Estoque';
import Produto from '../models/Produto';

// Gerar view agregada da vitrine virtual (combina Estoque + Produto)
const buildVitrineView = async () => {
  try {
    // Buscar todos os produtos e estoques
    const produtos = await Produto.find();
    const estoques = await Estoque.find();
    
    const vitrineView: any[] = [];
    let idCounter = 1;
    
    for (const produto of produtos) {
      const estoquesProduto = estoques.filter(e => e.codigoProduto === produto.codigoProduto);
      
      if (estoquesProduto.length === 0) continue;
      
      // Agregar informações de promoção e novidade
      let isOnSale = false;
      let isNew = false;
      let precoPromocional: number | null = null;
      const variants: any[] = [];
      const allImages: string[] = [];
      
      estoquesProduto.forEach((estoque: any) => {
        isOnSale = isOnSale || !!estoque.emPromocao;
        isNew = isNew || !!estoque.isNovidade;
        if (estoque.precoPromocional && !precoPromocional) {
          precoPromocional = estoque.precoPromocional;
        }
        
        // Agregar variantes e imagens
        if (estoque.variantes && estoque.variantes.length > 0) {
          estoque.variantes.forEach((v: any) => {
            variants.push({
              color: v.cor,
              size: v.tamanho,
              available: Number(v.quantidade) || 0
            });
            // Coletar imagens das variantes
            if (v.imagens && v.imagens.length > 0) {
              allImages.push(...v.imagens);
            }
          });
        }
      });
      
      const totalAvailable = variants.reduce((sum, v) => sum + v.available, 0);
      
      let statusProduct = 'Disponível';
      if (totalAvailable === 0) {
        statusProduct = 'Esgotado';
      } else if (totalAvailable < 5) {
        statusProduct = 'Últimas unidades';
      }
      
      // Estrutura conforme especificação
      vitrineView.push({
        isOnSale,
        isNew,
        variants,
        totalAvailable,
        statusProduct,
        id: idCounter++,
        code: produto.codigoProduto,
        image: allImages.length > 0 ? allImages : ['default.jpg'],
        title: produto.nome,
        price: isOnSale && precoPromocional ? `R$ ${precoPromocional}` : `R$ ${produto.precoVenda.toFixed(2)}`,
        priceValue: isOnSale && precoPromocional ? precoPromocional : produto.precoVenda,
        originalPrice: isOnSale && precoPromocional ? `R$ ${produto.precoVenda.toFixed(2)}` : null,
        originalPriceValue: isOnSale && precoPromocional ? produto.precoVenda : null,
        category: produto.categoria,
        updatedAt: produto.dataAtualizacao || produto.dataCadastro
      });
    }
    
    return vitrineView;
  } catch (error) {
    console.error('Erro ao construir view da vitrine:', error);
    throw error;
  }
};

export const getAllVitrineVirtual = async (req: Request, res: Response) => {
  try {
    const vitrineView = await buildVitrineView();
    res.json(vitrineView);
  } catch (error) {
    console.error('Erro ao buscar vitrine virtual:', error);
    res.status(500).json({ error: 'Erro ao buscar vitrine virtual' });
  }
};

export const getVitrineVirtualById = async (req: Request, res: Response) => {
  try {
    const vitrineView = await buildVitrineView();
    const produto = vitrineView.find(p => p.id === parseInt(req.params.id));
    if (!produto) {
      return res.status(404).json({ error: 'Produto da vitrine não encontrado' });
    }
    res.json(produto);
  } catch (error) {
    console.error('Erro ao buscar produto da vitrine:', error);
    res.status(500).json({ error: 'Erro ao buscar produto da vitrine' });
  }
};

export const getNovidades = async (req: Request, res: Response) => {
  try {
    const vitrineView = await buildVitrineView();
    const novidades = vitrineView.filter(p => p.isNew);
    res.json(novidades);
  } catch (error) {
    console.error('Erro ao buscar novidades:', error);
    res.status(500).json({ error: 'Erro ao buscar novidades' });
  }
};

export const getPromocoes = async (req: Request, res: Response) => {
  try {
    const vitrineView = await buildVitrineView();
    const promocoes = vitrineView.filter(p => p.isOnSale);
    res.json(promocoes);
  } catch (error) {
    console.error('Erro ao buscar promoções:', error);
    res.status(500).json({ error: 'Erro ao buscar promoções' });
  }
};

export const getVitrineVirtualByCodigo = async (req: Request, res: Response) => {
  try {
    const vitrineView = await buildVitrineView();
    const produto = vitrineView.find(p => p.code === req.params.codigo);
    if (!produto) {
      return res.status(404).json({ error: 'Produto da vitrine não encontrado' });
    }
    res.json(produto);
  } catch (error) {
    console.error('Erro ao buscar produto da vitrine:', error);
    res.status(500).json({ error: 'Erro ao buscar produto da vitrine' });
  }
};

export const createVitrineVirtual = async (req: Request, res: Response) => {
  try {
    res.status(501).json({ error: 'Vitrine Virtual é somente leitura - use Estoque e Produto para modificar dados' });
  } catch (error) {
    console.error('Erro ao criar produto na vitrine:', error);
    res.status(400).json({ error: 'Erro ao criar produto na vitrine' });
  }
};

export const updateVitrineVirtual = async (req: Request, res: Response) => {
  try {
    res.status(501).json({ error: 'Vitrine Virtual é somente leitura - use Estoque e Produto para modificar dados' });
  } catch (error) {
    console.error('Erro ao atualizar produto na vitrine:', error);
    res.status(400).json({ error: 'Erro ao atualizar produto na vitrine' });
  }
};

export const deleteVitrineVirtual = async (req: Request, res: Response) => {
  try {
    res.status(501).json({ error: 'Vitrine Virtual é somente leitura - use Estoque e Produto para modificar dados' });
  } catch (error) {
    console.error('Erro ao remover produto da vitrine:', error);
    res.status(500).json({ error: 'Erro ao remover produto da vitrine' });
  }
};
