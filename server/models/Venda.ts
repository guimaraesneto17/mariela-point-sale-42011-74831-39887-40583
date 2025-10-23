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
    id: {
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
    tamanho: {
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
    precoFinalUnitario: {
      type: Number,
      required: true,
      min: 0
    },
    descontoAplicado: {
      type: Number,
      default: 0,
      min: 0
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  total: {
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
    enum: ['Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro'],
    trim: true
  },
  observacoes: {
    type: String,
    trim: true
  },
  taxaMaquininha: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  valorTaxa: {
    type: Number,
    default: 0,
    min: 0
  },
  valorRecebido: {
    type: Number,
    min: 0
  },
  parcelas: {
    type: Number,
    min: 1,
    default: 1
  }
}, {
  timestamps: true,
  collection: 'venda'
});

// Índices para melhor performance
VendaSchema.index({ data: -1 });
VendaSchema.index({ 'cliente.codigoCliente': 1 });

export default mongoose.models.Venda || mongoose.model('Venda', VendaSchema);
