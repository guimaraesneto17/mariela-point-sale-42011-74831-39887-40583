import mongoose from 'mongoose';

const VendedorSchema = new mongoose.Schema({
  codigoVendedor: {
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
    type: Date
  },
  ativo: {
    type: Boolean,
    default: true
  },
  metaMensal: {
    type: Number,
    min: 0
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
  collection: 'vendedor'
});

VendedorSchema.index({ nome: 1 });

export default mongoose.models.Vendedor || mongoose.model('Vendedor', VendedorSchema);
