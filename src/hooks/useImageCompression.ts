import { useState } from 'react';
import { toast } from 'sonner';

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeMB?: number;
}

interface UseImageCompressionReturn {
  compressing: boolean;
  compressImage: (file: File, options?: CompressionOptions) => Promise<string>;
  compressImages: (files: File[], options?: CompressionOptions) => Promise<string[]>;
  validateImageUrl: (url: string) => Promise<boolean>;
}

/**
 * Hook centralizado para compressão e validação de imagens
 */
export const useImageCompression = (): UseImageCompressionReturn => {
  const [compressing, setCompressing] = useState(false);

  const compressImage = async (
    file: File,
    options: CompressionOptions = {}
  ): Promise<string> => {
    const {
      maxWidth = 1200,
      maxHeight = 1200,
      quality = 0.85,
      maxSizeMB = 5
    } = options;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      throw new Error(`${file.name} não é uma imagem válida`);
    }

    // Validar tamanho do arquivo
    if (file.size > maxSizeMB * 1024 * 1024) {
      throw new Error(`${file.name} é muito grande. Máximo ${maxSizeMB}MB`);
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      const imageUrl = URL.createObjectURL(file);

      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;

          // Calcular dimensões mantendo aspect ratio
          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = (height / width) * maxWidth;
              width = maxWidth;
            } else {
              width = (width / height) * maxHeight;
              height = maxHeight;
            }
          }

          // Criar canvas e comprimir
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            throw new Error('Erro ao criar contexto do canvas');
          }

          ctx.drawImage(img, 0, 0, width, height);
          const base64 = canvas.toDataURL('image/jpeg', quality);

          URL.revokeObjectURL(imageUrl);
          resolve(base64);
        } catch (error) {
          URL.revokeObjectURL(imageUrl);
          reject(error);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(imageUrl);
        reject(new Error(`Erro ao carregar ${file.name}`));
      };

      img.src = imageUrl;
    });
  };

  const compressImages = async (
    files: File[],
    options?: CompressionOptions
  ): Promise<string[]> => {
    setCompressing(true);
    const compressedImages: string[] = [];
    const errors: string[] = [];

    try {
      for (const file of files) {
        try {
          const compressed = await compressImage(file, options);
          compressedImages.push(compressed);
        } catch (error: any) {
          errors.push(error.message);
          console.error(`Erro ao comprimir ${file.name}:`, error);
        }
      }

      if (errors.length > 0) {
        toast.error(`Erro em ${errors.length} imagem(ns)`, {
          description: errors[0]
        });
      }

      return compressedImages;
    } finally {
      setCompressing(false);
    }
  };

  const validateImageUrl = async (url: string): Promise<boolean> => {
    if (!url.trim()) {
      throw new Error('URL vazia');
    }

    return new Promise((resolve, reject) => {
      const testImg = new Image();
      testImg.crossOrigin = 'anonymous';

      testImg.onload = () => resolve(true);
      testImg.onerror = () => reject(new Error('URL inválida ou inacessível'));
      testImg.src = url;
    });
  };

  return {
    compressing,
    compressImage,
    compressImages,
    validateImageUrl
  };
};
