import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'pagination-limit';
const DEFAULT_LIMIT = 50;
const VALID_LIMITS = [25, 50, 100];

export const usePersistedLimit = (entityKey?: string) => {
  const storageKey = entityKey ? `${STORAGE_KEY}-${entityKey}` : STORAGE_KEY;
  
  const getInitialLimit = (): number => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (VALID_LIMITS.includes(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Erro ao ler preferência de limite do localStorage:', error);
    }
    return DEFAULT_LIMIT;
  };

  const [limit, setLimitState] = useState<number>(getInitialLimit);

  const setLimit = useCallback((newLimit: number) => {
    if (VALID_LIMITS.includes(newLimit)) {
      setLimitState(newLimit);
      try {
        localStorage.setItem(storageKey, newLimit.toString());
      } catch (error) {
        console.warn('Erro ao salvar preferência de limite no localStorage:', error);
      }
    }
  }, [storageKey]);

  return { limit, setLimit };
};
