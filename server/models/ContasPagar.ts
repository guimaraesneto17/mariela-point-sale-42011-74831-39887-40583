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
    trim: true,
    minlength: 3
  },
  fornecedor: {
    codigoFornecedor: { type: String, trim: true },
    nome: { type: String, trim: true }
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
    enum: ['Pendente', 'Pago', 'Vencido', 'Parcial'],
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
  
  // ============ PAGAMENTO (SOMENTE CONTA ÚNICA) ============
  pagamento: {
    type: {
      valor: { type: Number, min: 0 },
      data: { type: Date },
      formaPagamento: { 
        type: String, 
        enum: ['Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro', 'Boleto', 'Transferência', 'Outro']
      },
      comprovante: { type: String },
      observacoes: { type: String, trim: true }
    },
    required: false,
    default: undefined
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
      enum: ['Pendente', 'Pago', 'Vencido', 'Parcial'],
      default: 'Pendente'
    },
    pagamento: {
      type: {
        valor: { type: Number, min: 0 },
        data: { type: Date },
        formaPagamento: {
          type: String,
          enum: ['Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro', 'Boleto', 'Transferência', 'Outro']
        },
        comprovante: { type: String },
        observacoes: { type: String, trim: true }
      },
      required: false,
      default: undefined
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
  collection: 'contasPagar',
  versionKey: false
});

// Índices
ContasPagarSchema.index({ status: 1 });
ContasPagarSchema.index({ dataVencimento: 1 });
ContasPagarSchema.index({ categoria: 1 });
ContasPagarSchema.index({ tipoCriacao: 1 });
ContasPagarSchema.index({ replicaDe: 1 });

export default mongoose.models.ContasPagar || mongoose.model('ContasPagar', ContasPagarSchema);
