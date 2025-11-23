import { useState, useEffect } from "react";
import { FileText, Calendar, Filter, Download, TrendingUp, TrendingDown, Package, Users, DollarSign, ShoppingBag, Sparkles, Tag, Crown, UserCheck, Wallet, BarChart3, Boxes, Gift, MessageSquare, Send, Calendar as CalendarDays, Bell, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { vendasAPI, produtosAPI, clientesAPI, vendedoresAPI, estoqueAPI, caixaAPI, contasPagarAPI, contasReceberAPI } from "@/lib/api";
import { ComparacaoPeriodoDialog } from "@/components/ComparacaoPeriodoDialog";
import { VendasPorCategoriaCard } from "@/components/VendasPorCategoriaCard";
import { VendasEvolutionChart } from "@/components/VendasEvolutionChart";
import { MargemLucroCard } from "@/components/MargemLucroCard";
import { DashboardMovimentacoes } from "@/components/DashboardMovimentacoes";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line, Area, AreaChart } from "recharts";
import { GlobalLoading } from "@/components/GlobalLoading";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

const Relatorios = () => {
  const [dataInicioVendas, setDataInicioVendas] = useState("");
  const [dataFimVendas, setDataFimVendas] = useState("");
  const [periodoVendas, setPeriodoVendas] = useState("todos");
  const [dataInicioProdutos, setDataInicioProdutos] = useState("");
  const [dataFimProdutos, setDataFimProdutos] = useState("");
  const [periodoProdutos, setPeriodoProdutos] = useState("todos");
  const [dataInicioCaixa, setDataInicioCaixa] = useState("");
  const [dataFimCaixa, setDataFimCaixa] = useState("");
  const [periodoCaixa, setPeriodoCaixa] = useState("todos");
  const [dataInicioFinanceiro, setDataInicioFinanceiro] = useState("");
  const [dataFimFinanceiro, setDataFimFinanceiro] = useState("");
  const [periodoFinanceiro, setPeriodoFinanceiro] = useState("todos");
  
  const [loading, setLoading] = useState(true);
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [relatorioVendas, setRelatorioVendas] = useState<any>({
    totalVendas: 0,
    faturamentoTotal: 0,
    ticketMedio: 0,
    vendasPorCategoria: [],
    vendasPorMes: [],
    vendasOriginais: [],
  });
  const [relatorioProdutos, setRelatorioProdutos] = useState<any>({
    totalProdutos: 0,
    emEstoque: 0,
    novidades: 0,
    emPromocao: 0,
    valorEstoqueCusto: 0,
    valorEstoqueVenda: 0,
    produtosMaisVendidos: [],
    estoqueMinimo: [],
  });
  const [relatorioClientes, setRelatorioClientes] = useState<any>({
    totalClientes: 0,
    clientesAtivos: 0,
    clientesNovos: 0,
    topClientes: [],
    aniversariantes: [],
  });
  const [relatorioVendedores, setRelatorioVendedores] = useState<any>({
    totalVendedores: 0,
    topVendedores: [],
  });
  const [relatorioCaixa, setRelatorioCaixa] = useState<any>({
    totalCaixas: 0,
    caixasAbertos: 0,
    caixasFechados: 0,
    totalEntradas: 0,
    totalSaidas: 0,
    performanceTotal: 0,
    ultimosCaixas: [],
  });
  const [estoque, setEstoque] = useState<any[]>([]);
  const [relatorioEstoque, setRelatorioEstoque] = useState<any>({
    porCategoria: [],
    porCor: [],
    porTamanho: [],
    totalItens: 0,
    valorTotal: 0,
  });
  const [relatorioFinanceiro, setRelatorioFinanceiro] = useState<any>({
    totalReceber: 0,
    totalPagar: 0,
    saldoRealizado: 0,
    saldoPrevisto: 0,
    fluxoPorMes: [],
    evolucaoContas: [],
    topFornecedores: [],
    topClientes: [],
    contasPagar: [],
    contasReceber: [],
    topCategoriasPagar: [],
    topCategoriasReceber: [],
    proximosVencimentosPagar: [],
    proximosVencimentosReceber: [],
  });

  useEffect(() => {
    loadRelatorios();
  }, [periodoVendas, dataInicioVendas, dataFimVendas, periodoProdutos, dataInicioProdutos, dataFimProdutos, periodoCaixa, dataInicioCaixa, dataFimCaixa, periodoFinanceiro, dataInicioFinanceiro, dataFimFinanceiro]);

  // Função auxiliar para filtrar dados por período
  const filtrarPorPeriodo = (data: Date, dataInicio: string, dataFim: string, periodo: string) => {
    const hoje = new Date();
    
    // Se há datas personalizadas, usa elas
    if (dataInicio && dataFim) {
      const inicio = new Date(dataInicio);
      const fim = new Date(dataFim);
      fim.setHours(23, 59, 59, 999); // Inclui o dia todo
      return data >= inicio && data <= fim;
    }
    
    // Caso contrário, usa o período predefinido
    if (periodo === "todos") return true;
    
    const diasAtras = periodo === "7" ? 7 : periodo === "30" ? 30 : periodo === "90" ? 90 : 365;
    const dataLimite = new Date();
    dataLimite.setDate(hoje.getDate() - diasAtras);
    
    return data >= dataLimite;
  };

  const loadRelatorios = async () => {
    try {
      setLoading(true);
      const [vendas, produtos, clientes, vendedoresList, estoqueData, caixas] = await Promise.all([
        vendasAPI.getAll(),
        produtosAPI.getAll(),
        clientesAPI.getAll(),
        vendedoresAPI.getAll(),
        estoqueAPI.getAll(),
        caixaAPI.getAll(),
      ]);

      setVendedores(vendedoresList);
      setEstoque(estoqueData);

      // Relatório de Vendas com filtros de período
      const vendasFiltradas = vendas.filter((venda: any) => {
        const dataVenda = new Date(venda.data || venda.dataVenda);
        return filtrarPorPeriodo(dataVenda, dataInicioVendas, dataFimVendas, periodoVendas);
      });

      const vendasPorCategoria: any = {};
      vendasFiltradas.forEach((venda: any) => {
        venda.itens?.forEach((item: any) => {
          const produto = produtos.find((p: any) => p.codigoProduto === item.codigoProduto);
          const categoria = produto?.categoria || 'Outro';
          if (!vendasPorCategoria[categoria]) {
            vendasPorCategoria[categoria] = { categoria, vendas: 0, valor: 0 };
          }
          vendasPorCategoria[categoria].vendas += item.quantidade;
          vendasPorCategoria[categoria].valor += item.subtotal;
        });
      });

      const vendasPorMes: any = {};
      vendasFiltradas.forEach((venda: any) => {
        const data = new Date(venda.data || venda.dataVenda);
        const mesAno = `${data.toLocaleString('pt-BR', { month: 'long' })} ${data.getFullYear()}`;
        if (!vendasPorMes[mesAno]) {
          vendasPorMes[mesAno] = { mes: mesAno, vendas: 0, valor: 0 };
        }
        vendasPorMes[mesAno].vendas += 1;
        vendasPorMes[mesAno].valor += venda.total || 0;
      });

      const totalVendas = vendasFiltradas.length;
      const faturamentoTotal = vendasFiltradas.reduce((acc: number, v: any) => acc + (v.total || 0), 0);
      const ticketMedio = totalVendas > 0 ? faturamentoTotal / totalVendas : 0;

      setRelatorioVendas({
        totalVendas,
        faturamentoTotal,
        ticketMedio,
        vendasPorCategoria: Object.values(vendasPorCategoria),
        vendasPorMes: Object.values(vendasPorMes).slice(-3),
        vendasOriginais: vendasFiltradas,
      });

      // Relatório de Produtos com filtros de período
      const produtosVendidosFiltrados = vendasFiltradas;
      const totalProdutos = produtos.length;
      const emEstoque = estoqueData.reduce((acc: number, item: any) => acc + (item.quantidadeTotal || 0), 0);
      const novidades = estoqueData.filter((item: any) => item.isNovidade === true).length;
      const emPromocao = estoqueData.filter((item: any) => item.emPromocao === true).length;

      let valorEstoqueCusto = 0;
      let valorEstoqueVenda = 0;
      
      estoqueData.forEach((item: any) => {
        const quantidade = item.quantidadeTotal || 0;
        const precoCusto = item.precoCusto || 0;
        const precoVenda = item.precoVenda || item.precoPromocional || 0;
        
        valorEstoqueCusto += quantidade * precoCusto;
        valorEstoqueVenda += quantidade * precoVenda;
      });

      const produtosVendidos: any = {};
      produtosVendidosFiltrados.forEach((venda: any) => {
        venda.itens?.forEach((item: any) => {
          if (!produtosVendidos[item.codigoProduto]) {
            produtosVendidos[item.codigoProduto] = {
              produto: item.nomeProduto,
              vendas: 0,
              valor: 0,
              estoque: 0
            };
          }
          produtosVendidos[item.codigoProduto].vendas += item.quantidade;
          produtosVendidos[item.codigoProduto].valor += item.subtotal;
        });
      });

      Object.keys(produtosVendidos).forEach(codigo => {
        const itemEstoque = estoqueData.find((e: any) => e.codigoProduto === codigo);
        produtosVendidos[codigo].estoque = itemEstoque?.quantidadeTotal || 0;
      });

      const topProdutos = Object.values(produtosVendidos)
        .sort((a: any, b: any) => b.vendas - a.vendas)
        .slice(0, 5);

      setRelatorioProdutos({
        totalProdutos,
        emEstoque,
        novidades,
        emPromocao,
        valorEstoqueCusto,
        valorEstoqueVenda,
        produtosMaisVendidos: topProdutos,
        estoqueMinimo: estoqueData
          .filter((item: any) => (item.quantidadeTotal || 0) < 10)
          .map((item: any) => ({
            produto: item.nomeProduto || item.nome,
            estoque: item.quantidadeTotal || 0,
            minimo: 10
          }))
          .slice(0, 5),
      });

      // Relatório de Clientes - Adicionar aniversariantes do mês
      const totalClientes = clientes.length;
      const clientesCompras: any = {};
      
      vendas.forEach((venda: any) => {
        const codigoCliente = venda.cliente?.codigoCliente;
        if (!clientesCompras[codigoCliente]) {
          clientesCompras[codigoCliente] = {
            nome: venda.cliente?.nome,
            compras: 0,
            valorTotal: 0
          };
        }
        clientesCompras[codigoCliente].compras += 1;
        clientesCompras[codigoCliente].valorTotal += venda.total || 0;
      });

      const topClientesArray = Object.values(clientesCompras)
        .map((c: any) => ({
          ...c,
          ticketMedio: c.compras > 0 ? c.valorTotal / c.compras : 0
        }))
        .sort((a: any, b: any) => b.valorTotal - a.valorTotal)
        .slice(0, 5);

      const mesAtual = new Date().getMonth();
      const anoAtual = new Date().getFullYear();
      const clientesNovos = clientes.filter((c: any) => {
        const dataCadastro = new Date(c.dataCadastro);
        return dataCadastro.getMonth() === mesAtual && dataCadastro.getFullYear() === anoAtual;
      }).length;

      // Aniversariantes do mês
      const aniversariantes = clientes.filter((c: any) => {
        if (!c.dataNascimento) return false;
        const dataNasc = new Date(c.dataNascimento);
        return dataNasc.getMonth() === mesAtual;
      }).map((c: any) => ({
        nome: c.nome,
        telefone: c.telefone,
        dataNascimento: c.dataNascimento,
        codigoCliente: c.codigoCliente
      })).sort((a: any, b: any) => {
        const diaA = new Date(a.dataNascimento).getDate();
        const diaB = new Date(b.dataNascimento).getDate();
        return diaA - diaB;
      });

      setRelatorioClientes({
        totalClientes,
        clientesAtivos: Object.keys(clientesCompras).length,
        clientesNovos,
        topClientes: topClientesArray,
        aniversariantes,
      });

      // Relatório de Vendedores
      const vendedoresVendas: any = {};
      
      vendas.forEach((venda: any) => {
        const codigoVendedor = venda.vendedor?.codigoVendedor;
        if (!vendedoresVendas[codigoVendedor]) {
          vendedoresVendas[codigoVendedor] = {
            nome: venda.vendedor?.nome,
            vendas: 0,
            valorTotal: 0
          };
        }
        vendedoresVendas[codigoVendedor].vendas += 1;
        vendedoresVendas[codigoVendedor].valorTotal += venda.total || 0;
      });

      const topVendedoresArray = Object.values(vendedoresVendas)
        .map((v: any) => ({
          ...v,
          comissao: v.valorTotal * 0.10
        }))
        .sort((a: any, b: any) => b.valorTotal - a.valorTotal)
        .slice(0, 4);

      setRelatorioVendedores({
        totalVendedores: vendedoresList.length,
        topVendedores: topVendedoresArray,
      });

      // Relatório de Caixa com filtros de período
      const caixasFiltrados = caixas.filter((caixa: any) => {
        const dataCaixa = new Date(caixa.dataAbertura);
        return filtrarPorPeriodo(dataCaixa, dataInicioCaixa, dataFimCaixa, periodoCaixa);
      });

      const caixasAbertos = caixasFiltrados.filter((c: any) => c.status === 'aberto').length;
      const caixasFechados = caixasFiltrados.filter((c: any) => c.status === 'fechado').length;
      const totalEntradas = caixasFiltrados.reduce((acc: number, c: any) => acc + (c.entrada || 0), 0);
      const totalSaidas = caixasFiltrados.reduce((acc: number, c: any) => acc + (c.saida || 0), 0);
      const performanceTotal = caixasFiltrados.reduce((acc: number, c: any) => acc + (c.performance || 0), 0);

      const ultimosCaixas = caixasFiltrados
        .sort((a: any, b: any) => new Date(b.dataAbertura).getTime() - new Date(a.dataAbertura).getTime())
        .slice(0, 5)
        .map((c: any) => ({
          codigo: c.codigoCaixa,
          dataAbertura: new Date(c.dataAbertura).toLocaleDateString('pt-BR'),
          dataFechamento: c.dataFechamento ? new Date(c.dataFechamento).toLocaleDateString('pt-BR') : '-',
          status: c.status,
          performance: c.performance || 0,
        }));

      setRelatorioCaixa({
        totalCaixas: caixasFiltrados.length,
        caixasAbertos,
        caixasFechados,
        totalEntradas,
        totalSaidas,
        performanceTotal,
        ultimosCaixas,
      });

      // Relatório de Estoque
      const estoquePorCategoria: any = {};
      const estoquePorCor: any = {};
      const estoquePorTamanho: any = {};
      let totalItensEstoque = 0;
      let valorTotalEstoque = 0;

      estoqueData.forEach((item: any) => {
        const produto = produtos.find((p: any) => p.codigoProduto === item.codigoProduto);
        const categoria = produto?.categoria || 'Outro';
        const quantidade = item.quantidadeTotal || 0;
        const valor = quantidade * (item.precoVenda || 0);

        if (!estoquePorCategoria[categoria]) {
          estoquePorCategoria[categoria] = { name: categoria, quantidade: 0, valor: 0 };
        }
        estoquePorCategoria[categoria].quantidade += quantidade;
        estoquePorCategoria[categoria].valor += valor;

        if (item.variantes && item.variantes.length > 0) {
          item.variantes.forEach((v: any) => {
            const cor = v.cor || 'Sem cor';
            const qtdVariante = v.quantidade || 0;
            if (!estoquePorCor[cor]) {
              estoquePorCor[cor] = { name: cor, quantidade: 0 };
            }
            estoquePorCor[cor].quantidade += qtdVariante;

            if (v.tamanhos && Array.isArray(v.tamanhos)) {
              v.tamanhos.forEach((t: any) => {
                const tamanho = t.tamanho || 'Único';
                const qtdTamanho = t.quantidade || 0;
                if (!estoquePorTamanho[tamanho]) {
                  estoquePorTamanho[tamanho] = { name: tamanho, quantidade: 0 };
                }
                estoquePorTamanho[tamanho].quantidade += qtdTamanho;
              });
            }
          });
        }

        totalItensEstoque += quantidade;
        valorTotalEstoque += valor;
      });

      setRelatorioEstoque({
        porCategoria: Object.values(estoquePorCategoria),
        porCor: Object.values(estoquePorCor),
        porTamanho: Object.values(estoquePorTamanho),
        totalItens: totalItensEstoque,
        valorTotal: valorTotalEstoque,
      });

      // Relatório Financeiro com filtros de período
      let [contasPagar, contasReceber] = await Promise.all([
        contasPagarAPI.getAll(),
        contasReceberAPI.getAll(),
      ]);

      const hoje = new Date();
      
      // Filtrar contas a pagar
      contasPagar = contasPagar.filter((conta: any) => {
        const dataVencimento = new Date(conta.dataVencimento);
        return filtrarPorPeriodo(dataVencimento, dataInicioFinanceiro, dataFimFinanceiro, periodoFinanceiro);
      });

      // Filtrar contas a receber
      contasReceber = contasReceber.filter((conta: any) => {
        const dataVencimento = new Date(conta.dataVencimento);
        return filtrarPorPeriodo(dataVencimento, dataInicioFinanceiro, dataFimFinanceiro, periodoFinanceiro);
      });

      const totalPagar = contasPagar.reduce((acc: number, c: any) => acc + (c.valor || 0), 0);
      const totalReceber = contasReceber.reduce((acc: number, c: any) => acc + (c.valor || 0), 0);

      // Top categorias para pagar
      const categoriasPagar: any = {};
      contasPagar.forEach((conta: any) => {
        const cat = conta.categoria || 'Sem categoria';
        if (!categoriasPagar[cat]) {
          categoriasPagar[cat] = { categoria: cat, total: 0, quantidade: 0 };
        }
        categoriasPagar[cat].total += conta.valor || 0;
        categoriasPagar[cat].quantidade += 1;
      });

      const topCategoriasPagar = Object.values(categoriasPagar)
        .sort((a: any, b: any) => b.total - a.total)
        .slice(0, 5);

      // Top categorias para receber
      const categoriasReceber: any = {};
      contasReceber.forEach((conta: any) => {
        const cat = conta.categoria || 'Sem categoria';
        if (!categoriasReceber[cat]) {
          categoriasReceber[cat] = { categoria: cat, total: 0, quantidade: 0 };
        }
        categoriasReceber[cat].total += conta.valor || 0;
        categoriasReceber[cat].quantidade += 1;
      });

      const topCategoriasReceber = Object.values(categoriasReceber)
        .sort((a: any, b: any) => b.total - a.total)
        .slice(0, 5);

      // Próximos vencimentos (próximos 30 dias)
      const em30dias = addDays(hoje, 30);
      
      const proximosVencimentosPagar = contasPagar
        .filter((c: any) => {
          const venc = new Date(c.dataVencimento);
          return venc >= hoje && venc <= em30dias && c.status !== 'Pago';
        })
        .sort((a: any, b: any) => new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime())
        .slice(0, 10);

      const proximosVencimentosReceber = contasReceber
        .filter((c: any) => {
          const venc = new Date(c.dataVencimento);
          return venc >= hoje && venc <= em30dias && c.status !== 'Recebido';
        })
        .sort((a: any, b: any) => new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime())
        .slice(0, 10);

      // Fluxo de caixa por mês
      const fluxoPorMes: any = {};
      
      contasReceber.forEach((conta: any) => {
        const data = new Date(conta.dataVencimento);
        const mesAno = `${data.toLocaleString('pt-BR', { month: 'short' })}/${data.getFullYear().toString().substr(2)}`;
        if (!fluxoPorMes[mesAno]) {
          fluxoPorMes[mesAno] = { mes: mesAno, entradas: 0, saidas: 0, saldo: 0 };
        }
        fluxoPorMes[mesAno].entradas += conta.valor || 0;
      });

      contasPagar.forEach((conta: any) => {
        const data = new Date(conta.dataVencimento);
        const mesAno = `${data.toLocaleString('pt-BR', { month: 'short' })}/${data.getFullYear().toString().substr(2)}`;
        if (!fluxoPorMes[mesAno]) {
          fluxoPorMes[mesAno] = { mes: mesAno, entradas: 0, saidas: 0, saldo: 0 };
        }
        fluxoPorMes[mesAno].saidas += conta.valor || 0;
      });

      Object.keys(fluxoPorMes).forEach(mes => {
        fluxoPorMes[mes].saldo = fluxoPorMes[mes].entradas - fluxoPorMes[mes].saidas;
      });

      setRelatorioFinanceiro({
        totalReceber,
        totalPagar,
        saldoRealizado: 0,
        saldoPrevisto: totalReceber - totalPagar,
        fluxoPorMes: Object.values(fluxoPorMes),
        evolucaoContas: [],
        topFornecedores: [],
        topClientes: [],
        contasPagar,
        contasReceber,
        topCategoriasPagar,
        topCategoriasReceber,
        proximosVencimentosPagar,
        proximosVencimentosReceber,
      });

    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
      toast.error('Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const enviarMensagemAniversario = (cliente: any) => {
    const telefone = cliente.telefone?.replace(/\D/g, '');
    if (!telefone) {
      toast.error('Cliente não possui telefone cadastrado');
      return;
    }
    
    const mensagem = encodeURIComponent(`Olá ${cliente.nome}! 🎉🎂\n\nA equipe da Mariela Moda deseja um Feliz Aniversário! 🎈\n\nQue este dia seja especial e repleto de alegrias! ✨`);
    const url = `https://wa.me/55${telefone}?text=${mensagem}`;
    
    window.open(url, '_blank');
    toast.success('Abrindo WhatsApp...');
  };

  if (loading) {
    return <GlobalLoading message="Carregando relatórios..." />;
  }

  return (
    <div className="container mx-auto py-6 space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
            <BarChart3 className="h-10 w-10 text-primary" />
            Relatórios
          </h1>
          <p className="text-muted-foreground mt-1">Análises completas do seu negócio</p>
        </div>
      </div>

      <Tabs defaultValue="clientes" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="clientes"><Users className="h-4 w-4 mr-2" />Clientes</TabsTrigger>
          <TabsTrigger value="financeiro"><DollarSign className="h-4 w-4 mr-2" />Financeiro</TabsTrigger>
          <TabsTrigger value="vendas"><ShoppingBag className="h-4 w-4 mr-2" />Vendas</TabsTrigger>
          <TabsTrigger value="produtos"><Package className="h-4 w-4 mr-2" />Produtos</TabsTrigger>
          <TabsTrigger value="vendedores"><UserCheck className="h-4 w-4 mr-2" />Vendedores</TabsTrigger>
          <TabsTrigger value="caixa"><Wallet className="h-4 w-4 mr-2" />Caixa</TabsTrigger>
        </TabsList>

        {/* Tab Clientes com Aniversariantes */}
        <TabsContent value="clientes" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total de Clientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{relatorioClientes.totalClientes}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Clientes Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{relatorioClientes.clientesAtivos}</div>
                <p className="text-xs text-muted-foreground mt-1">Com compras registradas</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Novos Este Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{relatorioClientes.clientesNovos}</div>
              </CardContent>
            </Card>
          </div>

          {/* Aniversariantes do Mês */}
          {relatorioClientes.aniversariantes && relatorioClientes.aniversariantes.length > 0 && (
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Gift className="h-5 w-5" />
                  Aniversariantes do Mês
                  <Badge variant="secondary" className="ml-auto">{relatorioClientes.aniversariantes.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {relatorioClientes.aniversariantes.map((cliente: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-background rounded-lg border hover:border-primary transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <CalendarDays className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{cliente.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(cliente.dataNascimento), "dd 'de' MMMM", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={() => enviarMensagemAniversario(cliente)}
                      >
                        <Send className="h-4 w-4" />
                        Enviar Mensagem
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Clientes */}
          {relatorioClientes.topClientes && relatorioClientes.topClientes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-amber-500" />
                  Top Clientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {relatorioClientes.topClientes.map((cliente: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold ${
                          index === 0 ? 'bg-amber-500 text-white' :
                          index === 1 ? 'bg-gray-400 text-white' :
                          index === 2 ? 'bg-amber-700 text-white' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{cliente.nome}</p>
                          <p className="text-sm text-muted-foreground">{cliente.compras} compras</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground">{formatCurrency(cliente.valorTotal)}</p>
                        <p className="text-xs text-muted-foreground">Ticket: {formatCurrency(cliente.ticketMedio)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab Financeiro com Top Categorias e Próximos Vencimentos */}
        <TabsContent value="financeiro" className="space-y-4">
          {/* Filtros de Período */}
          <Card className="bg-gradient-to-br from-primary/5 to-background">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Período</Label>
                  <Select value={periodoFinanceiro} onValueChange={setPeriodoFinanceiro}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="7">Últimos 7 dias</SelectItem>
                      <SelectItem value="30">Últimos 30 dias</SelectItem>
                      <SelectItem value="90">Últimos 90 dias</SelectItem>
                      <SelectItem value="365">Último ano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Data Início</Label>
                  <Input
                    type="date"
                    value={dataInicioFinanceiro}
                    onChange={(e) => setDataInicioFinanceiro(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Data Fim</Label>
                  <Input
                    type="date"
                    value={dataFimFinanceiro}
                    onChange={(e) => setDataFimFinanceiro(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  {(periodoFinanceiro !== "todos" || dataInicioFinanceiro || dataFimFinanceiro) && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setPeriodoFinanceiro("todos");
                        setDataInicioFinanceiro("");
                        setDataFimFinanceiro("");
                        loadRelatorios();
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Limpar Filtros
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total a Receber</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(relatorioFinanceiro.totalReceber)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total a Pagar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(relatorioFinanceiro.totalPagar)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Previsto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${relatorioFinanceiro.saldoPrevisto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(relatorioFinanceiro.saldoPrevisto)}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Categorias a Pagar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  Top Categorias - Contas a Pagar
                </CardTitle>
              </CardHeader>
              <CardContent>
                {relatorioFinanceiro.topCategoriasPagar && relatorioFinanceiro.topCategoriasPagar.length > 0 ? (
                  <div className="space-y-3">
                    {relatorioFinanceiro.topCategoriasPagar.map((cat: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
                        <div>
                          <p className="font-medium text-foreground">{cat.categoria}</p>
                          <p className="text-sm text-muted-foreground">{cat.quantidade} conta{cat.quantidade > 1 ? 's' : ''}</p>
                        </div>
                        <p className="font-bold text-red-600">{formatCurrency(cat.total)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Nenhuma conta a pagar registrada</p>
                )}
              </CardContent>
            </Card>

            {/* Top Categorias a Receber */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Top Categorias - Contas a Receber
                </CardTitle>
              </CardHeader>
              <CardContent>
                {relatorioFinanceiro.topCategoriasReceber && relatorioFinanceiro.topCategoriasReceber.length > 0 ? (
                  <div className="space-y-3">
                    {relatorioFinanceiro.topCategoriasReceber.map((cat: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                        <div>
                          <p className="font-medium text-foreground">{cat.categoria}</p>
                          <p className="text-sm text-muted-foreground">{cat.quantidade} conta{cat.quantidade > 1 ? 's' : ''}</p>
                        </div>
                        <p className="font-bold text-green-600">{formatCurrency(cat.total)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Nenhuma conta a receber registrada</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Próximos Vencimentos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-amber-200 dark:border-amber-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
                  <Bell className="h-5 w-5" />
                  Próximos Vencimentos - A Pagar (30 dias)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {relatorioFinanceiro.proximosVencimentosPagar && relatorioFinanceiro.proximosVencimentosPagar.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {relatorioFinanceiro.proximosVencimentosPagar.map((conta: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded border">
                        <div className="flex-1">
                          <p className="font-medium text-sm text-foreground">{conta.descricao}</p>
                          <p className="text-xs text-muted-foreground">
                            Venc: {format(new Date(conta.dataVencimento), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                        <p className="font-bold text-sm text-red-600">{formatCurrency(conta.valor)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Nenhum vencimento nos próximos 30 dias</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-amber-200 dark:border-amber-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
                  <Bell className="h-5 w-5" />
                  Próximos Vencimentos - A Receber (30 dias)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {relatorioFinanceiro.proximosVencimentosReceber && relatorioFinanceiro.proximosVencimentosReceber.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {relatorioFinanceiro.proximosVencimentosReceber.map((conta: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded border">
                        <div className="flex-1">
                          <p className="font-medium text-sm text-foreground">{conta.descricao}</p>
                          <p className="text-xs text-muted-foreground">
                            Venc: {format(new Date(conta.dataVencimento), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                        <p className="font-bold text-sm text-green-600">{formatCurrency(conta.valor)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Nenhum vencimento nos próximos 30 dias</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Fluxo de Caixa */}
          {relatorioFinanceiro.fluxoPorMes && relatorioFinanceiro.fluxoPorMes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Fluxo de Caixa Mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={relatorioFinanceiro.fluxoPorMes}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <RechartsTooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                      formatter={(value: any) => formatCurrency(value)}
                    />
                    <Legend />
                    <Bar dataKey="entradas" fill="#10b981" name="Entradas" />
                    <Bar dataKey="saidas" fill="#ef4444" name="Saídas" />
                    <Bar dataKey="saldo" fill="hsl(var(--primary))" name="Saldo" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab Vendas */}
        <TabsContent value="vendas" className="space-y-4">
          {/* Filtros de Período */}
          <Card className="bg-gradient-to-br from-primary/5 to-background">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Período</Label>
                  <Select value={periodoVendas} onValueChange={setPeriodoVendas}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="7">Últimos 7 dias</SelectItem>
                      <SelectItem value="30">Últimos 30 dias</SelectItem>
                      <SelectItem value="90">Últimos 90 dias</SelectItem>
                      <SelectItem value="365">Último ano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Data Início</Label>
                  <Input
                    type="date"
                    value={dataInicioVendas}
                    onChange={(e) => setDataInicioVendas(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Data Fim</Label>
                  <Input
                    type="date"
                    value={dataFimVendas}
                    onChange={(e) => setDataFimVendas(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  {(periodoVendas !== "todos" || dataInicioVendas || dataFimVendas) && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setPeriodoVendas("todos");
                        setDataInicioVendas("");
                        setDataFimVendas("");
                        loadRelatorios();
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Limpar Filtros
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Total de Vendas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{relatorioVendas.totalVendas}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Faturamento Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{formatCurrency(relatorioVendas.faturamentoTotal)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Ticket Médio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{formatCurrency(relatorioVendas.ticketMedio)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Vendas por Categoria */}
          {relatorioVendas.vendasPorCategoria && relatorioVendas.vendasPorCategoria.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Vendas por Categoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={relatorioVendas.vendasPorCategoria}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="categoria" />
                    <YAxis />
                    <RechartsTooltip 
                      formatter={(value: any) => formatCurrency(value)}
                      contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Legend />
                    <Bar dataKey="valor" fill="hsl(var(--primary))" name="Valor Vendido" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Evolução de Vendas por Mês */}
          {relatorioVendas.vendasPorMes && relatorioVendas.vendasPorMes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Evolução Mensal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={relatorioVendas.vendasPorMes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <RechartsTooltip 
                      formatter={(value: any) => formatCurrency(value)}
                      contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="valor" stroke="hsl(var(--primary))" strokeWidth={2} name="Faturamento" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab Produtos */}
        <TabsContent value="produtos" className="space-y-4">
          {/* Filtros de Período */}
          <Card className="bg-gradient-to-br from-primary/5 to-background">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Período</Label>
                  <Select value={periodoProdutos} onValueChange={setPeriodoProdutos}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="7">Últimos 7 dias</SelectItem>
                      <SelectItem value="30">Últimos 30 dias</SelectItem>
                      <SelectItem value="90">Últimos 90 dias</SelectItem>
                      <SelectItem value="365">Último ano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Data Início</Label>
                  <Input
                    type="date"
                    value={dataInicioProdutos}
                    onChange={(e) => setDataInicioProdutos(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Data Fim</Label>
                  <Input
                    type="date"
                    value={dataFimProdutos}
                    onChange={(e) => setDataFimProdutos(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  {(periodoProdutos !== "todos" || dataInicioProdutos || dataFimProdutos) && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setPeriodoProdutos("todos");
                        setDataInicioProdutos("");
                        setDataFimProdutos("");
                        loadRelatorios();
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Limpar Filtros
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Total de Produtos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{relatorioProdutos.totalProdutos}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Boxes className="h-4 w-4" />
                  Em Estoque
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{relatorioProdutos.emEstoque} un</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Novidades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600">{relatorioProdutos.novidades}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Em Promoção
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{relatorioProdutos.emPromocao}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Valor Total (Custo)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{formatCurrency(relatorioProdutos.valorEstoqueCusto)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Valor Total (Venda)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(relatorioProdutos.valorEstoqueVenda)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Lucro potencial: {formatCurrency(relatorioProdutos.valorEstoqueVenda - relatorioProdutos.valorEstoqueCusto)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Produtos Mais Vendidos */}
          {relatorioProdutos.produtosMaisVendidos && relatorioProdutos.produtosMaisVendidos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Top 5 Produtos Mais Vendidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {relatorioProdutos.produtosMaisVendidos.map((produto: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold ${
                          index === 0 ? 'bg-amber-500 text-white' :
                          index === 1 ? 'bg-gray-400 text-white' :
                          index === 2 ? 'bg-amber-700 text-white' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{produto.produto}</p>
                          <p className="text-sm text-muted-foreground">
                            {produto.vendas} unidades vendidas | Estoque: {produto.estoque}
                          </p>
                        </div>
                      </div>
                      <p className="font-bold text-green-600">{formatCurrency(produto.valor)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Estoque Mínimo */}
          {relatorioProdutos.estoqueMinimo && relatorioProdutos.estoqueMinimo.length > 0 && (
            <Card className="border-amber-200 dark:border-amber-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
                  <Bell className="h-5 w-5" />
                  Alerta: Estoque Baixo (menos de 10 unidades)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {relatorioProdutos.estoqueMinimo.map((produto: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-amber-50 dark:bg-amber-950/20 rounded border border-amber-200 dark:border-amber-900">
                      <div>
                        <p className="font-medium text-foreground">{produto.produto}</p>
                        <p className="text-sm text-muted-foreground">Estoque atual: {produto.estoque} un</p>
                      </div>
                      <Badge variant="destructive">Baixo</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab Vendedores */}
        <TabsContent value="vendedores" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Total de Vendedores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{relatorioVendedores.totalVendedores}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Vendedores Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{relatorioVendedores.topVendedores.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Com vendas registradas</p>
              </CardContent>
            </Card>
          </div>

          {/* Top Vendedores */}
          {relatorioVendedores.topVendedores && relatorioVendedores.topVendedores.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-amber-500" />
                  Ranking de Vendedores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {relatorioVendedores.topVendedores.map((vendedor: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-muted/50 to-background rounded-lg border">
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg ${
                          index === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg' :
                          index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-md' :
                          index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-md' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-bold text-lg text-foreground">{vendedor.nome}</p>
                          <p className="text-sm text-muted-foreground">{vendedor.vendas} vendas realizadas</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-xl text-green-600">{formatCurrency(vendedor.valorTotal)}</p>
                        <p className="text-xs text-muted-foreground">
                          Comissão: <span className="font-semibold text-primary">{formatCurrency(vendedor.comissao)}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {relatorioVendedores.topVendedores.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma venda registrada por vendedores ainda</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab Caixa */}
        <TabsContent value="caixa" className="space-y-4">
          {/* Filtros de Período */}
          <Card className="bg-gradient-to-br from-primary/5 to-background">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Período</Label>
                  <Select value={periodoCaixa} onValueChange={setPeriodoCaixa}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="7">Últimos 7 dias</SelectItem>
                      <SelectItem value="30">Últimos 30 dias</SelectItem>
                      <SelectItem value="90">Últimos 90 dias</SelectItem>
                      <SelectItem value="365">Último ano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Data Início</Label>
                  <Input
                    type="date"
                    value={dataInicioCaixa}
                    onChange={(e) => setDataInicioCaixa(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Data Fim</Label>
                  <Input
                    type="date"
                    value={dataFimCaixa}
                    onChange={(e) => setDataFimCaixa(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  {(periodoCaixa !== "todos" || dataInicioCaixa || dataFimCaixa) && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setPeriodoCaixa("todos");
                        setDataInicioCaixa("");
                        setDataFimCaixa("");
                        loadRelatorios();
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Limpar Filtros
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Total de Caixas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{relatorioCaixa.totalCaixas}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Caixas Abertos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{relatorioCaixa.caixasAbertos}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Caixas Fechados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-muted-foreground">{relatorioCaixa.caixasFechados}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Total Entradas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(relatorioCaixa.totalEntradas)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  Total Saídas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(relatorioCaixa.totalSaidas)}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Performance Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-4xl font-bold ${relatorioCaixa.performanceTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(relatorioCaixa.performanceTotal)}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Saldo total de todos os caixas (entradas - saídas)
              </p>
            </CardContent>
          </Card>

          {/* Últimos Caixas */}
          {relatorioCaixa.ultimosCaixas && relatorioCaixa.ultimosCaixas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  Últimos 5 Caixas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {relatorioCaixa.ultimosCaixas.map((caixa: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          caixa.status === 'aberto' ? 'bg-green-100 dark:bg-green-950' : 'bg-muted'
                        }`}>
                          <Wallet className={`h-5 w-5 ${caixa.status === 'aberto' ? 'text-green-600' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Caixa #{caixa.codigo}</p>
                          <p className="text-sm text-muted-foreground">
                            Abertura: {caixa.dataAbertura} | Fechamento: {caixa.dataFechamento}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={caixa.status === 'aberto' ? 'default' : 'secondary'}>
                          {caixa.status === 'aberto' ? 'Aberto' : 'Fechado'}
                        </Badge>
                        <p className={`font-bold mt-2 ${caixa.performance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(caixa.performance)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {relatorioCaixa.ultimosCaixas.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum caixa registrado ainda</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Relatorios;
