import mongoose from 'mongoose';

const ContasPagarSchema = new mongoose.Schema({
  numeroDocumento: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  descricao: {
    type: String,
    required: true,
    trim: true
  },
  fornecedor: {
    codigoFornecedor: {
      type: String,
      trim: true
    },
    nome: {
      type: String,
      trim: true
    }
  },
  fornecedorCodigo: {
    type: String,
    trim: true
  },
  categoria: {
    type: String,
    required: true,
    trim: true
  },
  valor: {
    type: Number,
    required: true,
    min: 0
  },
  valorPago: {
    type: Number,
    default: 0,
    min: 0
  },
  dataEmissao: {
    type: Date,
    default: Date.now
  },
  dataVencimento: {
    type: Date,
    required: true
  },
  dataPagamento: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Pendente', 'Pago', 'Vencido', 'Parcial'],
    default: 'Pendente'
  },
  formaPagamento: {
    type: String,
    enum: ['Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro', 'Boleto', 'Transferência', 'Outro'],
    trim: true
  },
  observacoes: {
    type: String,
    trim: true
  },
  anexos: [{
    type: String,
    trim: true
  }],
  historicoPagamentos: [{
    valor: { type: Number, required: true, min: 0 },
    data: { type: Date, default: Date.now },
    formaPagamento: { type: String, enum: ['Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro', 'Boleto', 'Transferência', 'Outro'] },
    observacoes: { type: String, trim: true }
  }]
}, {
  timestamps: { createdAt: 'dataCadastro', updatedAt: 'dataAtualizacao' },
  collection: 'contasPagar',
  versionKey: false
});

// Índices
ContasPagarSchema.index({ status: 1 });
ContasPagarSchema.index({ dataVencimento: 1 });
ContasPagarSchema.index({ categoria: 1 });

export default mongoose.models.ContasPagar || mongoose.model('ContasPagar', ContasPagarSchema);
