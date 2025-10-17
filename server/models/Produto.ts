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
    trim: true
  },
  cor: {
    type: String,
    required: true,
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
  precoPromocional: {
    type: Number,
    min: 0
  },
  imagens: [{
    type: String,
    trim: true
  }],
  dataCadastro: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'produtos'
});

// Índices para melhor performance
ProdutoSchema.index({ nome: 'text', descricao: 'text' });
ProdutoSchema.index({ categoria: 1 });

export default mongoose.models.Produto || mongoose.model('Produto', ProdutoSchema);
