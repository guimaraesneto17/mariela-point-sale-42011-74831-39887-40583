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
    trim: true
  },
  telefone: {
    type: String,
    trim: true
  },
  instagram: {
    type: String,
    trim: true
  },
  endereco: {
    rua: {
      type: String,
      trim: true
    },
    numero: {
      type: String,
      trim: true
    },
    bairro: {
      type: String,
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
  versionKey: false,
  collection: 'fornecedor'
});

// Índices para melhor performance
FornecedorSchema.index({ nome: 'text' });

export default mongoose.models.Fornecedor || mongoose.model('Fornecedor', FornecedorSchema);
