import mongoose from 'mongoose';

const MovimentoSchema = new mongoose.Schema({
  tipo: {
    type: String,
    required: true,
    enum: ['entrada', 'saida'],
    trim: true
  },
  valor: {
    type: Number,
    required: true,
    min: 0
  },
  data: {
    type: String,
    required: true
  },
  codigoVenda: {
    type: String,
    trim: true,
    default: null
  },
  formaPagamento: {
    type: String,
    enum: ['Dinheiro', 'Pix', 'Cartão de Crédito', 'Cartão de Débito', null],
    default: null
  },
  observacao: {
    type: String,
    trim: true,
    default: null
  }
}, { _id: false });

const CaixaSchema = new mongoose.Schema({
  codigoCaixa: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  dataAbertura: {
    type: String,
    required: true
  },
  dataFechamento: {
    type: String,
    default: null
  },
  status: {
    type: String,
    required: true,
    enum: ['aberto', 'fechado'],
    default: 'aberto'
  },
  valorInicial: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  entrada: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  saida: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  performance: {
    type: Number,
    required: true,
    default: 0
  },
  movimentos: {
    type: [MovimentoSchema],
    default: []
  }
}, {
  timestamps: { createdAt: 'dataCadastro', updatedAt: 'dataAtualizacao' },
  collection: 'caixa',
  versionKey: false
});

// Índices para melhor performance
CaixaSchema.index({ dataAbertura: -1 });
CaixaSchema.index({ status: 1 });

export default mongoose.models.Caixa || mongoose.model('Caixa', CaixaSchema);
