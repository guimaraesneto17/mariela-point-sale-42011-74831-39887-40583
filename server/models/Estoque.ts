import mongoose from 'mongoose';

const EstoqueSchema = new mongoose.Schema({
  codigoEstoque: {
    type: String,
    trim: true,
    match: /^E\d{3}$/
  },
  codigoProduto: {
    type: String,
    required: true,
    trim: true,
    match: /^P\d{3}$/
  },
  quantidade: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  ativo: {
    type: Boolean,
    required: true,
    default: true
  },
  emPromocao: {
    type: Boolean,
    required: true,
    default: false
  },
  isNovidade: {
    type: Boolean,
    required: true,
    default: false
  },
  precoPromocional: {
    type: Number,
    min: 0,
    default: null
  },
  logPromocao: [{
    dataInicio: {
      type: String,
      required: true
    },
    dataFim: {
      type: String,
      default: null
    },
    precoPromocional: {
      type: Number,
      required: true,
      min: 0
    },
    ativo: {
      type: Boolean,
      required: true,
      default: true
    },
    observacao: {
      type: String,
      maxlength: 200
    },
    tipoDeDesconto: {
      type: String,
      enum: ['valorDireto', 'porcentagem', null],
      default: null
    },
    valorDesconto: {
      type: Number,
      min: 0,
      default: null
    }
  }],
  variantes: [{
    cor: {
      type: String,
      required: true,
      trim: true
    },
    quantidade: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    tamanhos: [{
      tamanho: {
        type: String,
        required: true,
        trim: true
      },
      quantidade: {
        type: Number,
        required: true,
        min: 0,
        default: 0
      }
    }],
    imagens: [{
      type: String,
      trim: true
    }]
  }],
  logMovimentacao: [{
    tipo: {
      type: String,
      enum: ['entrada', 'saida'],
      required: true
    },
    data: {
      type: String,
      required: true
    },
    quantidade: {
      type: Number,
      required: true,
      min: 1
    },
    origem: {
      type: String,
      enum: ['venda', 'compra', 'entrada', 'baixa no estoque']
    },
    codigoVenda: {
      type: String,
      match: /^VENDA\d{8}-\d{3}$/
    },
    motivo: String,
    fornecedor: {
      type: String,
      match: /^F\d{3}$/
    },
    observacao: {
      type: String,
      maxlength: 300
    },
    cor: String,
    tamanho: String
  }]
}, {
  timestamps: { createdAt: 'dataCadastro', updatedAt: 'dataAtualizacao' },
  collection: 'estoque',
  versionKey: false
});

// Índices compostos otimizados para consultas frequentes
EstoqueSchema.index({ codigoProduto: 1 }); // Busca por produto (mais comum)
EstoqueSchema.index({ codigoEstoque: 1 }); // Busca direta
EstoqueSchema.index({ emPromocao: 1 }); // Filtro promoção
EstoqueSchema.index({ isNovidade: 1 }); // Filtro novidade
EstoqueSchema.index({ ativo: 1 }); // Filtro ativo/inativo
EstoqueSchema.index({ dataCadastro: -1 }); // Ordenação por data
EstoqueSchema.index({ codigoProduto: 1, ativo: 1 }); // Produto + ativo
EstoqueSchema.index({ emPromocao: 1, ativo: 1, dataCadastro: -1 }); // Promoções ativas + data
EstoqueSchema.index({ isNovidade: 1, ativo: 1, dataCadastro: -1 }); // Novidades ativas + data
EstoqueSchema.index({ 'variantes.cor': 1, 'variantes.quantidade': -1 }); // Filtro cor + qtd
EstoqueSchema.index({ quantidade: -1, dataCadastro: -1 }); // Ordenação quantidade + data

export default mongoose.models.Estoque || mongoose.model('Estoque', EstoqueSchema);
