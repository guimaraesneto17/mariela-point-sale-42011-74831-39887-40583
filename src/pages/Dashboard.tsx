import { useState, useEffect, useMemo } from "react";
import { useClientes, useVendas, useProdutos, useEstoque, useVendedores, useContasPagar, useContasReceber, useCaixaAberto } from "@/hooks/useQueryCache";
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
  BarChart3,
  Wallet,
  ArrowUpDown,
  Calendar as CalendarIcon,
  X,
  PackageOpen,
  ShoppingBag,
  Percent,
  AlertCircle,
  Plus,
  Tag,
  RefreshCw,
  Cake,
} from "lucide-react";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { addDays } from "date-fns";
import { clientesAPI, vendasAPI, produtosAPI, estoqueAPI, vendedoresAPI, caixaAPI, contasPagarAPI, contasReceberAPI } from "@/lib/api";
import { toast } from "sonner";
import { formatDateTime, safeDate } from "@/lib/utils";
import { ComparacaoPeriodoDialog } from "@/components/ComparacaoPeriodoDialog";
import { DashboardWidgetCard } from "@/components/DashboardWidgetCard";
import { DashboardWidgetConfig, WidgetConfig } from "@/components/DashboardWidgetConfig";
import { DashboardAlertasCard } from "@/components/DashboardAlertasCard";
import { DashboardClientesAnalise } from "@/components/DashboardClientesAnalise";
import { DashboardVendedoresAnalise } from "@/components/DashboardVendedoresAnalise";
import { CategoriasDistribuicaoCard } from "@/components/CategoriasDistribuicaoCard";
import { MargemLucroCategoriasCard } from "@/components/MargemLucroCategoriasCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { ContentTransition } from "@/components/ContentTransition";
import { useQueryClient } from "@tanstack/react-query";

const Dashboard = () => {
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
    produtosPromocao: 0,
    totalGeralProdutos: 0,
    ticketMedio: 0,
    margemLucro: 0,
    crescimentoMensal: 0,
    valorEstoqueCusto: 0,
    valorEstoqueVenda: 0,
    contasAVencer7Dias: 0,
    contasAReceber7Dias: 0,
  });
  const [statsPeriodoAnterior, setStatsPeriodoAnterior] = useState<any>(null);
  
  const defaultWidgets: WidgetConfig[] = [
    { id: "vendas-hoje", label: "Vendas Hoje", category: "Vendas", visible: true },
    { id: "faturamento-diario", label: "Faturamento Diário", category: "Vendas", visible: true },
    { id: "total-clientes", label: "Total de Clientes", category: "Clientes", visible: true },
    { id: "aniversariantes-mes", label: "Aniversariantes do Mês", category: "Clientes", visible: true },
    { id: "ticket-medio", label: "Ticket Médio", category: "Vendas", visible: true },
    { id: "produtos-estoque", label: "Produtos em Estoque", category: "Estoque", visible: true },
    { id: "produtos-promocao", label: "Produtos em Promoção", category: "Estoque", visible: true },
    { id: "total-geral-produtos", label: "Total Geral (Variantes)", category: "Estoque", visible: true },
    { id: "valor-estoque-custo", label: "Valor Estoque (Custo)", category: "Estoque", visible: true },
    { id: "valor-estoque-venda", label: "Valor Estoque (Venda)", category: "Estoque", visible: true },
    { id: "margem-lucro", label: "Margem de Lucro Real", category: "Financeiro", visible: true },
    { id: "crescimento-mensal", label: "Crescimento Mensal", category: "Financeiro", visible: true },
    { id: "contas-vencer-7dias", label: "Contas a Vencer (7 dias)", category: "Financeiro", visible: true },
    { id: "contas-receber-7dias", label: "Contas a Receber (7 dias)", category: "Financeiro", visible: true },
  ];
  
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig[]>(() => {
    const saved = localStorage.getItem("dashboard-widgets");
    return saved ? JSON.parse(saved) : defaultWidgets;
  });
  
  const [widgetOrder, setWidgetOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem("dashboard-widget-order");
    return saved ? JSON.parse(saved) : defaultWidgets.map(w => w.id);
  });
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [topClientes, setTopClientes] = useState<any[]>([]);
  const [topVendedores, setTopVendedores] = useState<any[]>([]);
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [produtosBaixoEstoque, setProdutosBaixoEstoque] = useState<any[]>([]);
  const [movimentacoesEstoque, setMovimentacoesEstoque] = useState<any[]>([]);
  const [caixaAbertoManual, setCaixaAbertoManual] = useState<any>(null);
  const [vendasPorMes, setVendasPorMes] = useState<any[]>([]);
  const [vendasParaGrafico, setVendasParaGrafico] = useState<any[]>([]);
  const [data, setData] = useState<any>(null);
  const [estoque, setEstoque] = useState<any[]>([]);

  // Fetch data with React Query
  const queryClient = useQueryClient();
  const { data: clientesData = [], isLoading: isLoadingClientes, refetch: refetchClientes } = useClientes();
  const { data: vendasData = [], isLoading: isLoadingVendas, refetch: refetchVendas } = useVendas();
  const { data: produtosData = [], isLoading: isLoadingProdutos, refetch: refetchProdutos } = useProdutos();
  const { data: estoqueData = [], isLoading: isLoadingEstoque, refetch: refetchEstoque } = useEstoque();
  const { data: vendedoresData = [], isLoading: isLoadingVendedores, refetch: refetchVendedores } = useVendedores();
  const { data: contasPagarData = [], isLoading: isLoadingContasPagar, refetch: refetchContasPagar } = useContasPagar();
  const { data: contasReceberData = [], isLoading: isLoadingContasReceber, refetch: refetchContasReceber } = useContasReceber();
  const { data: caixaAbertoData, isLoading: isLoadingCaixa, refetch: refetchCaixaAberto } = useCaixaAberto();

  // Usar dados do React Query para o caixa
  const caixaAberto = caixaAbertoData || caixaAbertoManual;

  const loading = isLoadingClientes || isLoadingVendas || isLoadingProdutos || isLoadingEstoque || isLoadingVendedores || isLoadingContasPagar || isLoadingContasReceber || isLoadingCaixa;
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calcular aniversariantes do mês
  const aniversariantesMes = useMemo(() => {
    const mesAtual = new Date().getMonth();
    return clientesData.filter((cliente: any) => {
      if (!cliente.dataNascimento) return false;
      const dataNasc = new Date(cliente.dataNascimento);
      return dataNasc.getMonth() === mesAtual;
    });
  }, [clientesData]);

  // Função para recarregar todos os dados
  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    toast.loading("Recarregando dados...");
    
    try {
      await Promise.all([
        refetchClientes(),
        refetchVendas(),
        refetchProdutos(),
        refetchEstoque(),
        refetchVendedores(),
        refetchContasPagar(),
        refetchContasReceber(),
        refetchCaixaAberto(),
      ]);
      
      // Reprocessar dados após recarregar
      await processarDados();
      
      toast.dismiss();
      toast.success("Dados atualizados com sucesso!");
    } catch (error) {
      toast.dismiss();
      toast.error("Erro ao atualizar dados");
      console.error(error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      processarDados();
    }
  }, [dataInicio, dataFim, loading, clientesData, vendasData, produtosData, estoqueData, vendedoresData, contasPagarData, contasReceberData]);

  const processarDados = async () => {
    try {
      // Process data from React Query - data is already normalized to arrays
      const clientes = Array.isArray(clientesData) ? clientesData : [];
      const produtos = Array.isArray(produtosData) ? produtosData : [];
      const estoqueItems = Array.isArray(estoqueData) ? estoqueData : [];
      const vendedoresList = Array.isArray(vendedoresData) ? vendedoresData : [];
      const vendasAll = Array.isArray(vendasData) ? vendasData : [];
      const contasPagar = Array.isArray(contasPagarData) ? contasPagarData : [];
      const contasReceber = Array.isArray(contasReceberData) ? contasReceberData : [];

      // Store data for child components
      setData({ clientes, produtos });
      setEstoque(estoqueItems);
      setVendedores(vendedoresList);

      // Filter sales by date range
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

      // Caixa aberto agora é gerenciado pelo React Query (useCaixaAberto)

      // Coletar todas as movimentações de todos os itens do estoque
      const todasMovimentacoes: any[] = [];
      estoqueItems.forEach((item: any) => {
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
      setMovimentacoesEstoque(todasMovimentacoes);

      // Calcular estatísticas do período atual
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      const vendasHoje = vendas.filter((v: any) => {
        const vendaData = safeDate(v.data || v.dataVenda);
        if (!vendaData) return false;
        vendaData.setHours(0, 0, 0, 0);
        return vendaData.getTime() === hoje.getTime();
      });
      
      // Calcular período anterior para comparação
      const calcularPeriodoAnterior = () => {
        const dataInicioAtual = dataInicio || hoje;
        const dataFimAtual = dataFim || hoje;
        
        const diffDias = Math.ceil((dataFimAtual.getTime() - dataInicioAtual.getTime()) / (1000 * 60 * 60 * 24));
        
        const dataInicioAnterior = new Date(dataInicioAtual);
        dataInicioAnterior.setDate(dataInicioAnterior.getDate() - diffDias - 1);
        
        const dataFimAnterior = new Date(dataInicioAtual);
        dataFimAnterior.setDate(dataFimAnterior.getDate() - 1);
        
        return { dataInicioAnterior, dataFimAnterior, diffDias };
      };
      
      const { dataInicioAnterior, dataFimAnterior } = calcularPeriodoAnterior();
      
      // Filtrar vendas do período anterior
      const vendasPeriodoAnterior = vendasAll.filter((v: any) => {
        const vendaData = safeDate(v.data || v.dataVenda);
        if (!vendaData) return false;
        
        const inicio = new Date(dataInicioAnterior);
        const fim = new Date(dataFimAnterior);
        inicio.setHours(0, 0, 0, 0);
        fim.setHours(23, 59, 59, 999);
        return vendaData >= inicio && vendaData <= fim;
      });

      const faturamentoDiario = vendasHoje.reduce((acc: number, v: any) => acc + (v.total || 0), 0);
      const totalClientes = clientes.length;
      // Quantidade de produtos cadastrados em estoque (mesma lógica do badge de estoque)
      const produtosEstoque = estoqueItems.length;
      
      // Calcular produtos em promoção
      const produtosPromocao = estoqueItems.filter((item: any) => item.emPromocao === true).length;
      
      // Calcular Total Geral (todas as variantes)
      const totalGeralProdutos = estoqueItems.reduce((acc: number, item: any) => {
        if (item.variantes && Array.isArray(item.variantes)) {
          return acc + item.variantes.reduce((sum: number, v: any) => sum + (v.quantidade || 0), 0);
        }
        return acc + (item.quantidadeTotal || 0);
      }, 0);
      
      // Calcular valor total do estoque (considerando preço promocional quando disponível)
      let valorEstoqueCusto = 0;
      let valorEstoqueVenda = 0;
      
      estoqueItems.forEach((item: any) => {
        const quantidade = item.quantidadeTotal || 0;
        const precoCusto = item.precoCusto || 0;
        // Usar preço promocional se disponível e menor que o preço de venda
        const precoVenda = (item.precoPromocional && item.precoPromocional < item.precoVenda) 
          ? item.precoPromocional 
          : item.precoVenda || 0;
        
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

      // Calcular contas a vencer e a receber nos próximos 7 dias (APENAS PENDENTES)
      const dataHoje = new Date();
      dataHoje.setHours(0, 0, 0, 0); // Zerar horas para comparação correta
      const daquiA7Dias = addDays(dataHoje, 7);
      
      // Filtrar apenas contas PENDENTES (não pagas) a vencer nos próximos 7 dias
      const contasAVencer = contasPagar.filter((conta: any) => {
        const statusLower = (conta.status || '').toLowerCase();
        if (statusLower === 'pago' || statusLower === 'paga') return false;
        const dataVencimento = new Date(conta.dataVencimento);
        dataVencimento.setHours(0, 0, 0, 0);
        return dataVencimento >= dataHoje && dataVencimento <= daquiA7Dias;
      });
      
      // Filtrar apenas contas PENDENTES (não recebidas) a receber nos próximos 7 dias
      const contasAReceber = contasReceber.filter((conta: any) => {
        const statusLower = (conta.status || '').toLowerCase();
        if (statusLower === 'recebido' || statusLower === 'recebida') return false;
        const dataVencimento = new Date(conta.dataVencimento);
        dataVencimento.setHours(0, 0, 0, 0);
        return dataVencimento >= dataHoje && dataVencimento <= daquiA7Dias;
      });

      // Calcular APENAS o valor das contas PENDENTES
      const valorContasAVencer = contasAVencer.reduce((acc: number, c: any) => acc + (c.valor || 0), 0);
      const valorContasAReceber = contasAReceber.reduce((acc: number, c: any) => acc + (c.valor || 0), 0);

      // Calcular estatísticas do período anterior
      const faturamentoPeriodoAnterior = vendasPeriodoAnterior.reduce((acc: number, v: any) => acc + (v.total || 0), 0);
      const ticketMedioPeriodoAnterior = vendasPeriodoAnterior.length > 0 
        ? faturamentoPeriodoAnterior / vendasPeriodoAnterior.length 
        : 0;
      
      setStatsPeriodoAnterior({
        vendasTotal: vendasPeriodoAnterior.length,
        faturamento: faturamentoPeriodoAnterior,
        ticketMedio: ticketMedioPeriodoAnterior,
      });

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
        produtosPromocao,
        totalGeralProdutos, // Total de todas as variantes
        ticketMedio: vendas.length > 0 ? vendas.reduce((acc: number, v: any) => acc + (v.total || 0), 0) / vendas.length : 0,
        margemLucro,
        crescimentoMensal,
        valorEstoqueCusto,
        valorEstoqueVenda,
        contasAVencer7Dias: valorContasAVencer,
        contasAReceber7Dias: valorContasAReceber,
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
      const produtosBaixo = estoqueItems
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
    }
  };

  const limparFiltros = () => {
    setDataInicio(undefined);
    setDataFim(undefined);
  };

  const handleWidgetConfigSave = (newConfig: WidgetConfig[]) => {
    setWidgetConfig(newConfig);
    localStorage.setItem("dashboard-widgets", JSON.stringify(newConfig));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setWidgetOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        localStorage.setItem("dashboard-widget-order", JSON.stringify(newOrder));
        return newOrder;
      });
    }
  };

  const calcularComparacao = (valorAtual: number, valorAnterior: number) => {
    if (!statsPeriodoAnterior || valorAnterior === 0) return null;
    const percentual = ((valorAtual - valorAnterior) / valorAnterior) * 100;
    return {
      percentage: percentual,
      label: "vs período anterior",
    };
  };

  const visibleWidgets = useMemo(() => {
    return widgetOrder
      .filter(id => widgetConfig.find(w => w.id === id)?.visible)
      .map(id => widgetConfig.find(w => w.id === id)!)
      .filter(Boolean);
  }, [widgetOrder, widgetConfig]);

  const renderWidget = (widget: WidgetConfig) => {
    const widgets: Record<string, any> = {
      "vendas-hoje": (
        <DashboardWidgetCard
          id={widget.id}
          title="Vendas Hoje"
          value={stats.vendasHoje}
          icon={<ShoppingCart className="h-5 w-5 text-primary" />}
          iconBgColor="bg-primary/10"
          comparison={calcularComparacao(stats.vendasHoje, statsPeriodoAnterior?.vendasTotal || 0)}
        />
      ),
      "faturamento-diario": (
        <DashboardWidgetCard
          id={widget.id}
          title="Faturamento Diário"
          value={`R$ ${stats.faturamentoDiario.toFixed(2)}`}
          icon={<DollarSign className="h-5 w-5 text-green-600" />}
          iconBgColor="bg-green-500/10"
          valueColor="text-green-600"
          comparison={calcularComparacao(stats.faturamentoDiario, statsPeriodoAnterior?.faturamento || 0)}
        />
      ),
      "total-clientes": (
        <DashboardWidgetCard
          id={widget.id}
          title="Total de Clientes"
          value={stats.totalClientes}
          icon={<Users className="h-5 w-5 text-blue-600" />}
          iconBgColor="bg-blue-500/10"
        />
      ),
      "aniversariantes-mes": (
        <DashboardWidgetCard
          id={widget.id}
          title="Aniversariantes do Mês"
          value={aniversariantesMes.length}
          subtitle="Clientes aniversariantes"
          icon={<Cake className="h-5 w-5 text-pink-600" />}
          iconBgColor="bg-pink-500/10"
          valueColor="text-pink-600"
        />
      ),
      "ticket-medio": (
        <DashboardWidgetCard
          id={widget.id}
          title="Ticket Médio"
          value={`R$ ${stats.ticketMedio.toFixed(2)}`}
          icon={<Wallet className="h-5 w-5 text-purple-600" />}
          iconBgColor="bg-purple-500/10"
          comparison={calcularComparacao(stats.ticketMedio, statsPeriodoAnterior?.ticketMedio || 0)}
        />
      ),
      "produtos-estoque": (
        <DashboardWidgetCard
          id={widget.id}
          title="Produtos em Estoque"
          value={stats.produtosEstoque}
          icon={<Package className="h-5 w-5 text-orange-600" />}
          iconBgColor="bg-orange-500/10"
        />
      ),
      "total-geral-produtos": (
        <DashboardWidgetCard
          id={widget.id}
          title="Total Geral (Variantes)"
          value={stats.totalGeralProdutos}
          subtitle="Todas as variantes"
          icon={<Package className="h-5 w-5 text-blue-600" />}
          iconBgColor="bg-blue-500/10"
          valueColor="text-blue-600"
        />
      ),
      "valor-estoque-custo": (
        <DashboardWidgetCard
          id={widget.id}
          title="Valor Estoque (Custo)"
          value={`R$ ${stats.valorEstoqueCusto.toFixed(2)}`}
          subtitle="Total investido em estoque"
          icon={<PackageOpen className="h-5 w-5 text-amber-600" />}
          iconBgColor="bg-amber-500/10"
          valueColor="text-amber-600"
        />
      ),
      "valor-estoque-venda": (
        <DashboardWidgetCard
          id={widget.id}
          title="Valor Estoque (Venda)"
          value={`R$ ${stats.valorEstoqueVenda.toFixed(2)}`}
          subtitle="Valor potencial de venda"
          icon={<ShoppingBag className="h-5 w-5 text-emerald-600" />}
          iconBgColor="bg-emerald-500/10"
          valueColor="text-emerald-600"
        />
      ),
      "produtos-promocao": (
        <DashboardWidgetCard
          id={widget.id}
          title="Produtos em Promoção"
          value={stats.produtosPromocao}
          subtitle="Produtos com desconto ativo"
          icon={<Tag className="h-5 w-5 text-red-600" />}
          iconBgColor="bg-red-500/10"
          valueColor="text-red-600"
        />
      ),
      "margem-lucro": (
        <DashboardWidgetCard
          id={widget.id}
          title="Margem de Lucro Real"
          value={`${stats.margemLucro.toFixed(1)}%`}
          subtitle="Baseado no estoque atual"
          icon={<Percent className="h-5 w-5 text-primary" />}
          iconBgColor="bg-primary/10"
          valueColor="text-primary"
        />
      ),
      "crescimento-mensal": (
        <DashboardWidgetCard
          id={widget.id}
          title="Crescimento Mensal"
          value={`${stats.crescimentoMensal >= 0 ? '+' : ''}${stats.crescimentoMensal.toFixed(1)}%`}
          icon={<ArrowUpDown className="h-5 w-5 text-accent" />}
          iconBgColor="bg-accent/10"
          valueColor={stats.crescimentoMensal >= 0 ? "text-green-600" : "text-red-600"}
        />
      ),
      "contas-vencer-7dias": (
        <DashboardWidgetCard
          id={widget.id}
          title="Contas a Vencer"
          subtitle="Próximos 7 dias"
          value={`R$ ${stats.contasAVencer7Dias.toFixed(2)}`}
          icon={<TrendingDown className="h-5 w-5 text-red-600" />}
          iconBgColor="bg-red-500/10"
          valueColor="text-red-600"
        />
      ),
      "contas-receber-7dias": (
        <DashboardWidgetCard
          id={widget.id}
          title="Contas a Receber"
          subtitle="Próximos 7 dias"
          value={`R$ ${stats.contasAReceber7Dias.toFixed(2)}`}
          icon={<TrendingUp className="h-5 w-5 text-green-600" />}
          iconBgColor="bg-green-500/10"
          valueColor="text-green-600"
        />
      ),
    };

    return widgets[widget.id] || null;
  };

  const isInitialLoading = loading && !stats.totalClientes;

  return (
    <ContentTransition 
      isLoading={isInitialLoading} 
      skeleton={<DashboardSkeleton />}
    >
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Visão geral do seu negócio em tempo real
          </p>
        </div>
        <Button
          onClick={handleRefreshAll}
          disabled={isRefreshing}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Atualizando...' : 'Atualizar Dados'}
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

      {/* Card Único Resumido */}
      <Card className="p-8 shadow-card animate-fade-in hover-lift transition-smooth bg-gradient-to-br from-card via-card to-primary/5">
        <div className="space-y-8">
          {/* Header do Card */}
          <div className="flex items-center justify-between pb-4 border-b border-border flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                <BarChart3 className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Resumo do Negócio</h2>
                <p className="text-sm text-muted-foreground">Principais métricas em tempo real</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DashboardWidgetConfig
                widgets={widgetConfig}
                onSave={handleWidgetConfigSave}
              />
              {caixaAberto ? (
                <Badge className="bg-green-500 hover:bg-green-600 shadow-sm text-base px-4 py-2">
                  <Wallet className="h-4 w-4 mr-2" />
                  Caixa {caixaAberto.codigoCaixa} - Aberto
                </Badge>
              ) : (
                <Badge className="bg-orange-500 hover:bg-orange-600 shadow-sm text-base px-4 py-2">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Sem Caixa Aberto
                </Badge>
              )}
            </div>
          </div>

          {/* Grid de Widgets Personalizáveis */}
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={visibleWidgets.map(w => w.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {visibleWidgets.map((widget, index) => (
                  <motion.div 
                    key={widget.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                      duration: 0.4, 
                      delay: index * 0.08,
                      ease: [0.25, 0.46, 0.45, 0.94]
                    }}
                  >
                    {renderWidget(widget)}
                  </motion.div>
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Caixa e Performance - Destaque */}
          {caixaAberto ? (
            <div className="p-6 rounded-xl bg-gradient-to-br from-primary/5 via-background to-accent/5 border-2 border-primary/20 shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-1">Performance do Caixa</h3>
                  <p className="text-xs text-muted-foreground">
                    Aberto em {format(new Date(caixaAberto.dataAbertura), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                {caixaAberto.performance >= 0 ? (
                  <TrendingUp className="h-6 w-6 text-green-600" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-600" />
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                <div className="text-center p-3 md:p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Valor Inicial</p>
                  <p className="text-lg md:text-xl font-bold text-blue-600">
                    R$ {caixaAberto.valorInicial?.toFixed(2) || '0.00'}
                  </p>
                </div>
                
                <div className="text-center p-3 md:p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Entradas</p>
                  <p className="text-xl font-bold text-green-600">
                    R$ {caixaAberto.entrada?.toFixed(2) || '0.00'}
                  </p>
                </div>
                
                <div className="text-center p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Saídas</p>
                  <p className="text-xl font-bold text-red-600">
                    R$ {caixaAberto.saida?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Saldo Atual</p>
                  <p className={`text-3xl font-bold ${
                    caixaAberto.performance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    R$ {caixaAberto.performance?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-gradient-to-br from-orange-50/50 via-background to-orange-100/20 dark:from-orange-950/20 dark:via-background dark:to-orange-900/10 border-2 border-orange-500/30 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-orange-500/10 rounded-xl">
                  <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-orange-900 dark:text-orange-100">Nenhum Caixa Aberto</h3>
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    Para utilizar o sistema de vendas é necessário abrir o caixa antes
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => window.location.href = '/caixa'} 
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Abrir Caixa Agora
              </Button>
            </div>
          )}

          {/* Alertas de Estoque Parado */}
          <DashboardAlertasCard />


          {/* Top 3 Informações */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Top Produtos */}
            <div className="p-5 rounded-xl bg-gradient-card border border-border">
              <div className="flex items-center gap-2 mb-4">
                <Award className="h-5 w-5 text-primary" />
                <h3 className="text-base font-bold text-foreground">Top 3 Produtos</h3>
              </div>
              <div className="space-y-3">
                {topProducts.slice(0, 3).map((product, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-yellow-500/20 text-yellow-600' :
                        index === 1 ? 'bg-gray-400/20 text-gray-600' :
                        'bg-orange-600/20 text-orange-600'
                      }`}>
                        {index + 1}
                      </div>
                      <p className="text-sm font-medium text-foreground truncate">{product.nome}</p>
                    </div>
                    <p className="text-sm font-bold text-primary">R$ {product.valor.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Clientes */}
            <div className="p-5 rounded-xl bg-gradient-card border border-border">
              <div className="flex items-center gap-2 mb-4">
                <Crown className="h-5 w-5 text-blue-600" />
                <h3 className="text-base font-bold text-foreground">Top 3 Clientes</h3>
              </div>
              <div className="space-y-3">
                {topClientes.slice(0, 3).map((cliente, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-yellow-500/20 text-yellow-600' :
                        index === 1 ? 'bg-gray-400/20 text-gray-600' :
                        'bg-orange-600/20 text-orange-600'
                      }`}>
                        {index + 1}
                      </div>
                      <p className="text-sm font-medium text-foreground truncate">{cliente.nome}</p>
                    </div>
                    <p className="text-sm font-bold text-blue-600">R$ {cliente.valorTotal.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Vendedores */}
            <div className="p-5 rounded-xl bg-gradient-card border border-border">
              <div className="flex items-center gap-2 mb-4">
                <UserCheck className="h-5 w-5 text-green-600" />
                <h3 className="text-base font-bold text-foreground">Top 3 Vendedores</h3>
              </div>
              <div className="space-y-3">
                {topVendedores.slice(0, 3).map((vendedor, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-yellow-500/20 text-yellow-600' :
                        index === 1 ? 'bg-gray-400/20 text-gray-600' :
                        'bg-orange-600/20 text-orange-600'
                      }`}>
                        {index + 1}
                      </div>
                      <p className="text-sm font-medium text-foreground truncate">{vendedor.nome}</p>
                    </div>
                    <p className="text-sm font-bold text-green-600">R$ {vendedor.valorTotal.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Análise Avançada */}
          <div className="mt-8">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto">
                <TabsTrigger value="overview" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Visão Geral
                </TabsTrigger>
                <TabsTrigger value="categorias" className="gap-2">
                  <Package className="h-4 w-4" />
                  Categorias
                </TabsTrigger>
                <TabsTrigger value="clientes" className="gap-2">
                  <Users className="h-4 w-4" />
                  Análise de Clientes
                </TabsTrigger>
                <TabsTrigger value="vendedores" className="gap-2">
                  <UserCheck className="h-4 w-4" />
                  Análise de Vendedores
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-0">
                {/* Conteúdo já existente está acima */}
              </TabsContent>

              <TabsContent value="categorias" className="space-y-6">
                <CategoriasDistribuicaoCard 
                  produtos={produtos}
                  estoque={estoque}
                />
                <MargemLucroCategoriasCard 
                  produtos={produtos}
                  estoque={estoque}
                  vendas={vendasParaGrafico}
                />
              </TabsContent>

              <TabsContent value="clientes">
                <DashboardClientesAnalise 
                  vendas={vendasParaGrafico}
                  clientes={data?.clientes || []}
                  produtos={produtos}
                />
              </TabsContent>

              <TabsContent value="vendedores">
                <DashboardVendedoresAnalise 
                  vendas={vendasParaGrafico}
                  vendedores={vendedores}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </Card>

    </div>
    </ContentTransition>
  );
};

export default Dashboard;
