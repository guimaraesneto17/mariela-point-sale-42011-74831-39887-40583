import { useState, useEffect } from "react";
import { FileText, Calendar, Filter, Download, TrendingUp, TrendingDown, Package, Users, DollarSign, ShoppingBag, Sparkles, Tag, Crown, UserCheck, Wallet, BarChart3, Boxes } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { vendasAPI, produtosAPI, clientesAPI, vendedoresAPI, estoqueAPI, caixaAPI } from "@/lib/api";
import { ComparacaoPeriodoDialog } from "@/components/ComparacaoPeriodoDialog";
import { VendasPorCategoriaCard } from "@/components/VendasPorCategoriaCard";
import { VendasEvolutionChart } from "@/components/VendasEvolutionChart";
import { MargemLucroCard } from "@/components/MargemLucroCard";
import { DashboardMovimentacoes } from "@/components/DashboardMovimentacoes";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from "recharts";

const Relatorios = () => {
  // Filtros para vendas
  const [dataInicioVendas, setDataInicioVendas] = useState("");
  const [dataFimVendas, setDataFimVendas] = useState("");
  const [vendedorFiltro, setVendedorFiltro] = useState("todos");
  
  // Filtros para produtos
  const [categoriaFiltro, setCategoriaFiltro] = useState("todas");
  
  // Filtros para clientes
  const [statusCliente, setStatusCliente] = useState("todos");
  
  // Filtros para caixa
  const [periodoCaixa, setPeriodoCaixa] = useState("mensal"); // hoje, ontem, semanal ou mensal
  
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

  useEffect(() => {
    loadRelatorios();
  }, []);

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

      // Relatório de Vendas - calcular vendas por categoria real
      const vendasPorCategoria: any = {};
      vendas.forEach((venda: any) => {
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

      // Calcular vendas por mês
      const vendasPorMes: any = {};
      vendas.forEach((venda: any) => {
        const data = new Date(venda.data || venda.dataVenda);
        const mesAno = `${data.toLocaleString('pt-BR', { month: 'long' })} ${data.getFullYear()}`;
        if (!vendasPorMes[mesAno]) {
          vendasPorMes[mesAno] = { mes: mesAno, vendas: 0, valor: 0 };
        }
        vendasPorMes[mesAno].vendas += 1;
        vendasPorMes[mesAno].valor += venda.total || 0;
      });

      const totalVendas = vendas.length;
      const faturamentoTotal = vendas.reduce((acc: number, v: any) => acc + (v.total || 0), 0);
      const ticketMedio = totalVendas > 0 ? faturamentoTotal / totalVendas : 0;

      setRelatorioVendas({
        totalVendas,
        faturamentoTotal,
        ticketMedio,
        vendasPorCategoria: Object.values(vendasPorCategoria),
        vendasPorMes: Object.values(vendasPorMes).slice(-3),
        vendasOriginais: vendas,
      });

      // Relatório de Produtos
      const totalProdutos = produtos.length;
      const emEstoque = estoqueData.reduce((acc: number, item: any) => acc + (item.quantidadeTotal || 0), 0);
      
      // Contar novidades e promoções do ESTOQUE, não dos produtos
      const novidades = estoqueData.filter((item: any) => item.isNovidade === true).length;
      const emPromocao = estoqueData.filter((item: any) => item.emPromocao === true).length;

      // Calcular valor total do estoque pelo custo e venda
      let valorEstoqueCusto = 0;
      let valorEstoqueVenda = 0;
      
      estoqueData.forEach((item: any) => {
        const quantidade = item.quantidadeTotal || 0;
        const precoCusto = item.precoCusto || 0;
        const precoVenda = item.precoVenda || item.precoPromocional || 0;
        
        valorEstoqueCusto += quantidade * precoCusto;
        valorEstoqueVenda += quantidade * precoVenda;
      });

      // Calcular produtos mais vendidos
      const produtosVendidos: any = {};
      vendas.forEach((venda: any) => {
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

      // Adicionar estoque aos produtos vendidos
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

      // Relatório de Clientes - calcular compras reais
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
      const clientesNovos = clientes.filter((c: any) => {
        const dataCadastro = new Date(c.dataCadastro);
        return dataCadastro.getMonth() === mesAtual;
      }).length;

      setRelatorioClientes({
        totalClientes,
        clientesAtivos: Object.keys(clientesCompras).length,
        clientesNovos,
        topClientes: topClientesArray,
      });

      // Relatório de Vendedores - calcular vendas reais
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

      // Relatório de Caixa
      const caixasAbertos = caixas.filter((c: any) => c.status === 'aberto').length;
      const caixasFechados = caixas.filter((c: any) => c.status === 'fechado').length;
      const totalEntradas = caixas.reduce((acc: number, c: any) => acc + (c.entrada || 0), 0);
      const totalSaidas = caixas.reduce((acc: number, c: any) => acc + (c.saida || 0), 0);
      const performanceTotal = caixas.reduce((acc: number, c: any) => acc + (c.performance || 0), 0);

      const ultimosCaixas = caixas
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
        totalCaixas: caixas.length,
        caixasAbertos,
        caixasFechados,
        totalEntradas,
        totalSaidas,
        performanceTotal,
        ultimosCaixas,
      });

      // Relatório de Estoque - Análise por categoria, cor e tamanho
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

        // Por categoria
        if (!estoquePorCategoria[categoria]) {
          estoquePorCategoria[categoria] = { name: categoria, quantidade: 0, valor: 0 };
        }
        estoquePorCategoria[categoria].quantidade += quantidade;
        estoquePorCategoria[categoria].valor += valor;

        // Por cor (se houver variantes)
        if (item.variantes && item.variantes.length > 0) {
          item.variantes.forEach((v: any) => {
            const cor = v.cor || 'Sem cor';
            const qtdVariante = v.quantidade || 0;
            if (!estoquePorCor[cor]) {
              estoquePorCor[cor] = { name: cor, quantidade: 0 };
            }
            estoquePorCor[cor].quantidade += qtdVariante;
          });
        }

        // Por tamanho (se houver variantes)
        if (item.variantes && item.variantes.length > 0) {
          item.variantes.forEach((v: any) => {
            const tamanho = v.tamanho || 'Único';
            const qtdVariante = v.quantidade || 0;
            if (!estoquePorTamanho[tamanho]) {
              estoquePorTamanho[tamanho] = { name: tamanho, quantidade: 0 };
            }
            estoquePorTamanho[tamanho].quantidade += qtdVariante;
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

    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
      toast.error('Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  };

  const limparFiltros = () => {
    setDataInicioVendas("");
    setDataFimVendas("");
    setVendedorFiltro("todos");
    setCategoriaFiltro("todas");
    setStatusCliente("todos");
    setPeriodoCaixa("hoje");
    toast.info("Filtros limpos");
  };

  // Aplicar filtros aos relatórios
  const relatorioVendasFiltrado = {
    ...relatorioVendas,
    vendasPorCategoria: categoriaFiltro !== "todas" 
      ? relatorioVendas.vendasPorCategoria.filter((c: any) => 
          c.categoria.toLowerCase() === categoriaFiltro.toLowerCase()
        )
      : relatorioVendas.vendasPorCategoria,
  };

  const relatorioProdutosFiltrado = {
    ...relatorioProdutos,
    produtosMaisVendidos: relatorioProdutos.produtosMaisVendidos,
  };

  // Filtrar relatório de caixa por período
  const getDataLimite = () => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // Início do dia
    
    if (periodoCaixa === "hoje") {
      return hoje;
    } else if (periodoCaixa === "ontem") {
      const ontem = new Date(hoje);
      ontem.setDate(hoje.getDate() - 1);
      return ontem;
    } else if (periodoCaixa === "semanal") {
      const semanaAtras = new Date(hoje);
      semanaAtras.setDate(hoje.getDate() - 7);
      return semanaAtras;
    } else {
      const mesAtras = new Date(hoje);
      mesAtras.setMonth(hoje.getMonth() - 1);
      return mesAtras;
    }
  };

  const getPeriodoLabel = () => {
    switch (periodoCaixa) {
      case "hoje":
        return "Hoje";
      case "ontem":
        return "Ontem";
      case "semanal":
        return "Última Semana";
      case "mensal":
        return "Último Mês";
      default:
        return "Período";
    }
  };

  const relatorioCaixaFiltrado = {
    ...relatorioCaixa,
    ultimosCaixas: relatorioCaixa.ultimosCaixas.filter((c: any) => {
      const dataAbertura = new Date(c.dataAbertura.split('/').reverse().join('-'));
      return dataAbertura >= getDataLimite();
    }),
  };

  // Recalcular totais com base nos caixas filtrados
  const totalEntradasFiltrado = relatorioCaixaFiltrado.ultimosCaixas.reduce((acc: number, c: any) => {
    // Buscar o caixa original para pegar os valores corretos
    return acc;
  }, 0);

  const totalSaidasFiltrado = relatorioCaixaFiltrado.ultimosCaixas.reduce((acc: number, c: any) => {
    return acc;
  }, 0);

  const performanceTotalFiltrado = relatorioCaixaFiltrado.ultimosCaixas.reduce((acc: number, c: any) => {
    return acc + c.performance;
  }, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Relatórios</h1>
          <p className="text-muted-foreground">
            Análises detalhadas e insights do seu negócio
          </p>
        </div>
        <FileText className="h-12 w-12 text-primary" />
      </div>

      <Tabs defaultValue="vendas" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="vendas">Vendas</TabsTrigger>
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
          <TabsTrigger value="estoque">Estoque</TabsTrigger>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="vendedores">Vendedores</TabsTrigger>
          <TabsTrigger value="caixa">Caixa</TabsTrigger>
        </TabsList>

        {/* Relatório de Vendas */}
        <TabsContent value="vendas" className="space-y-6">
          {/* Filtros específicos para Vendas */}
          <Card className="p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">Filtros de Vendas</h3>
              </div>
              <ComparacaoPeriodoDialog vendas={relatorioVendas.vendasOriginais || []} />
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Data Início
                  </label>
                  <Input
                    type="date"
                    value={dataInicioVendas}
                    onChange={(e) => setDataInicioVendas(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Data Fim
                  </label>
                  <Input
                    type="date"
                    value={dataFimVendas}
                    onChange={(e) => setDataFimVendas(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Vendedor
                  </label>
                  <Select value={vendedorFiltro} onValueChange={setVendedorFiltro}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {vendedores.map((v: any) => (
                        <SelectItem key={v.codigoVendedor} value={v.codigoVendedor}>
                          {v.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={limparFiltros} variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          </Card>

          <h2 className="text-2xl font-bold text-foreground">Relatório de Vendas</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-card via-card to-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Vendas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <ShoppingBag className="h-8 w-8 text-primary" />
                  <p className="text-3xl font-bold text-foreground">
                    {relatorioVendas.totalVendas}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card via-card to-green-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Faturamento Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <p className="text-3xl font-bold text-foreground">
                    R$ {relatorioVendas.faturamentoTotal.toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card via-card to-blue-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Ticket Médio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                  <p className="text-3xl font-bold text-foreground">
                    R$ {relatorioVendas.ticketMedio.toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <VendasPorCategoriaCard 
              vendas={relatorioVendas.vendasOriginais || []}
              produtos={[]}
            />
            
            <VendasEvolutionChart 
              vendas={relatorioVendas.vendasOriginais || []}
              dataInicio={dataInicioVendas ? new Date(dataInicioVendas) : undefined}
              dataFim={dataFimVendas ? new Date(dataFimVendas) : undefined}
            />
          </div>
        </TabsContent>

        {/* Relatório de Produtos */}
        <TabsContent value="produtos" className="space-y-6">
          {/* Filtros específicos para Produtos */}
          <Card className="p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold text-foreground">Filtros de Produtos</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Categoria
                  </label>
                  <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas</SelectItem>
                      <SelectItem value="Calça">Calça</SelectItem>
                      <SelectItem value="Saia">Saia</SelectItem>
                      <SelectItem value="Vestido">Vestido</SelectItem>
                      <SelectItem value="Blusa">Blusa</SelectItem>
                      <SelectItem value="Bolsa">Bolsa</SelectItem>
                      <SelectItem value="Acessório">Acessório</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={limparFiltros} variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          </Card>

          <h2 className="text-2xl font-bold text-foreground">Relatório de Produtos</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-card via-card to-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Produtos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Package className="h-8 w-8 text-primary" />
                  <p className="text-3xl font-bold text-foreground">
                    {relatorioProdutos.totalProdutos}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card via-card to-blue-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Em Estoque
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Package className="h-8 w-8 text-blue-600" />
                  <p className="text-3xl font-bold text-foreground">
                    {relatorioProdutos.emEstoque}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card via-card to-green-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Novidades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Sparkles className="h-8 w-8 text-green-600" />
                  <p className="text-3xl font-bold text-foreground">
                    {relatorioProdutos.novidades}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card via-card to-red-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Em Promoção
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Tag className="h-8 w-8 text-red-600" />
                  <p className="text-3xl font-bold text-foreground">
                    {relatorioProdutos.emPromocao}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card via-card to-purple-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Valor em Estoque (Custo)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-purple-600" />
                  <p className="text-2xl font-bold text-foreground">
                    R$ {relatorioProdutos.valorEstoqueCusto.toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card via-card to-orange-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Valor em Estoque (Venda)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-orange-600" />
                  <p className="text-2xl font-bold text-foreground">
                    R$ {relatorioProdutos.valorEstoqueVenda.toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Distribuição por Categoria */}
            <Card className="p-6 shadow-card">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Distribuição de Estoque por Categoria
              </h3>
              <div className="space-y-3">
                {(() => {
                  const distribuicaoPorCategoria: { [key: string]: number } = {};
                  estoque.forEach((item: any) => {
                    const categoria = item.categoria || 'Outro';
                    if (!distribuicaoPorCategoria[categoria]) {
                      distribuicaoPorCategoria[categoria] = 0;
                    }
                    distribuicaoPorCategoria[categoria] += item.quantidadeTotal || 0;
                  });
                  
                  const totalEstoque = Object.values(distribuicaoPorCategoria).reduce((a, b) => a + b, 0);
                  
                  return Object.entries(distribuicaoPorCategoria)
                    .sort((a, b) => b[1] - a[1])
                    .map(([categoria, quantidade], index) => {
                      const porcentagem = totalEstoque > 0 ? (quantidade / totalEstoque) * 100 : 0;
                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-foreground">{categoria}</span>
                            <span className="text-sm text-muted-foreground">
                              {quantidade} un. ({porcentagem.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-3">
                            <div
                              className="bg-gradient-to-r from-primary to-primary/60 h-3 rounded-full transition-all"
                              style={{ width: `${porcentagem}%` }}
                            />
                          </div>
                        </div>
                      );
                    });
                })()}
              </div>
            </Card>

            {/* Gráfico de Valor em Estoque */}
            <Card className="p-6 shadow-card">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Valor em Estoque por Categoria
              </h3>
              <div className="space-y-3">
                {(() => {
                  const valorPorCategoria: { [key: string]: { custo: number; venda: number } } = {};
                  estoque.forEach((item: any) => {
                    const categoria = item.categoria || 'Outro';
                    if (!valorPorCategoria[categoria]) {
                      valorPorCategoria[categoria] = { custo: 0, venda: 0 };
                    }
                    const quantidade = item.quantidadeTotal || 0;
                    valorPorCategoria[categoria].custo += quantidade * (item.precoCusto || 0);
                    valorPorCategoria[categoria].venda += quantidade * (item.precoVenda || item.precoPromocional || 0);
                  });
                  
                  const totalVenda = Object.values(valorPorCategoria).reduce((a, b) => a + b.venda, 0);
                  
                  return Object.entries(valorPorCategoria)
                    .sort((a, b) => b[1].venda - a[1].venda)
                    .map(([categoria, valores], index) => {
                      const porcentagem = totalVenda > 0 ? (valores.venda / totalVenda) * 100 : 0;
                      const lucro = valores.venda - valores.custo;
                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-foreground">{categoria}</span>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-green-600">
                                R$ {valores.venda.toFixed(2)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Lucro: R$ {lucro.toFixed(2)}
                              </div>
                            </div>
                          </div>
                          <div className="w-full bg-muted rounded-full h-3">
                            <div
                              className="bg-gradient-to-r from-green-500 to-green-500/60 h-3 rounded-full transition-all"
                              style={{ width: `${porcentagem}%` }}
                            />
                          </div>
                        </div>
                      );
                    });
                })()}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 shadow-card">
              <h3 className="text-lg font-bold text-foreground mb-4">Produtos Mais Vendidos</h3>
              <TooltipProvider>
                <div className="space-y-3">
                  {relatorioProdutosFiltrado.produtosMaisVendidos.map((produto: any, index: number) => {
                    const itemEstoque = estoque.find((e: any) => 
                      e.nomeProduto === produto.produto || e.nome === produto.produto
                    );
                    
                    return (
                      <div
                        key={index}
                        className="p-4 rounded-lg bg-gradient-card hover:shadow-md transition-all"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-bold text-primary">{index + 1}</span>
                            </div>
                            <p className="font-medium text-foreground">{produto.produto}</p>
                          </div>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge 
                                variant={produto.estoque < 10 ? "destructive" : "secondary"}
                                className="cursor-help"
                              >
                                Est: {produto.estoque}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="max-w-xs">
                              <div className="space-y-1">
                                <p className="font-semibold text-sm mb-2">Variantes em estoque:</p>
                                {itemEstoque?.variantes && itemEstoque.variantes.length > 0 ? (
                                  itemEstoque.variantes.map((variante: any, idx: number) => (
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
                        <div className="flex items-center justify-between ml-11">
                          <p className="text-sm text-muted-foreground">{produto.vendas} vendas</p>
                          <span className="font-bold text-primary">
                            R$ {produto.valor.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TooltipProvider>
            </Card>

            <Card className="p-6 shadow-card">
              <h3 className="text-lg font-bold text-foreground mb-4">
                📊 Detalhamento de Estoque
              </h3>
              <TooltipProvider>
                <div className="space-y-3">
                  {estoque.slice(0, 10).map((item: any, index: number) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg bg-gradient-card hover:shadow-md transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-foreground">{item.nomeProduto || item.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.categoria} • {item.codigoProduto}
                          </p>
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge 
                              variant={(item.quantidadeTotal || 0) === 0 ? "destructive" : (item.quantidadeTotal || 0) < 5 ? "secondary" : "default"}
                              className="cursor-help"
                            >
                              {item.quantidadeTotal || 0}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-xs">
                            <div className="space-y-1">
                              <p className="font-semibold text-sm mb-2">Variantes em estoque:</p>
                              {item.variantes && item.variantes.length > 0 ? (
                                item.variantes.map((variante: any, idx: number) => (
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
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Custo: </span>
                          <span className="font-semibold">R$ {item.precoCusto?.toFixed(2)}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Venda: </span>
                          <span className="font-semibold text-primary">R$ {item.precoVenda?.toFixed(2)}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Margem: </span>
                          <span className="font-semibold text-green-600">
                            {item.precoCusto > 0 ? ((item.precoVenda - item.precoCusto) / item.precoCusto * 100).toFixed(0) : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TooltipProvider>
            </Card>
          </div>
        </TabsContent>

        {/* Relatório de Estoque */}
        <TabsContent value="estoque" className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Boxes className="h-8 w-8 text-primary" />
            Análise de Estoque
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-card via-card to-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Itens em Estoque
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Package className="h-8 w-8 text-primary" />
                  <p className="text-3xl font-bold text-foreground">
                    {relatorioEstoque.totalItens}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card via-card to-green-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Valor Total em Estoque
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <p className="text-3xl font-bold text-foreground">
                    R$ {relatorioEstoque.valorTotal.toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos de Distribuição */}
          <div className="grid grid-cols-1 gap-6 mb-6">
            <MargemLucroCard 
              valorEstoqueCusto={relatorioProdutos.valorEstoqueCusto}
              valorEstoqueVenda={relatorioProdutos.valorEstoqueVenda}
              vendasPorMes={[]}
            />
            
            <DashboardMovimentacoes 
              movimentacoes={estoque.flatMap((item: any) => 
                (item.logMovimentacao || []).map((mov: any) => ({
                  ...mov,
                  codigoProduto: item.codigoProduto,
                  nomeProduto: item.nomeProduto || item.nome || item.codigoProduto,
                }))
              )}
            />
          </div>

          {/* Gráficos de Distribuição */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Pizza - Distribuição por Categoria */}
            <Card className="p-6 shadow-card">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Distribuição por Categoria
              </h3>
              {relatorioEstoque.porCategoria.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={relatorioEstoque.porCategoria}
                      dataKey="quantidade"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(entry) => `${entry.name}: ${entry.quantidade}`}
                    >
                      {relatorioEstoque.porCategoria.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Sem dados disponíveis
                </div>
              )}
            </Card>

            {/* Gráfico de Barras - Valor por Categoria */}
            <Card className="p-6 shadow-card">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Valor por Categoria
              </h3>
              {relatorioEstoque.porCategoria.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={relatorioEstoque.porCategoria}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                    <Legend />
                    <Bar dataKey="valor" fill="hsl(var(--primary))" name="Valor em Estoque" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Sem dados disponíveis
                </div>
              )}
            </Card>
          </div>

          {/* Gráficos de Variantes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribuição por Cor */}
            <Card className="p-6 shadow-card">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Distribuição por Cor
              </h3>
              {relatorioEstoque.porCor.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={relatorioEstoque.porCor.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="quantidade" fill="hsl(270, 70%, 60%)" name="Quantidade" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Sem dados de variantes disponíveis
                </div>
              )}
            </Card>

            {/* Distribuição por Tamanho */}
            <Card className="p-6 shadow-card">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-orange-600" />
                Distribuição por Tamanho
              </h3>
              {relatorioEstoque.porTamanho.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={relatorioEstoque.porTamanho}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="quantidade" fill="hsl(25, 70%, 60%)" name="Quantidade" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Sem dados de variantes disponíveis
                </div>
              )}
            </Card>
          </div>

          {/* Tabela detalhada */}
          <Card className="p-6 shadow-card">
            <h3 className="text-lg font-bold text-foreground mb-4">Resumo Detalhado</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatorioEstoque.porCategoria.map((item: any, index: number) => (
                <Card key={index} className="p-4 bg-gradient-card">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-foreground">{item.name}</h4>
                    <Badge variant="secondary">{item.quantidade} un.</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Valor: <span className="font-semibold text-green-600">R$ {item.valor.toFixed(2)}</span></p>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Relatório de Clientes */}
        <TabsContent value="clientes" className="space-y-6">
          {/* Filtros específicos para Clientes */}
          <Card className="p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold text-foreground">Filtros de Clientes</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Status
                  </label>
                  <Select value={statusCliente} onValueChange={setStatusCliente}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="ativos">Ativos (Com compras)</SelectItem>
                      <SelectItem value="novos">Novos (Este mês)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={limparFiltros} variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          </Card>

          <h2 className="text-2xl font-bold text-foreground">Relatório de Clientes</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-card via-card to-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Clientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-primary" />
                  <p className="text-3xl font-bold text-foreground">
                    {relatorioClientes.totalClientes}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card via-card to-green-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Clientes Ativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-green-600" />
                  <p className="text-3xl font-bold text-foreground">
                    {relatorioClientes.clientesAtivos}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card via-card to-blue-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Novos este Mês
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-blue-600" />
                  <p className="text-3xl font-bold text-foreground">
                    {relatorioClientes.clientesNovos}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="p-6 shadow-card bg-gradient-to-br from-card via-card to-blue-500/5">
            <div className="flex items-center gap-3 mb-4">
              <Crown className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-bold text-foreground">Top Clientes</h3>
            </div>
            <div className="space-y-3">
              {relatorioClientes.topClientes.map((cliente, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg bg-gradient-card hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        index === 0 ? "bg-yellow-500/20" : 
                        index === 1 ? "bg-gray-400/20" : 
                        index === 2 ? "bg-orange-600/20" : "bg-primary/10"
                      }`}>
                        {index < 3 ? (
                          <Crown className={`h-5 w-5 ${
                            index === 0 ? "text-yellow-600" :
                            index === 1 ? "text-gray-500" :
                            "text-orange-700"
                          }`} />
                        ) : (
                          <span className="text-sm font-bold text-primary">{index + 1}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{cliente.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {cliente.compras} compras
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">
                        R$ {cliente.valorTotal.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Ticket: R$ {cliente.ticketMedio.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Relatório de Caixa */}
        <TabsContent value="caixa" className="space-y-6">
          <Card className="p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold text-foreground">Filtros de Caixa</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Período de Análise
                  </label>
                  <Select value={periodoCaixa} onValueChange={setPeriodoCaixa}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hoje">Hoje</SelectItem>
                      <SelectItem value="ontem">Ontem</SelectItem>
                      <SelectItem value="semanal">Última Semana</SelectItem>
                      <SelectItem value="mensal">Último Mês</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={limparFiltros} variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          </Card>

          <h2 className="text-2xl font-bold text-foreground">Relatório de Caixa - {getPeriodoLabel()}</h2>

          {/* Cards de Estatísticas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-card via-card to-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Caixas no Período
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Wallet className="h-8 w-8 text-primary" />
                  <p className="text-3xl font-bold text-foreground">
                    {relatorioCaixaFiltrado.ultimosCaixas.length}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Total geral: {relatorioCaixa.totalCaixas}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card via-card to-green-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Entradas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                  <p className="text-3xl font-bold text-green-600">
                    R$ {relatorioCaixa.totalEntradas.toFixed(2)}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Média: R$ {(relatorioCaixa.totalEntradas / (relatorioCaixaFiltrado.ultimosCaixas.length || 1)).toFixed(2)}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card via-card to-red-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Saídas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <TrendingDown className="h-8 w-8 text-red-600" />
                  <p className="text-3xl font-bold text-red-600">
                    R$ {relatorioCaixa.totalSaidas.toFixed(2)}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Média: R$ {(relatorioCaixa.totalSaidas / (relatorioCaixaFiltrado.ultimosCaixas.length || 1)).toFixed(2)}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card via-card to-blue-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Performance Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-blue-600" />
                  <p className={`text-3xl font-bold ${
                    performanceTotalFiltrado >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    R$ {performanceTotalFiltrado.toFixed(2)}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {performanceTotalFiltrado >= 0 ? 'Lucro' : 'Prejuízo'} no período
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Análise de Fluxo de Caixa Consolidado */}
          <Card className="p-6 shadow-card">
            <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Análise de Fluxo de Caixa
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Entradas */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border-2 border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-500 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">
                        Entradas
                      </p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        R$ {relatorioCaixa.totalEntradas.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  Vendas e recebimentos
                </div>
              </div>

              {/* Saídas */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-500 rounded-lg">
                      <TrendingDown className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">
                        Saídas
                      </p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        R$ {relatorioCaixa.totalSaidas.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  Custos e despesas
                </div>
              </div>

              {/* Saldo */}
              <div className="space-y-3">
                <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                  performanceTotalFiltrado >= 0 
                    ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
                    : 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${
                      performanceTotalFiltrado >= 0 ? 'bg-blue-500' : 'bg-orange-500'
                    }`}>
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">
                        {performanceTotalFiltrado >= 0 ? 'Lucro' : 'Prejuízo'}
                      </p>
                      <p className={`text-2xl font-bold ${
                        performanceTotalFiltrado >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'
                      }`}>
                        R$ {Math.abs(performanceTotalFiltrado).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  Saldo do período
                </div>
              </div>
            </div>
          </Card>

        </TabsContent>

        {/* Relatório de Vendedores */}
        <TabsContent value="vendedores" className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Relatório de Vendedores</h2>

          <Card className="p-6 shadow-card bg-gradient-to-br from-card via-card to-green-500/5">
            <div className="flex items-center gap-3 mb-4">
              <UserCheck className="h-6 w-6 text-green-600" />
              <h3 className="text-lg font-bold text-foreground">
                Performance dos Vendedores
              </h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {relatorioVendedores.topVendedores.map((vendedor, index) => (
                <div
                  key={index}
                  className="p-5 rounded-lg bg-gradient-card hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        index === 0 ? "bg-yellow-500/20" : 
                        index === 1 ? "bg-gray-400/20" : 
                        index === 2 ? "bg-orange-600/20" : "bg-primary/10"
                      }`}>
                        {index < 3 ? (
                          <Crown className={`h-6 w-6 ${
                            index === 0 ? "text-yellow-600" :
                            index === 1 ? "text-gray-500" :
                            "text-orange-700"
                          }`} />
                        ) : (
                          <UserCheck className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-lg text-foreground">{vendedor.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {vendedor.vendas} vendas realizadas
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 pt-3 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Faturamento Total</span>
                      <span className="font-bold text-green-600">
                        R$ {vendedor.valorTotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Comissão (10%)</span>
                      <span className="font-bold text-primary">
                        R$ {vendedor.comissao.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Ticket Médio</span>
                      <span className="font-medium text-foreground">
                        R$ {(vendedor.valorTotal / vendedor.vendas).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Relatório de Caixa */}
        <TabsContent value="caixa" className="space-y-6">
          {/* Filtros específicos para Caixa */}
          <Card className="p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold text-foreground">Filtros de Caixa</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Período
                  </label>
                  <Select value={periodoCaixa} onValueChange={setPeriodoCaixa}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="semanal">Última Semana</SelectItem>
                      <SelectItem value="mensal">Último Mês</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={limparFiltros} variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          </Card>

          <h2 className="text-2xl font-bold text-foreground">
            Relatório de Caixa - {periodoCaixa === "semanal" ? "Última Semana" : "Último Mês"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-card via-card to-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Caixas no Período
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Wallet className="h-8 w-8 text-primary" />
                  <p className="text-3xl font-bold text-foreground">
                    {relatorioCaixaFiltrado.ultimosCaixas.length}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card via-card to-green-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Caixas Abertos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                  <p className="text-3xl font-bold text-green-600">
                    {relatorioCaixa.caixasAbertos}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card via-card to-blue-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Performance no Período
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-blue-600" />
                  <p className={`text-3xl font-bold ${
                    performanceTotalFiltrado >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    R$ {performanceTotalFiltrado.toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>
        </div>

          <Card className="p-6 shadow-card">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Caixas do Período ({periodoCaixa === "semanal" ? "Última Semana" : "Último Mês"})
            </h3>
            <div className="space-y-3">
              {relatorioCaixaFiltrado.ultimosCaixas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum caixa encontrado no período selecionado
                </div>
              ) : (
                relatorioCaixaFiltrado.ultimosCaixas.map((caixa: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-lg bg-gradient-card hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-primary">{caixa.codigo}</span>
                    <span className="text-xs text-muted-foreground">
                      {caixa.dataAbertura} - {caixa.dataFechamento}
                    </span>
                  </div>
                  <Badge variant={caixa.status === 'aberto' ? 'default' : 'secondary'}>
                    {caixa.status === 'aberto' ? 'Aberto' : 'Fechado'}
                  </Badge>
                </div>
                <span className={`font-bold text-lg ${
                  caixa.performance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  R$ {caixa.performance.toFixed(2)}
                </span>
              </div>
            ))
              )}
          </div>
        </Card>
      </TabsContent>
      </Tabs>
    </div>
  );
};

export default Relatorios;
