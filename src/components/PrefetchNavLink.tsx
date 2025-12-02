import { Link, LinkProps } from 'react-router-dom';
import { usePrefetchNavigation } from '@/hooks/usePrefetchNavigation';
import { ReactNode } from 'react';

interface PrefetchNavLinkProps extends Omit<LinkProps, 'className'> {
  prefetchRoute?: 'dashboard' | 'nova-venda' | 'produtos' | 'estoque' | 'clientes' | 'vendedores' | 'fornecedores' | 'vendas';
  children: ReactNode;
  className?: string | ((props: { isActive: boolean }) => string);
}

/**
 * Link component que prefetcha dados ao passar o mouse
 * Melhora a percepção de performance ao carregar dados antes do clique
 */
export function PrefetchNavLink({ prefetchRoute, children, className, ...props }: PrefetchNavLinkProps) {
  const {
    prefetchDashboard,
    prefetchNovaVenda,
    prefetchProdutos,
    prefetchEstoque,
    prefetchClientes,
    prefetchVendedores,
    prefetchFornecedores,
    prefetchVendas,
  } = usePrefetchNavigation();

  const handleMouseEnter = () => {
    if (!prefetchRoute) return;

    switch (prefetchRoute) {
      case 'dashboard':
        prefetchDashboard();
        break;
      case 'nova-venda':
        prefetchNovaVenda();
        break;
      case 'produtos':
        prefetchProdutos();
        break;
      case 'estoque':
        prefetchEstoque();
        break;
      case 'clientes':
        prefetchClientes();
        break;
      case 'vendedores':
        prefetchVendedores();
        break;
      case 'fornecedores':
        prefetchFornecedores();
        break;
      case 'vendas':
        prefetchVendas();
        break;
    }
  };

  return (
    <Link 
      {...props}
      onMouseEnter={handleMouseEnter}
    >
      {children}
    </Link>
  );
}
