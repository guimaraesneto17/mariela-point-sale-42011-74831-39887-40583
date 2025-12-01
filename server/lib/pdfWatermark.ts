import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

/**
 * Configurações do watermark
 */
interface WatermarkConfig {
  enabled: boolean;
  logoPath: string;
  opacity: number;
  position: 'center' | 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  scale: number; // Escala do logo em relação à imagem (0.1 = 10% da largura)
  margin: number; // Margem em pixels para posições nas bordas
}

const defaultConfig: WatermarkConfig = {
  enabled: true,
  logoPath: path.join(__dirname, '../../public/logo.png'),
  opacity: 0.3, // 30% de opacidade
  position: 'bottom-right',
  scale: 0.15, // Logo ocupa 15% da largura da imagem
  margin: 20
};

/**
 * Calcula a posição do watermark baseado na configuração
 */
function calculateWatermarkPosition(
  imageWidth: number,
  imageHeight: number,
  logoWidth: number,
  logoHeight: number,
  config: WatermarkConfig
): { left: number; top: number } {
  const { position, margin } = config;

  switch (position) {
    case 'center':
      return {
        left: Math.floor((imageWidth - logoWidth) / 2),
        top: Math.floor((imageHeight - logoHeight) / 2)
      };
    case 'top-left':
      return { left: margin, top: margin };
    case 'top-right':
      return { left: imageWidth - logoWidth - margin, top: margin };
    case 'bottom-left':
      return { left: margin, top: imageHeight - logoHeight - margin };
    case 'bottom-right':
    default:
      return {
        left: imageWidth - logoWidth - margin,
        top: imageHeight - logoHeight - margin
      };
  }
}

/**
 * Adiciona watermark em uma imagem
 */
export async function addWatermark(
  imageBuffer: Buffer,
  config: Partial<WatermarkConfig> = {}
): Promise<Buffer> {
  const finalConfig = { ...defaultConfig, ...config };

  // Se watermark estiver desabilitado, retorna o buffer original
  if (!finalConfig.enabled) {
    return imageBuffer;
  }

  // Verifica se o logo existe
  if (!fs.existsSync(finalConfig.logoPath)) {
    console.warn(`Logo file not found at ${finalConfig.logoPath}. Skipping watermark.`);
    return imageBuffer;
  }

  try {
    // Obtém informações da imagem original
    const imageMetadata = await sharp(imageBuffer).metadata();
    const imageWidth = imageMetadata.width || 1920;
    const imageHeight = imageMetadata.height || 1080;

    // Calcula o tamanho do logo baseado na escala
    const logoWidth = Math.floor(imageWidth * finalConfig.scale);

    // Redimensiona o logo mantendo proporção
    const logoBuffer = await sharp(finalConfig.logoPath)
      .resize(logoWidth, null, { fit: 'inside' })
      .toBuffer();

    // Obtém as dimensões do logo redimensionado
    const logoMetadata = await sharp(logoBuffer).metadata();
    const logoHeight = logoMetadata.height || logoWidth;

    // Calcula a posição do watermark
    const position = calculateWatermarkPosition(
      imageWidth,
      imageHeight,
      logoWidth,
      logoHeight,
      finalConfig
    );

    // Aplica opacidade ao logo
    const watermarkBuffer = await sharp(logoBuffer)
      .ensureAlpha()
      .composite([
        {
          input: Buffer.from([255, 255, 255, Math.floor(255 * finalConfig.opacity)]),
          raw: {
            width: 1,
            height: 1,
            channels: 4
          },
          tile: true,
          blend: 'dest-in'
        }
      ])
      .toBuffer();

    // Aplica o watermark na imagem original
    const watermarkedImage = await sharp(imageBuffer)
      .composite([
        {
          input: watermarkBuffer,
          top: position.top,
          left: position.left
        }
      ])
      .toBuffer();

    return watermarkedImage;
  } catch (error) {
    console.error('Error adding watermark:', error);
    // Em caso de erro, retorna a imagem original
    return imageBuffer;
  }
}

/**
 * Processa múltiplas imagens adicionando watermark
 */
export async function addWatermarkToMultiple(
  imageBuffers: Buffer[],
  config: Partial<WatermarkConfig> = {}
): Promise<Buffer[]> {
  return Promise.all(imageBuffers.map(buffer => addWatermark(buffer, config)));
}

/**
 * Configuração exportável para uso em outros módulos
 */
export const watermarkConfig = {
  setEnabled: (enabled: boolean) => {
    defaultConfig.enabled = enabled;
  },
  setOpacity: (opacity: number) => {
    defaultConfig.opacity = Math.max(0, Math.min(1, opacity));
  },
  setPosition: (position: WatermarkConfig['position']) => {
    defaultConfig.position = position;
  },
  setScale: (scale: number) => {
    defaultConfig.scale = Math.max(0.05, Math.min(0.5, scale));
  },
  getConfig: () => ({ ...defaultConfig })
};
