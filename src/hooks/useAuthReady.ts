import { useState, useEffect } from 'react';

/**
 * Hook que verifica se o token de autenticação está disponível
 * Usado para condicionar queries que precisam de autenticação
 */
export function useAuthReady(): boolean {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Verifica se o token existe no localStorage
    const checkToken = () => {
      const token = localStorage.getItem('mariela_access_token');
      setIsReady(!!token);
    };

    // Verificar imediatamente
    checkToken();

    // Também ouvir mudanças no storage (para quando o login acontecer)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'mariela_access_token') {
        checkToken();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Polling para detectar login (para mesma aba)
    const interval = setInterval(checkToken, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return isReady;
}

/**
 * Retorna true se existe um token válido no localStorage
 */
export function hasAuthToken(): boolean {
  return !!localStorage.getItem('mariela_access_token');
}
