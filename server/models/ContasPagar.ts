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
    valor: { type: Number, min: 0 },
    data: { type: Date },
    formaPagamento: { 
      type: String, 
      enum: ['Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro', 'Boleto', 'Transferência', 'Outro']
    },
    comprovante: { type: String },
    observacoes: { type: String, trim: true }
  },
  
  // ============ PARCELAMENTO ============
  detalhesParcelamento: {
    type: {
      quantidadeParcelas: { type: Number, min: 1 },
      valorTotal: { type: Number, min: 0 }
    },
    required: false
  },
  
  parcelas: {
    type: [{
      numeroParcela: { type: Number, required: true },
      valor: { type: Number, required: true, min: 0 },
      dataVencimento: { type: Date, required: true },
      status: {
        type: String,
        enum: ['Pendente', 'Pago', 'Vencido', 'Parcial'],
        default: 'Pendente'
      },
      pagamento: {
        valor: { type: Number, min: 0 },
        data: { type: Date },
        formaPagamento: {
          type: String,
          enum: ['Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro', 'Boleto', 'Transferência', 'Outro']
        },
        comprovante: { type: String },
        observacoes: { type: String, trim: true }
      }
    }],
    required: false,
    default: undefined
  },
  
  // ============ RÉPLICA ============
  detalhesReplica: {
    type: {
      quantidadeReplicas: { type: Number, min: 1 },
      valor: { type: Number, min: 0 }
    },
    required: false
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

// Validação customizada baseada no tipoCriacao
ContasPagarSchema.pre('save', function(next) {
  const conta = this;

  // Validação para conta ÚNICA
  if (conta.tipoCriacao === 'Unica') {
    // Não deve ter detalhesParcelamento, parcelas ou detalhesReplica
    if (conta.detalhesParcelamento) {
      return next(new Error('Conta do tipo Única não pode ter detalhesParcelamento'));
    }
    if (conta.parcelas && conta.parcelas.length > 0) {
      return next(new Error('Conta do tipo Única não pode ter parcelas'));
    }
    if (conta.detalhesReplica) {
      return next(new Error('Conta do tipo Única não pode ter detalhesReplica'));
    }
  }

  // Validação para PARCELAMENTO
  if (conta.tipoCriacao === 'Parcelamento') {
    // Deve ter detalhesParcelamento
    if (!conta.detalhesParcelamento) {
      return next(new Error('Conta do tipo Parcelamento deve ter detalhesParcelamento'));
    }
    if (!conta.detalhesParcelamento.quantidadeParcelas || conta.detalhesParcelamento.quantidadeParcelas < 1) {
      return next(new Error('detalhesParcelamento.quantidadeParcelas deve ser >= 1'));
    }
    if (conta.detalhesParcelamento.valorTotal === undefined || conta.detalhesParcelamento.valorTotal < 0) {
      return next(new Error('detalhesParcelamento.valorTotal deve ser >= 0'));
    }

    // Deve ter array de parcelas não vazio
    if (!conta.parcelas || conta.parcelas.length === 0) {
      return next(new Error('Conta do tipo Parcelamento deve ter ao menos uma parcela'));
    }

    // Validar que quantidade de parcelas bate com o array
    if (conta.parcelas.length !== conta.detalhesParcelamento.quantidadeParcelas) {
      return next(new Error('Quantidade de parcelas no array não corresponde ao detalhesParcelamento.quantidadeParcelas'));
    }

    // Não deve ter pagamento no nível raiz
    if (conta.pagamento) {
      return next(new Error('Conta do tipo Parcelamento não pode ter campo pagamento no nível raiz (use pagamento dentro de cada parcela)'));
    }

    // Não deve ter detalhesReplica
    if (conta.detalhesReplica) {
      return next(new Error('Conta do tipo Parcelamento não pode ter detalhesReplica'));
    }
  }

  // Validação para RÉPLICA
  if (conta.tipoCriacao === 'Replica') {
    // Deve ter detalhesReplica
    if (!conta.detalhesReplica) {
      return next(new Error('Conta do tipo Replica deve ter detalhesReplica'));
    }
    if (!conta.detalhesReplica.quantidadeReplicas || conta.detalhesReplica.quantidadeReplicas < 1) {
      return next(new Error('detalhesReplica.quantidadeReplicas deve ser >= 1'));
    }
    if (conta.detalhesReplica.valor === undefined || conta.detalhesReplica.valor < 0) {
      return next(new Error('detalhesReplica.valor deve ser >= 0'));
    }

    // Não deve ter pagamento, detalhesParcelamento ou parcelas
    if (conta.pagamento) {
      return next(new Error('Conta do tipo Replica não pode ter campo pagamento'));
    }
    if (conta.detalhesParcelamento) {
      return next(new Error('Conta do tipo Replica não pode ter detalhesParcelamento'));
    }
    if (conta.parcelas && conta.parcelas.length > 0) {
      return next(new Error('Conta do tipo Replica não pode ter parcelas'));
    }
  }

  next();
});

export default mongoose.models.ContasPagar || mongoose.model('ContasPagar', ContasPagarSchema);
