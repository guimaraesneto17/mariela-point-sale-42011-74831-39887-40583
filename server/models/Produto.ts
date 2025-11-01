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
  imagens: [{
    type: String,
    trim: true
  }],
  ativo: {
    type: Boolean,
    default: true
  },
  logMovimentacao: [{
    tipo: {
      type: String,
      enum: ['entrada', 'saida'],
      required: true
    },
    data: {
      type: String,
      required: true
    },
    quantidade: {
      type: Number,
      required: true,
      min: 1
    },
    origem: {
      type: String,
      enum: ['venda', 'compra', 'entrada', 'baixa no estoque']
    },
    codigoVenda: {
      type: String,
      match: /^VENDA\d{8}-\d{3}$/
    },
    motivo: String,
    fornecedor: {
      type: String,
      match: /^F\d{3}$/
    },
    observacao: {
      type: String,
      maxlength: 300
    },
    cor: String,
    tamanho: String
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
