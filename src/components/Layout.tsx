import { Outlet, useNavigate } from "react-router-dom";
import { PrefetchNavLink } from "@/components/PrefetchNavLink";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Warehouse,
  Truck,
  Plus,
  UserCheck,
  FileText,
  LogOut,
  Wallet,
  TrendingUp,
  Menu,
  X,
  UserCog
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/logo.png";
import { useAPIWakeup } from "@/hooks/useAPIWakeup";
import { GlobalLoading } from "@/components/GlobalLoading";
import { useIsMobile } from "@/hooks/use-mobile";
import { CacheIndicator } from "@/components/CacheIndicator";
import { CaixaFechadoNotification } from "@/components/CaixaFechadoNotification";
import { FinanceiroAlertasDialog } from "@/components/FinanceiroAlertasDialog";
import { useContasPagar, useContasReceber } from "@/hooks/useQueryCache";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { RoleIndicator } from "@/components/RoleIndicator";

const Layout = () => {
  const navigate = useNavigate();
  const { logout, isAdmin } = useAuth();
  const { isWakingUp } = useAPIWakeup();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showFinanceiroAlertas, setShowFinanceiroAlertas] = useState(false);
  
  const { data: contasPagarData = [] } = useContasPagar();
  const { data: contasReceberData = [] } = useContasReceber();

  // Verificar contas urgentes ao abrir o sistema
  useEffect(() => {
    const verificarContasUrgentes = () => {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const contasPagarUrgentes = contasPagarData.filter((conta: any) => {
        const statusLower = (conta.status || '').toLowerCase();
        if (statusLower === 'pago' || statusLower === 'paga') return false;
        
        const dataVencimento = new Date(conta.dataVencimento);
        dataVencimento.setHours(0, 0, 0, 0);
        return dataVencimento <= hoje;
      });

      const contasReceberUrgentes = contasReceberData.filter((conta: any) => {
        const statusLower = (conta.status || '').toLowerCase();
        if (statusLower === 'recebido' || statusLower === 'recebida') return false;
        
        const dataVencimento = new Date(conta.dataVencimento);
        dataVencimento.setHours(0, 0, 0, 0);
        return dataVencimento <= hoje;
      });

      const totalUrgentes = contasPagarUrgentes.length + contasReceberUrgentes.length;

      if (totalUrgentes > 0) {
        setShowFinanceiroAlertas(true);
      }
    };

    if (contasPagarData.length > 0 || contasReceberData.length > 0) {
      verificarContasUrgentes();
    }
  }, [contasPagarData, contasReceberData]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      toast.error("Erro ao fazer logout");
    }
  };

  const handleNavClick = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const navItems = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard", prefetch: "dashboard" as const },
    { to: "/relatorios", icon: FileText, label: "Relatórios", prefetch: undefined },
    { to: "/produtos", icon: Package, label: "Produtos", prefetch: "produtos" as const },
    { to: "/clientes", icon: Users, label: "Clientes", prefetch: "clientes" as const },
    { to: "/fornecedores", icon: Truck, label: "Fornecedores", prefetch: "fornecedores" as const },
    { to: "/vendedores", icon: UserCheck, label: "Vendedores", prefetch: "vendedores" as const },
    { to: "/estoque", icon: Warehouse, label: "Estoque", prefetch: "estoque" as const },
    { to: "/vendas", icon: ShoppingCart, label: "Vendas", prefetch: "vendas" as const },
    { to: "/caixa", icon: Wallet, label: "Caixa", prefetch: undefined },
    { to: "/financeiro", icon: TrendingUp, label: "Financeiro", prefetch: undefined },
    ...(isAdmin ? [{ to: "/usuarios", icon: UserCog, label: "Usuários", prefetch: undefined }] : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      {isWakingUp && <GlobalLoading message="Iniciando sistema..." />}
      
      {/* Mobile Header */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#7c3aed] shadow-lg">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Mariela PDV" className="w-10 h-10 rounded-full object-cover" />
              <div>
                <h1 className="text-white text-lg font-bold">Mariela PDV</h1>
                <p className="text-white/90 text-xs">Moda Feminina</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white hover:bg-white/10"
            >
              {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </header>
      )}
      
      {/* Overlay para mobile */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar com design moderno */}
      <aside className={`
        fixed top-0 h-full bg-gradient-to-b from-[#7c3aed] via-[#6d28d9] to-[#5b21b6] shadow-2xl flex flex-col z-40 transition-all duration-300
        ${isMobile ? 'w-72' : 'w-72 left-0'}
        ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}
        ${isMobile ? 'left-0' : 'left-0'}
        before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent before:pointer-events-none
      `}>

        {/* Header com logo - apenas desktop */}
        {!isMobile && (
          <div className="p-6 text-center border-b border-white/10 backdrop-blur-sm">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl overflow-hidden shadow-2xl ring-2 ring-white/20 transform transition-transform hover:scale-105">
              <img src={logo} alt="Mariela PDV" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-white text-2xl font-bold tracking-tight mb-1">Mariela PDV</h1>
            <p className="text-white/80 text-sm font-medium">Moda Feminina</p>
            <div className="mt-4 flex justify-center">
              <RoleIndicator />
            </div>
          </div>
        )}

        {/* Navegação moderna */}
        <nav className={`flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar ${isMobile ? 'mt-4' : ''}`}>
          {navItems.map((item) => (
            <PrefetchNavLink
              key={item.to}
              to={item.to}
              prefetchRoute={item.prefetch}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `group flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden ${
                  isActive
                    ? "bg-white text-[#7c3aed] shadow-xl shadow-white/20 font-semibold scale-[1.02]"
                    : "text-white/85 hover:bg-white/15 hover:text-white hover:translate-x-1"
                }`
              }
            >
              <item.icon 
                className="h-5 w-5 transition-all duration-300 group-hover:scale-110"
                strokeWidth={2}
              />
              <span className="text-[15px] font-medium tracking-wide">{item.label}</span>
            </PrefetchNavLink>
          ))}

          {/* Botão Nova Venda moderno com Prefetch */}
          <div className="pt-4 mt-4 border-t border-white/10">
            <PrefetchNavLink
              to="/vendas/nova"
              prefetchRoute="nova-venda"
              className="block"
            >
              <Button
                className="w-full bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] text-white font-bold shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-300 py-6 rounded-xl group relative overflow-hidden"
                onClick={handleNavClick}
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                <span className="text-base tracking-wide">Nova Venda</span>
              </Button>
            </PrefetchNavLink>
          </div>
        </nav>

        {/* Footer moderno */}
        <div className="p-4 border-t border-white/10 backdrop-blur-sm space-y-3">
          {isMobile && (
            <div className="mb-3 flex justify-center">
              <RoleIndicator />
            </div>
          )}
          {!isMobile && (
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/60 text-xs font-medium">© 2025 Mariela Moda</p>
              <CacheIndicator />
            </div>
          )}
          <Button
            variant="ghost"
            className="w-full text-white/90 hover:bg-white/15 hover:text-white justify-start group rounded-xl transition-all duration-300 py-5"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-3 group-hover:rotate-12 transition-transform" />
            <span className="font-medium">Sair</span>
          </Button>
          {isMobile && (
            <p className="text-white/60 text-xs text-center font-medium">© 2025 Mariela Moda</p>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className={`${isMobile ? 'pt-16' : 'ml-72'} min-h-screen`}>
        <CaixaFechadoNotification />
        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>
      <CaixaFechadoNotification />
      <FinanceiroAlertasDialog 
        open={showFinanceiroAlertas} 
        onOpenChange={setShowFinanceiroAlertas} 
      />
      <ConnectionStatus />
    </div>
  );
};

export default Layout;
