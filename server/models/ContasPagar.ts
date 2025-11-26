import mongoose from 'mongoose';

const ContasPagarSchema = new mongoose.Schema({
  numeroDocumento: {
    type: String,
    required: [true, 'Número do documento é obrigatório'],
    unique: true,
    trim: true,
    index: true
  },
  
  descricao: {
    type: String,
    required: [true, 'Descrição é obrigatória'],
    trim: true,
    maxlength: [200, 'Descrição não pode ter mais que 200 caracteres']
  },
  
  fornecedor: {
    codigoFornecedor: { type: String, trim: true },
    nome: { type: String, trim: true }
  },
  
  categoria: {
    type: String,
    required: [true, 'Categoria é obrigatória'],
    trim: true,
    index: true
  },
  
  valor: {
    type: Number,
    required: [true, 'Valor é obrigatório'],
    min: [0, 'Valor não pode ser negativo']
  },
  
  dataEmissao: {
    type: Date,
    default: Date.now,
    required: true
  },
  
  dataVencimento: {
    type: Date,
    required: [true, 'Data de vencimento é obrigatória'],
    index: true
  },
  
  status: {
    type: String,
    enum: ['Pendente', 'Pago', 'Vencido', 'Parcial'],
    default: 'Pendente',
    required: true,
    index: true
  },
  
  observacoes: {
    type: String,
    trim: true,
    maxlength: [500, 'Observações não podem ter mais que 500 caracteres']
  },
  
  tipoCriacao: {
    type: String,
    enum: ['Unica', 'Parcelamento', 'Replica'],
    default: 'Unica',
    required: true,
    index: true
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
      observacoes: { type: String, trim: true },
      jurosMulta: { type: Number, min: 0 }
    },
    required: false,
    default: undefined
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
        observacoes: { type: String, trim: true },
        jurosMulta: { type: Number, min: 0 }
      }
    }],
    required: false,
    default: undefined
  },
  
  // ============ REPLICA ============
  detalhesReplica: {
    type: {
      quantidadeReplicas: { type: Number, min: 1 },
      valor: { type: Number, min: 0 }
    },
    required: false
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

// Validação customizada
ContasPagarSchema.pre('save', function(next) {
  const conta = this as any;
  
  // Validar conta única
  if (conta.tipoCriacao === 'Unica') {
    if (conta.detalhesParcelamento) {
      return next(new Error('Conta do tipo Unica não pode ter detalhes de parcelamento'));
    }
    if (conta.parcelas && conta.parcelas.length > 0) {
      return next(new Error('Conta do tipo Unica não pode ter parcelas'));
    }
    if (conta.detalhesReplica) {
      return next(new Error('Conta do tipo Unica não pode ter detalhes de réplica'));
    }
  }
  
  // Validar parcelamento
  if (conta.tipoCriacao === 'Parcelamento') {
    if (conta.pagamento && Object.keys(conta.pagamento).length > 0) {
      return next(new Error('Conta do tipo Parcelamento não pode ter campo pagamento no nível raiz (use pagamento dentro de cada parcela)'));
    }
    if (!conta.detalhesParcelamento) {
      return next(new Error('Conta do tipo Parcelamento deve ter detalhes de parcelamento'));
    }
    if (!conta.parcelas || conta.parcelas.length === 0) {
      return next(new Error('Conta do tipo Parcelamento deve ter pelo menos uma parcela'));
    }
    if (conta.detalhesReplica) {
      return next(new Error('Conta do tipo Parcelamento não pode ter detalhes de réplica'));
    }
    
    // Validar quantidade de parcelas
    if (conta.detalhesParcelamento.quantidadeParcelas !== conta.parcelas.length) {
      return next(new Error('Quantidade de parcelas informada não corresponde ao array de parcelas'));
    }
    
    // Validar valor total (tolerância de 0.10 para arredondamentos)
    const somaValorParcelas = conta.parcelas.reduce((sum: number, p: any) => sum + (p.valor || 0), 0);
    const diff = Math.abs((conta.detalhesParcelamento.valorTotal || 0) - somaValorParcelas);
    if (diff > 0.10) {
      return next(new Error(`Soma dos valores das parcelas (${somaValorParcelas.toFixed(2)}) deve ser igual ao valor total (${(conta.detalhesParcelamento.valorTotal || 0).toFixed(2)})`));
    }
  }
  
  // Validar replica
  if (conta.tipoCriacao === 'Replica') {
    if (conta.pagamento && Object.keys(conta.pagamento).length > 0) {
      return next(new Error('Conta do tipo Replica não pode ter campo pagamento'));
    }
    if (!conta.detalhesReplica) {
      return next(new Error('Conta do tipo Replica deve ter detalhes de réplica'));
    }
    if (!conta.parcelas || conta.parcelas.length === 0) {
      return next(new Error('Conta do tipo Replica deve ter pelo menos uma réplica'));
    }
    if (conta.detalhesParcelamento) {
      return next(new Error('Conta do tipo Replica não pode ter detalhes de parcelamento'));
    }
    
    // Validar quantidade de réplicas
    if (conta.detalhesReplica.quantidadeReplicas !== conta.parcelas.length) {
      return next(new Error('Quantidade de réplicas informada não corresponde ao array de parcelas'));
    }
    
    // Validar que todas as réplicas têm o mesmo valor
    const valorBase = conta.detalhesReplica.valor;
    const todasIguais = conta.parcelas.every((p: any) => Math.abs(p.valor - valorBase) < 0.01);
    if (!todasIguais) {
      return next(new Error('Todas as réplicas devem ter o mesmo valor'));
    }
  }
  
  next();
});

export default mongoose.models.ContasPagar || mongoose.model('ContasPagar', ContasPagarSchema);
