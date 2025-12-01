import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { cacheMiddleware, CACHE_TTL } from '../middleware/cache';
import Produto from '../models/Produto';
import Estoque from '../models/Estoque';

const router = express.Router();

/**
 * @swagger
 * /api/search/produtos:
 *   get:
 *     summary: Busca avançada de produtos com filtros combinados
 *     description: |
 *       Busca produtos aplicando múltiplos filtros simultaneamente.
 *       Utiliza índices compostos do MongoDB para otimização.
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: termo
 *         schema:
 *           type: string
 *         description: Termo de busca (nome ou descrição)
 *       - in: query
 *         name: categoria
 *         schema:
 *           type: string
 *         description: Filtrar por categoria
 *       - in: query
 *         name: precoMin
 *         schema:
 *           type: number
 *         description: Preço mínimo
 *       - in: query
 *         name: precoMax
 *         schema:
 *           type: number
 *         description: Preço máximo
 *       - in: query
 *         name: emEstoque
 *         schema:
 *           type: boolean
 *         description: Apenas produtos com estoque disponível
 *       - in: query
 *         name: emPromocao
 *         schema:
 *           type: boolean
 *         description: Apenas produtos em promoção
 *       - in: query
 *         name: novidade
 *         schema:
 *           type: boolean
 *         description: Apenas novidades
 *       - in: query
 *         name: ordenar
 *         schema:
 *           type: string
 *           enum: [nome, preco-asc, preco-desc, data-asc, data-desc]
 *         description: Ordenação dos resultados
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Resultados da busca
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                 filtros:
 *                   type: object
 *       500:
 *         description: Erro na busca
 */
router.get('/produtos', authenticateToken, cacheMiddleware(CACHE_TTL.PRODUTOS), async (req, res) => {
  try {
    const {
      termo,
      categoria,
      precoMin,
      precoMax,
      emEstoque,
      emPromocao,
      novidade,
      ordenar = 'nome',
      page = '1',
      limit = '50'
    } = req.query;

    // Construir query do MongoDB
    const query: any = {};

    // Filtro de categoria
    if (categoria) {
      query.categoria = categoria;
    }

    // Filtro de preço
    if (precoMin || precoMax) {
      query.precoVenda = {};
      if (precoMin) query.precoVenda.$gte = parseFloat(precoMin as string);
      if (precoMax) query.precoVenda.$lte = parseFloat(precoMax as string);
    }

    // Busca por estoque disponível
    let produtosFiltrados: any[] = [];
    
    if (emEstoque === 'true' || emPromocao === 'true' || novidade === 'true') {
      // Buscar no estoque primeiro se algum filtro de estoque está ativo
      const estoqueQuery: any = { ativo: true };
      
      if (emPromocao === 'true') estoqueQuery.emPromocao = true;
      if (novidade === 'true') estoqueQuery.isNovidade = true;
      
      const estoqueItems = await Estoque
        .find(estoqueQuery)
        .distinct('codigoProduto')
        .lean()
        .exec();

      if (estoqueItems.length > 0) {
        query.codigoProduto = { $in: estoqueItems };
      } else {
        // Sem produtos no estoque com os filtros aplicados
        return res.json({
          data: [],
          pagination: { total: 0, page: parseInt(page as string), limit: parseInt(limit as string), pages: 0 },
          filtros: { termo, categoria, precoMin, precoMax, emEstoque, emPromocao, novidade }
        });
      }
    }

    // Busca textual (usa índice text)
    if (termo) {
      query.$text = { $search: termo as string };
    }

    // Ordenação
    let sort: any = {};
    switch (ordenar) {
      case 'preco-asc':
        sort = { precoVenda: 1 };
        break;
      case 'preco-desc':
        sort = { precoVenda: -1 };
        break;
      case 'data-asc':
        sort = { dataCadastro: 1 };
        break;
      case 'data-desc':
        sort = { dataCadastro: -1 };
        break;
      default:
        sort = { nome: 1 };
    }

    // Paginação
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Executar busca com paginação
    const [produtos, total] = await Promise.all([
      Produto
        .find(query)
        .select('-historicoPrecosn') // Excluir histórico pesado
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean()
        .exec(),
      Produto.countDocuments(query)
    ]);

    // Se filtro de estoque está ativo, enriquecer com dados de estoque
    if (emEstoque === 'true') {
      const codigosProdutos = produtos.map(p => p.codigoProduto);
      const estoqueItems = await Estoque
        .find({ codigoProduto: { $in: codigosProdutos }, ativo: true })
        .lean()
        .exec();

      // Agrupar estoque por produto
      const estoqueMap = new Map<string, number>();
      estoqueItems.forEach((item: any) => {
        const qtdTotal = item.variantes?.reduce((sum: number, v: any) => sum + (v.quantidade || 0), 0) || 0;
        const current = estoqueMap.get(item.codigoProduto) || 0;
        estoqueMap.set(item.codigoProduto, current + qtdTotal);
      });

      // Filtrar apenas produtos com estoque > 0
      produtosFiltrados = produtos.filter(p => {
        const qtd = estoqueMap.get(p.codigoProduto) || 0;
        return qtd > 0;
      }).map(p => ({
        ...p,
        quantidadeEmEstoque: estoqueMap.get(p.codigoProduto) || 0
      }));
    } else {
      produtosFiltrados = produtos;
    }

    res.json({
      data: produtosFiltrados,
      pagination: {
        total: emEstoque === 'true' ? produtosFiltrados.length : total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil((emEstoque === 'true' ? produtosFiltrados.length : total) / limitNum)
      },
      filtros: { termo, categoria, precoMin, precoMax, emEstoque, emPromocao, novidade, ordenar }
    });
  } catch (error) {
    console.error('Erro na busca avançada:', error);
    res.status(500).json({ error: 'Erro ao realizar busca' });
  }
});

export default router;
