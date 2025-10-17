import { DollarSign, ShoppingCart, Users, Package, TrendingUp, TrendingDown, UserCheck, Award, Crown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StatsCard from "@/components/StatsCard";

const Dashboard = () => {
  // Mock data - será substituído por dados reais da API
  const stats = {
    vendasHoje: 12,
    faturamentoDiario: 1250.80,
    entradaDiaria: 450.00,
    saidaDiaria: 800.80,
    faturamentoMensal: 32450.00,
    entradaMensal: 12500.00,
    saidaMensal: 19950.00,
    totalClientes: 89,
    produtosEstoque: 156,
  };

  const topProducts = [
    { nome: "Vestido Floral Curto", vendas: 45, valor: 6745.50 },
    { nome: "Blusa Manga Longa", vendas: 38, valor: 3416.20 },
    { nome: "Calça Jeans Skinny", vendas: 32, valor: 6396.80 },
    { nome: "Saia Plissada Midi", vendas: 28, valor: 3637.20 },
  ];

  const topClientes = [
    { nome: "Maria Silva", compras: 28, valorTotal: 4580.50 },
    { nome: "Ana Paula Costa", compras: 22, valorTotal: 3890.00 },
    { nome: "Juliana Santos", compras: 19, valorTotal: 3245.90 },
    { nome: "Fernanda Lima", compras: 15, valorTotal: 2678.30 },
  ];

  const topVendedores = [
    { nome: "Ana Carolina", vendas: 87, valorTotal: 15680.50 },
    { nome: "João Pedro", vendas: 76, valorTotal: 13245.80 },
    { nome: "Carla Santos", vendas: 65, valorTotal: 11890.30 },
    { nome: "Juliana Lima", vendas: 54, valorTotal: 9456.90 },
  ];

  const recentSales = [
    {
      codigo: "VENDA20251013-001",
      cliente: "Maria Silva",
      vendedor: "Ana Carolina",
      valor: 259.80,
      data: "13/10/2025 14:30"
    },
    {
      codigo: "VENDA20251013-002",
      cliente: "Ana Paula Costa",
      vendedor: "João Pedro",
      valor: 89.90,
      data: "13/10/2025 10:15"
    },
    {
      codigo: "VENDA20251013-003",
      cliente: "Juliana Santos",
      vendedor: "Ana Carolina",
      valor: 259.80,
      data: "13/10/2025 16:45"
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do seu negócio em tempo real
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Vendas Hoje"
          value={stats.vendasHoje}
          icon={ShoppingCart}
          trend={{ value: 12, isPositive: true }}
          gradient
        />
        <StatsCard
          title="Faturamento Diário"
          value={`R$ ${stats.faturamentoDiario.toFixed(2)}`}
          icon={DollarSign}
          trend={{ value: 8, isPositive: true }}
          gradient
        />
        <StatsCard
          title="Total de Clientes"
          value={stats.totalClientes}
          icon={Users}
          trend={{ value: 15, isPositive: true }}
        />
        <StatsCard
          title="Produtos em Estoque"
          value={stats.produtosEstoque}
          icon={Package}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 shadow-card">
          <h3 className="text-lg font-bold text-foreground mb-4">Fluxo de Caixa Diário</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Entrada (Vendas)</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    R$ {stats.entradaDiaria.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500 rounded-lg">
                  <TrendingDown className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Saída (Custos)</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    R$ {stats.saidaDiaria.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Lucro Diário</span>
                <span className="text-xl font-bold text-primary">
                  R$ {(stats.entradaDiaria - stats.saidaDiaria).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-card">
          <h3 className="text-lg font-bold text-foreground mb-4">Fluxo de Caixa Mensal</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Entrada (Vendas)</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    R$ {stats.entradaMensal.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500 rounded-lg">
                  <TrendingDown className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Saída (Custos)</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    R$ {stats.saidaMensal.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Lucro Mensal</span>
                <span className="text-xl font-bold text-primary">
                  R$ {(stats.entradaMensal - stats.saidaMensal).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 shadow-card">
          <h3 className="text-lg font-bold text-foreground mb-4">Produtos Mais Vendidos</h3>
          <div className="space-y-3">
            {topProducts.map((product, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-lg bg-gradient-card hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{product.nome}</p>
                    <p className="text-sm text-muted-foreground">{product.vendas} vendas</p>
                  </div>
                </div>
                <span className="font-bold text-primary">
                  R$ {product.valor.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 shadow-card">
          <h3 className="text-lg font-bold text-foreground mb-4">Vendas Recentes</h3>
          <div className="space-y-3">
            {recentSales.map((sale) => (
              <div
                key={sale.codigo}
                className="p-4 rounded-lg bg-gradient-card hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-primary">{sale.codigo}</span>
                  <span className="text-sm text-muted-foreground">{sale.data}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{sale.cliente}</p>
                    <p className="text-xs text-muted-foreground">Vendedor: {sale.vendedor}</p>
                  </div>
                  <span className="font-bold text-foreground">
                    R$ {sale.valor.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 shadow-card bg-gradient-to-br from-card via-card to-blue-500/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Crown className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Top Clientes</h3>
          </div>
          <div className="space-y-3">
            {topClientes.map((cliente, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-lg bg-gradient-card hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    index === 0 ? "bg-yellow-500/20" : 
                    index === 1 ? "bg-gray-400/20" : 
                    index === 2 ? "bg-orange-600/20" : "bg-primary/10"
                  }`}>
                    {index === 0 ? (
                      <Award className="h-4 w-4 text-yellow-600" />
                    ) : index === 1 ? (
                      <Award className="h-4 w-4 text-gray-500" />
                    ) : index === 2 ? (
                      <Award className="h-4 w-4 text-orange-700" />
                    ) : (
                      <span className="text-sm font-bold text-primary">{index + 1}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{cliente.nome}</p>
                    <p className="text-sm text-muted-foreground">{cliente.compras} compras</p>
                  </div>
                </div>
                <span className="font-bold text-blue-600">
                  R$ {cliente.valorTotal.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 shadow-card bg-gradient-to-br from-card via-card to-green-500/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Top Vendedores</h3>
          </div>
          <div className="space-y-3">
            {topVendedores.map((vendedor, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-lg bg-gradient-card hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    index === 0 ? "bg-yellow-500/20" : 
                    index === 1 ? "bg-gray-400/20" : 
                    index === 2 ? "bg-orange-600/20" : "bg-primary/10"
                  }`}>
                    {index === 0 ? (
                      <Award className="h-4 w-4 text-yellow-600" />
                    ) : index === 1 ? (
                      <Award className="h-4 w-4 text-gray-500" />
                    ) : index === 2 ? (
                      <Award className="h-4 w-4 text-orange-700" />
                    ) : (
                      <span className="text-sm font-bold text-primary">{index + 1}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{vendedor.nome}</p>
                    <p className="text-sm text-muted-foreground">{vendedor.vendas} vendas</p>
                  </div>
                </div>
                <span className="font-bold text-green-600">
                  R$ {vendedor.valorTotal.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
