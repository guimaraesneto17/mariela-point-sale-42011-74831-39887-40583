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
  cor: {
    type: String,
    required: true,
    trim: true
  },
  imagens: [{
    type: String,
    trim: true
  }],
  tamanhos: [{
    tamanho: {
      type: String,
      required: true,
      enum: ['PP', 'P', 'M', 'G', 'GG', 'U']
    },
    quantidadeDisponivel: {
      type: Number,
      required: true,
      min: 0
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
VitrineVirtualSchema.index({ category: 1 });
VitrineVirtualSchema.index({ 'tags.isNew': 1 });
VitrineVirtualSchema.index({ 'tags.isOnSale': 1 });

export default mongoose.models.VitrineVirtual || mongoose.model('VitrineVirtual', VitrineVirtualSchema);
