import mongoose from 'mongoose';

const VitrineVirtualSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  color: {
    type: String,
    required: true,
    trim: true
  },
  images: [{
    type: String,
    trim: true
  }],
  pricing: {
    cost: {
      type: Number,
      required: true,
      min: 0
    },
    sale: {
      type: Number,
      required: true,
      min: 0
    },
    promotional: {
      type: Number,
      min: 0
    }
  },
  availability: {
    sizes: [{
      size: {
        type: String,
        required: true,
        enum: ['PP', 'P', 'M', 'G', 'GG', 'U']
      },
      totalAvailable: {
        type: Number,
        required: true,
        min: 0
      }
    }]
  },
  tags: {
    isNew: {
      type: Boolean,
      default: false
    },
    isOnSale: {
      type: Boolean,
      default: false
    }
  },
  registrationDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'vitrineVirtual'
});

// Índices para melhor performance
VitrineVirtualSchema.index({ code: 1 });
VitrineVirtualSchema.index({ category: 1 });
VitrineVirtualSchema.index({ 'tags.isNew': 1 });
VitrineVirtualSchema.index({ 'tags.isOnSale': 1 });

export default mongoose.models.VitrineVirtual || mongoose.model('VitrineVirtual', VitrineVirtualSchema);
