import { useState, useEffect } from "react";
import { FileText, Calendar, Filter, Download, TrendingUp, Package, Users, DollarSign, ShoppingBag, Sparkles, Tag, Crown, UserCheck, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { vendasAPI, produtosAPI, clientesAPI, vendedoresAPI, estoqueAPI, caixaAPI } from "@/lib/api";

const Relatorios = () => {
  // Filtros para vendas
  const [dataInicioVendas, setDataInicioVendas] = useState("");
  const [dataFimVendas, setDataFimVendas] = useState("");
  const [vendedorFiltro, setVendedorFiltro] = useState("todos");
  
  // Filtros para produtos
  const [categoriaFiltro, setCategoriaFiltro] = useState("todas");
  const [estoqueMinimo, setEstoqueMinimo] = useState("");
  
  // Filtros para clientes
  const [statusCliente, setStatusCliente] = useState("todos");
  
  const [loading, setLoading] = useState(true);
  const [vendedores, setVendedores] = useState<any[]>([]);
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
  const [relatorioCaixa, setRelatorioCaixa] = useState<any>({
    totalCaixas: 0,
    caixasAbertos: 0,
    caixasFechados: 0,
    totalEntradas: 0,
    totalSaidas: 0,
    performanceTotal: 0,
    ultimosCaixas: [],
  });

  useEffect(() => {
    loadRelatorios();
  }, []);

  const loadRelatorios = async () => {
    try {
      setLoading(true);
      const [vendas, produtos, clientes, vendedoresList, estoque, caixas] = await Promise.all([
        vendasAPI.getAll(),
        produtosAPI.getAll(),
        clientesAPI.getAll(),
        vendedoresAPI.getAll(),
        estoqueAPI.getAll(),
        caixaAPI.getAll(),
      ]);

      setVendedores(vendedoresList);

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
        const itemEstoque = estoque.find((e: any) => e.codigoProduto === codigo);
        produtosVendidos[codigo].estoque = itemEstoque?.quantidadeDisponivel || 0;
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
        estoqueMinimo: estoque
          .filter((item: any) => (item.quantidadeDisponivel || 0) < 10)
          .map((item: any) => ({
            produto: item.nomeProduto || item.nome,
            estoque: item.quantidadeDisponivel || 0,
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
    setEstoqueMinimo("");
    setStatusCliente("todos");
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
    estoqueMinimo: estoqueMinimo 
      ? relatorioProdutos.estoqueMinimo.filter((p: any) => p.estoque <= parseInt(estoqueMinimo))
      : relatorioProdutos.estoqueMinimo,
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

      <Tabs defaultValue="vendas" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="vendas">Vendas</TabsTrigger>
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="vendedores">Vendedores</TabsTrigger>
          <TabsTrigger value="caixa">Caixa</TabsTrigger>
        </TabsList>

        {/* Relatório de Vendas */}
        <TabsContent value="vendas" className="space-y-6">
          {/* Filtros específicos para Vendas */}
          <Card className="p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold text-foreground">Filtros de Vendas</h3>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 shadow-card">
              <h3 className="text-lg font-bold text-foreground mb-4">Vendas por Categoria</h3>
              <div className="space-y-3">
                {relatorioVendasFiltrado.vendasPorCategoria.map((cat: any, index: number) => (
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
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Estoque Mínimo
                  </label>
                  <Input
                    type="number"
                    placeholder="Ex: 10"
                    value={estoqueMinimo}
                    onChange={(e) => setEstoqueMinimo(e.target.value)}
                  />
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
            <Card className="p-6 shadow-card">
              <h3 className="text-lg font-bold text-foreground mb-4">Produtos Mais Vendidos</h3>
              <div className="space-y-3">
                {relatorioProdutosFiltrado.produtosMaisVendidos.map((produto: any, index: number) => (
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
                {relatorioProdutosFiltrado.estoqueMinimo.map((produto: any, index: number) => (
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
        <h2 className="text-2xl font-bold text-foreground">Relatório de Caixa</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-card via-card to-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Caixas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Wallet className="h-8 w-8 text-primary" />
                <p className="text-3xl font-bold text-foreground">
                  {relatorioCaixa.totalCaixas}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card via-card to-green-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Entradas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <p className="text-3xl font-bold text-green-600">
                  R$ {relatorioCaixa.totalEntradas.toFixed(2)}
                </p>
              </div>
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
                  relatorioCaixa.performanceTotal >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  R$ {relatorioCaixa.performanceTotal.toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="p-6 shadow-card">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Últimos Caixas
          </h3>
          <div className="space-y-3">
            {relatorioCaixa.ultimosCaixas.map((caixa: any, index: number) => (
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
            ))}
          </div>
        </Card>
      </TabsContent>
      </Tabs>
    </div>
  );
};

export default Relatorios;
