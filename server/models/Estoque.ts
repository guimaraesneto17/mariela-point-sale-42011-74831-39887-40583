import mongoose from 'mongoose';

const EstoqueSchema = new mongoose.Schema({
  codigoProduto: {
    type: String,
    required: true,
    trim: true
  },
  cor: {
    type: String,
    required: true,
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
  }],
  dataCadastro: {
    type: String,
    default: () => new Date().toISOString()
  },
  dataAtualizacao: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  collection: 'estoque'
});

// Índices para melhor performance
EstoqueSchema.index({ quantidade: 1 });
EstoqueSchema.index({ emPromocao: 1 });
EstoqueSchema.index({ isNovidade: 1 });

export default mongoose.models.Estoque || mongoose.model('Estoque', EstoqueSchema);
