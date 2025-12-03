import { Outlet, useNavigate } from "react-router-dom";
import { PrefetchNavLink } from "@/components/PrefetchNavLink";
import { PageTransition } from "@/components/PageTransition";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { useContasPagar, useContasReceber, useCaixaAberto } from "@/hooks/useQueryCache";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { RoleIndicator } from "@/components/RoleIndicator";
import { SidebarSkeleton } from "@/components/SidebarSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

const Layout = () => {
  const navigate = useNavigate();
  const { logout, isAdmin } = useAuth();
  const { isWakingUp } = useAPIWakeup();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showFinanceiroAlertas, setShowFinanceiroAlertas] = useState(false);
  const [isSidebarLoading, setIsSidebarLoading] = useState(true);
  
  const { data: contasPagarData = [], isLoading: isLoadingContasPagar } = useContasPagar();
  const { data: contasReceberData = [], isLoading: isLoadingContasReceber } = useContasReceber();
  const { data: caixaAberto, refetch: refetchCaixa } = useCaixaAberto();

  // Controlar o estado de loading do sidebar
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSidebarLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

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
      <motion.aside 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className={`
        fixed top-0 h-full bg-gradient-to-b from-[#7c3aed] via-[#6d28d9] to-[#5b21b6] shadow-2xl flex flex-col z-40 transition-all duration-300
        ${isMobile ? 'w-72' : 'w-72 left-0'}
        ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}
        ${isMobile ? 'left-0' : 'left-0'}
        before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent before:pointer-events-none
      `}>

        {/* Header com logo - apenas desktop */}
        {!isMobile && (
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="p-6 text-center border-b border-white/10 backdrop-blur-sm"
          >
            <motion.div 
              className="w-20 h-20 mx-auto mb-4 rounded-2xl overflow-hidden shadow-2xl ring-2 ring-white/20"
              whileHover={{ scale: 1.05, rotate: 2 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <img src={logo} alt="Mariela PDV" className="w-full h-full object-cover" />
            </motion.div>
            <h1 className="text-white text-2xl font-bold tracking-tight mb-1">Mariela PDV</h1>
            <p className="text-white/80 text-sm font-medium">Moda Feminina</p>
            <div className="mt-4 flex justify-center">
              <RoleIndicator />
            </div>
          </motion.div>
        )}

        {/* Navegação moderna em formato de botão */}
        <nav className={`flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar ${isMobile ? 'mt-4' : ''}`}>
          <AnimatePresence mode="wait">
            {isSidebarLoading ? (
              <motion.div
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <SidebarSkeleton />
              </motion.div>
            ) : (
              <motion.div
                key="nav"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-2"
              >
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.to}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ 
                      delay: index * 0.05, 
                      duration: 0.3,
                      type: "spring",
                      stiffness: 200
                    }}
                  >
                    <PrefetchNavLink
                      to={item.to}
                      prefetchRoute={item.prefetch}
                      onClick={handleNavClick}
                    >
                      {({ isActive }) => (
                        <motion.div
                          whileHover={{ scale: 1.03, x: 4 }}
                          whileTap={{ scale: 0.97 }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        >
                          <Button
                            variant={isActive ? "default" : "ghost"}
                            className={`w-full justify-start gap-3 h-12 rounded-xl transition-all duration-300 relative overflow-hidden ${
                              isActive
                                ? "bg-white text-[#7c3aed] shadow-xl shadow-white/30 font-semibold hover:bg-white"
                                : "text-white/90 hover:bg-white/15 hover:text-white font-medium"
                            }`}
                          >
                            {isActive && (
                              <motion.div
                                layoutId="activeIndicator"
                                className="absolute left-0 top-0 bottom-0 w-1 bg-[#7c3aed] rounded-r-full"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.2 }}
                              />
                            )}
                            <motion.div
                              animate={isActive ? { rotate: [0, -10, 10, 0] } : {}}
                              transition={{ duration: 0.4 }}
                            >
                              <item.icon 
                                className={`h-5 w-5 transition-all duration-300 ${isActive ? 'text-[#7c3aed]' : ''}`}
                                strokeWidth={isActive ? 2.5 : 2}
                              />
                            </motion.div>
                            <span className="text-[15px] tracking-wide">{item.label}</span>
                            {isActive && (
                              <motion.div 
                                className="absolute right-3 w-2 h-2 bg-[#7c3aed] rounded-full"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 500 }}
                              />
                            )}
                          </Button>
                        </motion.div>
                      )}
                    </PrefetchNavLink>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Botão Nova Venda destacado */}
          <motion.div 
            className="pt-4 mt-4 border-t border-white/10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: navItems.length * 0.05 + 0.1, duration: 0.4 }}
          >
            <PrefetchNavLink
              to="/vendas/nova"
              prefetchRoute="nova-venda"
            >
              {() => (
                <motion.div
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <Button
                    className="w-full bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] text-white font-bold shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-300 h-14 rounded-xl group relative overflow-hidden"
                    onClick={handleNavClick}
                  >
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: "100%" }}
                      transition={{ duration: 0.6 }}
                    />
                    <motion.div
                      whileHover={{ rotate: 90 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Plus className="h-5 w-5 mr-2" />
                    </motion.div>
                    <span className="text-base tracking-wide">Nova Venda</span>
                  </Button>
                </motion.div>
              )}
            </PrefetchNavLink>
          </motion.div>
        </nav>

        {/* Footer moderno */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="p-4 border-t border-white/10 backdrop-blur-sm space-y-3"
        >
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
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              variant="ghost"
              className="w-full text-white/90 hover:bg-white/15 hover:text-white justify-start group rounded-xl transition-all duration-300 py-5"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-3 group-hover:rotate-12 transition-transform" />
              <span className="font-medium">Sair</span>
            </Button>
          </motion.div>
          {isMobile && (
            <p className="text-white/60 text-xs text-center font-medium">© 2025 Mariela Moda</p>
          )}
        </motion.div>
      </motion.aside>

      {/* Main Content */}
      <main className={`${isMobile ? 'pt-16' : 'ml-72'} min-h-screen`}>
        <CaixaFechadoNotification />
        <div className="p-4 md:p-8">
          <PageTransition>
            <Outlet />
          </PageTransition>
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
