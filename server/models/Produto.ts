import mongoose from 'mongoose';

const ProdutoSchema = new mongoose.Schema({
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
    trim: true,
    enum: ['Calça', 'Saia', 'Vestido', 'Blusa', 'Bolsa', 'Acessório', 'Short-Saia', 'Short', 'Conjunto', 'Outro']
  },
  precoCusto: {
    type: Number,
    required: true,
    min: 0
  },
  margemDeLucro: {
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
  fornecedor: {
    codigoFornecedor: {
      type: String,
      trim: true
    },
    nome: {
      type: String,
      trim: true
    }
  },
  historicoPrecosn: [{
    data: {
      type: Date,
      default: Date.now
    },
    precoCusto: {
      type: Number,
      required: true
    },
    precoVenda: {
      type: Number,
      required: true
    },
    margemDeLucro: {
      type: Number,
      required: true
    }
  }]
}, {
  timestamps: { createdAt: 'dataCadastro', updatedAt: 'dataAtualizacao' },
  collection: 'produto',
  versionKey: false
});

// Índices para melhor performance
ProdutoSchema.index({ nome: 'text', descricao: 'text' });
ProdutoSchema.index({ categoria: 1 });

export default mongoose.models.Produto || mongoose.model('Produto', ProdutoSchema);
