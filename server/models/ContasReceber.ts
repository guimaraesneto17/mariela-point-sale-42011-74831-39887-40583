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
  vendaRelacionada: {
    codigoVenda: {
      type: String,
      trim: true
    }
  },
  categoria: {
    type: String,
    required: true,
    enum: ['Venda', 'Serviço', 'Outros'],
    default: 'Venda'
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
    required: true
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
    enum: ['Dinheiro', 'PIX', 'Débito', 'Crédito', 'Boleto', 'Transferência', 'Outro'],
    trim: true
  },
  observacoes: {
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

export default mongoose.models.ContasReceber || mongoose.model('ContasReceber', ContasReceberSchema);
