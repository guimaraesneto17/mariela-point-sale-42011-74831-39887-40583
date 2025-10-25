import { useState, useEffect } from "react";
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
  UserCheck,
  Award,
  Crown,
  Settings,
  BarChart3,
  Wallet,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StatsCard from "@/components/StatsCard";
import { DashboardCard } from "@/components/DashboardCard";
import {
  DashboardConfigDialog,
  DashboardCardConfig,
} from "@/components/DashboardConfigDialog";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { clientesAPI, vendasAPI, produtosAPI, estoqueAPI, vendedoresAPI } from "@/lib/api";
import { toast } from "sonner";
import { formatDateTime, safeDate } from "@/lib/utils";

const STORAGE_KEY = "mariela-dashboard-config";

const defaultCards: DashboardCardConfig[] = [
  {
    id: "vendas-hoje",
    title: "Vendas Hoje",
    description: "Número total de vendas realizadas hoje",
    visible: true,
    category: "stats",
  },
  {
    id: "faturamento-diario",
    title: "Faturamento Diário",
    description: "Total faturado no dia atual",
    visible: true,
    category: "stats",
  },
  {
    id: "total-clientes",
    title: "Total de Clientes",
    description: "Número de clientes cadastrados",
    visible: true,
    category: "stats",
  },
  {
    id: "produtos-estoque",
    title: "Produtos em Estoque",
    description: "Quantidade de produtos disponíveis",
    visible: true,
    category: "stats",
  },
  {
    id: "fluxo-diario",
    title: "Fluxo de Caixa Diário",
    description: "Entradas e saídas do dia",
    visible: true,
    category: "finance",
  },
  {
    id: "fluxo-mensal",
    title: "Fluxo de Caixa Mensal",
    description: "Entradas e saídas do mês",
    visible: true,
    category: "finance",
  },
  {
    id: "produtos-vendidos",
    title: "Produtos Mais Vendidos",
    description: "Top produtos com maior número de vendas",
    visible: true,
    category: "sales",
  },
  {
    id: "vendas-recentes",
    title: "Vendas Recentes",
    description: "Últimas vendas realizadas",
    visible: true,
    category: "sales",
  },
  {
    id: "top-clientes",
    title: "Top Clientes",
    description: "Clientes com maior volume de compras",
    visible: true,
    category: "ranking",
  },
  {
    id: "top-vendedores",
    title: "Top Vendedores",
    description: "Vendedores com melhor desempenho",
    visible: true,
    category: "ranking",
  },
  {
    id: "ticket-medio",
    title: "Ticket Médio",
    description: "Valor médio por venda",
    visible: false,
    category: "stats",
  },
  {
    id: "margem-lucro",
    title: "Margem de Lucro",
    description: "Percentual de lucro sobre vendas",
    visible: false,
    category: "finance",
  },
  {
    id: "produtos-baixo-estoque",
    title: "Produtos em Baixo Estoque",
    description: "Produtos que precisam de reposição",
    visible: false,
    category: "sales",
  },
  {
    id: "crescimento-mensal",
    title: "Crescimento Mensal",
    description: "Comparativo com mês anterior",
    visible: false,
    category: "stats",
  },
];

const Dashboard = () => {
  const [configOpen, setConfigOpen] = useState(false);
  const [cards, setCards] = useState<DashboardCardConfig[]>([]);
  const [cardOrder, setCardOrder] = useState<string[]>([]);
  const [stats, setStats] = useState<any>({
    vendasHoje: 0,
    faturamentoDiario: 0,
    entradaDiaria: 0,
    saidaDiaria: 0,
    faturamentoMensal: 0,
    entradaMensal: 0,
    saidaMensal: 0,
    totalClientes: 0,
    produtosEstoque: 0,
    ticketMedio: 0,
    margemLucro: 0,
    crescimentoMensal: 0,
  });
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [topClientes, setTopClientes] = useState<any[]>([]);
  const [topVendedores, setTopVendedores] = useState<any[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [produtosBaixoEstoque, setProdutosBaixoEstoque] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const { cards: storedCards, order } = JSON.parse(stored);
      setCards(storedCards);
      setCardOrder(order);
    } else {
      setCards(defaultCards);
      setCardOrder(defaultCards.map((c) => c.id));
    }
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [vendas, clientes, produtos, estoque, vendedores] = await Promise.all([
        vendasAPI.getAll(),
        clientesAPI.getAll(),
        produtosAPI.getAll(),
        estoqueAPI.getAll(),
        vendedoresAPI.getAll(),
      ]);

      // Calcular estatísticas
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      const vendasHoje = vendas.filter((v: any) => {
        const vendaData = safeDate(v.data || v.dataVenda);
        if (!vendaData) return false;
        vendaData.setHours(0, 0, 0, 0);
        return vendaData.getTime() === hoje.getTime();
      });

      const faturamentoDiario = vendasHoje.reduce((acc: number, v: any) => acc + (v.total || 0), 0);
      const totalClientes = clientes.length;
      const produtosEstoque = estoque.reduce((acc: number, item: any) => acc + (item.quantidadeDisponivel || 0), 0);
      
      setStats({
        vendasHoje: vendasHoje.length,
        faturamentoDiario,
        entradaDiaria: faturamentoDiario * 0.7,
        saidaDiaria: faturamentoDiario * 0.3,
        faturamentoMensal: vendas.reduce((acc: number, v: any) => acc + (v.total || 0), 0),
        entradaMensal: vendas.reduce((acc: number, v: any) => acc + (v.total || 0), 0) * 0.7,
        saidaMensal: vendas.reduce((acc: number, v: any) => acc + (v.total || 0), 0) * 0.3,
        totalClientes,
        produtosEstoque,
        ticketMedio: vendas.length > 0 ? vendas.reduce((acc: number, v: any) => acc + (v.total || 0), 0) / vendas.length : 0,
        margemLucro: 38.5,
        crescimentoMensal: 15.3,
      });

      // Top produtos (simplificado - usar dados mock)
      setTopProducts([
        { nome: "Vestido Floral Curto", vendas: 45, valor: 6745.5 },
        { nome: "Blusa Manga Longa", vendas: 38, valor: 3416.2 },
        { nome: "Calça Jeans Skinny", vendas: 32, valor: 6396.8 },
        { nome: "Saia Plissada Midi", vendas: 28, valor: 3637.2 },
      ]);

      setRecentSales(vendas.slice(0, 3).map((v: any) => ({
        codigo: v.codigoVenda || v.codigo,
        cliente: v.cliente?.nome || 'Cliente',
        vendedor: v.vendedor?.nome || 'Vendedor',
        valor: v.total || 0,
        data: formatDateTime(v.data || v.dataVenda),
      })));

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = (newCards: DashboardCardConfig[]) => {
    setCards(newCards);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ cards: newCards, order: cardOrder })
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setCardOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ cards, order: newOrder })
        );
        return newOrder;
      });
    }
  };

  const visibleCards = cards.filter((c) => c.visible);
  const sortedCards = cardOrder
    .map((id) => visibleCards.find((c) => c.id === id))
    .filter(Boolean) as DashboardCardConfig[];

  const renderCard = (cardConfig: DashboardCardConfig) => {
    switch (cardConfig.id) {
      case "vendas-hoje":
        return (
          <StatsCard
            title="Vendas Hoje"
            value={stats.vendasHoje}
            icon={ShoppingCart}
            trend={{ value: 12, isPositive: true }}
            gradient
          />
        );
      case "faturamento-diario":
        return (
          <StatsCard
            title="Faturamento Diário"
            value={`R$ ${stats.faturamentoDiario.toFixed(2)}`}
            icon={DollarSign}
            trend={{ value: 8, isPositive: true }}
            gradient
          />
        );
      case "total-clientes":
        return (
          <StatsCard
            title="Total de Clientes"
            value={stats.totalClientes}
            icon={Users}
            trend={{ value: 15, isPositive: true }}
          />
        );
      case "produtos-estoque":
        return (
          <StatsCard
            title="Produtos em Estoque"
            value={stats.produtosEstoque}
            icon={Package}
          />
        );
      case "ticket-medio":
        return (
          <StatsCard
            title="Ticket Médio"
            value={`R$ ${stats.ticketMedio.toFixed(2)}`}
            icon={Wallet}
            trend={{ value: 5, isPositive: true }}
          />
        );
      case "margem-lucro":
        return (
          <StatsCard
            title="Margem de Lucro"
            value={`${stats.margemLucro.toFixed(1)}%`}
            icon={BarChart3}
            trend={{ value: 3, isPositive: true }}
            gradient
          />
        );
      case "crescimento-mensal":
        return (
          <StatsCard
            title="Crescimento Mensal"
            value={`${stats.crescimentoMensal.toFixed(1)}%`}
            icon={ArrowUpDown}
            trend={{ value: stats.crescimentoMensal, isPositive: true }}
            gradient
          />
        );
      case "fluxo-diario":
        return (
          <DashboardCard id={cardConfig.id}>
            <h3 className="text-lg font-bold text-foreground mb-4">
              Fluxo de Caixa Diário
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Entrada (Vendas)
                    </p>
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
                    <p className="text-sm text-muted-foreground">
                      Saída (Custos)
                    </p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      R$ {stats.saidaDiaria.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Lucro Diário
                  </span>
                  <span className="text-xl font-bold text-primary">
                    R$ {(stats.entradaDiaria - stats.saidaDiaria).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </DashboardCard>
        );
      case "fluxo-mensal":
        return (
          <DashboardCard id={cardConfig.id}>
            <h3 className="text-lg font-bold text-foreground mb-4">
              Fluxo de Caixa Mensal
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Entrada (Vendas)
                    </p>
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
                    <p className="text-sm text-muted-foreground">
                      Saída (Custos)
                    </p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      R$ {stats.saidaMensal.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Lucro Mensal
                  </span>
                  <span className="text-xl font-bold text-primary">
                    R$ {(stats.entradaMensal - stats.saidaMensal).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </DashboardCard>
        );
      case "produtos-vendidos":
        return (
          <DashboardCard id={cardConfig.id}>
            <h3 className="text-lg font-bold text-foreground mb-4">
              Produtos Mais Vendidos
            </h3>
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg bg-gradient-card hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {product.nome}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {product.vendas} vendas
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-primary">
                    R$ {product.valor.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </DashboardCard>
        );
      case "vendas-recentes":
        return (
          <DashboardCard id={cardConfig.id}>
            <h3 className="text-lg font-bold text-foreground mb-4">
              Vendas Recentes
            </h3>
            <div className="space-y-3">
              {recentSales.map((sale) => (
                <div
                  key={sale.codigo}
                  className="p-4 rounded-lg bg-gradient-card hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-primary">
                      {sale.codigo}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {sale.data}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {sale.cliente}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Vendedor: {sale.vendedor}
                      </p>
                    </div>
                    <span className="font-bold text-foreground">
                      R$ {sale.valor.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </DashboardCard>
        );
      case "top-clientes":
        return (
          <DashboardCard id={cardConfig.id} className="bg-gradient-to-br from-card via-card to-blue-500/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Crown className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Top Clientes
              </h3>
            </div>
            <div className="space-y-3">
              {topClientes.map((cliente, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg bg-gradient-card hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        index === 0
                          ? "bg-yellow-500/20"
                          : index === 1
                          ? "bg-gray-400/20"
                          : index === 2
                          ? "bg-orange-600/20"
                          : "bg-primary/10"
                      }`}
                    >
                      {index === 0 ? (
                        <Award className="h-4 w-4 text-yellow-600" />
                      ) : index === 1 ? (
                        <Award className="h-4 w-4 text-gray-500" />
                      ) : index === 2 ? (
                        <Award className="h-4 w-4 text-orange-700" />
                      ) : (
                        <span className="text-sm font-bold text-primary">
                          {index + 1}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {cliente.nome}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {cliente.compras} compras
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-blue-600">
                    R$ {cliente.valorTotal.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </DashboardCard>
        );
      case "top-vendedores":
        return (
          <DashboardCard id={cardConfig.id} className="bg-gradient-to-br from-card via-card to-green-500/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Top Vendedores
              </h3>
            </div>
            <div className="space-y-3">
              {topVendedores.map((vendedor, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg bg-gradient-card hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        index === 0
                          ? "bg-yellow-500/20"
                          : index === 1
                          ? "bg-gray-400/20"
                          : index === 2
                          ? "bg-orange-600/20"
                          : "bg-primary/10"
                      }`}
                    >
                      {index === 0 ? (
                        <Award className="h-4 w-4 text-yellow-600" />
                      ) : index === 1 ? (
                        <Award className="h-4 w-4 text-gray-500" />
                      ) : index === 2 ? (
                        <Award className="h-4 w-4 text-orange-700" />
                      ) : (
                        <span className="text-sm font-bold text-primary">
                          {index + 1}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {vendedor.nome}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {vendedor.vendas} vendas
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-green-600">
                    R$ {vendedor.valorTotal.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </DashboardCard>
        );
      case "produtos-baixo-estoque":
        return (
          <DashboardCard id={cardConfig.id}>
            <h3 className="text-lg font-bold text-foreground mb-4">
              Produtos em Baixo Estoque
            </h3>
            <div className="space-y-3">
              {produtosBaixoEstoque.map((produto, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800"
                >
                  <div>
                    <p className="font-medium text-foreground">{produto.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      Mínimo: {produto.minimo} unidades
                    </p>
                  </div>
                  <Badge variant="destructive">
                    {produto.quantidade} restantes
                  </Badge>
                </div>
              ))}
            </div>
          </DashboardCard>
        );
      default:
        return null;
    }
  };

  const statsCards = sortedCards.filter((c) =>
    ["vendas-hoje", "faturamento-diario", "total-clientes", "produtos-estoque", "ticket-medio", "margem-lucro", "crescimento-mensal"].includes(
      c.id
    )
  );

  const otherCards = sortedCards.filter(
    (c) =>
      ![
        "vendas-hoje",
        "faturamento-diario",
        "total-clientes",
        "produtos-estoque",
        "ticket-medio",
        "margem-lucro",
        "crescimento-mensal",
      ].includes(c.id)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Visão geral do seu negócio em tempo real
          </p>
        </div>
        <Button
          onClick={() => setConfigOpen(true)}
          variant="outline"
          className="gap-2"
        >
          <Settings className="h-4 w-4" />
          Configurar Dashboard
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        {/* Stats Cards */}
        {statsCards.length > 0 && (
          <SortableContext items={statsCards.map((c) => c.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statsCards.map((card) => (
                <div key={card.id}>{renderCard(card)}</div>
              ))}
            </div>
          </SortableContext>
        )}

        {/* Other Cards */}
        {otherCards.length > 0 && (
          <SortableContext items={otherCards.map((c) => c.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {otherCards.map((card) => (
                <div key={card.id}>{renderCard(card)}</div>
              ))}
            </div>
          </SortableContext>
        )}
      </DndContext>

      <DashboardConfigDialog
        open={configOpen}
        onOpenChange={setConfigOpen}
        cards={cards}
        onSave={saveConfig}
      />
    </div>
  );
};

export default Dashboard;
