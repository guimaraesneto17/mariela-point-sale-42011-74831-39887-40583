import mongoose from 'mongoose';

const VitrineVirtualSchema = new mongoose.Schema({
  codigoProduto: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  nome: {
    type: String,
    required: true,
    trim: true
  },
  descricao: {
    type: String,
    trim: true
  },
  categoria: {
    type: String,
    required: true,
    trim: true
  },
  imagens: [{
    type: String,
    trim: true
  }],
  variants: [{
    size: {
      type: String,
      required: true,
      trim: true
    },
    color: {
      type: String,
      required: true,
      trim: true
    },
    availability: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    }
  }],
  precoCusto: {
    type: Number,
    required: true,
    min: 0
  },
  precoVenda: {
    type: Number,
    required: true,
    min: 0
  },
  precoPromocional: {
    type: Number,
    min: 0
  },
  emPromocao: {
    type: Boolean,
    default: false
  },
  isNovidade: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: { createdAt: 'dataCadastro', updatedAt: 'dataAtualizacao' },
  collection: 'vitrineVirtual',
  versionKey: false
});

// Índices para melhor performance
VitrineVirtualSchema.index({ categoria: 1 });
VitrineVirtualSchema.index({ emPromocao: 1 });
VitrineVirtualSchema.index({ isNovidade: 1 });

export default mongoose.models.VitrineVirtual || mongoose.model('VitrineVirtual', VitrineVirtualSchema);
