import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import VitrineVirtual from '../models/VitrineVirtual';
import StorageStats from '../models/StorageStats';
import { listAllImages, deleteImageFromBlob } from '../services/imageUploadService';

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
          if (url && url.includes('product-images')) {
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
 * Extrai o caminho do arquivo de uma URL do Supabase Storage
 */
function extractFilePathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/product-images/');
    return pathParts.length >= 2 ? pathParts[1] : null;
  } catch {
    return null;
  }
}

/**
 * Identifica e remove imagens órfãs do storage
 */
export const cleanupOrphanImages = async (req: Request, res: Response) => {
  try {
    console.log('Iniciando cleanup de imagens órfãs...');

    // Buscar todas as imagens no storage
    const storageImages = await listAllImages();
    console.log(`Total de imagens no storage: ${storageImages.length}`);

    // Buscar todas as URLs referenciadas no banco
    const referencedUrls = await getAllReferencedImageUrls();

    // Identificar imagens órfãs
    const orphanImages: string[] = [];
    
    for (const filePath of storageImages) {
      // Construir URL completa
      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);
      
      const publicUrl = data.publicUrl;

      // Verificar se a URL está referenciada no banco
      if (!referencedUrls.has(publicUrl)) {
        orphanImages.push(filePath);
      }
    }

    console.log(`Total de imagens órfãs encontradas: ${orphanImages.length}`);

    // Se modo dry-run, apenas retornar lista
    if (req.query.dryRun === 'true') {
      return res.json({
        success: true,
        dryRun: true,
        totalStorageImages: storageImages.length,
        totalReferencedImages: referencedUrls.size,
        orphanImagesCount: orphanImages.length,
        orphanImages: orphanImages.map((path) => {
          const { data } = supabase.storage
            .from('product-images')
            .getPublicUrl(path);
          return {
            path,
            url: data.publicUrl,
          };
        }),
      });
    }

    // Deletar imagens órfãs
    const deletedImages: string[] = [];
    const failedDeletions: { path: string; error: string }[] = [];

    for (const filePath of orphanImages) {
      try {
        const { error } = await supabase.storage
          .from('product-images')
          .remove([filePath]);

        if (error) {
          console.error(`Erro ao deletar ${filePath}:`, error);
          failedDeletions.push({ path: filePath, error: error.message });
        } else {
          deletedImages.push(filePath);
          console.log(`Imagem órfã deletada: ${filePath}`);
        }
      } catch (error: any) {
        console.error(`Erro ao processar deleção de ${filePath}:`, error);
        failedDeletions.push({ path: filePath, error: error.message });
      }
    }

    res.json({
      success: true,
      totalStorageImages: storageImages.length,
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
    const storageImages = await listAllImages();
    const referencedUrls = await getAllReferencedImageUrls();

    // Calcular tamanho total
    const { data: files } = await supabase.storage
      .from('product-images')
      .list('products', { limit: 10000 });

    const totalSize = files?.reduce((sum, file) => sum + (file.metadata?.size || 0), 0) || 0;

    const stats = {
      totalImages: storageImages.length,
      referencedImages: referencedUrls.size,
      orphanImages: storageImages.length - referencedUrls.size,
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
