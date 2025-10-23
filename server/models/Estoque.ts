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
    default: 1
  },
  tamanho: {
    type: String,
    required: true,
    enum: ['PP', 'P', 'M', 'G', 'GG', 'U'],
    trim: true
  },
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
  margemDeLucro: {
    type: Number,
    min: 0
  },
  emPromocao: {
    type: Boolean,
    default: false
  },
  precoPromocional: {
    type: Number,
    min: 0
  },
  tipoPrecoPromocional: {
    type: String,
    enum: ['valor direto', 'porcentagem'],
    trim: true
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
      trim: true
    }
  }]
}, {
  timestamps: true,
  collection: 'estoque'
});

// Índices para melhor performance
EstoqueSchema.index({ quantidade: 1 });
EstoqueSchema.index({ emPromocao: 1 });
EstoqueSchema.index({ isNovidade: 1 });

export default mongoose.models.Estoque || mongoose.model('Estoque', EstoqueSchema);
