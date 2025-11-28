import { Outlet, NavLink, useNavigate } from "react-router-dom";
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
    { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/relatorios", icon: FileText, label: "Relatórios" },
    { to: "/produtos", icon: Package, label: "Produtos" },
    { to: "/clientes", icon: Users, label: "Clientes" },
    { to: "/fornecedores", icon: Truck, label: "Fornecedores" },
    { to: "/vendedores", icon: UserCheck, label: "Vendedores" },
    { to: "/estoque", icon: Warehouse, label: "Estoque" },
    { to: "/vendas", icon: ShoppingCart, label: "Vendas" },
    { to: "/caixa", icon: Wallet, label: "Caixa" },
    { to: "/financeiro", icon: TrendingUp, label: "Financeiro" },
    ...(isAdmin ? [{ to: "/usuarios", icon: UserCog, label: "Usuários" }] : []),
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
      
      {/* Sidebar */}
      <aside className={`
        fixed top-0 h-full bg-[#7c3aed] shadow-xl flex flex-col z-40 transition-transform duration-300
        ${isMobile ? 'w-64' : 'w-64 left-0'}
        ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}
        ${isMobile ? 'left-0' : 'left-0'}
      `}>

        {/* Header com logo - apenas desktop */}
        {!isMobile && (
          <div className="p-6 text-center border-b border-white/20">
            <div className="w-24 h-24 mx-auto mb-3 rounded-full overflow-hidden shadow-lg shadow-[#6d28d9]/30">
              <img src={logo} alt="Mariela PDV" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-white text-xl font-bold">Mariela PDV</h1>
            <p className="text-white/90 text-sm">Moda Feminina</p>
          </div>
        )}

        {/* Navegação */}
        <nav className={`flex-1 p-4 space-y-1 overflow-y-auto ${isMobile ? 'mt-4' : ''}`}>
          {navItems.map((item) => {
            // Simplificado sem PrefetchLink para evitar complexidade
            return (
              <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                  ? "bg-[#c4b5fd] text-[#7c3aed] shadow-md font-semibold"
                  : "text-white hover:bg-white/10"
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
            );
          })}

          {/* Botão Nova Venda */}
          <Button
            className="w-full mt-4 bg-[#22c55e] hover:bg-[#16a34a] text-white font-semibold"
            onClick={() => {
              navigate("/vendas/nova");
              handleNavClick();
            }}
          >
            <Plus className="h-5 w-5 mr-2" />
            Nova Venda
          </Button>
        </nav>

        {/* Copyright e Logout */}
        <div className="p-4 border-t border-white/20 space-y-2">
          {!isMobile && (
            <div className="flex items-center justify-between mb-2">
              <p className="text-white/70 text-xs">© 2025 Mariela Moda Feminina</p>
              <CacheIndicator />
            </div>
          )}
          <Button
            variant="ghost"
            className="w-full text-white hover:bg-white/10 justify-start"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
          {isMobile && (
            <p className="text-white/70 text-xs text-center">© 2025 Mariela Moda Feminina</p>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className={`${isMobile ? 'pt-16' : 'ml-64'} min-h-screen`}>
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
