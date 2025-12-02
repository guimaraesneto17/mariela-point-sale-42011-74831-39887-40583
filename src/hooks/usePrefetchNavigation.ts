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

/**
 * Hook para prefetching estratégico de dados baseado na navegação do usuário
 * Antecipa as necessidades de dados para páginas que o usuário provavelmente visitará
 */
export function usePrefetchNavigation() {
  const queryClient = useQueryClient();

  /**
   * Prefetch dados para a página Nova Venda
   * Carrega clientes, vendedores e estoque necessários para criar uma venda
   */
  const prefetchNovaVenda = () => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.CLIENTES,
      queryFn: () => clientesAPI.getAll(),
      staleTime: 5 * 60 * 1000, // 5 minutos
    });
    
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.VENDEDORES,
      queryFn: () => vendedoresAPI.getAll(),
      staleTime: 5 * 60 * 1000,
    });
    
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.ESTOQUE,
      queryFn: () => estoqueAPI.getAll(),
      staleTime: 2 * 60 * 1000, // 2 minutos (estoque muda mais frequentemente)
    });
  };

  /**
   * Prefetch dados para a página Dashboard
   * Carrega todos os dados necessários para exibir as estatísticas
   */
  const prefetchDashboard = () => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.VENDAS,
      queryFn: () => vendasAPI.getAll(),
      staleTime: 5 * 60 * 1000,
    });
    
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.CLIENTES,
      queryFn: () => clientesAPI.getAll(),
      staleTime: 5 * 60 * 1000,
    });
    
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.PRODUTOS,
      queryFn: () => produtosAPI.getAll(),
      staleTime: 5 * 60 * 1000,
    });
    
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.ESTOQUE,
      queryFn: () => estoqueAPI.getAll(),
      staleTime: 2 * 60 * 1000,
    });
  };

  /**
   * Prefetch dados para a página de Produtos
   * Carrega produtos e fornecedores
   */
  const prefetchProdutos = () => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.PRODUTOS,
      queryFn: () => produtosAPI.getAll(),
      staleTime: 5 * 60 * 1000,
    });
    
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.FORNECEDORES,
      queryFn: () => fornecedoresAPI.getAll(),
      staleTime: 10 * 60 * 1000, // 10 minutos (fornecedores mudam raramente)
    });
  };

  /**
   * Prefetch dados para a página de Estoque
   * Carrega estoque e produtos relacionados
   */
  const prefetchEstoque = () => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.ESTOQUE,
      queryFn: () => estoqueAPI.getAll(),
      staleTime: 2 * 60 * 1000,
    });
    
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.PRODUTOS,
      queryFn: () => produtosAPI.getAll(),
      staleTime: 5 * 60 * 1000,
    });
  };

  /**
   * Prefetch dados para a página de Clientes
   */
  const prefetchClientes = () => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.CLIENTES,
      queryFn: () => clientesAPI.getAll(),
      staleTime: 5 * 60 * 1000,
    });
  };

  /**
   * Prefetch dados para a página de Vendedores
   */
  const prefetchVendedores = () => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.VENDEDORES,
      queryFn: () => vendedoresAPI.getAll(),
      staleTime: 5 * 60 * 1000,
    });
  };

  /**
   * Prefetch dados para a página de Fornecedores
   */
  const prefetchFornecedores = () => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.FORNECEDORES,
      queryFn: () => fornecedoresAPI.getAll(),
      staleTime: 10 * 60 * 1000,
    });
  };

  /**
   * Prefetch dados para a página de Vendas
   * Carrega vendas, clientes e vendedores
   */
  const prefetchVendas = () => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.VENDAS,
      queryFn: () => vendasAPI.getAll(),
      staleTime: 5 * 60 * 1000,
    });
    
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.CLIENTES,
      queryFn: () => clientesAPI.getAll(),
      staleTime: 5 * 60 * 1000,
    });
    
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.VENDEDORES,
      queryFn: () => vendedoresAPI.getAll(),
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
