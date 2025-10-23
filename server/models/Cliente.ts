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
  dataCadastro: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'cliente'
});

// Índices para melhor performance
ClienteSchema.index({ nome: 'text' });
ClienteSchema.index({ telefone: 1 });

export default mongoose.models.Cliente || mongoose.model('Cliente', ClienteSchema);
