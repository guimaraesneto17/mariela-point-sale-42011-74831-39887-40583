// NOTA: Serviço desativado - @vercel/blob removido para deploy no Render
// import { put, del } from '@vercel/blob';

/**
 * Serviço de upload de imagens (DESATIVADO)
 * TODO: Implementar alternativa ao Vercel Blob Storage
 */

interface UploadResult {
    url: string;
    size: number;
    contentType: string;
}

/**
 * Faz upload de uma imagem base64 para Vercel Blob Storage
 * @param base64Image String base64 da imagem (com ou sem data URI prefix)
 * @param filename Nome do arquivo (opcional, será gerado automaticamente se não fornecido)
 * @returns URL pública da imagem no storage
 */
export async function uploadImageToBlob(
    base64Image: string,
    filename?: string
): Promise<UploadResult> {
    // DESATIVADO: Vercel Blob não disponível
    throw new Error('Upload de imagens desativado - implementar alternativa ao Vercel Blob');
    
    /* CÓDIGO ORIGINAL COMENTADO
    try {
        // Extrair tipo MIME e dados base64
        let base64Data: string;
        let contentType = 'image/jpeg'; // padrão

        if (base64Image.startsWith('data:')) {
            const matches = base64Image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (!matches || matches.length !== 3) {
                throw new Error('Formato de imagem base64 inválido');
            }
            contentType = matches[1];
            base64Data = matches[2];
        } else {
            base64Data = base64Image;
        }

        // Converter base64 para Buffer
        const buffer = Buffer.from(base64Data, 'base64');

        // Gerar nome de arquivo único se não fornecido
        const uniqueFilename = filename || `produto-${Date.now()}-${Math.random().toString(36).substring(7)}.${getExtensionFromMime(contentType)}`;

        // Upload para Vercel Blob
        const blob = await put(uniqueFilename, buffer, {
            access: 'public',
            contentType,
        });

        return {
            url: blob.url,
            size: buffer.length,
            contentType,
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
    */
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
 * Deleta uma imagem do Vercel Blob Storage
 * @param imageUrl URL da imagem a ser deletada
 */
export async function deleteImageFromBlob(imageUrl: string): Promise<void> {
    // DESATIVADO: Vercel Blob não disponível
    console.warn('Delete de imagem desativado - Vercel Blob não disponível');
    /* CÓDIGO ORIGINAL COMENTADO
    try {
        await del(imageUrl);
    } catch (error) {
        console.error('Erro ao deletar imagem:', error);
        // Não lançar erro para não bloquear operações
    }
    */
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

/**
 * Obtém extensão do arquivo baseado no MIME type
 */
function getExtensionFromMime(mimeType: string): string {
    const mimeMap: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'image/svg+xml': 'svg',
    };

    return mimeMap[mimeType] || 'jpg';
}
