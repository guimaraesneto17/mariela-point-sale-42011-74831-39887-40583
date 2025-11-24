import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { QUERY_KEYS } from './useQueryCache';
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
} from '@/lib/api';

/**
 * Hook para prefetching inteligente de dados
 * Antecipa o carregamento de dados baseado em navegação e ações do usuário
 */
export function usePrefetch() {
  const queryClient = useQueryClient();

  // Prefetch individual de cada entidade
  const prefetchClientes = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.CLIENTES,
      queryFn: () => clientesAPI.getAll(),
      staleTime: 1000 * 60 * 5, // 5 minutos
    });
  }, [queryClient]);

  const prefetchVendas = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.VENDAS,
      queryFn: () => vendasAPI.getAll(),
      staleTime: 1000 * 60 * 5,
    });
  }, [queryClient]);

  const prefetchProdutos = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.PRODUTOS,
      queryFn: () => produtosAPI.getAll(),
      staleTime: 1000 * 60 * 5,
    });
  }, [queryClient]);

  const prefetchEstoque = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.ESTOQUE,
      queryFn: () => estoqueAPI.getAll(),
      staleTime: 1000 * 60 * 5,
    });
  }, [queryClient]);

  const prefetchVendedores = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.VENDEDORES,
      queryFn: () => vendedoresAPI.getAll(),
      staleTime: 1000 * 60 * 5,
    });
  }, [queryClient]);

  const prefetchFornecedores = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.FORNECEDORES,
      queryFn: () => fornecedoresAPI.getAll(),
      staleTime: 1000 * 60 * 5,
    });
  }, [queryClient]);

  const prefetchCaixaAberto = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.CAIXA_ABERTO,
      queryFn: async () => {
        try {
          return await caixaAPI.getCaixaAberto();
        } catch {
          return null;
        }
      },
      staleTime: 1000 * 60 * 2, // 2 minutos para caixa
    });
  }, [queryClient]);

  const prefetchContasPagar = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.CONTAS_PAGAR,
      queryFn: () => contasPagarAPI.getAll(),
      staleTime: 1000 * 60 * 5,
    });
  }, [queryClient]);

  const prefetchContasReceber = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.CONTAS_RECEBER,
      queryFn: () => contasReceberAPI.getAll(),
      staleTime: 1000 * 60 * 5,
    });
  }, [queryClient]);

  // Prefetch estratégico por contexto
  const prefetchForNovaVenda = useCallback(() => {
    // Para nova venda, precisamos de produtos, clientes, vendedores e estoque
    prefetchProdutos();
    prefetchClientes();
    prefetchVendedores();
    prefetchEstoque();
  }, [prefetchProdutos, prefetchClientes, prefetchVendedores, prefetchEstoque]);

  const prefetchForDashboard = useCallback(() => {
    // Dashboard precisa de tudo
    prefetchClientes();
    prefetchVendas();
    prefetchProdutos();
    prefetchEstoque();
    prefetchVendedores();
    prefetchCaixaAberto();
    prefetchContasPagar();
    prefetchContasReceber();
  }, [
    prefetchClientes,
    prefetchVendas,
    prefetchProdutos,
    prefetchEstoque,
    prefetchVendedores,
    prefetchCaixaAberto,
    prefetchContasPagar,
    prefetchContasReceber,
  ]);

  const prefetchForFinanceiro = useCallback(() => {
    // Financeiro precisa de contas e fornecedores/clientes
    prefetchContasPagar();
    prefetchContasReceber();
    prefetchFornecedores();
    prefetchClientes();
  }, [prefetchContasPagar, prefetchContasReceber, prefetchFornecedores, prefetchClientes]);

  const prefetchForEstoque = useCallback(() => {
    // Estoque precisa de produtos e estoque
    prefetchProdutos();
    prefetchEstoque();
    prefetchFornecedores();
  }, [prefetchProdutos, prefetchEstoque, prefetchFornecedores]);

  const prefetchForRelatorios = useCallback(() => {
    // Relatórios precisam de todos os dados
    prefetchClientes();
    prefetchVendas();
    prefetchProdutos();
    prefetchVendedores();
  }, [prefetchClientes, prefetchVendas, prefetchProdutos, prefetchVendedores]);

  return {
    // Prefetch individual
    prefetchClientes,
    prefetchVendas,
    prefetchProdutos,
    prefetchEstoque,
    prefetchVendedores,
    prefetchFornecedores,
    prefetchCaixaAberto,
    prefetchContasPagar,
    prefetchContasReceber,
    
    // Prefetch estratégico
    prefetchForNovaVenda,
    prefetchForDashboard,
    prefetchForFinanceiro,
    prefetchForEstoque,
    prefetchForRelatorios,
  };
}

/**
 * Hook para verificar se dados estão em cache
 */
export function useCacheStatus() {
  const queryClient = useQueryClient();

  const isCached = useCallback((queryKey: readonly string[]) => {
    const data = queryClient.getQueryData(queryKey);
    return data !== undefined;
  }, [queryClient]);

  const getCacheAge = useCallback((queryKey: readonly string[]) => {
    const query = queryClient.getQueryState(queryKey);
    if (!query?.dataUpdatedAt) return null;
    return Date.now() - query.dataUpdatedAt;
  }, [queryClient]);

  const isStale = useCallback((queryKey: readonly string[]) => {
    const query = queryClient.getQueryState(queryKey);
    return query?.isInvalidated || false;
  }, [queryClient]);

  return {
    isCached,
    getCacheAge,
    isStale,
    // Status de cada entidade
    clientesCached: isCached(QUERY_KEYS.CLIENTES),
    vendasCached: isCached(QUERY_KEYS.VENDAS),
    produtosCached: isCached(QUERY_KEYS.PRODUTOS),
    estoqueCached: isCached(QUERY_KEYS.ESTOQUE),
  };
}
