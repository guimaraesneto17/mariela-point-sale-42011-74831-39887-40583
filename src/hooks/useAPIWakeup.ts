import { useEffect, useState } from "react";
import { toast } from "sonner";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://mariela-pdv-backend.onrender.com/api';

export const useAPIWakeup = () => {
  const [isWakingUp, setIsWakingUp] = useState(true);

  useEffect(() => {
    const wakeUpAPI = async () => {
      try {
        console.log("🚀 Iniciando wake-up da API...");
        setIsWakingUp(true);
        
        // Faz uma chamada simples para acordar a API
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout
        
        await fetch(`${API_BASE_URL}/produtos`, {
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        console.log("✅ API acordada com sucesso!");
      } catch (error) {
        console.log("⚠️ API pode estar em standby, mas continuando...");
      } finally {
        setIsWakingUp(false);
      }
    };

    wakeUpAPI();
  }, []);

  return { isWakingUp };
};
