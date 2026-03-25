import { Request, Response } from 'express';
import Estoque from '../models/Estoque';
import Produto from '../models/Produto';

export const executeStockCleanup = async (req: Request, res: Response) => {
  try {
    const dryRun = req.query.dryRun === 'true';
    
    // Buscar todos os documentos de estoque
    const docs = await Estoque.find().lean().exec();
    
    // Agrupar por codigoProduto
    const groups = new Map<string, any[]>();
    docs.forEach((doc: any) => {
      const key = doc.codigoProduto as string;
      const list = groups.get(key) || [];
      list.push(doc);
      groups.set(key, list);
    });
    
    const removidos: { codigoProduto: string; nomeProduto?: string }[] = [];
    const erros: { codigoProduto: string; error: string }[] = [];
    
    for (const [codigoProduto, docsArr] of groups) {
      // Calcular quantidade total de todas as variantes
      let quantidadeTotal = 0;
      docsArr.forEach((doc: any) => {
        if (doc.variantes && Array.isArray(doc.variantes)) {
          doc.variantes.forEach((v: any) => {
            quantidadeTotal += Number(v.quantidade) || 0;
          });
        } else {
          quantidadeTotal += Number(doc.quantidade) || 0;
        }
      });
      
      if (quantidadeTotal === 0) {
        if (!dryRun) {
          try {
            // Excluir registros de estoque
            await Estoque.deleteMany({ codigoProduto });
            // Excluir produto correspondente
            await Produto.deleteOne({ codigoProduto });
            
            removidos.push({ codigoProduto });
          } catch (err: any) {
            erros.push({ codigoProduto, error: err.message });
          }
        } else {
          // No dry run, buscar nome do produto para info
          const produto = await Produto.findOne({ codigoProduto }).select('nome').lean();
          removidos.push({ codigoProduto, nomeProduto: (produto as any)?.nome || 'Desconhecido' });
        }
      }
    }
    
    res.json({
      success: true,
      dryRun,
      totalAnalisados: groups.size,
      totalRemovidos: removidos.length,
      removidos,
      erros: erros.length > 0 ? erros : undefined,
      executadoEm: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Erro ao executar limpeza de estoque:', error);
    res.status(500).json({ error: 'Erro ao executar limpeza de estoque', message: error.message });
  }
};
