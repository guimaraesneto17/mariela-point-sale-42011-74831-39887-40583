import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, Wallet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { caixaAPI } from "@/lib/api";

export function CaixaFechadoNotification() {
  const [caixaAberto, setCaixaAberto] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Páginas onde a notificação deve aparecer
  const paginasComNotificacao = ["/vendas", "/vendas/nova", "/caixa", "/financeiro"];
  const mostrarNotificacao = paginasComNotificacao.includes(location.pathname);

  useEffect(() => {
    verificarCaixaAberto();
    // Verificar a cada 30 segundos
    const interval = setInterval(verificarCaixaAberto, 30000);
    return () => clearInterval(interval);
  }, []);

  // Reset dismissed quando mudar de página
  useEffect(() => {
    setDismissed(false);
  }, [location.pathname]);

  const verificarCaixaAberto = async () => {
    try {
      setLoading(true);
      const response = await caixaAPI.getCaixaAberto();
      setCaixaAberto(response);
    } catch (error) {
      setCaixaAberto(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading || caixaAberto || !mostrarNotificacao || dismissed) {
    return null;
  }

  return (
    <div className="bg-orange-500 text-white shadow-lg relative">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-sm">Caixa Fechado</p>
              <p className="text-xs text-white/90">
                Para realizar vendas é necessário abrir o caixa antes
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigate("/caixa")}
              size="sm"
              variant="secondary"
              className="bg-white text-orange-600 hover:bg-white/90 font-semibold"
            >
              <Wallet className="h-4 w-4 mr-2" />
              Abrir Caixa
            </Button>
            
            <Button
              onClick={() => setDismissed(true)}
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
