import { Request, Response } from 'express';
import { uploadImageToBlob, uploadMultipleImages } from '../services/imageUploadService';

/**
 * Upload de uma única imagem
 */
export const uploadSingleImage = async (req: Request, res: Response) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Imagem não fornecida' });
    }

    const result = await uploadImageToBlob(image);

    res.json({
      success: true,
      url: result.url,
      size: result.size,
      contentType: result.contentType,
    });
  } catch (error: any) {
    console.error('Erro ao fazer upload de imagem:', error);
    res.status(500).json({ 
      error: 'Erro ao fazer upload da imagem',
      message: error.message 
    });
  }
};

/**
 * Upload de múltiplas imagens
 */
export const uploadMultipleImagesEndpoint = async (req: Request, res: Response) => {
  try {
    const { images } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'Nenhuma imagem fornecida' });
    }

    const urls = await uploadMultipleImages(images);

    res.json({
      success: true,
      urls,
      count: urls.length,
    });
  } catch (error: any) {
    console.error('Erro ao fazer upload de imagens:', error);
    res.status(500).json({ 
      error: 'Erro ao fazer upload das imagens',
      message: error.message 
    });
  }
};
