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
    cidade: optionalString(), // agora opcional
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
  precoCusto: z.number().min(0.01, "Preço de custo deve ser maior que 0"),
  precoVenda: z.number().min(0.01, "Preço de venda deve ser maior que 0"),
  margemDeLucro: z.number().min(0, "Margem de lucro deve ser maior ou igual a 0"),
});

// ESTOQUE
export const estoqueSchema = z.object({
  codigoProduto: z.string()
    .regex(regex.codigoProduto, "Código do produto deve seguir o formato P001, P002, etc."),
  cor: z.string().min(1, "Cor é obrigatória"),
  tamanho: z.enum(["PP", "P", "M", "G", "GG", "U"], {
    errorMap: () => ({ message: "Tamanho é obrigatório" }),
  }),
  quantidade: z.number()
    .int("Quantidade deve ser um número inteiro")
    .min(0, "Quantidade deve ser maior ou igual a 0"),
  precoPromocional: z.number()
    .min(0, "Preço promocional deve ser maior ou igual a 0")
    .optional(),
  ativo: z.boolean().optional().default(true),
  emPromocao: z.boolean().optional().default(false),
  isNovidade: z.boolean().optional().default(false),
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
