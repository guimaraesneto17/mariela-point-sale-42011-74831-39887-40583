import { Link, LinkProps, useLocation } from 'react-router-dom';
import { usePrefetchNavigation } from '@/hooks/usePrefetchNavigation';
import { ReactNode, forwardRef } from 'react';

interface PrefetchNavLinkProps extends Omit<LinkProps, 'className' | 'children'> {
  prefetchRoute?: 'dashboard' | 'nova-venda' | 'produtos' | 'estoque' | 'clientes' | 'vendedores' | 'fornecedores' | 'vendas';
  children: ReactNode | ((props: { isActive: boolean }) => ReactNode);
  className?: string | ((props: { isActive: boolean }) => string);
}

/**
 * Link component que prefetcha dados ao passar o mouse
 * Melhora a percepção de performance ao carregar dados antes do clique
 * Suporta children como função para passar isActive
 */
export const PrefetchNavLink = forwardRef<HTMLAnchorElement, PrefetchNavLinkProps>(
  function PrefetchNavLink({ prefetchRoute, children, className, ...props }, ref) {
    const location = useLocation();
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

    const isActive = location.pathname === props.to;
    const computedClassName = typeof className === 'function' ? className({ isActive }) : className;
    const computedChildren = typeof children === 'function' ? children({ isActive }) : children;

    return (
      <Link 
        ref={ref}
        {...props}
        className={computedClassName}
        onMouseEnter={handleMouseEnter}
      >
        {computedChildren}
      </Link>
    );
  }
);
