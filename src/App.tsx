import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import VendedorDashboard from "./pages/VendedorDashboard";
import Produtos from "./pages/Produtos";
import Vendas from "./pages/Vendas";
import NovaVenda from "./pages/NovaVenda";
import Clientes from "./pages/Clientes";
import Estoque from "./pages/Estoque";
import Fornecedores from "./pages/Fornecedores";
import Vendedores from "./pages/Vendedores";
import Relatorios from "./pages/Relatorios";
import VitrineVirtual from "./pages/VitrineVirtual";
import Caixa from "./pages/Caixa";
import Financeiro from "./pages/Financeiro";
import BackendStatus from "./pages/BackendStatus";
import Usuarios from "./pages/Usuarios";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes - dados frescos
      gcTime: 1000 * 60 * 30, // 30 minutes no cache
      refetchOnWindowFocus: false,
      refetchOnMount: 'always', // Sempre revalidar ao montar
      retry: 2,
    },
  },
});

// Limpar cache se não houver token (evita dados stale após logout/login)
const hasValidToken = () => !!localStorage.getItem('mariela_access_token');

// Configurar persistência customizada no localStorage
const persister = {
  persistClient: async (client: any) => {
    try {
      // Só persiste se houver token válido
      if (hasValidToken()) {
        localStorage.setItem('MARIELA_CACHE', JSON.stringify(client));
      }
    } catch (error) {
      console.error('Erro ao persistir cache:', error);
    }
  },
  restoreClient: async () => {
    try {
      // Só restaura cache se houver token válido
      if (!hasValidToken()) {
        localStorage.removeItem('MARIELA_CACHE');
        return undefined;
      }
      const cached = localStorage.getItem('MARIELA_CACHE');
      return cached ? JSON.parse(cached) : undefined;
    } catch (error) {
      console.error('Erro ao restaurar cache:', error);
      return undefined;
    }
  },
  removeClient: async () => {
    try {
      localStorage.removeItem('MARIELA_CACHE');
    } catch (error) {
      console.error('Erro ao remover cache:', error);
    }
  },
};

const App = () => (
  <PersistQueryClientProvider
    client={queryClient}
    persistOptions={{
      persister,
      maxAge: 1000 * 60 * 60 * 24, // 24 horas
      dehydrateOptions: {
        shouldDehydrateQuery: (query) => {
          // Não persistir queries com erro ou que estão carregando
          return query.state.status === 'success';
        },
      },
    }}
  >
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route element={<Layout />}>
               <Route path="/" element={<ProtectedRoute requiredRoles={['admin', 'gerente']}><Dashboard /></ProtectedRoute>} />
               <Route path="/vendedor-dashboard" element={<ProtectedRoute><VendedorDashboard /></ProtectedRoute>} />
              <Route path="/produtos" element={<ProtectedRoute requiredModule="produtos"><Produtos /></ProtectedRoute>} />
              <Route path="/vendas" element={<ProtectedRoute requiredModule="vendas"><Vendas /></ProtectedRoute>} />
              <Route path="/vendas/nova" element={<ProtectedRoute requiredModule="vendas"><NovaVenda /></ProtectedRoute>} />
              <Route path="/clientes" element={<ProtectedRoute requiredModule="clientes"><Clientes /></ProtectedRoute>} />
              <Route path="/estoque" element={<ProtectedRoute requiredModule="estoque"><Estoque /></ProtectedRoute>} />
              <Route path="/fornecedores" element={<ProtectedRoute requiredModule="fornecedores"><Fornecedores /></ProtectedRoute>} />
              <Route path="/vendedores" element={<ProtectedRoute requiredModule="vendedores"><Vendedores /></ProtectedRoute>} />
              <Route path="/relatorios" element={<ProtectedRoute requiredModule="relatorios"><Relatorios /></ProtectedRoute>} />
              <Route path="/vitrine-virtual" element={<ProtectedRoute requiredModule="vitrine"><VitrineVirtual /></ProtectedRoute>} />
              <Route path="/caixa" element={<ProtectedRoute requiredModule="caixa"><Caixa /></ProtectedRoute>} />
              <Route path="/financeiro" element={<ProtectedRoute requiredModule="financeiro"><Financeiro /></ProtectedRoute>} />
              <Route path="/usuarios" element={<ProtectedRoute requiredRoles={['admin']}><Usuarios /></ProtectedRoute>} />
              <Route path="/backend-status" element={<ProtectedRoute requiredRoles={['admin']}><BackendStatus /></ProtectedRoute>} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </PersistQueryClientProvider>
);

export default App;
