import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook que verifica se o token de autenticação está disponível
 * Usado para condicionar queries que precisam de autenticação
 * IMPORTANTE: Retorna false na página de login para evitar chamadas API
 */
export function useAuthReady(): boolean {
  const location = useLocation();
  const [isReady, setIsReady] = useState(() => {
    // Verificação inicial síncrona
    if (location.pathname === '/auth') return false;
    return !!localStorage.getItem('mariela_access_token');
  });

  const checkToken = useCallback(() => {
    // Nunca está pronto na página de login
    if (location.pathname === '/auth') {
      setIsReady(false);
      return;
    }
    const token = localStorage.getItem('mariela_access_token');
    setIsReady(!!token);
  }, [location.pathname]);

  useEffect(() => {
    // Verificar imediatamente
    checkToken();

    // Ouvir mudanças no storage (para quando o login acontecer)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'mariela_access_token') {
        checkToken();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkToken]);

  return isReady;
}

/**
 * Retorna true se existe um token válido no localStorage
 */
export function hasAuthToken(): boolean {
  return !!localStorage.getItem('mariela_access_token');
}
