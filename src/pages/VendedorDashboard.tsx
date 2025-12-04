import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useClientes, useVendas, useEstoque, useVendedores } from "@/hooks/useQueryCache";
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
  Award,
  Target,
  Calendar as CalendarIcon,
  RefreshCw,
  Search,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { safeDate, formatCurrency } from "@/lib/utils";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const VendedorDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchEstoque, setSearchEstoque] = useState("");
  const [searchClientes, setSearchClientes] = useState("");
  const [selectedVenda, setSelectedVenda] = useState<any>(null);

  // Fetch data
  const { data: clientesData = [], isLoading: isLoadingClientes, refetch: refetchClientes } = useClientes();
  const { data: vendasData = [], isLoading: isLoadingVendas, refetch: refetchVendas } = useVendas();
  const { data: estoqueData = [], isLoading: isLoadingEstoque, refetch: refetchEstoque } = useEstoque();
  const { data: vendedoresData = [], isLoading: isLoadingVendedores, refetch: refetchVendedores } = useVendedores();

  const loading = isLoadingClientes || isLoadingVendas || isLoadingEstoque || isLoadingVendedores;

  // Encontrar dados do vendedor atual
  const vendedorAtual = useMemo(() => {
    if (!user?.codigoVendedor) return null;
    return vendedoresData.find((v: any) => v.codigoVendedor === user.codigoVendedor);
  }, [vendedoresData, user?.codigoVendedor]);

  // Filtrar vendas do vendedor atual
  const minhasVendas = useMemo(() => {
    if (!user?.codigoVendedor) return [];
    return vendasData.filter((v: any) => 
      v.vendedor?.codigoVendedor === user.codigoVendedor
    ).sort((a: any, b: any) => {
      const dataA = safeDate(a.data || a.dataVenda);
      const dataB = safeDate(b.data || b.dataVenda);
      return (dataB?.getTime() || 0) - (dataA?.getTime() || 0);
    });
  }, [vendasData, user?.codigoVendedor]);

  // Estatísticas do vendedor
  const stats = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();

    // Vendas de hoje
    const vendasHoje = minhasVendas.filter((v: any) => {
      const vendaData = safeDate(v.data || v.dataVenda);
      if (!vendaData) return false;
      vendaData.setHours(0, 0, 0, 0);
      return vendaData.getTime() === hoje.getTime();
    });

    // Vendas do mês
    const vendasMes = minhasVendas.filter((v: any) => {
      const vendaData = safeDate(v.data || v.dataVenda);
      return vendaData && vendaData.getMonth() === mesAtual && vendaData.getFullYear() === anoAtual;
    });

    const totalVendasHoje = vendasHoje.length;
    const faturamentoHoje = vendasHoje.reduce((acc: number, v: any) => acc + (v.total || 0), 0);
    const totalVendasMes = vendasMes.length;
    const faturamentoMes = vendasMes.reduce((acc: number, v: any) => acc + (v.total || 0), 0);
    const ticketMedio = totalVendasMes > 0 ? faturamentoMes / totalVendasMes : 0;

    // Meta mensal
    const metaMensal = vendedorAtual?.metaMensal || 0;
    const progressoMeta = metaMensal > 0 ? (faturamentoMes / metaMensal) * 100 : 0;

    return {
      totalVendasHoje,
      faturamentoHoje,
      totalVendasMes,
      faturamentoMes,
      ticketMedio,
      metaMensal,
      progressoMeta,
      totalVendas: minhasVendas.length,
      totalClientes: clientesData.length,
    };
  }, [minhasVendas, vendedorAtual, clientesData]);

  // Filtrar estoque
  const estoqueFiltrado = useMemo(() => {
    if (!searchEstoque) return estoqueData.slice(0, 20);
    const search = searchEstoque.toLowerCase();
    return estoqueData.filter((item: any) =>
      item.nomeProduto?.toLowerCase().includes(search) ||
      item.codigoProduto?.toLowerCase().includes(search) ||
      item.categoria?.toLowerCase().includes(search)
    ).slice(0, 20);
  }, [estoqueData, searchEstoque]);

  // Filtrar clientes
  const clientesFiltrados = useMemo(() => {
    if (!searchClientes) return clientesData.slice(0, 20);
    const search = searchClientes.toLowerCase();
    return clientesData.filter((cliente: any) =>
      cliente.nome?.toLowerCase().includes(search) ||
      cliente.telefone?.includes(search) ||
      cliente.codigoCliente?.toLowerCase().includes(search)
    ).slice(0, 20);
  }, [clientesData, searchClientes]);

  // Refresh data
  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    toast.loading("Atualizando dados...");
    
    try {
      await Promise.all([
        refetchClientes(),
        refetchVendas(),
        refetchEstoque(),
        refetchVendedores(),
      ]);
      
      toast.dismiss();
      toast.success("Dados atualizados!");
    } catch (error) {
      toast.dismiss();
      toast.error("Erro ao atualizar dados");
    } finally {
      setIsRefreshing(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 p-4 md:p-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Olá, {user?.nome || 'Vendedor'}! 👋
          </h1>
          <p className="text-muted-foreground">
            Acompanhe suas vendas e metas
          </p>
        </div>
        <Button
          onClick={handleRefreshAll}
          disabled={isRefreshing}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Atualizando...' : 'Atualizar'}
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Vendas Hoje */}
        <Card className="hover-lift transition-smooth">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vendas Hoje</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalVendasHoje}</p>
                <p className="text-sm text-green-600">
                  {formatCurrency(stats.faturamentoHoje)}
                </p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vendas do Mês */}
        <Card className="hover-lift transition-smooth">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vendas do Mês</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalVendasMes}</p>
                <p className="text-sm text-green-600">
                  {formatCurrency(stats.faturamentoMes)}
                </p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-xl">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ticket Médio */}
        <Card className="hover-lift transition-smooth">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ticket Médio</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(stats.ticketMedio)}
                </p>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-xl">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meta Mensal */}
        <Card className="hover-lift transition-smooth">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Meta Mensal</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.progressoMeta.toFixed(0)}%
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(stats.faturamentoMes)} / {formatCurrency(stats.metaMensal)}
                </p>
              </div>
              <div className="p-3 bg-orange-500/10 rounded-xl">
                <Target className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  stats.progressoMeta >= 100 ? 'bg-green-500' : 'bg-orange-500'
                }`}
                style={{ width: `${Math.min(stats.progressoMeta, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Minhas Vendas Recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Minhas Vendas Recentes
          </CardTitle>
          <CardDescription>
            Últimas {Math.min(minhasVendas.length, 10)} vendas realizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {minhasVendas.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma venda realizada ainda
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {minhasVendas.slice(0, 10).map((venda: any) => (
                    <TableRow key={venda._id}>
                      <TableCell className="font-medium">{venda.codigoVenda}</TableCell>
                      <TableCell>
                        {format(safeDate(venda.data || venda.dataVenda) || new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>{venda.cliente?.nome || '-'}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatCurrency(venda.total)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{venda.formaPagamento}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedVenda(venda)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grid: Estoque e Clientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de Estoque */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Produtos em Estoque
            </CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produto..."
                value={searchEstoque}
                onChange={(e) => setSearchEstoque(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {estoqueFiltrado.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Nenhum produto encontrado
                </p>
              ) : (
                estoqueFiltrado.map((item: any) => (
                  <div
                    key={item._id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.nomeProduto}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{item.codigoProduto}</span>
                        {item.emPromocao && (
                          <Badge variant="destructive" className="text-xs">Promoção</Badge>
                        )}
                        {item.isNovidade && (
                          <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-600">Novidade</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">
                        {item.emPromocao && item.precoPromocional ? (
                          <>
                            <span className="line-through text-muted-foreground text-sm mr-2">
                              {formatCurrency(item.precoVenda)}
                            </span>
                            {formatCurrency(item.precoPromocional)}
                          </>
                        ) : (
                          formatCurrency(item.precoVenda)
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantidadeTotal || 0} un.
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lista de Clientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Clientes
            </CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente..."
                value={searchClientes}
                onChange={(e) => setSearchClientes(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {clientesFiltrados.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Nenhum cliente encontrado
                </p>
              ) : (
                clientesFiltrados.map((cliente: any) => (
                  <div
                    key={cliente._id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{cliente.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        {cliente.telefone || 'Sem telefone'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {cliente.quantidadeCompras || 0} compras
                      </p>
                      <p className="text-sm font-medium text-green-600">
                        {formatCurrency(cliente.valorTotalComprado || 0)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Detalhes da Venda */}
      <Dialog open={!!selectedVenda} onOpenChange={() => setSelectedVenda(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da Venda</DialogTitle>
            <DialogDescription>
              {selectedVenda?.codigoVenda}
            </DialogDescription>
          </DialogHeader>
          {selectedVenda && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Data</p>
                  <p className="font-medium">
                    {format(safeDate(selectedVenda.data) || new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Cliente</p>
                  <p className="font-medium">{selectedVenda.cliente?.nome || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pagamento</p>
                  <p className="font-medium">{selectedVenda.formaPagamento}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-bold text-green-600">{formatCurrency(selectedVenda.total)}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-2">Itens</p>
                <div className="space-y-2">
                  {selectedVenda.itens?.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between p-2 bg-muted/50 rounded">
                      <div>
                        <p className="font-medium">{item.nomeProduto}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{item.cor} - {item.tamanho}</span>
                          <span>x{item.quantidade}</span>
                          {item.emPromocao && (
                            <Badge variant="destructive" className="text-xs">Promoção</Badge>
                          )}
                          {item.novidade && (
                            <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-600">Novidade</Badge>
                          )}
                        </div>
                      </div>
                      <p className="font-medium">{formatCurrency(item.subtotal)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendedorDashboard;
