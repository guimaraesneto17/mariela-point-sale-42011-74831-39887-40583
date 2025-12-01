import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://mariela-pdv-backend.onrender.com/api';
const API_TIMEOUT = 30000; // 30 segundos
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 segundo entre tentativas

// Criar instância do Axios com configurações
export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token automaticamente
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mariela_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para tratamento de erros e renovação de token
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Se receber 401 e não for tentativa de refresh, tentar renovar token
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh')) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('mariela_refresh_token');
        if (refreshToken) {
          const response = await axiosInstance.post<{ success: boolean; accessToken: string; expiresIn: string }>('/auth/refresh', { refreshToken });
          const { accessToken } = response.data;

          localStorage.setItem('mariela_access_token', accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;

          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // Falhou ao renovar, fazer logout
        localStorage.removeItem('mariela_access_token');
        localStorage.removeItem('mariela_refresh_token');
        localStorage.removeItem('mariela_user');
        
        if (!window.location.pathname.includes('/auth')) {
          window.location.href = '/auth';
        }
      }
    }

    // Se receber 403 ou outros erros de autenticação
    if (error.response?.status === 403) {
      localStorage.removeItem('mariela_access_token');
      localStorage.removeItem('mariela_refresh_token');
      localStorage.removeItem('mariela_user');
      
      if (!window.location.pathname.includes('/auth')) {
        window.location.href = '/auth';
      }
    }

    return Promise.reject(error);
  }
);

// Export default da instância axios
export default axiosInstance;

// Helper para delay entre tentativas
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper para fazer requisições HTTP com timeout e retry
async function fetchAPI(endpoint: string, options?: RequestInit, retryCount = 0): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    // Adicionar token de autenticação se disponível
    const token = localStorage.getItem('mariela_access_token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      const serviceName = endpoint.split('/')[1] || 'API';
      
      // Tentar novamente se ainda tiver tentativas disponíveis
      if (retryCount < MAX_RETRIES) {
        console.warn(`⏱️ Timeout no serviço "${serviceName}". Tentativa ${retryCount + 1}/${MAX_RETRIES}...`);
        await delay(RETRY_DELAY * (retryCount + 1)); // Aumenta o delay a cada tentativa
        return fetchAPI(endpoint, options, retryCount + 1);
      }
      
      throw new Error(`Timeout: O serviço "${serviceName}" não respondeu após ${MAX_RETRIES} tentativas. Verifique sua conexão ou tente novamente.`);
    }
    
    throw error;
  }
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
  updateVariantImages: (codigoProduto: string, data: { cor: string; tamanho?: string; imagens: string[] }) => 
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
    registrarNoCaixa?: boolean;
    numeroParcela?: number;
    comprovante?: string;
    jurosMulta?: number;
  }) => {
    console.log('📤 [FRONTEND] Enviando pagamento:', { numero, data });
    // Enviar no formato que o backend espera
    const payload = {
      valorPago: data.valorPago,
      dataPagamento: data.dataPagamento,
      formaPagamento: data.formaPagamento,
      observacoes: data.observacoes,
      numeroParcela: data.numeroParcela,
      comprovante: data.comprovante,
      jurosMulta: data.jurosMulta,
    };
    return fetchAPI(`/contas-pagar/${numero}/pagar`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }).then(result => {
      console.log('✅ [FRONTEND] Resposta do pagamento:', result);
      return result;
    }).catch(error => {
      console.error('❌ [FRONTEND] Erro no pagamento:', error);
      throw error;
    });
  },
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
    registrarNoCaixa?: boolean;
    numeroParcela?: number;
    comprovante?: string;
    jurosMulta?: number;
  }) => {
    console.log('📤 [FRONTEND] Enviando recebimento:', { numero, data });
    // Enviar no formato que o backend espera
    const payload = {
      valorRecebido: data.valorRecebido,
      dataRecebimento: data.dataRecebimento,
      formaPagamento: data.formaPagamento,
      observacoes: data.observacoes,
      numeroParcela: data.numeroParcela,
      comprovante: data.comprovante,
      jurosMulta: data.jurosMulta,
    };
    return fetchAPI(`/contas-receber/${numero}/receber`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }).then(result => {
      console.log('✅ [FRONTEND] Resposta do recebimento:', result);
      return result;
    }).catch(error => {
      console.error('❌ [FRONTEND] Erro no recebimento:', error);
      throw error;
    });
  },
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

// ============= PERMISSÕES =============
export const permissoesAPI = {
  getAll: () => fetchAPI('/permissions'),
  getByRole: (role: string) => fetchAPI(`/permissions/role/${role}`),
  batchUpdate: (permissions: any[]) => fetchAPI('/permissions/batch', {
    method: 'POST',
    body: JSON.stringify({ permissions })
  }),
  initializeDefaults: (role: string) => fetchAPI(`/permissions/initialize/${role}`, {
    method: 'POST'
  }),
  checkPermission: (role: string, module: string, action: string) => 
    fetchAPI(`/permissions/check?role=${role}&module=${module}&action=${action}`)
};
