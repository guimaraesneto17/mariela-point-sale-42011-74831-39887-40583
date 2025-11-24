import { ReactNode, useCallback } from 'react';
import { Link, LinkProps } from 'react-router-dom';
import { usePrefetch } from '@/hooks/usePrefetch';

interface PrefetchLinkProps extends LinkProps {
  prefetchOn?: 'hover' | 'mount' | 'both';
  prefetchRoute?: string;
  children: ReactNode;
}

/**
 * Link inteligente com prefetching de dados
 * Carrega dados antecipadamente baseado em hover ou mount
 */
export function PrefetchLink({ 
  prefetchOn = 'hover', 
  prefetchRoute,
  to,
  children,
  ...props 
}: PrefetchLinkProps) {
  const {
    prefetchForDashboard,
    prefetchForNovaVenda,
    prefetchForFinanceiro,
    prefetchForEstoque,
    prefetchForRelatorios,
    prefetchClientes,
    prefetchVendas,
    prefetchProdutos,
    prefetchVendedores,
    prefetchFornecedores,
  } = usePrefetch();

  const route = prefetchRoute || (typeof to === 'string' ? to : to.pathname);

  const handlePrefetch = useCallback(() => {
    if (!route) return;

    // Prefetch baseado na rota
    switch (route) {
      case '/':
        prefetchForDashboard();
        break;
      case '/vendas/nova':
        prefetchForNovaVenda();
        break;
      case '/vendas':
        prefetchVendas();
        break;
      case '/clientes':
        prefetchClientes();
        break;
      case '/produtos':
        prefetchProdutos();
        break;
      case '/estoque':
        prefetchForEstoque();
        break;
      case '/vendedores':
        prefetchVendedores();
        break;
      case '/fornecedores':
        prefetchFornecedores();
        break;
      case '/financeiro':
        prefetchForFinanceiro();
        break;
      case '/relatorios':
        prefetchForRelatorios();
        break;
    }
  }, [
    route,
    prefetchForDashboard,
    prefetchForNovaVenda,
    prefetchVendas,
    prefetchClientes,
    prefetchProdutos,
    prefetchForEstoque,
    prefetchVendedores,
    prefetchFornecedores,
    prefetchForFinanceiro,
    prefetchForRelatorios,
  ]);

  // Prefetch on mount se configurado
  if (prefetchOn === 'mount' || prefetchOn === 'both') {
    handlePrefetch();
  }

  return (
    <Link
      to={to}
      {...props}
      onMouseEnter={(e) => {
        if (prefetchOn === 'hover' || prefetchOn === 'both') {
          handlePrefetch();
        }
        props.onMouseEnter?.(e);
      }}
    >
      {children}
    </Link>
  );
}
