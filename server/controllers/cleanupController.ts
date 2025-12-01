import { Request, Response } from 'express';
import { list, del } from '@vercel/blob';
import VitrineVirtual from '../models/VitrineVirtual';
import Estoque from '../models/Estoque';
import StorageStats from '../models/StorageStats';

// Configuração do Vercel Blob
const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

if (!BLOB_READ_WRITE_TOKEN) {
  console.error('BLOB_READ_WRITE_TOKEN não configurado');
}

/**
 * Busca todas as URLs de imagens referenciadas no banco de dados
 */
async function getAllReferencedImageUrls(): Promise<Set<string>> {
  const referencedUrls = new Set<string>();

  try {
    // Buscar imagens da vitrine virtual
    const vitrineProducts = await VitrineVirtual.find({}, { variantes: 1 });
    
    vitrineProducts.forEach((product) => {
      product.variantes?.forEach((variante: any) => {
        variante.imagens?.forEach((url: string) => {
          if (url && url.startsWith('https://')) {
            referencedUrls.add(url);
          }
        });
      });
    });

    // Buscar imagens do estoque
    const estoqueProducts = await Estoque.find({}, { variantes: 1 });
    
    estoqueProducts.forEach((product) => {
      product.variantes?.forEach((variante: any) => {
        variante.imagens?.forEach((url: string) => {
          if (url && url.startsWith('https://')) {
            referencedUrls.add(url);
          }
        });
      });
    });

    console.log(`Total de imagens referenciadas no banco: ${referencedUrls.size}`);
    return referencedUrls;
  } catch (error) {
    console.error('Erro ao buscar imagens referenciadas:', error);
    throw error;
  }
}

/**
 * Identifica e remove imagens órfãs do storage
 */
export const cleanupOrphanImages = async (req: Request, res: Response) => {
  try {
    console.log('Iniciando cleanup de imagens órfãs...');

    if (!BLOB_READ_WRITE_TOKEN) {
      return res.status(500).json({
        error: 'BLOB_READ_WRITE_TOKEN não configurado',
        message: 'Configure a variável de ambiente BLOB_READ_WRITE_TOKEN no Render.com'
      });
    }

    // Buscar todas as imagens no Vercel Blob
    const { blobs } = await list({
      token: BLOB_READ_WRITE_TOKEN,
      prefix: 'products/',
    });
    
    console.log(`Total de imagens no storage: ${blobs.length}`);

    // Buscar todas as URLs referenciadas no banco
    const referencedUrls = await getAllReferencedImageUrls();

    // Identificar imagens órfãs
    const orphanImages: Array<{ url: string; pathname: string; size: number }> = [];
    
    for (const blob of blobs) {
      // Verificar se a URL está referenciada no banco
      if (!referencedUrls.has(blob.url)) {
        orphanImages.push({
          url: blob.url,
          pathname: blob.pathname,
          size: blob.size,
        });
      }
    }

    console.log(`Total de imagens órfãs encontradas: ${orphanImages.length}`);

    // Se modo dry-run, apenas retornar lista
    if (req.query.dryRun === 'true') {
      return res.json({
        success: true,
        dryRun: true,
        totalStorageImages: blobs.length,
        totalReferencedImages: referencedUrls.size,
        orphanImagesCount: orphanImages.length,
        orphanImages,
      });
    }

    // Deletar imagens órfãs
    const deletedImages: string[] = [];
    const failedDeletions: { url: string; error: string }[] = [];

    for (const orphan of orphanImages) {
      try {
        await del(orphan.url, { token: BLOB_READ_WRITE_TOKEN });
        deletedImages.push(orphan.url);
        console.log(`Imagem órfã deletada: ${orphan.pathname}`);
      } catch (error: any) {
        console.error(`Erro ao deletar ${orphan.pathname}:`, error);
        failedDeletions.push({ url: orphan.url, error: error.message });
      }
    }

    res.json({
      success: true,
      totalStorageImages: blobs.length,
      totalReferencedImages: referencedUrls.size,
      orphanImagesCount: orphanImages.length,
      deletedImagesCount: deletedImages.length,
      failedDeletionsCount: failedDeletions.length,
      deletedImages,
      failedDeletions,
    });
  } catch (error: any) {
    console.error('Erro ao executar cleanup de imagens:', error);
    res.status(500).json({
      error: 'Erro ao executar cleanup de imagens',
      message: error.message,
    });
  }
};

/**
 * Retorna estatísticas sobre o uso de storage
 */
export const getStorageStats = async (req: Request, res: Response) => {
  try {
    if (!BLOB_READ_WRITE_TOKEN) {
      return res.status(500).json({
        error: 'BLOB_READ_WRITE_TOKEN não configurado',
      });
    }

    // Buscar todas as imagens no Vercel Blob
    const { blobs } = await list({
      token: BLOB_READ_WRITE_TOKEN,
      prefix: 'products/',
    });
    
    const referencedUrls = await getAllReferencedImageUrls();

    // Calcular tamanho total
    const totalSize = blobs.reduce((sum, blob) => sum + blob.size, 0);

    const stats = {
      totalImages: blobs.length,
      referencedImages: referencedUrls.size,
      orphanImages: blobs.length - referencedUrls.size,
      totalSizeBytes: totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
    };

    // Salvar estatísticas históricas
    try {
      await StorageStats.create({
        timestamp: new Date(),
        ...stats,
      });
    } catch (histError) {
      console.warn('Erro ao salvar estatísticas históricas:', histError);
    }

    res.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    console.error('Erro ao buscar estatísticas de storage:', error);
    res.status(500).json({
      error: 'Erro ao buscar estatísticas de storage',
      message: error.message,
    });
  }
};

/**
 * Retorna histórico de estatísticas de storage
 */
export const getStorageHistory = async (req: Request, res: Response) => {
  try {
    const { days = 30 } = req.query;
    const daysNum = parseInt(days as string, 10);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    const history = await StorageStats.find({
      timestamp: { $gte: startDate }
    }).sort({ timestamp: 1 }).limit(100);

    res.json({
      success: true,
      history,
    });
  } catch (error: any) {
    console.error('Erro ao buscar histórico de storage:', error);
    res.status(500).json({
      error: 'Erro ao buscar histórico de storage',
      message: error.message,
    });
  }
};
