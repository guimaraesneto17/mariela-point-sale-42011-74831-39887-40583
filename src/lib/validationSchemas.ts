import { z } from "zod";

// Cliente Schema
export const clienteSchema = z.object({
  codigoCliente: z
    .string()
    .regex(/^C\d{3}$/, "Código deve seguir o formato C001, C002, etc."),
  nome: z
    .string()
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  telefone: z
    .string()
    .regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, "Telefone deve estar no formato (99) 99999-9999")
    .or(z.literal("")),
  dataNascimento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD")
    .or(z.literal("")),
  observacao: z
    .string()
    .max(500, "Observação deve ter no máximo 500 caracteres")
    .optional(),
});

// Vendedor Schema
export const vendedorSchema = z.object({
  codigoVendedor: z
    .string()
    .regex(/^V\d{3}$/, "Código deve seguir o formato V001, V002, etc."),
  nome: z
    .string()
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  telefone: z
    .string()
    .regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, "Telefone deve estar no formato (99) 99999-9999")
    .or(z.literal("")),
  dataNascimento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD")
    .or(z.literal("")),
  observacao: z
    .string()
    .max(500, "Observação deve ter no máximo 500 caracteres")
    .optional(),
});

// Fornecedor Schema
export const fornecedorSchema = z.object({
  codigoFornecedor: z
    .string()
    .regex(/^F\d{3}$/, "Código deve seguir o formato F001, F002, etc."),
  nome: z
    .string()
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(150, "Nome deve ter no máximo 150 caracteres"),
  telefone: z
    .string()
    .regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, "Telefone deve estar no formato (99) 99999-9999")
    .or(z.literal("")),
  cnpj: z
    .string()
    .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, "CNPJ deve estar no formato 99.999.999/9999-99")
    .or(z.literal("")),
  instagram: z
    .string()
    .regex(/^@\w+/, "Instagram deve começar com @ (ex: @empresa)")
    .or(z.literal("")),
  endereco: z.object({
    rua: z.string().or(z.literal("")),
    numero: z.string().or(z.literal("")),
    bairro: z.string().or(z.literal("")),
    cidade: z.string().min(1, "Cidade é obrigatória"),
    estado: z
      .string()
      .regex(/^[A-Z]{2}$/, "Estado deve ser uma sigla de 2 letras maiúsculas (ex: SP, RJ)"),
    cep: z
      .string()
      .regex(/^\d{5}-\d{3}$/, "CEP deve estar no formato 99999-999")
      .or(z.literal("")),
  }),
  observacao: z
    .string()
    .max(500, "Observação deve ter no máximo 500 caracteres")
    .optional(),
});

// Produto Schema
export const produtoSchema = z.object({
  codigoProduto: z
    .string()
    .regex(/^P\d{3}$/, "Código deve seguir o formato P001, P002, etc."),
  nome: z
    .string()
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  descricao: z
    .string()
    .min(10, "Descrição deve ter no mínimo 10 caracteres")
    .max(500, "Descrição deve ter no máximo 500 caracteres")
    .or(z.literal("")),
  categoria: z.enum(["Calça", "Saia", "Vestido", "Blusa", "Bolsa", "Acessório", "Outro"], {
    errorMap: () => ({ message: "Selecione uma categoria válida" }),
  }),
  cor: z.string().min(1, "Cor é obrigatória"),
  ativo: z.boolean().optional().default(true),
  precoCusto: z
    .number({ invalid_type_error: "Preço de custo deve ser um número" })
    .min(0, "Preço de custo deve ser maior ou igual a 0")
    .optional(),
  precoVenda: z
    .number({ invalid_type_error: "Preço de venda deve ser um número" })
    .min(0, "Preço de venda deve ser maior que 0")
    .optional(),
  margemLucro: z
    .number({ invalid_type_error: "Margem de lucro deve ser um número" })
    .min(0, "Margem de lucro deve ser maior ou igual a 0")
    .optional(),
  tamanho: z.enum(["PP", "P", "M", "G", "GG", "U"]).optional().default("U"),
});

// Estoque Schema
export const estoqueSchema = z.object({
  codigoProduto: z
    .string()
    .regex(/^P\d{3}$/, "Código do produto deve seguir o formato P001, P002, etc."),
  tamanho: z.enum(["PP", "P", "M", "G", "GG", "U"], {
    errorMap: () => ({ message: "Selecione um tamanho válido" }),
  }),
  quantidade: z
    .number({ invalid_type_error: "Quantidade deve ser um número" })
    .int("Quantidade deve ser um número inteiro")
    .min(0, "Quantidade deve ser maior ou igual a 0"),
  precoCusto: z
    .number({ invalid_type_error: "Preço de custo deve ser um número" })
    .min(0, "Preço de custo deve ser maior ou igual a 0"),
  precoVenda: z
    .number({ invalid_type_error: "Preço de venda deve ser um número" })
    .min(0, "Preço de venda deve ser maior que 0"),
  margemDeLucro: z
    .number({ invalid_type_error: "Margem de lucro deve ser um número" })
    .min(0, "Margem de lucro deve ser maior ou igual a 0")
    .optional(),
  emPromocao: z.boolean().optional().default(false),
  precoPromocional: z
    .number({ invalid_type_error: "Preço promocional deve ser um número" })
    .min(0, "Preço promocional deve ser maior ou igual a 0")
    .optional(),
  tipoPrecoPromocional: z.enum(["valor direto", "porcentagem"]).optional(),
  isNovidade: z.boolean().optional().default(false),
});

// Helper para formatar mensagens de erro
export const formatZodErrors = (errors: z.ZodError) => {
  return errors.errors.map((error) => ({
    field: error.path.join("."),
    message: error.message,
  }));
};
