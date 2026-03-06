import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from './useQueryCache';
import { 
  clientesAPI, 
  vendasAPI, 
  produtosAPI, 
  estoqueAPI, 
  vendedoresAPI,
  fornecedoresAPI,
} from '@/lib/api';
import { normalizeApiResponse } from '@/lib/utils';

/**
 * Hook para prefetching estratégico de dados baseado na navegação do usuário
 * Antecipa as necessidades de dados para páginas que o usuário provavelmente visitará
 */
export function usePrefetchNavigation() {
  const queryClient = useQueryClient();

  const norm = (fn: () => Promise<any>) => async () => normalizeApiResponse(await fn());

  const prefetchNovaVenda = () => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.CLIENTES,
      queryFn: norm(() => clientesAPI.getAll()),
      staleTime: 5 * 60 * 1000,
    });
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.VENDEDORES,
      queryFn: norm(() => vendedoresAPI.getAll()),
      staleTime: 5 * 60 * 1000,
    });
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.ESTOQUE,
      queryFn: norm(() => estoqueAPI.getAll()),
      staleTime: 2 * 60 * 1000,
    });
  };

  const prefetchDashboard = () => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.VENDAS,
      queryFn: norm(() => vendasAPI.getAll()),
      staleTime: 5 * 60 * 1000,
    });
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.CLIENTES,
      queryFn: norm(() => clientesAPI.getAll()),
      staleTime: 5 * 60 * 1000,
    });
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.PRODUTOS,
      queryFn: norm(() => produtosAPI.getAll()),
      staleTime: 5 * 60 * 1000,
    });
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.ESTOQUE,
      queryFn: norm(() => estoqueAPI.getAll()),
      staleTime: 2 * 60 * 1000,
    });
  };

  const prefetchProdutos = () => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.PRODUTOS,
      queryFn: norm(() => produtosAPI.getAll()),
      staleTime: 5 * 60 * 1000,
    });
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.FORNECEDORES,
      queryFn: norm(() => fornecedoresAPI.getAll()),
      staleTime: 10 * 60 * 1000,
    });
  };

  const prefetchEstoque = () => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.ESTOQUE,
      queryFn: norm(() => estoqueAPI.getAll()),
      staleTime: 2 * 60 * 1000,
    });
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.PRODUTOS,
      queryFn: norm(() => produtosAPI.getAll()),
      staleTime: 5 * 60 * 1000,
    });
  };

  const prefetchClientes = () => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.CLIENTES,
      queryFn: norm(() => clientesAPI.getAll()),
      staleTime: 5 * 60 * 1000,
    });
  };

  const prefetchVendedores = () => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.VENDEDORES,
      queryFn: norm(() => vendedoresAPI.getAll()),
      staleTime: 5 * 60 * 1000,
    });
  };

  const prefetchFornecedores = () => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.FORNECEDORES,
      queryFn: norm(() => fornecedoresAPI.getAll()),
      staleTime: 10 * 60 * 1000,
    });
  };

  const prefetchVendas = () => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.VENDAS,
      queryFn: norm(() => vendasAPI.getAll()),
      staleTime: 5 * 60 * 1000,
    });
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.CLIENTES,
      queryFn: norm(() => clientesAPI.getAll()),
      staleTime: 5 * 60 * 1000,
    });
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.VENDEDORES,
      queryFn: norm(() => vendedoresAPI.getAll()),
      staleTime: 5 * 60 * 1000,
    });
  };

  return {
    prefetchNovaVenda,
    prefetchDashboard,
    prefetchProdutos,
    prefetchEstoque,
    prefetchClientes,
    prefetchVendedores,
    prefetchFornecedores,
    prefetchVendas,
  };
}
