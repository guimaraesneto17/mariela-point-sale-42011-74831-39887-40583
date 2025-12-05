import { Navigate, useLocation } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { usePermission } from "@/hooks/usePermission";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  requiredModule?: string;
}

export function ProtectedRoute({ children, requiredRoles, requiredModule }: ProtectedRouteProps) {
  const { isAuthenticated, loading, hasRole, user } = useAuth();
  const { canView } = usePermission();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Redirecionar vendedor da página principal para o dashboard de vendedor
  if (location.pathname === '/' && user?.role === 'vendedor') {
    return <Navigate to="/vendedor-dashboard" replace />;
  }

  // Verificar roles se especificadas
  if (requiredRoles && requiredRoles.length > 0 && !hasRole(...requiredRoles)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-destructive/10 rounded-lg border border-destructive">
          <h2 className="text-2xl font-bold text-destructive mb-2">Acesso Negado</h2>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  // Verificar permissões de módulo se especificadas (para não-admins)
  if (requiredModule && user?.role !== 'admin' && !canView(requiredModule as any)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-destructive/10 rounded-lg border border-destructive">
          <h2 className="text-2xl font-bold text-destructive mb-2">Acesso Negado</h2>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar este módulo.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
