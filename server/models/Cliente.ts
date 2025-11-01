import mongoose from 'mongoose';

const ClienteSchema = new mongoose.Schema({
  codigoCliente: {
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
  telefone: {
    type: String,
    trim: true
  },
  dataNascimento: {
    type: String,
    trim: true
  },
  observacao: {
    type: String,
    trim: true
  },
  valorTotalComprado: {
    type: Number,
    default: 0,
    min: 0
  },
  quantidadeCompras: {
    type: Number,
    default: 0,
    min: 0
  },
  dataUltimaCompra: {
    type: Date
  }
}, {
  timestamps: { createdAt: 'dataCadastro', updatedAt: 'dataAtualizacao' },
  collection: 'cliente',
  versionKey: false
});

// Índices para melhor performance
ClienteSchema.index({ nome: 'text' });
ClienteSchema.index({ telefone: 1 });

export default mongoose.models.Cliente || mongoose.model('Cliente', ClienteSchema);
