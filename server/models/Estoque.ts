import mongoose from 'mongoose';

const EstoqueSchema = new mongoose.Schema({
  codigoProduto: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  quantidade: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  tamanho: {
    type: String,
    required: true,
    enum: ['PP', 'P', 'M', 'G', 'GG', 'U'],
    trim: true
  },
  quantidadeDisponivel: {
    type: Number,
    required: false,
    min: 0,
    default: 0
  },
  emPromocao: {
    type: Boolean,
    default: false
  },
  valorPromocional: {
    type: Number,
    min: 0
  },
  isNovidade: {
    type: Boolean,
    default: false
  },
  logMovimentacao: [{
    tipo: {
      type: String,
      required: true,
      enum: ['entrada', 'saida'],
      trim: true
    },
    quantidade: {
      type: Number,
      required: true,
      min: 1
    },
    data: {
      type: Date,
      default: Date.now
    },
    origem: {
      type: String,
      enum: ['venda', 'compra', 'baixa no estoque'],
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
      trim: true
    }
  }]
}, {
  timestamps: true,
  collection: 'estoque'
});

// Índices para melhor performance
EstoqueSchema.index({ codigoProduto: 1 });
EstoqueSchema.index({ quantidadeDisponivel: 1 });
EstoqueSchema.index({ emPromocao: 1 });

export default mongoose.models.Estoque || mongoose.model('Estoque', EstoqueSchema);
