import { z } from "zod";

// ===========================================================
// Regex centralizados (igual ao backend)
// ===========================================================
const regex = {
  codigoCliente: /^C\d{3}$/,
  codigoFornecedor: /^F\d{3}$/,
  codigoProduto: /^P\d{3}$/,
  codigoVendedor: /^V\d{3}$/,
  telefone: /^\(\d{2}\) \d{4,5}-\d{4}$/,
  data: /^\d{4}-\d{2}-\d{2}$/,
  cnpj: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
  instagram: /^@\w+/,
  cep: /^\d{5}-\d{3}$/,
  estado: /^[A-Z]{2}$/,
};

// ===========================================================
// Helper — string opcional ou vazia ("")
// ===========================================================
const optionalString = (schema: z.ZodString = z.string()) =>
  schema.optional().or(z.literal(""));

// ===========================================================
// Schemas
// ===========================================================

// CLIENTE
export const clienteSchema = z.object({
  codigoCliente: z.string()
    .regex(regex.codigoCliente, "Código deve seguir o formato C001, C002, etc."),
  nome: z.string()
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  telefone: optionalString(z.string().regex(regex.telefone, "Telefone deve estar no formato (99) 99999-9999")),
  dataNascimento: optionalString(z.string().regex(regex.data, "Data deve estar no formato YYYY-MM-DD")),
  valorTotalComprado: z.number()
    .min(0, "Valor total comprado deve ser maior ou igual a 0")
    .default(0)
    .optional(),
  quantidadeCompras: z.number()
    .int("Quantidade de compras deve ser um número inteiro")
    .min(0, "Quantidade de compras deve ser maior ou igual a 0")
    .default(0)
    .optional(),
  dataUltimaCompra: z.string()
    .regex(regex.data, "Data deve estar no formato YYYY-MM-DD")
    .nullable()
    .optional(),
  observacao: z.string().max(500, "Observação deve ter no máximo 500 caracteres").optional(),
});

// VENDEDOR
export const vendedorSchema = z.object({
  codigoVendedor: z.string()
    .regex(regex.codigoVendedor, "Código deve seguir o formato V001, V002, etc."),
  nome: z.string()
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(120, "Nome deve ter no máximo 120 caracteres"),
  telefone: optionalString(z.string().regex(regex.telefone, "Telefone deve estar no formato (99) 99999-9999")),
  dataNascimento: optionalString(z.string().regex(regex.data, "Data deve estar no formato YYYY-MM-DD")),
  ativo: z.boolean().default(true),
  metaMensal: z.number()
    .min(0, "Meta mensal deve ser maior ou igual a 0")
    .nullable()
    .optional(),
  vendasRealizadas: z.number()
    .int("Vendas realizadas deve ser um número inteiro")
    .min(0, "Vendas realizadas deve ser maior ou igual a 0")
    .default(0)
    .optional(),
  totalVendido: z.number()
    .min(0, "Total vendido deve ser maior ou igual a 0")
    .default(0)
    .optional(),
  observacao: z.string().max(500, "Observação deve ter no máximo 500 caracteres").optional(),
});

// FORNECEDOR
export const fornecedorSchema = z.object({
  codigoFornecedor: z.string()
    .regex(regex.codigoFornecedor, "Código deve seguir o formato F001, F002, etc."),
  nome: z.string()
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(150, "Nome deve ter no máximo 150 caracteres"),
  telefone: optionalString(z.string().regex(regex.telefone, "Telefone deve estar no formato (99) 99999-9999")),
  cnpj: optionalString(z.string().regex(regex.cnpj, "CNPJ deve estar no formato 99.999.999/9999-99")),
  instagram: optionalString(z.string().regex(regex.instagram, "Instagram deve começar com @ (ex: @empresa)")),
  endereco: z.object({
    rua: optionalString(),
    numero: optionalString(),
    bairro: optionalString(),
    cidade: z.string().min(1, "Cidade é obrigatória"),
    estado: z.string()
      .regex(regex.estado, "Estado deve ser uma sigla de 2 letras maiúsculas (ex: SP, RJ)"),
    cep: optionalString(z.string().regex(regex.cep, "CEP deve estar no formato 99999-999")),
  }),
  observacao: z.string().max(500, "Observação deve ter no máximo 500 caracteres").optional(),
});

// PRODUTO
export const produtoSchema = z.object({
  codigoProduto: z.string()
    .regex(regex.codigoProduto, "Código deve seguir o formato P001, P002, etc."),
  nome: z.string()
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  descricao: optionalString(z.string()
    .min(10, "Descrição deve ter no mínimo 10 caracteres")
    .max(500, "Descrição deve ter no máximo 500 caracteres")),
  categoria: z.enum(["Calça", "Saia", "Vestido", "Blusa", "Bolsa", "Acessório", "Outro"], {
    errorMap: () => ({ message: "Categoria é obrigatória" }),
  }),
  precoCusto: z
    .number({ 
      required_error: "Preço de custo é obrigatório",
      invalid_type_error: "Preço de custo deve ser um número" 
    })
    .min(0.01, "Preço de custo deve ser maior que 0"),
  precoVenda: z
    .number({ 
      required_error: "Preço de venda é obrigatório",
      invalid_type_error: "Preço de venda deve ser um número" 
    })
    .min(0.01, "Preço de venda deve ser maior que 0"),
  margemDeLucro: z
    .number({ 
      required_error: "Margem de lucro é obrigatória",
      invalid_type_error: "Margem de lucro deve ser um número" 
    })
    .min(0, "Margem de lucro deve ser maior ou igual a 0"),
  fornecedor: z.object({
    codigoFornecedor: z.string()
      .regex(regex.codigoFornecedor, "Código deve seguir o formato F001, F002, etc."),
    nome: z.string()
      .min(3, "Nome deve ter no mínimo 3 caracteres")
      .max(100, "Nome deve ter no máximo 100 caracteres"),
  }).nullable().optional(),
  });

// ESTOQUE
export const estoqueSchema = z.object({
  codigoProduto: z.string()
    .regex(regex.codigoProduto, "Código do produto deve seguir o formato P001, P002, etc."),
  quantidade: z.number()
    .int("Quantidade deve ser um número inteiro")
    .min(0, "Quantidade deve ser maior ou igual a 0"),
  emPromocao: z.boolean().default(false),
  isNovidade: z.boolean().default(false),
  precoPromocional: z.number()
    .min(0, "Preço promocional deve ser maior ou igual a 0")
    .nullable()
    .optional(),
  variantes: z.array(z.object({
    cor: z.string().min(1, "Cor é obrigatória"),
    quantidade: z.number()
      .int("Quantidade deve ser um número inteiro")
      .min(0, "Quantidade deve ser maior ou igual a 0"),
    tamanhos: z.array(z.object({
      tamanho: z.string().min(1, "Tamanho é obrigatório"),
      quantidade: z.number()
        .int("Quantidade deve ser um número inteiro")
        .min(0, "Quantidade deve ser maior ou igual a 0"),
    })).min(1, "Deve ter pelo menos um tamanho"),
    imagens: z.array(z.string()).optional(),
  })).optional(),
  logMovimentacao: z.array(z.object({
    tipo: z.enum(["entrada", "saida"]),
    data: z.string(),
    quantidade: z.number().int().min(1),
    origem: z.enum(["venda", "compra", "entrada", "baixa no estoque"]).optional(),
    codigoVenda: z.string().regex(/^VENDA\d{8}-\d{3}$/).nullable().optional(),
    motivo: z.string().nullable().optional(),
    fornecedor: z.string().regex(regex.codigoFornecedor).nullable().optional(),
    observacao: z.string().max(300).nullable().optional(),
    cor: z.string().nullable().optional(),
    tamanho: z.string().nullable().optional(),
  })).optional(),
});

// CONTAS A PAGAR
export const contaPagarSchema = z.object({
  tipoCriacao: z.enum(['Unica', 'Parcelamento', 'Replica'], {
    errorMap: () => ({ message: "Tipo de criação é obrigatório" }),
  }).default('Unica'),
  descricao: z.string()
    .min(3, "Descrição deve ter no mínimo 3 caracteres")
    .max(200, "Descrição deve ter no máximo 200 caracteres"),
  fornecedor: z.object({
    codigoFornecedor: optionalString(),
    nome: optionalString(),
  }).optional(),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  valor: z.number()
    .min(0.01, "Valor deve ser maior que 0"),
  dataVencimento: z.date({
    required_error: "Data de vencimento é obrigatória",
  }),
  observacoes: z.string().max(500, "Observações devem ter no máximo 500 caracteres").optional(),
  // Campos para parcelamento
  quantidadeParcelas: z.number().min(1).optional(),
  valorTotal: z.number().min(0.01).optional(),
  dataInicio: z.date().optional(),
  // Campos para réplica
  quantidadeReplicas: z.number().min(1).optional(),
});

// CONTAS A RECEBER
export const contaReceberSchema = z.object({
  tipoCriacao: z.enum(['Unica', 'Parcelamento', 'Replica'], {
    errorMap: () => ({ message: "Tipo de criação é obrigatório" }),
  }).default('Unica'),
  descricao: z.string()
    .min(3, "Descrição deve ter no mínimo 3 caracteres")
    .max(200, "Descrição deve ter no máximo 200 caracteres"),
  cliente: z.object({
    codigoCliente: optionalString(),
    nome: optionalString(),
  }).optional(),
  vendaRelacionada: z.object({
    codigoVenda: optionalString(),
  }).optional(),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  valor: z.number()
    .min(0.01, "Valor deve ser maior que 0"),
  dataVencimento: z.date({
    required_error: "Data de vencimento é obrigatória",
  }),
  observacoes: z.string().max(500, "Observações devem ter no máximo 500 caracteres").optional(),
  // Campos para parcelamento
  quantidadeParcelas: z.number().min(1).optional(),
  valorTotal: z.number().min(0.01).optional(),
  dataInicio: z.date().optional(),
  // Campos para réplica
  quantidadeReplicas: z.number().min(1).optional(),
});

// CATEGORIA FINANCEIRA
export const categoriaFinanceiraSchema = z.object({
  nome: z.string()
    .min(2, "Nome deve ter no mínimo 2 caracteres")
    .max(50, "Nome deve ter no máximo 50 caracteres"),
  tipo: z.enum(['pagar', 'receber', 'ambos'], {
    errorMap: () => ({ message: "Tipo deve ser 'pagar', 'receber' ou 'ambos'" }),
  }),
  cor: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Cor deve estar no formato hexadecimal (#RRGGBB)"),
  icone: z.string()
    .min(1, "Ícone é obrigatório")
    .max(50, "Ícone deve ter no máximo 50 caracteres"),
  descricao: optionalString(),
  categoriaPai: z.string()
    .nullable()
    .optional(),
  ativo: z.boolean().default(true),
  ordem: z.number()
    .int("Ordem deve ser um número inteiro")
    .min(0, "Ordem deve ser maior ou igual a 0")
    .default(0)
    .optional(),
});

// ===========================================================
// Helper de formatação de erros
// ===========================================================
export const formatZodErrors = (errors: z.ZodError) => {
  return errors.errors.map((error) => ({
    field: error.path.join("."),
    message: error.message,
  }));
};
