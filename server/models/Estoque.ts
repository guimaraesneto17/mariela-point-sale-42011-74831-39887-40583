import mongoose from 'mongoose';

const EstoqueSchema = new mongoose.Schema({
  codigoProduto: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    match: /^P\d{3}$/
  },
  quantidade: {
    type: Number,
    required: true,
    min: 0,
    default: 0
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
  precoPromocional: {
    type: Number,
    min: 0,
    default: null
  },
  logPromocao: [{
    dataInicio: {
      type: String,
      required: true
    },
    dataFim: {
      type: String,
      default: null
    },
    precoPromocional: {
      type: Number,
      required: true,
      min: 0
    },
    ativo: {
      type: Boolean,
      required: true,
      default: true
    },
    observacao: {
      type: String,
      maxlength: 200
    },
    tipoDeDesconto: {
      type: String,
      enum: ['valorDireto', 'porcentagem', null],
      default: null
    },
    valorDesconto: {
      type: Number,
      min: 0,
      default: null
    }
  }],
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
