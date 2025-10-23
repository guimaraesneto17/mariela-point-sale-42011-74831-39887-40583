import mongoose from 'mongoose';

const FornecedorSchema = new mongoose.Schema({
  codigoFornecedor: {
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
  cnpj: {
    type: String,
    required: false,
    trim: true
  },
  telefone: {
    type: String,
    required: true,
    trim: true
  },
  instagram: {
    type: String,
    trim: true
  },
  endereco: {
    rua: {
      type: String,
      required: true,
      trim: true
    },
    numero: {
      type: String,
      required: true,
      trim: true
    },
    bairro: {
      type: String,
      required: true,
      trim: true
    },
    cidade: {
      type: String,
      required: true,
      trim: true
    },
    estado: {
      type: String,
      required: true,
      trim: true
    },
    cep: {
      type: String,
      required: true,
      trim: true
    }
  },
  observacao: {
    type: String,
    trim: true
  },
  dataCadastro: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'fornecedor'
});

// Índices para melhor performance
FornecedorSchema.index({ nome: 'text' });

export default mongoose.models.Fornecedor || mongoose.model('Fornecedor', FornecedorSchema);
