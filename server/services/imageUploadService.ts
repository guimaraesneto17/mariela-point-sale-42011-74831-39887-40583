import { put, del, list } from '@vercel/blob';
import sharp from 'sharp';
import { addWatermark } from '../lib/pdfWatermark';

// Configuração do Vercel Blob
const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

if (!BLOB_READ_WRITE_TOKEN) {
  throw new Error('BLOB_READ_WRITE_TOKEN não configurado. Configure no Render.com');
}

interface UploadResult {
  urls: {
    thumbnail: string;
    medium: string;
    full: string;
  };
  sizes: {
    thumbnail: number;
    medium: number;
    full: number;
  };
  totalSize: number;
  originalSize: number;
  compressionRatio: string;
}

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

/**
 * Comprime uma imagem em múltiplas versões (thumbnail, medium, full)
 * @param buffer Buffer da imagem original
 * @param baseFilename Nome base do arquivo (sem extensão)
 * @returns Array com buffers e formatos de cada versão
 */
async function compressImageMultipleVersions(
  buffer: Buffer,
  baseFilename: string
): Promise<Array<{ buffer: Buffer; format: string; size: 'thumbnail' | 'medium' | 'full' }>> {
  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();
    
    console.log('Imagem original:', {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: buffer.length,
    });

    const versions: Array<{ buffer: Buffer; format: string; size: 'thumbnail' | 'medium' | 'full' }> = [];
    
    // Thumbnail: 200x200
    const thumbnailImage = sharp(buffer).resize(200, 200, {
      fit: 'inside',
      withoutEnlargement: true,
    });
    
    let thumbnailCompressed;
    let thumbnailFormat = 'jpeg';
    
    if (metadata.format === 'png' && metadata.hasAlpha) {
      thumbnailCompressed = thumbnailImage.webp({ quality: 80 });
      thumbnailFormat = 'webp';
    } else {
      thumbnailCompressed = thumbnailImage.jpeg({ quality: 80, progressive: true });
      thumbnailFormat = 'jpeg';
    }
    
    const thumbnailBuffer = await thumbnailCompressed.toBuffer();
    versions.push({ buffer: thumbnailBuffer, format: thumbnailFormat, size: 'thumbnail' });
    
    // Medium: 800x800
    const mediumImage = sharp(buffer).resize(800, 800, {
      fit: 'inside',
      withoutEnlargement: true,
    });
    
    let mediumCompressed;
    let mediumFormat = 'jpeg';
    
    if (metadata.format === 'png' && metadata.hasAlpha) {
      mediumCompressed = mediumImage.webp({ quality: 85 });
      mediumFormat = 'webp';
    } else {
      mediumCompressed = mediumImage.jpeg({ quality: 85, progressive: true });
      mediumFormat = 'jpeg';
    }
    
    const mediumBuffer = await mediumCompressed.toBuffer();
    versions.push({ buffer: mediumBuffer, format: mediumFormat, size: 'medium' });
    
    // Full: 1920x1920
    const fullImage = sharp(buffer).resize(1920, 1920, {
      fit: 'inside',
      withoutEnlargement: true,
    });
    
    let fullCompressed;
    let fullFormat = 'jpeg';
    
    if (metadata.format === 'png' && metadata.hasAlpha) {
      fullCompressed = fullImage.webp({ quality: 85 });
      fullFormat = 'webp';
    } else {
      fullCompressed = fullImage.jpeg({ quality: 85, progressive: true });
      fullFormat = 'jpeg';
    }
    
    const fullBuffer = await fullCompressed.toBuffer();
    versions.push({ buffer: fullBuffer, format: fullFormat, size: 'full' });

    const totalCompressedSize = thumbnailBuffer.length + mediumBuffer.length + fullBuffer.length;
    const compressionRatio = ((1 - totalCompressedSize / (buffer.length * 3)) * 100).toFixed(2);
    
    console.log('Imagens comprimidas:', {
      originalSize: buffer.length,
      thumbnail: { size: thumbnailBuffer.length, format: thumbnailFormat },
      medium: { size: mediumBuffer.length, format: mediumFormat },
      full: { size: fullBuffer.length, format: fullFormat },
      totalSize: totalCompressedSize,
      compressionRatio: `${compressionRatio}%`,
    });

    return versions;
  } catch (error) {
    console.error('Erro ao comprimir imagem:', error);
    throw new Error('Falha na compressão da imagem');
  }
}

/**
 * Faz upload de uma imagem base64 para Vercel Blob com compressão progressiva
 * @param base64Image String base64 da imagem (com ou sem data URI prefix)
 * @param filename Nome base do arquivo (opcional, será gerado automaticamente se não fornecido)
 * @returns URLs e tamanhos de todas as versões da imagem
 */
export async function uploadImageToBlob(
  base64Image: string,
  filename?: string
): Promise<UploadResult> {
  try {
    // Extrair dados base64
    let base64Data: string;
    let originalContentType = 'image/jpeg';

    if (base64Image.startsWith('data:')) {
      const matches = base64Image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        throw new Error('Formato de imagem base64 inválido');
      }
      originalContentType = matches[1];
      base64Data = matches[2];
    } else {
      base64Data = base64Image;
    }

    // Converter base64 para Buffer
    const originalBuffer = Buffer.from(base64Data, 'base64');
    const originalSize = originalBuffer.length;
    
    // Aplicar watermark no buffer original
    const watermarkedBuffer = await addWatermark(originalBuffer, {
      enabled: true,
      opacity: 0.3,
      position: 'bottom-right',
      scale: 0.15,
      margin: 20
    });
    
    // Gerar nome base único
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const baseFilename = filename?.replace(/\.[^/.]+$/, '') || `produto-${timestamp}-${randomStr}`;
    
    // Comprimir em múltiplas versões (usando o buffer com watermark)
    const versions = await compressImageMultipleVersions(watermarkedBuffer, baseFilename);

    // Upload de todas as versões para Vercel Blob
    const uploadResults: { [key: string]: { url: string; size: number } } = {};
    
    for (const version of versions) {
      const versionFilename = `products/${baseFilename}-${version.size}.${version.format}`;

      const blob = await put(versionFilename, version.buffer, {
        access: 'public',
        token: BLOB_READ_WRITE_TOKEN,
        contentType: `image/${version.format}`,
      });

      uploadResults[version.size] = {
        url: blob.url,
        size: version.buffer.length,
      };
      
      console.log(`Upload concluído: ${versionFilename} -> ${blob.url}`);
    }

    const totalSize = Object.values(uploadResults).reduce((sum, v) => sum + v.size, 0);
    const compressionRatio = ((1 - totalSize / (originalSize * 3)) * 100).toFixed(2);

    return {
      urls: {
        thumbnail: uploadResults.thumbnail.url,
        medium: uploadResults.medium.url,
        full: uploadResults.full.url,
      },
      sizes: {
        thumbnail: uploadResults.thumbnail.size,
        medium: uploadResults.medium.size,
        full: uploadResults.full.size,
      },
      totalSize,
      originalSize,
      compressionRatio: `${compressionRatio}%`,
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Erro ao fazer upload de imagem:', error);
      throw new Error(`Falha no upload da imagem: ${error.message}`);
    } else {
      console.error('Erro desconhecido ao fazer upload de imagem:', error);
      throw new Error('Falha no upload da imagem: erro desconhecido');
    }
  }
}

/**
 * Faz upload de múltiplas imagens
 * @param base64Images Array de strings base64
 * @returns Array de resultados com URLs de todas as versões
 */
export async function uploadMultipleImages(
  base64Images: string[]
): Promise<UploadResult[]> {
  const uploadPromises = base64Images.map((img) => uploadImageToBlob(img));
  return await Promise.all(uploadPromises);
}

/**
 * Deleta uma imagem do Vercel Blob
 * @param imageUrl URL da imagem a ser deletada
 */
export async function deleteImageFromBlob(imageUrl: string): Promise<void> {
  try {
    await del(imageUrl, { token: BLOB_READ_WRITE_TOKEN });
    console.log('Imagem deletada com sucesso:', imageUrl);
  } catch (error) {
    console.error('Erro ao deletar imagem:', error);
  }
}

/**
 * Deleta múltiplas imagens
 * @param imageUrls Array de URLs para deletar
 */
export async function deleteMultipleImages(imageUrls: string[]): Promise<void> {
  const deletePromises = imageUrls.map((url) => deleteImageFromBlob(url));
  await Promise.allSettled(deletePromises);
}

/**
 * Lista todas as imagens no storage
 * @returns Array de URLs de arquivos
 */
export async function listAllImages(): Promise<string[]> {
  try {
    const { blobs } = await list({
      token: BLOB_READ_WRITE_TOKEN,
      prefix: 'products/',
    });

    return blobs.map((blob: any) => blob.url);
  } catch (error) {
    console.error('Erro ao listar imagens:', error);
    return [];
  }
}

/**
 * Verifica se uma string é uma imagem base64
 * @param str String a ser verificada
 */
export function isBase64Image(str: string): boolean {
  if (!str) return false;

  // Verifica se tem o prefixo data:image
  if (str.startsWith('data:image/')) {
    return true;
  }

  // Verifica se parece com base64 puro
  const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
  return base64Regex.test(str) && str.length > 100;
}

/**
 * Processa imagens: converte base64 para URL ou mantém URL existente
 * @param images Array de imagens (base64 ou URL)
 * @returns Array de resultados com URLs de todas as versões
 */
export async function processImages(images: string[]): Promise<UploadResult[]> {
  const processedImages: UploadResult[] = [];

  for (const img of images) {
    if (isBase64Image(img)) {
      // É base64, fazer upload com múltiplas versões
      const result = await uploadImageToBlob(img);
      processedImages.push(result);
    } else if (img.startsWith('http://') || img.startsWith('https://')) {
      // Já é URL, retornar formato de resultado compatível
      // (assumindo que é a versão full)
      processedImages.push({
        urls: {
          thumbnail: img,
          medium: img,
          full: img,
        },
        sizes: {
          thumbnail: 0,
          medium: 0,
          full: 0,
        },
        totalSize: 0,
        originalSize: 0,
        compressionRatio: '0%',
      });
    } else {
      console.warn('Formato de imagem não reconhecido:', img.substring(0, 50));
    }
  }

  return processedImages;
}
