import mongoose from 'mongoose';

const EstoqueSchema = new mongoose.Schema({
  codigoProduto: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  variantes: [{
    cor: {
      type: String,
      required: true,
      trim: true
    },
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
  }],
  emPromocao: {
    type: Boolean,
    required: true,
    default: false
  },
  isNovidade: {
    type: Boolean,
    required: true,
    default: false
  },
  precoPromocional: {
    type: Number,
    min: 0,
    default: null
  },
  logMovimentacao: [{
    tipo: {
      type: String,
      required: true,
      enum: ['entrada', 'saida'],
      trim: true
    },
    cor: {
      type: String,
      trim: true
    },
    tamanho: {
      type: String,
      trim: true
    },
    quantidade: {
      type: Number,
      required: true,
      min: 1
    },
    data: {
      type: String,
      required: true
    },
    origem: {
      type: String,
      enum: ['venda', 'compra', 'entrada', 'baixa no estoque'],
      trim: true
    },
    fornecedor: {
      type: String,
      trim: true
    },
    motivo: {
      type: String,
      trim: true
    },
    codigoVenda: {
      type: String,
      trim: true
    },
    observacao: {
      type: String,
      trim: true,
      maxLength: 300
    }
  }]
}, {
  timestamps: { createdAt: 'dataCadastro', updatedAt: 'dataAtualizacao' },
  collection: 'estoque',
  versionKey: false
});

// Índices para melhor performance
EstoqueSchema.index({ codigoProduto: 1 }, { unique: true });
EstoqueSchema.index({ emPromocao: 1 });
EstoqueSchema.index({ isNovidade: 1 });

export default mongoose.models.Estoque || mongoose.model('Estoque', EstoqueSchema);
