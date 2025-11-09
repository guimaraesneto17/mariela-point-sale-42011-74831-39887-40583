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
  Calendar as CalendarIcon,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
import { clientesAPI, vendasAPI, produtosAPI, estoqueAPI, vendedoresAPI, caixaAPI } from "@/lib/api";
import { toast } from "sonner";
import { formatDateTime, safeDate } from "@/lib/utils";
import { ComparacaoPeriodoDialog } from "@/components/ComparacaoPeriodoDialog";

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
    id: "caixa-unificado",
    title: "Caixa Atual",
    description: "Performance e status do caixa",
    visible: true,
    category: "stats",
  },
  {
    id: "ticket-medio",
    title: "Ticket Médio",
    description: "Valor médio por venda",
    visible: true,
    category: "stats",
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
];

const Dashboard = () => {
  const [configOpen, setConfigOpen] = useState(false);
  const [cards, setCards] = useState<DashboardCardConfig[]>([]);
  const [cardOrder, setCardOrder] = useState<string[]>([]);
  const [dataInicio, setDataInicio] = useState<Date | undefined>(undefined);
  const [dataFim, setDataFim] = useState<Date | undefined>(undefined);
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
    valorEstoqueCusto: 0,
    valorEstoqueVenda: 0,
  });
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [topClientes, setTopClientes] = useState<any[]>([]);
  const [topVendedores, setTopVendedores] = useState<any[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [produtosBaixoEstoque, setProdutosBaixoEstoque] = useState<any[]>([]);
  const [movimentacoesEstoque, setMovimentacoesEstoque] = useState<any[]>([]);
  const [caixaAberto, setCaixaAberto] = useState<any>(null);
  const [vendasPorMes, setVendasPorMes] = useState<any[]>([]);
  const [vendasParaGrafico, setVendasParaGrafico] = useState<any[]>([]);
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
  }, [dataInicio, dataFim]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [vendasAll, clientes, produtos, estoque, vendedores] = await Promise.all([
        vendasAPI.getAll(),
        clientesAPI.getAll(),
        produtosAPI.getAll(),
        estoqueAPI.getAll(),
        vendedoresAPI.getAll(),
      ]);

      // Filtrar vendas por período se datas foram selecionadas
      let vendas = vendasAll;
      if (dataInicio || dataFim) {
        vendas = vendasAll.filter((v: any) => {
          const vendaData = safeDate(v.data || v.dataVenda);
          if (!vendaData) return false;
          
          if (dataInicio && dataFim) {
            const inicio = new Date(dataInicio);
            const fim = new Date(dataFim);
            inicio.setHours(0, 0, 0, 0);
            fim.setHours(23, 59, 59, 999);
            return vendaData >= inicio && vendaData <= fim;
          } else if (dataInicio) {
            const inicio = new Date(dataInicio);
            inicio.setHours(0, 0, 0, 0);
            return vendaData >= inicio;
          } else if (dataFim) {
            const fim = new Date(dataFim);
            fim.setHours(23, 59, 59, 999);
            return vendaData <= fim;
          }
          return true;
        });
      }
      
      setProdutos(produtos);
      setVendasParaGrafico(vendas); // Armazenar vendas para o gráfico

      // Tentar carregar caixa aberto
      try {
        const caixa = await caixaAPI.getCaixaAberto();
        setCaixaAberto(caixa);
      } catch (error) {
        console.log('Nenhum caixa aberto encontrado');
        setCaixaAberto(null);
      }

      // Coletar todas as movimentações de todos os itens do estoque
      const todasMovimentacoes: any[] = [];
      estoque.forEach((item: any) => {
        if (item.logMovimentacao && Array.isArray(item.logMovimentacao)) {
          item.logMovimentacao.forEach((mov: any) => {
            todasMovimentacoes.push({
              ...mov,
              codigoProduto: item.codigoProduto,
              nomeProduto: item.nomeProduto || item.nome || item.codigoProduto,
            });
          });
        }
      });
      console.log('📦 Total de movimentações coletadas:', todasMovimentacoes.length);
      setMovimentacoesEstoque(todasMovimentacoes);

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
      const produtosEstoque = estoque.reduce((acc: number, item: any) => acc + (item.quantidadeTotal || 0), 0);
      
      // Calcular valor total do estoque pelo custo e venda
      let valorEstoqueCusto = 0;
      let valorEstoqueVenda = 0;
      
      estoque.forEach((item: any) => {
        const quantidade = item.quantidadeTotal || 0;
        const precoCusto = item.precoCusto || 0;
        const precoVenda = item.precoVenda || item.precoPromocional || 0;
        
        valorEstoqueCusto += quantidade * precoCusto;
        valorEstoqueVenda += quantidade * precoVenda;
      });
      
      // Calcular margem de lucro real
      const margemLucro = valorEstoqueVenda > 0 ? ((valorEstoqueVenda - valorEstoqueCusto) / valorEstoqueVenda) * 100 : 0;
      
      // Calcular crescimento mensal (comparar com mês anterior)
      const mesAtual = new Date().getMonth();
      const anoAtual = new Date().getFullYear();
      const mesAnterior = mesAtual === 0 ? 11 : mesAtual - 1;
      const anoMesAnterior = mesAtual === 0 ? anoAtual - 1 : anoAtual;
      
      const vendasMesAtual = vendas.filter((v: any) => {
        const vendaData = safeDate(v.data || v.dataVenda);
        return vendaData && vendaData.getMonth() === mesAtual && vendaData.getFullYear() === anoAtual;
      });
      
      const vendasMesAnterior = vendas.filter((v: any) => {
        const vendaData = safeDate(v.data || v.dataVenda);
        return vendaData && vendaData.getMonth() === mesAnterior && vendaData.getFullYear() === anoMesAnterior;
      });
      
      const faturamentoMesAtual = vendasMesAtual.reduce((acc: number, v: any) => acc + (v.total || 0), 0);
      const faturamentoMesAnterior = vendasMesAnterior.reduce((acc: number, v: any) => acc + (v.total || 0), 0);
      const crescimentoMensal = faturamentoMesAnterior > 0 
        ? ((faturamentoMesAtual - faturamentoMesAnterior) / faturamentoMesAnterior) * 100 
        : 0;

      // Calcular vendas por mês para o gráfico de margem
      const vendasPorMesMap: any = {};
      vendas.forEach((v: any) => {
        const vendaData = safeDate(v.data || v.dataVenda);
        if (vendaData) {
          const mesAno = `${vendaData.toLocaleString('pt-BR', { month: 'short' })} ${vendaData.getFullYear()}`;
          if (!vendasPorMesMap[mesAno]) {
            vendasPorMesMap[mesAno] = { mes: mesAno, valor: 0, vendas: 0 };
          }
          vendasPorMesMap[mesAno].valor += v.total || 0;
          vendasPorMesMap[mesAno].vendas += 1;
        }
      });
      
      const vendasPorMesArray = Object.values(vendasPorMesMap).slice(-6); // últimos 6 meses
      setVendasPorMes(vendasPorMesArray);

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
        margemLucro,
        crescimentoMensal,
        valorEstoqueCusto,
        valorEstoqueVenda,
      });

      // Calcular top produtos baseado nas vendas reais
      const produtosVendidos = new Map<string, { nome: string; vendas: number; valor: number }>();
      vendas.forEach((venda: any) => {
        if (venda.itens && Array.isArray(venda.itens)) {
          venda.itens.forEach((item: any) => {
            const codigo = item.codigoProduto || item.codigo;
            const nome = item.nome || item.nomeProduto || codigo;
            const existing = produtosVendidos.get(codigo) || { nome, vendas: 0, valor: 0 };
            produtosVendidos.set(codigo, {
              nome: existing.nome,
              vendas: existing.vendas + (item.quantidade || 1),
              valor: existing.valor + (item.precoVenda || item.preco || 0) * (item.quantidade || 1),
            });
          });
        }
      });
      
      const topProdutosArray = Array.from(produtosVendidos.values())
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 4);
      setTopProducts(topProdutosArray);

      // Calcular top clientes baseado nas vendas reais
      const clientesVendas = new Map<string, { nome: string; compras: number; valorTotal: number }>();
      vendas.forEach((venda: any) => {
        const clienteId = venda.cliente?._id || venda.cliente?.codigo || venda.clienteId;
        const clienteNome = venda.cliente?.nome || 'Cliente';
        const existing = clientesVendas.get(clienteId) || { nome: clienteNome, compras: 0, valorTotal: 0 };
        clientesVendas.set(clienteId, {
          nome: existing.nome,
          compras: existing.compras + 1,
          valorTotal: existing.valorTotal + (venda.total || 0),
        });
      });
      
      const topClientesArray = Array.from(clientesVendas.values())
        .sort((a, b) => b.valorTotal - a.valorTotal)
        .slice(0, 5);
      setTopClientes(topClientesArray);

      // Calcular top vendedores baseado nas vendas reais
      const vendedoresVendas = new Map<string, { nome: string; vendas: number; valorTotal: number }>();
      vendas.forEach((venda: any) => {
        const vendedorId = venda.vendedor?._id || venda.vendedor?.codigo || venda.vendedorId;
        const vendedorNome = venda.vendedor?.nome || 'Vendedor';
        const existing = vendedoresVendas.get(vendedorId) || { nome: vendedorNome, vendas: 0, valorTotal: 0 };
        vendedoresVendas.set(vendedorId, {
          nome: existing.nome,
          vendas: existing.vendas + 1,
          valorTotal: existing.valorTotal + (venda.total || 0),
        });
      });
      
      const topVendedoresArray = Array.from(vendedoresVendas.values())
        .sort((a, b) => b.valorTotal - a.valorTotal)
        .slice(0, 5);
      setTopVendedores(topVendedoresArray);

      // Produtos em baixo estoque (quantidade <= 5)
      const produtosBaixo = estoque
        .filter((item: any) => (item.quantidadeTotal || 0) <= 5)
        .map((item: any) => ({
          codigo: item.codigoProduto || item.codigo,
          nome: item.nomeProduto || item.nome,
          quantidade: item.quantidadeTotal || 0,
          precoVenda: item.precoVenda || 0,
          variantes: item.variantes || [],
        }))
        .slice(0, 5);
      setProdutosBaixoEstoque(produtosBaixo);

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
            gradient
          />
        );
      case "faturamento-diario":
        return (
          <StatsCard
            title="Faturamento Diário"
            value={`R$ ${stats.faturamentoDiario.toFixed(2)}`}
            icon={DollarSign}
            gradient
          />
        );
      case "total-clientes":
        return (
          <StatsCard
            title="Total de Clientes"
            value={stats.totalClientes}
            icon={Users}
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
      case "valor-estoque-custo":
        return (
          <StatsCard
            title="Valor em Estoque (Custo)"
            value={`R$ ${stats.valorEstoqueCusto.toFixed(2)}`}
            icon={Package}
            gradient
          />
        );
      case "valor-estoque-venda":
        return (
          <StatsCard
            title="Valor em Estoque (Venda)"
            value={`R$ ${stats.valorEstoqueVenda.toFixed(2)}`}
            icon={DollarSign}
            gradient
          />
        );
      case "ticket-medio":
        return (
          <StatsCard
            title="Ticket Médio"
            value={`R$ ${stats.ticketMedio.toFixed(2)}`}
            icon={Wallet}
          />
        );
      case "margem-lucro":
        return (
          <StatsCard
            title="Margem de Lucro"
            value={`${stats.margemLucro.toFixed(1)}%`}
            icon={BarChart3}
            gradient
          />
        );
      case "crescimento-mensal":
        return (
          <StatsCard
            title="Crescimento Mensal"
            value={`${stats.crescimentoMensal.toFixed(1)}%`}
            icon={ArrowUpDown}
            trend={{ 
              value: Math.abs(stats.crescimentoMensal), 
              isPositive: stats.crescimentoMensal >= 0 
            }}
            gradient
          />
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
            <TooltipProvider>
              <div className="space-y-3">
                {produtosBaixoEstoque.map((produto, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800"
                  >
                    <div>
                      <p className="font-medium text-foreground">{produto.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        Mínimo: {(produto.minimo ?? 5)} unidades
                      </p>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="destructive" className="cursor-help">
                          {produto.quantidade} restantes
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs">
                        <div className="space-y-1">
                          <p className="font-semibold text-sm mb-2">Variantes em estoque:</p>
                          {produto.variantes && produto.variantes.length > 0 ? (
                            produto.variantes.map((variante: any, idx: number) => (
                              <div key={idx} className="flex justify-between gap-4 text-xs">
                                <span className="font-medium">
                                  {variante.cor} - {variante.tamanho}:
                                </span>
                                <span>{variante.quantidade} un.</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-muted-foreground">Sem variantes cadastradas</p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                ))}
              </div>
            </TooltipProvider>
          </DashboardCard>
        );
      case "caixa-unificado":
        return (
          <DashboardCard id={cardConfig.id}>
            {caixaAberto ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
                      <Wallet className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">Caixa Atual</h3>
                      <p className="text-xs text-muted-foreground">{caixaAberto.codigoCaixa}</p>
                    </div>
                  </div>
                  <Badge className="bg-green-500 hover:bg-green-600 shadow-sm">Aberto</Badge>
                </div>
                
                <div className="p-5 rounded-xl bg-gradient-to-br from-card via-card to-primary/5 border-2 border-primary/20 shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-muted-foreground">Performance do Caixa</p>
                    {caixaAberto.performance >= 0 ? (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <p className={`text-4xl font-bold mb-1 ${
                    caixaAberto.performance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    R$ {caixaAberto.performance?.toFixed(2) || '0.00'}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <ArrowUpDown className="h-3 w-3" />
                    Valor Inicial: R$ {caixaAberto.valorInicial?.toFixed(2) || '0.00'}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-lg bg-gradient-card border border-border hover:shadow-md transition-all">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Entradas</p>
                    <p className="text-xl font-bold text-green-600">
                      R$ {caixaAberto.entrada?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-card border border-border hover:shadow-md transition-all">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Saídas</p>
                    <p className="text-xl font-bold text-red-600">
                      R$ {caixaAberto.saida?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <Wallet className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">Caixa Atual</h3>
                <p className="text-muted-foreground text-sm">Nenhum caixa aberto no momento</p>
              </div>
            )}
          </DashboardCard>
        );
      default:
        return null;
    }
  };

  const statsCards = sortedCards.filter((c) =>
    ["vendas-hoje", "faturamento-diario", "total-clientes", "produtos-estoque", "caixa-unificado", "ticket-medio", "margem-lucro", "crescimento-mensal"].includes(
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
        "caixa-unificado",
        "ticket-medio",
        "margem-lucro",
        "crescimento-mensal",
      ].includes(c.id)
  );

  const limparFiltros = () => {
    setDataInicio(undefined);
    setDataFim(undefined);
  };

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

      {/* Filtros de Data */}
      <Card className="p-4 shadow-card">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Período de análise:</span>
            </div>
          
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataInicio ? format(dataInicio, "dd/MM/yyyy", { locale: ptBR }) : "Data inicial"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataInicio}
                  onSelect={setDataInicio}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            <span className="text-muted-foreground">até</span>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataFim ? format(dataFim, "dd/MM/yyyy", { locale: ptBR }) : "Data final"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataFim}
                  onSelect={setDataFim}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

            {(dataInicio || dataFim) && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-2">
                  Período ativo
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={limparFiltros}
                  className="h-8 gap-1"
                >
                  <X className="h-3 w-3" />
                  Limpar filtros
                </Button>
              </div>
            )}
          </div>
          
          <ComparacaoPeriodoDialog vendas={vendasParaGrafico} />
        </div>
      </Card>

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
