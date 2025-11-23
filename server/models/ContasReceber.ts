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
    trim: true,
    minlength: 3
  },
  cliente: {
    codigoCliente: { type: String, trim: true },
    nome: { type: String, trim: true }
  },
  vendaRelacionada: {
    codigoVenda: { type: String, trim: true }
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
  dataEmissao: {
    type: Date,
    default: Date.now
  },
  dataVencimento: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Pendente', 'Recebido', 'Vencido', 'Parcial'],
    default: 'Pendente'
  },
  observacoes: {
    type: String,
    trim: true
  },
  
  // ============ TIPO DE CRIAÇÃO ============
  tipoCriacao: {
    type: String,
    enum: ['Unica', 'Parcelamento', 'Replica'],
    required: true,
    default: 'Unica'
  },
  
  // ============ RECEBIMENTO (SOMENTE CONTA ÚNICA) ============
  recebimento: {
    valor: { type: Number, min: 0 },
    data: { type: Date },
    formaPagamento: { 
      type: String, 
      enum: ['Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro', 'Boleto', 'Transferência', 'Outro']
    },
    comprovante: [{ type: String }],
    observacoes: { type: String, trim: true }
  },
  
  // ============ PARCELAMENTO ============
  detalhesParcelamento: {
    quantidadeParcelas: { type: Number, min: 1 },
    valorTotal: { type: Number, min: 0 }
  },
  
  parcelas: [{
    numeroParcela: { type: Number, required: true },
    valor: { type: Number, required: true, min: 0 },
    dataVencimento: { type: Date, required: true },
    status: {
      type: String,
      enum: ['Pendente', 'Recebido', 'Vencido', 'Parcial'],
      default: 'Pendente'
    },
    recebimento: {
      valor: { type: Number, min: 0 },
      data: { type: Date },
      formaPagamento: {
        type: String,
        enum: ['Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro', 'Boleto', 'Transferência', 'Outro']
      },
      comprovante: [{ type: String }],
      observacoes: { type: String, trim: true }
    }
  }],
  
  // ============ RÉPLICA ============
  detalhesReplica: {
    quantidadeReplicas: { type: Number, min: 1 },
    valor: { type: Number, min: 0 }
  },
  
  replicaDe: {
    type: String,
    trim: true
  }
}, {
  timestamps: { createdAt: 'dataCadastro', updatedAt: 'dataAtualizacao' },
  collection: 'contasReceber',
  versionKey: false
});

// Índices
ContasReceberSchema.index({ status: 1 });
ContasReceberSchema.index({ dataVencimento: 1 });
ContasReceberSchema.index({ categoria: 1 });
ContasReceberSchema.index({ tipoCriacao: 1 });
ContasReceberSchema.index({ replicaDe: 1 });

export default mongoose.models.ContasReceber || mongoose.model('ContasReceber', ContasReceberSchema);
