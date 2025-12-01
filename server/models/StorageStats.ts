import mongoose from 'mongoose';

const StorageStatsSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  totalImages: {
    type: Number,
    required: true,
    default: 0
  },
  totalSizeBytes: {
    type: Number,
    required: true,
    default: 0
  },
  totalSizeMB: {
    type: Number,
    required: true,
    default: 0
  },
  referencedImages: {
    type: Number,
    required: true,
    default: 0
  },
  orphanImages: {
    type: Number,
    required: true,
    default: 0
  }
}, {
  timestamps: false,
  collection: 'storageStats',
  versionKey: false
});

// Índice para busca eficiente por timestamp
StorageStatsSchema.index({ timestamp: -1 });

export default mongoose.models.StorageStats || mongoose.model('StorageStats', StorageStatsSchema);
