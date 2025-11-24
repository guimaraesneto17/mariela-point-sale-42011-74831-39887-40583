import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  CLIENTES: ['clientes'],
  VENDAS: ['vendas'],
  PRODUTOS: ['produtos'],
  ESTOQUE: ['estoque'],
  VENDEDORES: ['vendedores'],
  FORNECEDORES: ['fornecedores'],
  CAIXA_ABERTO: ['caixa', 'aberto'],
  CONTAS_PAGAR: ['contas-pagar'],
  CONTAS_RECEBER: ['contas-receber'],
  RESUMO_PAGAR: ['resumo-pagar'],
  RESUMO_RECEBER: ['resumo-receber'],
  CATEGORIAS_FINANCEIRAS: ['categorias-financeiras'],
} as const;

// Clientes
export function useClientes() {
  return useQuery({
    queryKey: QUERY_KEYS.CLIENTES,
    queryFn: () => clientesAPI.getAll(),
  });
}

export function useCreateCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => clientesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CLIENTES });
      toast.success('Cliente criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar cliente', { description: error.message });
    },
  });
}

export function useUpdateCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => clientesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CLIENTES });
      toast.success('Cliente atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar cliente', { description: error.message });
    },
  });
}

export function useDeleteCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clientesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CLIENTES });
      toast.success('Cliente excluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir cliente', { description: error.message });
    },
  });
}

// Vendas
export function useVendas() {
  return useQuery({
    queryKey: QUERY_KEYS.VENDAS,
    queryFn: () => vendasAPI.getAll(),
  });
}

// Produtos
export function useProdutos() {
  return useQuery({
    queryKey: QUERY_KEYS.PRODUTOS,
    queryFn: () => produtosAPI.getAll(),
  });
}

export function useCreateProduto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => produtosAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUTOS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ESTOQUE });
      toast.success('Produto criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar produto', { description: error.message });
    },
  });
}

export function useUpdateProduto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => produtosAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUTOS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ESTOQUE });
      toast.success('Produto atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar produto', { description: error.message });
    },
  });
}

export function useDeleteProduto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => produtosAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUTOS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ESTOQUE });
      toast.success('Produto excluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir produto', { description: error.message });
    },
  });
}

// Estoque
export function useEstoque() {
  return useQuery({
    queryKey: QUERY_KEYS.ESTOQUE,
    queryFn: () => estoqueAPI.getAll(),
  });
}

export function useUpdateEstoque() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ codigoProduto, data }: { codigoProduto: string; data: any }) => 
      estoqueAPI.update(codigoProduto, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ESTOQUE });
      toast.success('Estoque atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar estoque', { description: error.message });
    },
  });
}

// Vendedores
export function useVendedores() {
  return useQuery({
    queryKey: QUERY_KEYS.VENDEDORES,
    queryFn: () => vendedoresAPI.getAll(),
  });
}

export function useCreateVendedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => vendedoresAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VENDEDORES });
      toast.success('Vendedor criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar vendedor', { description: error.message });
    },
  });
}

export function useUpdateVendedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => vendedoresAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VENDEDORES });
      toast.success('Vendedor atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar vendedor', { description: error.message });
    },
  });
}

export function useDeleteVendedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vendedoresAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VENDEDORES });
      toast.success('Vendedor excluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir vendedor', { description: error.message });
    },
  });
}

// Fornecedores
export function useFornecedores() {
  return useQuery({
    queryKey: QUERY_KEYS.FORNECEDORES,
    queryFn: () => fornecedoresAPI.getAll(),
  });
}

export function useCreateFornecedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => fornecedoresAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FORNECEDORES });
      toast.success('Fornecedor criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar fornecedor', { description: error.message });
    },
  });
}

export function useUpdateFornecedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => fornecedoresAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FORNECEDORES });
      toast.success('Fornecedor atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar fornecedor', { description: error.message });
    },
  });
}

export function useDeleteFornecedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fornecedoresAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FORNECEDORES });
      toast.success('Fornecedor excluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir fornecedor', { description: error.message });
    },
  });
}

// Caixa
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
  });
}

// Contas a Pagar
export function useContasPagar() {
  return useQuery({
    queryKey: QUERY_KEYS.CONTAS_PAGAR,
    queryFn: () => contasPagarAPI.getAll(),
  });
}

export function useResumoPagar() {
  return useQuery({
    queryKey: QUERY_KEYS.RESUMO_PAGAR,
    queryFn: () => contasPagarAPI.getResumo(),
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTAS_PAGAR });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.RESUMO_PAGAR });
      toast.success('Conta excluída com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir conta', { description: error.message });
    },
  });
}

// Contas a Receber
export function useContasReceber() {
  return useQuery({
    queryKey: QUERY_KEYS.CONTAS_RECEBER,
    queryFn: () => contasReceberAPI.getAll(),
  });
}

export function useResumoReceber() {
  return useQuery({
    queryKey: QUERY_KEYS.RESUMO_RECEBER,
    queryFn: () => contasReceberAPI.getResumo(),
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTAS_RECEBER });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.RESUMO_RECEBER });
      toast.success('Conta excluída com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir conta', { description: error.message });
    },
  });
}

// Categorias Financeiras
export function useCategoriasFinanceiras() {
  return useQuery({
    queryKey: QUERY_KEYS.CATEGORIAS_FINANCEIRAS,
    queryFn: () => categoriasFinanceirasAPI.getAll(),
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
