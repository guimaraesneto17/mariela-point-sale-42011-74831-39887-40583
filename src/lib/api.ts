const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://mariela-pdv-backend.onrender.com/api';

// Helper para fazer requisições HTTP
async function fetchAPI(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// ============= CLIENTES =============
export const clientesAPI = {
  getAll: () => fetchAPI('/clientes'),
  getByCodigo: (codigo: string) => fetchAPI(`/clientes/${codigo}`),
  create: (data: any) => fetchAPI('/clientes', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (codigo: string, data: any) => fetchAPI(`/clientes/${codigo}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (codigo: string) => fetchAPI(`/clientes/${codigo}`, { method: 'DELETE' }),
};

// ============= PRODUTOS =============
export const produtosAPI = {
  getAll: () => fetchAPI('/produtos'),
  getByCodigo: (codigo: string) => fetchAPI(`/produtos/${codigo}`),
  create: (data: any) => fetchAPI('/produtos', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (codigo: string, data: any) => fetchAPI(`/produtos/${codigo}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (codigo: string) => fetchAPI(`/produtos/${codigo}`, { method: 'DELETE' }),
};

// ============= VENDAS =============
export const vendasAPI = {
  getAll: () => fetchAPI('/vendas'),
  getByCodigo: (codigo: string) => fetchAPI(`/vendas/${codigo}`),
  create: (data: any) => fetchAPI('/vendas', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (codigo: string, data: any) => fetchAPI(`/vendas/${codigo}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (codigo: string) => fetchAPI(`/vendas/${codigo}`, { method: 'DELETE' }),
};

// ============= ESTOQUE =============
export const estoqueAPI = {
  getAll: () => fetchAPI('/estoque'),
  getByCodigo: (codigo: string) => fetchAPI(`/estoque/codigo/${codigo}`),
  create: (data: any) => fetchAPI('/estoque', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (codigo: string, data: any) => fetchAPI(`/estoque/${codigo}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  registrarEntrada: (data: any) => fetchAPI('/estoque/entrada', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  registrarSaida: (data: any) => fetchAPI('/estoque/saida', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  toggleNovidade: (codigo: string, isNovidade: boolean) => fetchAPI(`/estoque/novidade/${codigo}`, {
    method: 'PATCH',
    body: JSON.stringify({ isNovidade }),
  }),
  togglePromocao: (codigo: string, emPromocao: boolean, precoPromocional?: number, extraData?: any) => {
    const body: any = { emPromocao, precoPromocional };
    if (extraData) {
      Object.assign(body, extraData);
    }
    return fetchAPI(`/estoque/promocao/${codigo}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },
  updateVariantImages: (codigoProduto: string, data: { cor: string; tamanho: string; imagens: string[] }) => 
    fetchAPI(`/estoque/variante/imagens/${codigoProduto}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (codigo: string) => fetchAPI(`/estoque/${codigo}`, { method: 'DELETE' }),
};

// ============= FORNECEDORES =============
export const fornecedoresAPI = {
  getAll: () => fetchAPI('/fornecedores'),
  getByCodigo: (codigo: string) => fetchAPI(`/fornecedores/${codigo}`),
  create: (data: any) => fetchAPI('/fornecedores', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (codigo: string, data: any) => fetchAPI(`/fornecedores/${codigo}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (codigo: string) => fetchAPI(`/fornecedores/${codigo}`, { method: 'DELETE' }),
};

// ============= VENDEDORES =============
export const vendedoresAPI = {
  getAll: () => fetchAPI('/vendedores'),
  getByCodigo: (codigo: string) => fetchAPI(`/vendedores/${codigo}`),
  create: (data: any) => fetchAPI('/vendedores', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (codigo: string, data: any) => fetchAPI(`/vendedores/${codigo}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (codigo: string) => fetchAPI(`/vendedores/${codigo}`, { method: 'DELETE' }),
};

// ============= VITRINE VIRTUAL =============
export const vitrineVirtualAPI = {
  getAll: () => fetchAPI('/vitrine'),
  getByCodigo: (codigo: string) => fetchAPI(`/vitrine/codigo/${codigo}`),
  getNovidades: () => fetchAPI('/vitrine/novidades'),
  getPromocoes: () => fetchAPI('/vitrine/promocoes'),
  create: (data: any) => fetchAPI('/vitrine', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (codigo: string, data: any) => fetchAPI(`/vitrine/${codigo}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (codigo: string) => fetchAPI(`/vitrine/${codigo}`, { method: 'DELETE' }),
};

// ============= RECÁLCULO =============
export const recalculoAPI = {
  recalcularTotais: () => fetchAPI('/recalculo/totais', { method: 'POST' }),
};

// ============= CAIXA =============
export const caixaAPI = {
  getAll: () => fetchAPI('/caixa'),
  getCaixaAberto: () => fetchAPI('/caixa/aberto'),
  getByCodigo: (codigo: string) => fetchAPI(`/caixa/${codigo}`),
  abrirCaixa: (valorInicial: number) => fetchAPI('/caixa/abrir', {
    method: 'POST',
    body: JSON.stringify({ valorInicial }),
  }),
  adicionarMovimento: (tipo: 'entrada' | 'saida', valor: number, observacao?: string) => fetchAPI('/caixa/movimento', {
    method: 'POST',
    body: JSON.stringify({ tipo, valor, observacao }),
  }),
  sincronizarVendas: () => fetchAPI('/caixa/sincronizar-vendas', { method: 'POST' }),
  fecharCaixa: () => fetchAPI('/caixa/fechar', { method: 'POST' }),
  excluirMovimento: (index: number) => fetchAPI('/caixa/movimento/excluir', {
    method: 'DELETE',
    body: JSON.stringify({ index }),
  }),
  reabrirCaixa: (codigo: string) => fetchAPI('/caixa/reabrir', {
    method: 'POST',
    body: JSON.stringify({ codigoCaixa: codigo }),
  }),
  delete: (codigo: string) => fetchAPI(`/caixa/${codigo}`, { method: 'DELETE' }),
};

// ============= CONTAS A PAGAR =============
export const contasPagarAPI = {
  getAll: () => fetchAPI('/contas-pagar'),
  getByNumero: (numero: string) => fetchAPI(`/contas-pagar/${numero}`),
  getResumo: () => fetchAPI('/contas-pagar/resumo'),
  create: (data: any) => fetchAPI('/contas-pagar', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (numero: string, data: any) => fetchAPI(`/contas-pagar/${numero}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  pagar: (numero: string, data: { 
    valorPago: number; 
    dataPagamento?: string; 
    formaPagamento: string; 
    observacoes?: string; 
    registrarNoCaixa?: boolean 
  }) => 
    fetchAPI(`/contas-pagar/${numero}/pagar`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  delete: (numero: string) => fetchAPI(`/contas-pagar/${numero}`, { method: 'DELETE' }),
};

// ============= CONTAS A RECEBER =============
export const contasReceberAPI = {
  getAll: () => fetchAPI('/contas-receber'),
  getByNumero: (numero: string) => fetchAPI(`/contas-receber/${numero}`),
  getResumo: () => fetchAPI('/contas-receber/resumo'),
  create: (data: any) => fetchAPI('/contas-receber', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (numero: string, data: any) => fetchAPI(`/contas-receber/${numero}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  receber: (numero: string, data: { 
    valorRecebido: number; 
    dataRecebimento?: string; 
    formaPagamento: string; 
    observacoes?: string; 
    registrarNoCaixa?: boolean 
  }) => 
    fetchAPI(`/contas-receber/${numero}/receber`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  delete: (numero: string) => fetchAPI(`/contas-receber/${numero}`, { method: 'DELETE' }),
};

// ============= CATEGORIAS FINANCEIRAS =============
export const categoriasFinanceirasAPI = {
  getAll: (tipo?: 'pagar' | 'receber') => {
    const queryParam = tipo ? `?tipo=${tipo}` : '';
    return fetchAPI(`/categorias-financeiras${queryParam}`);
  },
  getById: (id: string) => fetchAPI(`/categorias-financeiras/${id}`),
  create: (data: any) => fetchAPI('/categorias-financeiras', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => fetchAPI(`/categorias-financeiras/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI(`/categorias-financeiras/${id}`, { method: 'DELETE' }),
  reorder: (categorias: { id: string; ordem: number }[]) => fetchAPI('/categorias-financeiras/reorder', {
    method: 'POST',
    body: JSON.stringify({ categorias }),
  }),
};
