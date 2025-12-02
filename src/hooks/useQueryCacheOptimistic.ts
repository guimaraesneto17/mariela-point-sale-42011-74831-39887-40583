import { useQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import { 
  clientesAPI, 
  vendasAPI, 
  produtosAPI, 
  estoqueAPI, 
  vendedoresAPI, 
  fornecedoresAPI,
  caixaAPI,
  contasPagarAPI,
  contasReceberAPI,
  categoriasFinanceirasAPI
} from '@/lib/api';
import { toast } from 'sonner';

// Query Keys
export const QUERY_KEYS = {
  CLIENTES: ['clientes'] as const,
  VENDAS: ['vendas'] as const,
  PRODUTOS: ['produtos'] as const,
  ESTOQUE: ['estoque'] as const,
  VENDEDORES: ['vendedores'] as const,
  FORNECEDORES: ['fornecedores'] as const,
  CAIXA_ABERTO: ['caixa', 'aberto'] as const,
  CONTAS_PAGAR: ['contas-pagar'] as const,
  CONTAS_RECEBER: ['contas-receber'] as const,
  RESUMO_PAGAR: ['resumo-pagar'] as const,
  RESUMO_RECEBER: ['resumo-receber'] as const,
  CATEGORIAS_FINANCEIRAS: ['categorias-financeiras'] as const,
};

// Default query options with retry and error handling
const defaultQueryOptions = {
  retry: 3,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  staleTime: 5 * 60 * 1000, // 5 minutes
};

// Clientes
export function useClientes() {
  return useQuery({
    queryKey: QUERY_KEYS.CLIENTES,
    queryFn: () => clientesAPI.getAll(),
    ...defaultQueryOptions,
  });
}

export function useCreateCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => clientesAPI.create(data),
    onMutate: async (newCliente) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.CLIENTES });
      
      // Snapshot previous value
      const previousClientes = queryClient.getQueryData(QUERY_KEYS.CLIENTES);
      
      // Optimistically update
      queryClient.setQueryData(QUERY_KEYS.CLIENTES, (old: any) => {
        const clientes = Array.isArray(old) ? old : [];
        return [...clientes, { ...newCliente, _id: 'temp-' + Date.now() }];
      });
      
      return { previousClientes };
    },
    onError: (error: any, newCliente, context) => {
      // Rollback on error
      if (context?.previousClientes) {
        queryClient.setQueryData(QUERY_KEYS.CLIENTES, context.previousClientes);
      }
      toast.error('Erro ao criar cliente', { description: error.message });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CLIENTES });
    },
    onSuccess: () => {
      toast.success('Cliente criado com sucesso!');
    },
  });
}

export function useUpdateCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => clientesAPI.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.CLIENTES });
      
      const previousClientes = queryClient.getQueryData(QUERY_KEYS.CLIENTES);
      
      queryClient.setQueryData(QUERY_KEYS.CLIENTES, (old: any) => {
        const clientes = Array.isArray(old) ? old : [];
        return clientes.map((cliente: any) => 
          cliente.codigoCliente === id ? { ...cliente, ...data } : cliente
        );
      });
      
      return { previousClientes };
    },
    onError: (error: any, variables, context) => {
      if (context?.previousClientes) {
        queryClient.setQueryData(QUERY_KEYS.CLIENTES, context.previousClientes);
      }
      toast.error('Erro ao atualizar cliente', { description: error.message });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CLIENTES });
    },
    onSuccess: () => {
      toast.success('Cliente atualizado com sucesso!');
    },
  });
}

export function useDeleteCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clientesAPI.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.CLIENTES });
      
      const previousClientes = queryClient.getQueryData(QUERY_KEYS.CLIENTES);
      
      queryClient.setQueryData(QUERY_KEYS.CLIENTES, (old: any) => {
        const clientes = Array.isArray(old) ? old : [];
        return clientes.filter((cliente: any) => cliente.codigoCliente !== id);
      });
      
      return { previousClientes };
    },
    onError: (error: any, id, context) => {
      if (context?.previousClientes) {
        queryClient.setQueryData(QUERY_KEYS.CLIENTES, context.previousClientes);
      }
      toast.error('Erro ao excluir cliente', { description: error.message });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CLIENTES });
    },
    onSuccess: () => {
      toast.success('Cliente excluído com sucesso!');
    },
  });
}

// Vendas
export function useVendas() {
  return useQuery({
    queryKey: QUERY_KEYS.VENDAS,
    queryFn: () => vendasAPI.getAll(),
    ...defaultQueryOptions,
  });
}

// Produtos
export function useProdutos() {
  return useQuery({
    queryKey: QUERY_KEYS.PRODUTOS,
    queryFn: () => produtosAPI.getAll(),
    ...defaultQueryOptions,
  });
}

export function useCreateProduto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => produtosAPI.create(data),
    onMutate: async (newProduto) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.PRODUTOS });
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.ESTOQUE });
      
      const previousProdutos = queryClient.getQueryData(QUERY_KEYS.PRODUTOS);
      const previousEstoque = queryClient.getQueryData(QUERY_KEYS.ESTOQUE);
      
      queryClient.setQueryData(QUERY_KEYS.PRODUTOS, (old: any) => {
        const produtos = Array.isArray(old) ? old : [];
        return [...produtos, { ...newProduto, _id: 'temp-' + Date.now() }];
      });
      
      return { previousProdutos, previousEstoque };
    },
    onError: (error: any, newProduto, context) => {
      if (context?.previousProdutos) {
        queryClient.setQueryData(QUERY_KEYS.PRODUTOS, context.previousProdutos);
      }
      if (context?.previousEstoque) {
        queryClient.setQueryData(QUERY_KEYS.ESTOQUE, context.previousEstoque);
      }
      toast.error('Erro ao criar produto', { description: error.message });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUTOS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ESTOQUE });
    },
    onSuccess: () => {
      toast.success('Produto criado com sucesso!');
    },
  });
}

export function useUpdateProduto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => produtosAPI.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.PRODUTOS });
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.ESTOQUE });
      
      const previousProdutos = queryClient.getQueryData(QUERY_KEYS.PRODUTOS);
      const previousEstoque = queryClient.getQueryData(QUERY_KEYS.ESTOQUE);
      
      queryClient.setQueryData(QUERY_KEYS.PRODUTOS, (old: any) => {
        const produtos = Array.isArray(old) ? old : [];
        return produtos.map((produto: any) => 
          produto.codigoProduto === id ? { ...produto, ...data } : produto
        );
      });
      
      return { previousProdutos, previousEstoque };
    },
    onError: (error: any, variables, context) => {
      if (context?.previousProdutos) {
        queryClient.setQueryData(QUERY_KEYS.PRODUTOS, context.previousProdutos);
      }
      if (context?.previousEstoque) {
        queryClient.setQueryData(QUERY_KEYS.ESTOQUE, context.previousEstoque);
      }
      toast.error('Erro ao atualizar produto', { description: error.message });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUTOS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ESTOQUE });
    },
    onSuccess: () => {
      toast.success('Produto atualizado com sucesso!');
    },
  });
}

export function useDeleteProduto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => produtosAPI.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.PRODUTOS });
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.ESTOQUE });
      
      const previousProdutos = queryClient.getQueryData(QUERY_KEYS.PRODUTOS);
      const previousEstoque = queryClient.getQueryData(QUERY_KEYS.ESTOQUE);
      
      queryClient.setQueryData(QUERY_KEYS.PRODUTOS, (old: any) => {
        const produtos = Array.isArray(old) ? old : [];
        return produtos.filter((produto: any) => produto.codigoProduto !== id);
      });
      
      return { previousProdutos, previousEstoque };
    },
    onError: (error: any, id, context) => {
      if (context?.previousProdutos) {
        queryClient.setQueryData(QUERY_KEYS.PRODUTOS, context.previousProdutos);
      }
      if (context?.previousEstoque) {
        queryClient.setQueryData(QUERY_KEYS.ESTOQUE, context.previousEstoque);
      }
      toast.error('Erro ao excluir produto', { description: error.message });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUTOS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ESTOQUE });
    },
    onSuccess: () => {
      toast.success('Produto excluído com sucesso!');
    },
  });
}

// Estoque
export function useEstoque() {
  return useQuery({
    queryKey: QUERY_KEYS.ESTOQUE,
    queryFn: () => estoqueAPI.getAll(),
    ...defaultQueryOptions,
  });
}

export function useUpdateEstoque() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ codigoProduto, data }: { codigoProduto: string; data: any }) => 
      estoqueAPI.update(codigoProduto, data),
    onMutate: async ({ codigoProduto, data }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.ESTOQUE });
      
      const previousEstoque = queryClient.getQueryData(QUERY_KEYS.ESTOQUE);
      
      queryClient.setQueryData(QUERY_KEYS.ESTOQUE, (old: any) => {
        const estoque = Array.isArray(old) ? old : [];
        return estoque.map((item: any) => 
          item.codigoProduto === codigoProduto ? { ...item, ...data } : item
        );
      });
      
      return { previousEstoque };
    },
    onError: (error: any, variables, context) => {
      if (context?.previousEstoque) {
        queryClient.setQueryData(QUERY_KEYS.ESTOQUE, context.previousEstoque);
      }
      toast.error('Erro ao atualizar estoque', { description: error.message });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ESTOQUE });
    },
    onSuccess: () => {
      toast.success('Estoque atualizado com sucesso!');
    },
  });
}

// Vendedores
export function useVendedores() {
  return useQuery({
    queryKey: QUERY_KEYS.VENDEDORES,
    queryFn: () => vendedoresAPI.getAll(),
    ...defaultQueryOptions,
  });
}

export function useCreateVendedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => vendedoresAPI.create(data),
    onMutate: async (newVendedor) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.VENDEDORES });
      
      const previousVendedores = queryClient.getQueryData(QUERY_KEYS.VENDEDORES);
      
      queryClient.setQueryData(QUERY_KEYS.VENDEDORES, (old: any) => {
        const vendedores = Array.isArray(old) ? old : [];
        return [...vendedores, { ...newVendedor, _id: 'temp-' + Date.now() }];
      });
      
      return { previousVendedores };
    },
    onError: (error: any, newVendedor, context) => {
      if (context?.previousVendedores) {
        queryClient.setQueryData(QUERY_KEYS.VENDEDORES, context.previousVendedores);
      }
      toast.error('Erro ao criar vendedor', { description: error.message });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VENDEDORES });
    },
    onSuccess: () => {
      toast.success('Vendedor criado com sucesso!');
    },
  });
}

export function useUpdateVendedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => vendedoresAPI.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.VENDEDORES });
      
      const previousVendedores = queryClient.getQueryData(QUERY_KEYS.VENDEDORES);
      
      queryClient.setQueryData(QUERY_KEYS.VENDEDORES, (old: any) => {
        const vendedores = Array.isArray(old) ? old : [];
        return vendedores.map((vendedor: any) => 
          vendedor.codigoVendedor === id ? { ...vendedor, ...data } : vendedor
        );
      });
      
      return { previousVendedores };
    },
    onError: (error: any, variables, context) => {
      if (context?.previousVendedores) {
        queryClient.setQueryData(QUERY_KEYS.VENDEDORES, context.previousVendedores);
      }
      toast.error('Erro ao atualizar vendedor', { description: error.message });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VENDEDORES });
    },
    onSuccess: () => {
      toast.success('Vendedor atualizado com sucesso!');
    },
  });
}

export function useDeleteVendedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vendedoresAPI.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.VENDEDORES });
      
      const previousVendedores = queryClient.getQueryData(QUERY_KEYS.VENDEDORES);
      
      queryClient.setQueryData(QUERY_KEYS.VENDEDORES, (old: any) => {
        const vendedores = Array.isArray(old) ? old : [];
        return vendedores.filter((vendedor: any) => vendedor.codigoVendedor !== id);
      });
      
      return { previousVendedores };
    },
    onError: (error: any, id, context) => {
      if (context?.previousVendedores) {
        queryClient.setQueryData(QUERY_KEYS.VENDEDORES, context.previousVendedores);
      }
      toast.error('Erro ao excluir vendedor', { description: error.message });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VENDEDORES });
    },
    onSuccess: () => {
      toast.success('Vendedor excluído com sucesso!');
    },
  });
}

// Fornecedores
export function useFornecedores() {
  return useQuery({
    queryKey: QUERY_KEYS.FORNECEDORES,
    queryFn: () => fornecedoresAPI.getAll(),
    ...defaultQueryOptions,
  });
}

export function useCreateFornecedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => fornecedoresAPI.create(data),
    onMutate: async (newFornecedor) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.FORNECEDORES });
      
      const previousFornecedores = queryClient.getQueryData(QUERY_KEYS.FORNECEDORES);
      
      queryClient.setQueryData(QUERY_KEYS.FORNECEDORES, (old: any) => {
        const fornecedores = Array.isArray(old) ? old : [];
        return [...fornecedores, { ...newFornecedor, _id: 'temp-' + Date.now() }];
      });
      
      return { previousFornecedores };
    },
    onError: (error: any, newFornecedor, context) => {
      if (context?.previousFornecedores) {
        queryClient.setQueryData(QUERY_KEYS.FORNECEDORES, context.previousFornecedores);
      }
      toast.error('Erro ao criar fornecedor', { description: error.message });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FORNECEDORES });
    },
    onSuccess: () => {
      toast.success('Fornecedor criado com sucesso!');
    },
  });
}

export function useUpdateFornecedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => fornecedoresAPI.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.FORNECEDORES });
      
      const previousFornecedores = queryClient.getQueryData(QUERY_KEYS.FORNECEDORES);
      
      queryClient.setQueryData(QUERY_KEYS.FORNECEDORES, (old: any) => {
        const fornecedores = Array.isArray(old) ? old : [];
        return fornecedores.map((fornecedor: any) => 
          fornecedor.codigoFornecedor === id ? { ...fornecedor, ...data } : fornecedor
        );
      });
      
      return { previousFornecedores };
    },
    onError: (error: any, variables, context) => {
      if (context?.previousFornecedores) {
        queryClient.setQueryData(QUERY_KEYS.FORNECEDORES, context.previousFornecedores);
      }
      toast.error('Erro ao atualizar fornecedor', { description: error.message });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FORNECEDORES });
    },
    onSuccess: () => {
      toast.success('Fornecedor atualizado com sucesso!');
    },
  });
}

export function useDeleteFornecedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fornecedoresAPI.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.FORNECEDORES });
      
      const previousFornecedores = queryClient.getQueryData(QUERY_KEYS.FORNECEDORES);
      
      queryClient.setQueryData(QUERY_KEYS.FORNECEDORES, (old: any) => {
        const fornecedores = Array.isArray(old) ? old : [];
        return fornecedores.filter((fornecedor: any) => fornecedor.codigoFornecedor !== id);
      });
      
      return { previousFornecedores };
    },
    onError: (error: any, id, context) => {
      if (context?.previousFornecedores) {
        queryClient.setQueryData(QUERY_KEYS.FORNECEDORES, context.previousFornecedores);
      }
      toast.error('Erro ao excluir fornecedor', { description: error.message });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FORNECEDORES });
    },
    onSuccess: () => {
      toast.success('Fornecedor excluído com sucesso!');
    },
  });
}

// Caixa - sem polling automático para evitar excesso de chamadas
export function useCaixaAberto() {
  return useQuery({
    queryKey: QUERY_KEYS.CAIXA_ABERTO,
    queryFn: async () => {
      try {
        return await caixaAPI.getCaixaAberto();
      } catch (error) {
        return null;
      }
    },
    // Desabilita refetch automático para evitar 429 (Too Many Requests)
    // A verificação é feita apenas quando necessário via invalidações manuais
    retry: 0,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    staleTime: 300000, // Cache válido por 5 minutos
  });
}

// Contas a Pagar
export function useContasPagar() {
  return useQuery({
    queryKey: QUERY_KEYS.CONTAS_PAGAR,
    queryFn: () => contasPagarAPI.getAll(),
    ...defaultQueryOptions,
  });
}

export function useResumoPagar() {
  return useQuery({
    queryKey: QUERY_KEYS.RESUMO_PAGAR,
    queryFn: () => contasPagarAPI.getResumo(),
    ...defaultQueryOptions,
  });
}

export function useCreateContaPagar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => contasPagarAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTAS_PAGAR });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.RESUMO_PAGAR });
      toast.success('Conta a pagar criada com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar conta', { description: error.message });
    },
  });
}

export function useDeleteContaPagar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (numero: string) => contasPagarAPI.delete(numero),
    onMutate: async (numero) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.CONTAS_PAGAR });
      
      const previousContas = queryClient.getQueryData(QUERY_KEYS.CONTAS_PAGAR);
      
      queryClient.setQueryData(QUERY_KEYS.CONTAS_PAGAR, (old: any) => {
        const contas = Array.isArray(old) ? old : [];
        return contas.filter((conta: any) => conta.numeroDocumento !== numero);
      });
      
      return { previousContas };
    },
    onError: (error: any, numero, context) => {
      if (context?.previousContas) {
        queryClient.setQueryData(QUERY_KEYS.CONTAS_PAGAR, context.previousContas);
      }
      toast.error('Erro ao excluir conta', { description: error.message });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTAS_PAGAR });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.RESUMO_PAGAR });
    },
    onSuccess: () => {
      toast.success('Conta excluída com sucesso!');
    },
  });
}

// Contas a Receber
export function useContasReceber() {
  return useQuery({
    queryKey: QUERY_KEYS.CONTAS_RECEBER,
    queryFn: () => contasReceberAPI.getAll(),
    ...defaultQueryOptions,
  });
}

export function useResumoReceber() {
  return useQuery({
    queryKey: QUERY_KEYS.RESUMO_RECEBER,
    queryFn: () => contasReceberAPI.getResumo(),
    ...defaultQueryOptions,
  });
}

export function useCreateContaReceber() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => contasReceberAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTAS_RECEBER });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.RESUMO_RECEBER });
      toast.success('Conta a receber criada com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar conta', { description: error.message });
    },
  });
}

export function useDeleteContaReceber() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (numero: string) => contasReceberAPI.delete(numero),
    onMutate: async (numero) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.CONTAS_RECEBER });
      
      const previousContas = queryClient.getQueryData(QUERY_KEYS.CONTAS_RECEBER);
      
      queryClient.setQueryData(QUERY_KEYS.CONTAS_RECEBER, (old: any) => {
        const contas = Array.isArray(old) ? old : [];
        return contas.filter((conta: any) => conta.numeroDocumento !== numero);
      });
      
      return { previousContas };
    },
    onError: (error: any, numero, context) => {
      if (context?.previousContas) {
        queryClient.setQueryData(QUERY_KEYS.CONTAS_RECEBER, context.previousContas);
      }
      toast.error('Erro ao excluir conta', { description: error.message });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTAS_RECEBER });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.RESUMO_RECEBER });
    },
    onSuccess: () => {
      toast.success('Conta excluída com sucesso!');
    },
  });
}

// Categorias Financeiras
export function useCategoriasFinanceiras() {
  return useQuery({
    queryKey: QUERY_KEYS.CATEGORIAS_FINANCEIRAS,
    queryFn: () => categoriasFinanceirasAPI.getAll(),
    ...defaultQueryOptions,
  });
}

// Hook para invalidar múltiplas queries de uma vez
export function useInvalidateQueries() {
  const queryClient = useQueryClient();
  
  return {
    invalidateAll: () => {
      queryClient.invalidateQueries();
    },
    invalidateVendas: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VENDAS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CLIENTES });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VENDEDORES });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ESTOQUE });
    },
    invalidateFinanceiro: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTAS_PAGAR });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTAS_RECEBER });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.RESUMO_PAGAR });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.RESUMO_RECEBER });
    },
  };
}
