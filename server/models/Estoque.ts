import mongoose from 'mongoose';

const EstoqueSchema = new mongoose.Schema({
  codigoProduto: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  quantidadeDisponivel: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  tamanho: {
    type: String,
    required: true,
    trim: true
  },
  emPromocao: {
    type: Boolean,
    default: false
  },
  valorPromocional: {
    type: Number,
    min: 0
  },
  novidade: {
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
    fornecedor: {
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
