import { ReactNode } from 'react';
import { usePermission, ModuleName, Action } from '@/hooks/usePermission';

interface PermissionGuardProps {
  children: ReactNode;
  module: ModuleName;
  action: Action;
  fallback?: ReactNode;
}

/**
 * Componente que renderiza children apenas se o usuário tiver a permissão necessária
 * 
 * @example
 * <PermissionGuard module="produtos" action="create">
 *   <Button>Criar Produto</Button>
 * </PermissionGuard>
 */
export function PermissionGuard({ 
  children, 
  module, 
  action, 
  fallback = null 
}: PermissionGuardProps) {
  const { hasPermission } = usePermission();

  if (!hasPermission(module, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Versão alternativa que aceita múltiplas verificações de permissão
 */
interface PermissionGuardAnyProps {
  children: ReactNode;
  checks: Array<{ module: ModuleName; action: Action }>;
  fallback?: ReactNode;
}

export function PermissionGuardAny({ 
  children, 
  checks, 
  fallback = null 
}: PermissionGuardAnyProps) {
  const { hasAnyPermission } = usePermission();

  if (!hasAnyPermission(checks)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Versão que requer todas as permissões
 */
interface PermissionGuardAllProps {
  children: ReactNode;
  checks: Array<{ module: ModuleName; action: Action }>;
  fallback?: ReactNode;
}

export function PermissionGuardAll({ 
  children, 
  checks, 
  fallback = null 
}: PermissionGuardAllProps) {
  const { hasAllPermissions } = usePermission();

  if (!hasAllPermissions(checks)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
