import mongoose from 'mongoose';

const TamanhoSchema = new mongoose.Schema({
  tamanho: {
    type: String,
    required: true,
    trim: true
  },
  quantidade: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  }
}, { _id: false });

const VarianteSchema = new mongoose.Schema({
  cor: {
    type: String,
    required: true,
    trim: true
  },
  quantidade: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  tamanhos: {
    type: [TamanhoSchema],
    default: []
  },
  imagens: [{
    type: String,
    trim: true
  }]
}, { _id: true });

const VitrineVirtualSchema = new mongoose.Schema({
  codigoProduto: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: /^P\d{3}$/
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
  precoVenda: {
    type: Number,
    required: true,
    min: 0
  },
  precoPromocional: {
    type: Number,
    min: 0,
    default: null
  },
  variantes: {
    type: [VarianteSchema],
    default: []
  },
  statusProduct: {
    type: String,
    enum: ['Disponível', 'Últimas unidades', 'Esgotado'],
    default: 'Disponível'
  },
  totalAvailable: {
    type: Number,
    min: 0,
    default: 0
  },
  isOnSale: {
    type: Boolean,
    default: false
  },
  isNew: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: { createdAt: 'dataCadastro', updatedAt: 'updatedAt' },
  collection: 'vitrineVirtual',
  versionKey: false
});

// Índices para melhor performance
VitrineVirtualSchema.index({ categoria: 1 });
VitrineVirtualSchema.index({ isOnSale: 1 });
VitrineVirtualSchema.index({ isNew: 1 });
VitrineVirtualSchema.index({ codigoProduto: 1 });

export default mongoose.models.VitrineVirtual || mongoose.model('VitrineVirtual', VitrineVirtualSchema);
