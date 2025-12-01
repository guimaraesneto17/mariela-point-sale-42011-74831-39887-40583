import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface UploadResult {
  url: string;
  size: number;
  contentType: string;
}

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

/**
 * Comprime uma imagem usando Sharp
 * @param buffer Buffer da imagem original
 * @param options Opções de compressão
 * @returns Buffer da imagem comprimida
 */
async function compressImage(
  buffer: Buffer,
  options: CompressionOptions = {}
): Promise<{ buffer: Buffer; format: string }> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 85,
  } = options;

  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();
    
    console.log('Imagem original:', {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: buffer.length,
    });

    // Redimensionar mantendo aspect ratio
    const resized = image.resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    });

    // Converter para JPEG ou WebP com compressão
    let compressed;
    let format = 'jpeg';

    if (metadata.format === 'png' && metadata.hasAlpha) {
      // PNG com transparência -> WebP
      compressed = resized.webp({ quality });
      format = 'webp';
    } else {
      // Tudo mais -> JPEG
      compressed = resized.jpeg({ quality, progressive: true });
      format = 'jpeg';
    }

    const compressedBuffer = await compressed.toBuffer();

    const compressionRatio = ((1 - compressedBuffer.length / buffer.length) * 100).toFixed(2);
    console.log('Imagem comprimida:', {
      originalSize: buffer.length,
      compressedSize: compressedBuffer.length,
      compressionRatio: `${compressionRatio}%`,
      format,
    });

    return { buffer: compressedBuffer, format };
  } catch (error) {
    console.error('Erro ao comprimir imagem:', error);
    throw new Error('Falha na compressão da imagem');
  }
}

/**
 * Faz upload de uma imagem base64 para Supabase Storage com compressão automática
 * @param base64Image String base64 da imagem (com ou sem data URI prefix)
 * @param filename Nome do arquivo (opcional, será gerado automaticamente se não fornecido)
 * @returns URL pública da imagem no storage
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
    
    // Comprimir imagem
    const { buffer: compressedBuffer, format } = await compressImage(originalBuffer);

    // Gerar nome de arquivo único
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const uniqueFilename = filename || `produto-${timestamp}-${randomStr}.${format}`;
    const filePath = `products/${uniqueFilename}`;

    // Upload para Supabase Storage
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, compressedBuffer, {
        contentType: `image/${format}`,
        cacheControl: '31536000', // 1 ano
        upsert: false,
      });

    if (error) {
      console.error('Erro no upload para Supabase:', error);
      throw new Error(`Falha no upload: ${error.message}`);
    }

    // Obter URL pública
    const { data: publicUrlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return {
      url: publicUrlData.publicUrl,
      size: compressedBuffer.length,
      contentType: `image/${format}`,
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
 * @returns Array de URLs públicas
 */
export async function uploadMultipleImages(
  base64Images: string[]
): Promise<string[]> {
  const uploadPromises = base64Images.map((img) => uploadImageToBlob(img));
  const results = await Promise.all(uploadPromises);
  return results.map((result) => result.url);
}

/**
 * Deleta uma imagem do Supabase Storage
 * @param imageUrl URL da imagem a ser deletada
 */
export async function deleteImageFromBlob(imageUrl: string): Promise<void> {
  try {
    // Extrair caminho do arquivo da URL
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/product-images/');
    if (pathParts.length < 2) {
      console.warn('URL de imagem inválida:', imageUrl);
      return;
    }
    const filePath = pathParts[1];

    const { error } = await supabase.storage
      .from('product-images')
      .remove([filePath]);

    if (error) {
      console.error('Erro ao deletar imagem:', error);
    } else {
      console.log('Imagem deletada com sucesso:', filePath);
    }
  } catch (error) {
    console.error('Erro ao processar deleção de imagem:', error);
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
 * @returns Array de caminhos de arquivos
 */
export async function listAllImages(): Promise<string[]> {
  try {
    const { data, error } = await supabase.storage
      .from('product-images')
      .list('products', {
        limit: 10000,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      console.error('Erro ao listar imagens:', error);
      return [];
    }

    return data.map((file) => `products/${file.name}`);
  } catch (error) {
    console.error('Erro ao processar listagem de imagens:', error);
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
 * @returns Array de URLs
 */
export async function processImages(images: string[]): Promise<string[]> {
  const processedImages: string[] = [];

  for (const img of images) {
    if (isBase64Image(img)) {
      // É base64, fazer upload
      const result = await uploadImageToBlob(img);
      processedImages.push(result.url);
    } else if (img.startsWith('http://') || img.startsWith('https://')) {
      // Já é URL, manter
      processedImages.push(img);
    } else {
      console.warn('Formato de imagem não reconhecido:', img.substring(0, 50));
    }
  }

  return processedImages;
}
