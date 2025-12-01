import { useAuth } from '@/contexts/AuthContext';
import { useMemo } from 'react';

export type ModuleName =
  | 'dashboard'
  | 'vendas'
  | 'estoque'
  | 'financeiro'
  | 'produtos'
  | 'clientes'
  | 'fornecedores'
  | 'vendedores'
  | 'caixa'
  | 'relatorios'
  | 'vitrine'
  | 'usuarios';

export type Action = 'view' | 'create' | 'edit' | 'delete' | 'export';

interface Permission {
  role: 'admin' | 'gerente' | 'vendedor';
  module: ModuleName;
  actions: Action[];
}

/**
 * Hook para verificar permissões do usuário atual
 * Retorna funções para verificar se o usuário tem permissão para determinada ação
 */
export function usePermission() {
  const { user, permissions } = useAuth();

  // Admin tem acesso total
  const isAdmin = useMemo(() => user?.role === 'admin', [user]);

  /**
   * Verifica se o usuário tem permissão para uma ação específica em um módulo
   */
  const hasPermission = useMemo(() => {
    return (module: ModuleName, action: Action): boolean => {
      // Admin tem acesso total
      if (isAdmin) return true;

      // Sem usuário autenticado, sem permissões
      if (!user || !permissions) return false;

      // Buscar permissão específica para o módulo
      const permission = permissions.find(
        (p: Permission) => p.module === module && p.role === user.role
      );

      // Se não encontrou permissão para o módulo, não tem acesso
      if (!permission) return false;

      // Verificar se tem a ação específica
      return permission.actions.includes(action);
    };
  }, [isAdmin, user, permissions]);

  /**
   * Verifica se o usuário pode visualizar um módulo
   */
  const canView = useMemo(() => {
    return (module: ModuleName): boolean => {
      return hasPermission(module, 'view');
    };
  }, [hasPermission]);

  /**
   * Verifica se o usuário pode criar em um módulo
   */
  const canCreate = useMemo(() => {
    return (module: ModuleName): boolean => {
      return hasPermission(module, 'create');
    };
  }, [hasPermission]);

  /**
   * Verifica se o usuário pode editar em um módulo
   */
  const canEdit = useMemo(() => {
    return (module: ModuleName): boolean => {
      return hasPermission(module, 'edit');
    };
  }, [hasPermission]);

  /**
   * Verifica se o usuário pode excluir em um módulo
   */
  const canDelete = useMemo(() => {
    return (module: ModuleName): boolean => {
      return hasPermission(module, 'delete');
    };
  }, [hasPermission]);

  /**
   * Verifica se o usuário pode exportar dados de um módulo
   */
  const canExport = useMemo(() => {
    return (module: ModuleName): boolean => {
      return hasPermission(module, 'export');
    };
  }, [hasPermission]);

  /**
   * Verifica se o usuário tem pelo menos uma das permissões especificadas
   */
  const hasAnyPermission = useMemo(() => {
    return (checks: Array<{ module: ModuleName; action: Action }>): boolean => {
      return checks.some(({ module, action }) => hasPermission(module, action));
    };
  }, [hasPermission]);

  /**
   * Verifica se o usuário tem todas as permissões especificadas
   */
  const hasAllPermissions = useMemo(() => {
    return (checks: Array<{ module: ModuleName; action: Action }>): boolean => {
      return checks.every(({ module, action }) => hasPermission(module, action));
    };
  }, [hasPermission]);

  return {
    isAdmin,
    hasPermission,
    canView,
    canCreate,
    canEdit,
    canDelete,
    canExport,
    hasAnyPermission,
    hasAllPermissions,
  };
}
