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
  BarChart3,
  Wallet,
  ArrowUpDown,
  Calendar as CalendarIcon,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { clientesAPI, vendasAPI, produtosAPI, estoqueAPI, vendedoresAPI, caixaAPI } from "@/lib/api";
import { toast } from "sonner";
import { formatDateTime, safeDate } from "@/lib/utils";
import { ComparacaoPeriodoDialog } from "@/components/ComparacaoPeriodoDialog";

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

  useEffect(() => {
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
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                <BarChart3 className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Resumo do Negócio</h2>
                <p className="text-sm text-muted-foreground">Principais métricas em tempo real</p>
              </div>
            </div>
            {caixaAberto && (
              <Badge className="bg-green-500 hover:bg-green-600 shadow-sm text-base px-4 py-2">
                <Wallet className="h-4 w-4 mr-2" />
                Caixa {caixaAberto.codigoCaixa} - Aberto
              </Badge>
            )}
          </div>

          {/* Grid de Métricas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Vendas Hoje */}
            <div className="p-5 rounded-xl bg-gradient-card border border-border hover:shadow-md transition-smooth">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground mb-1">{stats.vendasHoje}</p>
              <p className="text-sm text-muted-foreground">Vendas Hoje</p>
            </div>

            {/* Faturamento Diário */}
            <div className="p-5 rounded-xl bg-gradient-card border border-border hover:shadow-md transition-smooth">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-green-600 mb-1">
                R$ {stats.faturamentoDiario.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">Faturamento Diário</p>
            </div>

            {/* Total Clientes */}
            <div className="p-5 rounded-xl bg-gradient-card border border-border hover:shadow-md transition-smooth">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground mb-1">{stats.totalClientes}</p>
              <p className="text-sm text-muted-foreground">Total de Clientes</p>
            </div>

            {/* Ticket Médio */}
            <div className="p-5 rounded-xl bg-gradient-card border border-border hover:shadow-md transition-smooth">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Wallet className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground mb-1">
                R$ {stats.ticketMedio.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">Ticket Médio</p>
            </div>
          </div>

          {/* Caixa e Performance - Destaque */}
          {caixaAberto && (
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
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Valor Inicial</p>
                  <p className="text-xl font-bold text-blue-600">
                    R$ {caixaAberto.valorInicial?.toFixed(2) || '0.00'}
                  </p>
                </div>
                
                <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/20">
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
          )}

          {/* Estoque e Margem */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl bg-gradient-card border border-border hover:shadow-md transition-smooth">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-orange-600" />
                  <p className="text-sm font-medium text-muted-foreground">Produtos em Estoque</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.produtosEstoque}</p>
            </div>

            <div className="p-5 rounded-xl bg-gradient-card border border-border hover:shadow-md transition-smooth">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <p className="text-sm font-medium text-muted-foreground">Margem de Lucro</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-primary">{stats.margemLucro.toFixed(1)}%</p>
            </div>

            <div className="p-5 rounded-xl bg-gradient-card border border-border hover:shadow-md transition-smooth">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-5 w-5 text-accent" />
                  <p className="text-sm font-medium text-muted-foreground">Crescimento Mensal</p>
                </div>
              </div>
              <p className={`text-2xl font-bold ${stats.crescimentoMensal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.crescimentoMensal >= 0 ? '+' : ''}{stats.crescimentoMensal.toFixed(1)}%
              </p>
            </div>
          </div>

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
        </div>
      </Card>

    </div>
  );
};

export default Dashboard;
