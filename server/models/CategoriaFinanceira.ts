import mongoose from 'mongoose';

const CategoriaFinanceiraSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  tipo: {
    type: String,
    required: true,
    enum: ['pagar', 'receber', 'ambos'],
    default: 'ambos'
  },
  cor: {
    type: String,
    required: true,
    match: /^#[0-9A-Fa-f]{6}$/,
    default: '#8B5CF6'
  },
  icone: {
    type: String,
    required: true,
    default: 'Tag'
  },
  descricao: {
    type: String,
    trim: true,
    maxlength: 200
  },
  categoriaPai: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CategoriaFinanceira',
    default: null
  },
  ativo: {
    type: Boolean,
    default: true
  },
  ordem: {
    type: Number,
    default: 0
  }
}, {
  timestamps: { createdAt: 'dataCadastro', updatedAt: 'dataAtualizacao' },
  collection: 'categoriasFinanceiras',
  versionKey: false
});

// Índices
CategoriaFinanceiraSchema.index({ tipo: 1 });
CategoriaFinanceiraSchema.index({ ativo: 1 });
CategoriaFinanceiraSchema.index({ ordem: 1 });

export default mongoose.models.CategoriaFinanceira || mongoose.model('CategoriaFinanceira', CategoriaFinanceiraSchema);
