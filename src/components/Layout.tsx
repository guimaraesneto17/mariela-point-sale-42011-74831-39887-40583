import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Warehouse, 
  Truck,
  Plus,
  UserCheck,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/logo.png";

const Layout = () => {
  const navigate = useNavigate();

  const navItems = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/relatorios", icon: FileText, label: "Relatórios" },
    { to: "/produtos", icon: Package, label: "Produtos" },
    { to: "/clientes", icon: Users, label: "Clientes" },
    { to: "/fornecedores", icon: Truck, label: "Fornecedores" },
    { to: "/vendedores", icon: UserCheck, label: "Vendedores" },
    { to: "/estoque", icon: Warehouse, label: "Estoque" },
    { to: "/vendas", icon: ShoppingCart, label: "Vendas" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed left-0 top-0 h-full w-64 bg-[#7c3aed] shadow-xl flex flex-col">
        
        {/* Header com logo */}
        <div className="p-6 text-center border-b border-white/20">
          <div className="w-24 h-24 mx-auto mb-3 rounded-full overflow-hidden shadow-lg shadow-[#6d28d9]/30">
            <img src={logo} alt="Mariela PDV" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-white text-xl font-bold">Mariela PDV</h1>
          <p className="text-white/90 text-sm">Moda Feminina</p>
        </div>
        
        {/* Navegação */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-[#c4b5fd] text-[#7c3aed] shadow-md font-semibold"
                    : "text-white hover:bg-white/10"
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}

          {/* Botão Nova Venda */}
          <Button 
            className="w-full mt-4 bg-[#22c55e] hover:bg-[#16a34a] text-white font-semibold"
            onClick={() => navigate("/vendas/nova")}
          >
            <Plus className="h-5 w-5 mr-2" />
            Nova Venda
          </Button>
        </nav>

        {/* Copyright */}
        <div className="p-4 border-t border-white/20 text-center">
          <p className="text-white/70 text-xs">© 2025 Mariela Moda Feminina</p>
        </div>
      </aside>

      <main className="ml-64 min-h-screen p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
