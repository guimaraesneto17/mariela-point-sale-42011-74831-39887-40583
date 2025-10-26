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
  togglePromocao: (codigo: string, emPromocao: boolean, precoPromocional?: number) => fetchAPI(`/estoque/promocao/${codigo}`, {
    method: 'PATCH',
    body: JSON.stringify({ emPromocao, precoPromocional }),
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
