import mongoose from 'mongoose';

/**
 * Schema para configuração de cache por endpoint
 */

interface ICacheConfig {
  endpoint: string;
  ttl: number;
  enabled: boolean;
  compressionEnabled: boolean;
  compressionLevel: number;
  lastModified: Date;
  accessCount: number;
}

const cacheConfigSchema = new mongoose.Schema<ICacheConfig>({
  endpoint: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  ttl: {
    type: Number,
    required: true,
    default: 300000, // 5 minutos padrão
    min: 0,
  },
  enabled: {
    type: Boolean,
    required: true,
    default: true,
  },
  compressionEnabled: {
    type: Boolean,
    required: true,
    default: true,
  },
  compressionLevel: {
    type: Number,
    required: true,
    default: 6,
    min: 0,
    max: 9,
  },
  lastModified: {
    type: Date,
    default: Date.now,
  },
  accessCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Índices para melhor performance
cacheConfigSchema.index({ enabled: 1 });
cacheConfigSchema.index({ accessCount: -1 });

const CacheConfig = mongoose.model<ICacheConfig>('CacheConfig', cacheConfigSchema);

export default CacheConfig;
