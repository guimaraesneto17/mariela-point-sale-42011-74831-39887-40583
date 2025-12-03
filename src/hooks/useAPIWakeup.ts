import { useEffect, useState, useRef } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://mariela-pdv-backend.onrender.com/api';

export const useAPIWakeup = () => {
  const [isWakingUp, setIsWakingUp] = useState(false);
  const hasWokenUp = useRef(false);

  useEffect(() => {
    // Evitar múltiplas chamadas de wake-up
    if (hasWokenUp.current) {
      return;
    }

    const wakeUpAPI = async () => {
      // Verificar se há token antes de fazer wake-up
      const token = localStorage.getItem('mariela_access_token');
      if (!token) {
        // Sem token, não precisa acordar a API ainda
        return;
      }

      try {
        hasWokenUp.current = true;
        setIsWakingUp(true);
        
        // Usa endpoint de health que não requer autenticação
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        await fetch(`${API_BASE_URL.replace('/api', '')}/health`, {
          signal: controller.signal,
          method: 'HEAD',
        });
        
        clearTimeout(timeoutId);
      } catch (error) {
        // Silenciosamente ignora erros de wake-up
      } finally {
        setIsWakingUp(false);
      }
    };

    // Pequeno delay para evitar chamadas durante renderização inicial
    const timer = setTimeout(wakeUpAPI, 100);
    return () => clearTimeout(timer);
  }, []);

  return { isWakingUp };
};
