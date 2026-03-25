import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';

/**
 * Componente global que escuta eventos de sessão expirada e exibe dialog.
 * O evento é disparado pelo interceptor do Axios em src/lib/api.ts.
 */
export function SessionExpiredDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => {
      setOpen(true);
    };

    window.addEventListener('session-expired', handler);
    return () => window.removeEventListener('session-expired', handler);
  }, []);

  const handleLogin = () => {
    // Salvar rota atual para redirecionar após login
    const currentPath = window.location.pathname + window.location.search;
    if (currentPath && currentPath !== '/auth') {
      localStorage.setItem('mariela_redirect_after_login', currentPath);
    }

    // Limpar auth data
    localStorage.removeItem('mariela_access_token');
    localStorage.removeItem('mariela_refresh_token');
    localStorage.removeItem('mariela_user');

    setOpen(false);
    window.location.href = '/auth';
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Sessão Expirada
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Sua sessão expirou. Por favor, faça login novamente para continuar.
            </p>
            <p className="text-xs text-muted-foreground">
              Suas ações pendentes foram interrompidas de forma segura.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleLogin}>
            Fazer login novamente
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
