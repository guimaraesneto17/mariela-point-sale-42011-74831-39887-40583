import mongoose from 'mongoose';

const VendaSchema = new mongoose.Schema({
  codigoVenda: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  data: {
    type: Date,
    default: Date.now
  },
  vendedor: {
    type: String,
    required: true,
    trim: true
  },
  cliente: {
    codigoCliente: {
      type: String,
      required: true,
      trim: true
    },
    nome: {
      type: String,
      required: true,
      trim: true
    }
  },
  itens: [{
    codigoProduto: {
      type: String,
      required: true,
      trim: true
    },
    nomeProduto: {
      type: String,
      required: true,
      trim: true
    },
    quantidade: {
      type: Number,
      required: true,
      min: 1
    },
    precoUnitario: {
      type: Number,
      required: true,
      min: 0
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  valorTotal: {
    type: Number,
    required: true,
    min: 0
  },
  totalDesconto: {
    type: Number,
    default: 0,
    min: 0
  },
  formaPagamento: {
    type: String,
    required: true,
    enum: ['Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'Pix', 'Boleto'],
    trim: true
  }
}, {
  timestamps: true,
  collection: 'vendas'
});

// Índices para melhor performance
VendaSchema.index({ codigoVenda: 1 });
VendaSchema.index({ data: -1 });
VendaSchema.index({ 'cliente.codigoCliente': 1 });

export default mongoose.models.Venda || mongoose.model('Venda', VendaSchema);
