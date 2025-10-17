const API_BASE_URL = 'http://localhost:3001/api';

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
  getById: (id: string) => fetchAPI(`/clientes/${id}`),
  create: (data: any) => fetchAPI('/clientes', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => fetchAPI(`/clientes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI(`/clientes/${id}`, { method: 'DELETE' }),
};

// ============= PRODUTOS =============
export const produtosAPI = {
  getAll: () => fetchAPI('/produtos'),
  getById: (id: string) => fetchAPI(`/produtos/${id}`),
  create: (data: any) => fetchAPI('/produtos', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => fetchAPI(`/produtos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI(`/produtos/${id}`, { method: 'DELETE' }),
};

// ============= VENDAS =============
export const vendasAPI = {
  getAll: () => fetchAPI('/vendas'),
  getById: (id: string) => fetchAPI(`/vendas/${id}`),
  create: (data: any) => fetchAPI('/vendas', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => fetchAPI(`/vendas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI(`/vendas/${id}`, { method: 'DELETE' }),
};

// ============= ESTOQUE =============
export const estoqueAPI = {
  getAll: () => fetchAPI('/estoque'),
  getById: (id: string) => fetchAPI(`/estoque/${id}`),
  getByCodigo: (codigo: string) => fetchAPI(`/estoque/codigo/${codigo}`),
  create: (data: any) => fetchAPI('/estoque', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => fetchAPI(`/estoque/${id}`, {
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
  delete: (id: string) => fetchAPI(`/estoque/${id}`, { method: 'DELETE' }),
};

// ============= FORNECEDORES =============
export const fornecedoresAPI = {
  getAll: () => fetchAPI('/fornecedores'),
  getById: (id: string) => fetchAPI(`/fornecedores/${id}`),
  create: (data: any) => fetchAPI('/fornecedores', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => fetchAPI(`/fornecedores/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI(`/fornecedores/${id}`, { method: 'DELETE' }),
};

// ============= VENDEDORES =============
export const vendedoresAPI = {
  getAll: () => fetchAPI('/vendedores'),
  getById: (id: string) => fetchAPI(`/vendedores/${id}`),
  create: (data: any) => fetchAPI('/vendedores', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => fetchAPI(`/vendedores/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI(`/vendedores/${id}`, { method: 'DELETE' }),
};

// ============= VITRINE VIRTUAL =============
export const vitrineVirtualAPI = {
  getAll: () => fetchAPI('/vitrine'),
  getById: (id: string) => fetchAPI(`/vitrine/${id}`),
  getByCodigo: (codigo: string) => fetchAPI(`/vitrine/codigo/${codigo}`),
  getNovidades: () => fetchAPI('/vitrine/novidades'),
  getPromocoes: () => fetchAPI('/vitrine/promocoes'),
  create: (data: any) => fetchAPI('/vitrine', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => fetchAPI(`/vitrine/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI(`/vitrine/${id}`, { method: 'DELETE' }),
};
