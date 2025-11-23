import mongoose from 'mongoose';

const ContasReceberSchema = new mongoose.Schema({
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
  cliente: {
    codigoCliente: {
      type: String,
      trim: true
    },
    nome: {
      type: String,
      trim: true
    }
  },
  clienteCodigo: {
    type: String,
    trim: true
  },
  vendaRelacionada: {
    codigoVenda: {
      type: String,
      trim: true
    }
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
  valorRecebido: {
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
  dataRecebimento: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Pendente', 'Recebido', 'Vencido', 'Parcial'],
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
  historicoRecebimentos: [{
    valor: { type: Number, required: true, min: 0 },
    data: { type: Date, default: Date.now },
    formaPagamento: { type: String, enum: ['Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro', 'Boleto', 'Transferência', 'Outro'] },
    observacoes: { type: String, trim: true }
  }]
}, {
  timestamps: { createdAt: 'dataCadastro', updatedAt: 'dataAtualizacao' },
  collection: 'contasReceber',
  versionKey: false
});

// Índices
ContasReceberSchema.index({ status: 1 });
ContasReceberSchema.index({ dataVencimento: 1 });
ContasReceberSchema.index({ categoria: 1 });

export default mongoose.models.ContasReceber || mongoose.model('ContasReceber', ContasReceberSchema);
