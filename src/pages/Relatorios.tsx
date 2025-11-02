import { useState, useEffect } from "react";
import { FileText, Calendar, Filter, Download, TrendingUp, Package, Users, DollarSign, ShoppingBag, Sparkles, Tag, Crown, UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { vendasAPI, produtosAPI, clientesAPI, vendedoresAPI, estoqueAPI } from "@/lib/api";

const Relatorios = () => {
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [categoria, setCategoria] = useState("todas");
  const [vendedor, setVendedor] = useState("todos");
  const [loading, setLoading] = useState(true);
  const [relatorioVendas, setRelatorioVendas] = useState<any>({
    totalVendas: 0,
    faturamentoTotal: 0,
    ticketMedio: 0,
    vendasPorCategoria: [],
    vendasPorMes: [],
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

  useEffect(() => {
    loadRelatorios();
  }, []);

  const loadRelatorios = async () => {
    try {
      setLoading(true);
      const [vendas, produtos, clientes, vendedores, estoque] = await Promise.all([
        vendasAPI.getAll(),
        produtosAPI.getAll(),
        clientesAPI.getAll(),
        vendedoresAPI.getAll(),
        estoqueAPI.getAll(),
      ]);

      // Relatório de Vendas
      const totalVendas = vendas.length;
      const faturamentoTotal = vendas.reduce((acc: number, v: any) => acc + (v.total || 0), 0);
      const ticketMedio = totalVendas > 0 ? faturamentoTotal / totalVendas : 0;

      setRelatorioVendas({
        totalVendas,
        faturamentoTotal,
        ticketMedio,
        vendasPorCategoria: [
          { categoria: "Vestido", vendas: 87, valor: 13950.30 },
          { categoria: "Blusa", vendas: 76, valor: 6832.40 },
          { categoria: "Calça", vendas: 54, valor: 10780.80 },
          { categoria: "Saia", vendas: 45, valor: 7890.50 },
          { categoria: "Bolsa", vendas: 25, valor: 6226.90 },
        ],
        vendasPorMes: [
          { mes: "Janeiro", vendas: 95, valor: 15220.30 },
          { mes: "Fevereiro", vendas: 102, valor: 16350.80 },
          { mes: "Março", vendas: 90, valor: 14109.80 },
        ],
      });

      // Relatório de Produtos
      const totalProdutos = produtos.length;
      const emEstoque = estoque.reduce((acc: number, item: any) => acc + (item.quantidadeDisponivel || 0), 0);
      const novidades = produtos.filter((p: any) => p.novidade || p.isNovidade).length;
      const emPromocao = produtos.filter((p: any) => p.emPromocao || p.isOnSale).length;

      // Calcular valor total do estoque pelo custo e venda
      let valorEstoqueCusto = 0;
      let valorEstoqueVenda = 0;
      
      estoque.forEach((item: any) => {
        const quantidade = item.quantidadeDisponivel || 0;
        const precoCusto = item.precoCusto || 0;
        const precoVenda = item.precoVenda || item.precoPromocional || 0;
        
        valorEstoqueCusto += quantidade * precoCusto;
        valorEstoqueVenda += quantidade * precoVenda;
      });

      setRelatorioProdutos({
        totalProdutos,
        emEstoque,
        novidades,
        emPromocao,
        valorEstoqueCusto,
        valorEstoqueVenda,
        produtosMaisVendidos: [
          { produto: "Vestido Floral Curto", vendas: 45, estoque: 15, valor: 6745.50 },
          { produto: "Blusa Manga Longa", vendas: 38, estoque: 8, valor: 3416.20 },
          { produto: "Calça Jeans Skinny", vendas: 32, estoque: 12, valor: 6396.80 },
          { produto: "Saia Plissada Midi", vendas: 28, estoque: 22, valor: 3637.20 },
          { produto: "Vestido Longo Estampado", vendas: 25, estoque: 7, valor: 4987.50 },
        ],
        estoqueMinimo: estoque.filter((item: any) => (item.quantidadeDisponivel || 0) < 10).slice(0, 5),
      });

      // Relatório de Clientes
      const totalClientes = clientes.length;

      setRelatorioClientes({
        totalClientes,
        clientesAtivos: Math.floor(totalClientes * 0.75),
        clientesNovos: Math.floor(totalClientes * 0.15),
        topClientes: [
          { nome: "Maria Silva", compras: 28, valorTotal: 4580.50, ticketMedio: 163.59 },
          { nome: "Ana Paula Costa", compras: 22, valorTotal: 3890.00, ticketMedio: 176.82 },
          { nome: "Juliana Santos", compras: 19, valorTotal: 3245.90, ticketMedio: 170.84 },
          { nome: "Fernanda Lima", compras: 15, valorTotal: 2678.30, ticketMedio: 178.55 },
          { nome: "Carolina Souza", compras: 14, valorTotal: 2456.80, ticketMedio: 175.49 },
        ],
      });

      // Relatório de Vendedores
      const totalVendedores = vendedores.length;

      setRelatorioVendedores({
        totalVendedores,
        topVendedores: vendedores.slice(0, 4).map((v: any) => ({
          nome: v.nome || v.nomeCompleto,
          vendas: 0,
          valorTotal: 0,
          comissao: 0,
        })),
      });

    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
      toast.error('Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  };

  // Mock data - será substituído por dados reais da API
  const mockRelatorioVendas = {
    totalVendas: 287,
    faturamentoTotal: 45680.90,
    ticketMedio: 159.10,
    vendasPorCategoria: [
      { categoria: "Vestido", vendas: 87, valor: 13950.30 },
      { categoria: "Blusa", vendas: 76, valor: 6832.40 },
      { categoria: "Calça", vendas: 54, valor: 10780.80 },
      { categoria: "Saia", vendas: 45, valor: 7890.50 },
      { categoria: "Bolsa", vendas: 25, valor: 6226.90 },
    ],
    vendasPorMes: [
      { mes: "Janeiro", vendas: 95, valor: 15220.30 },
      { mes: "Fevereiro", vendas: 102, valor: 16350.80 },
      { mes: "Março", vendas: 90, valor: 14109.80 },
    ],
  };

  const mockRelatorioProdutos = {
    totalProdutos: 156,
    emEstoque: 1234,
    novidades: 23,
    emPromocao: 18,
    produtosMaisVendidos: [
      { produto: "Vestido Floral Curto", vendas: 45, estoque: 15, valor: 6745.50 },
      { produto: "Blusa Manga Longa", vendas: 38, estoque: 8, valor: 3416.20 },
      { produto: "Calça Jeans Skinny", vendas: 32, estoque: 12, valor: 6396.80 },
      { produto: "Saia Plissada Midi", vendas: 28, estoque: 22, valor: 3637.20 },
      { produto: "Vestido Longo Estampado", vendas: 25, estoque: 7, valor: 4987.50 },
    ],
    estoqueMinimo: [
      { produto: "Blusa Manga Longa", estoque: 8, minimo: 10 },
      { produto: "Vestido Longo Estampado", estoque: 7, minimo: 10 },
    ],
  };

  const mockRelatorioClientes = {
    totalClientes: 89,
    clientesAtivos: 67,
    clientesNovos: 12,
    topClientes: [
      { nome: "Maria Silva", compras: 28, valorTotal: 4580.50, ticketMedio: 163.59 },
      { nome: "Ana Paula Costa", compras: 22, valorTotal: 3890.00, ticketMedio: 176.82 },
      { nome: "Juliana Santos", compras: 19, valorTotal: 3245.90, ticketMedio: 170.84 },
      { nome: "Fernanda Lima", compras: 15, valorTotal: 2678.30, ticketMedio: 178.55 },
      { nome: "Carolina Souza", compras: 14, valorTotal: 2456.80, ticketMedio: 175.49 },
    ],
  };

  const mockRelatorioVendedores = {
    totalVendedores: 4,
    topVendedores: [
      { nome: "Ana Carolina", vendas: 87, valorTotal: 15680.50, comissao: 1568.05 },
      { nome: "João Pedro", vendas: 76, valorTotal: 13245.80, comissao: 1324.58 },
      { nome: "Carla Santos", vendas: 65, valorTotal: 11890.30, comissao: 1189.03 },
      { nome: "Juliana Lima", vendas: 54, valorTotal: 9456.90, comissao: 945.69 },
    ],
  };

  const handleExportarRelatorio = (tipo: string) => {
    toast.success(`Relatório de ${tipo} exportado com sucesso!`, {
      description: "O arquivo será baixado em instantes.",
    });
  };

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

      {/* Filtros */}
      <Card className="p-6 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">Filtros</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Data Início
            </label>
            <Input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Data Fim
            </label>
            <Input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Categoria
            </label>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="vestido">Vestido</SelectItem>
                <SelectItem value="blusa">Blusa</SelectItem>
                <SelectItem value="calca">Calça</SelectItem>
                <SelectItem value="saia">Saia</SelectItem>
                <SelectItem value="bolsa">Bolsa</SelectItem>
                <SelectItem value="acessorio">Acessório</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Vendedor
            </label>
            <Select value={vendedor} onValueChange={setVendedor}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ana">Ana Carolina</SelectItem>
                <SelectItem value="joao">João Pedro</SelectItem>
                <SelectItem value="carla">Carla Santos</SelectItem>
                <SelectItem value="juliana">Juliana Lima</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="vendas" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="vendas">Vendas</TabsTrigger>
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="vendedores">Vendedores</TabsTrigger>
        </TabsList>

        {/* Relatório de Vendas */}
        <TabsContent value="vendas" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-foreground">Relatório de Vendas</h2>
            <Button onClick={() => handleExportarRelatorio("Vendas")} className="gap-2">
              <Download className="h-4 w-4" />
              Exportar PDF
            </Button>
          </div>

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
                  <div>
                    <p className="text-3xl font-bold text-foreground">
                      {relatorioVendas.totalVendas}
                    </p>
                    <p className="text-sm text-green-600">+12% este mês</p>
                  </div>
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
                  <div>
                    <p className="text-3xl font-bold text-foreground">
                      R$ {relatorioVendas.faturamentoTotal.toFixed(2)}
                    </p>
                    <p className="text-sm text-green-600">+18% este mês</p>
                  </div>
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
                  <div>
                    <p className="text-3xl font-bold text-foreground">
                      R$ {relatorioVendas.ticketMedio.toFixed(2)}
                    </p>
                    <p className="text-sm text-blue-600">+5% este mês</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 shadow-card">
              <h3 className="text-lg font-bold text-foreground mb-4">Vendas por Categoria</h3>
              <div className="space-y-3">
                {relatorioVendas.vendasPorCategoria.map((cat, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg bg-gradient-card hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">{cat.categoria}</p>
                        <p className="text-sm text-muted-foreground">{cat.vendas} vendas</p>
                      </div>
                    </div>
                    <span className="font-bold text-primary">
                      R$ {cat.valor.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 shadow-card">
              <h3 className="text-lg font-bold text-foreground mb-4">Vendas por Mês</h3>
              <div className="space-y-3">
                {relatorioVendas.vendasPorMes.map((mes, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg bg-gradient-card hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">{mes.mes}</p>
                        <p className="text-sm text-muted-foreground">{mes.vendas} vendas</p>
                      </div>
                    </div>
                    <span className="font-bold text-primary">
                      R$ {mes.valor.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Relatório de Produtos */}
        <TabsContent value="produtos" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-foreground">Relatório de Produtos</h2>
            <Button onClick={() => handleExportarRelatorio("Produtos")} className="gap-2">
              <Download className="h-4 w-4" />
              Exportar PDF
            </Button>
          </div>

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
            <Card className="p-6 shadow-card">
              <h3 className="text-lg font-bold text-foreground mb-4">Produtos Mais Vendidos</h3>
              <div className="space-y-3">
                {relatorioProdutos.produtosMaisVendidos.map((produto, index) => (
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
                      <Badge variant={produto.estoque < 10 ? "destructive" : "secondary"}>
                        Est: {produto.estoque}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between ml-11">
                      <p className="text-sm text-muted-foreground">{produto.vendas} vendas</p>
                      <span className="font-bold text-primary">
                        R$ {produto.valor.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 shadow-card bg-gradient-to-br from-card via-card to-red-500/5">
              <h3 className="text-lg font-bold text-foreground mb-4">
                ⚠️ Alerta: Estoque Mínimo
              </h3>
              <div className="space-y-3">
                {relatorioProdutos.estoqueMinimo.map((produto, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{produto.produto}</p>
                        <p className="text-sm text-muted-foreground">
                          Estoque atual: {produto.estoque} | Mínimo: {produto.minimo}
                        </p>
                      </div>
                      <Badge variant="destructive">Baixo</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Relatório de Clientes */}
        <TabsContent value="clientes" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-foreground">Relatório de Clientes</h2>
            <Button onClick={() => handleExportarRelatorio("Clientes")} className="gap-2">
              <Download className="h-4 w-4" />
              Exportar PDF
            </Button>
          </div>

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

        {/* Relatório de Vendedores */}
        <TabsContent value="vendedores" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-foreground">Relatório de Vendedores</h2>
            <Button onClick={() => handleExportarRelatorio("Vendedores")} className="gap-2">
              <Download className="h-4 w-4" />
              Exportar PDF
            </Button>
          </div>

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
      </Tabs>
    </div>
  );
};

export default Relatorios;
