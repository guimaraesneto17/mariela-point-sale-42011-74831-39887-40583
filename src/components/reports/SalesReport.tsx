import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, ShoppingBag, Users, Package, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { VendasEvolutionChart } from "@/components/VendasEvolutionChart";
import { VendasPorCategoriaCard } from "@/components/VendasPorCategoriaCard";
import { MargemLucroCard } from "@/components/MargemLucroCard";
import { ReportFilters } from "./ReportFilters";

interface SalesReportProps {
  vendas: any[];
  vendedores: any[];
  clientes: any[];
  produtos: any[];
}

export const SalesReport = ({ vendas, vendedores, clientes, produtos }: SalesReportProps) => {
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [vendedorSelecionado, setVendedorSelecionado] = useState("todos");
  const [clienteSelecionado, setClienteSelecionado] = useState("todos");
  const [formaPagamento, setFormaPagamento] = useState("todos");

  const vendasFiltradas = useMemo(() => {
    return vendas.filter((venda: any) => {
      const dataVenda = new Date(venda.data || venda.dataVenda);
      
      if (dataInicio && dataVenda < new Date(dataInicio)) return false;
      if (dataFim && dataVenda > new Date(dataFim)) return false;
      if (vendedorSelecionado !== "todos" && venda.nomeVendedor !== vendedorSelecionado) return false;
      if (clienteSelecionado !== "todos" && venda.nomeCliente !== clienteSelecionado) return false;
      if (formaPagamento !== "todos" && venda.formaPagamento !== formaPagamento) return false;
      
      return true;
    });
  }, [vendas, dataInicio, dataFim, vendedorSelecionado, clienteSelecionado, formaPagamento]);

  const metricas = useMemo(() => {
    const totalVendas = vendasFiltradas.length;
    const faturamentoTotal = vendasFiltradas.reduce((sum: number, v: any) => sum + (v.valorTotal || 0), 0);
    const ticketMedio = totalVendas > 0 ? faturamentoTotal / totalVendas : 0;
    
    const clientesUnicos = new Set(vendasFiltradas.map((v: any) => v.clienteId || v.nomeCliente)).size;
    const produtosVendidos = vendasFiltradas.reduce((sum: number, v: any) => {
      return sum + (v.itens?.reduce((s: number, i: any) => s + (i.quantidade || 0), 0) || 0);
    }, 0);

    return {
      totalVendas,
      faturamentoTotal,
      ticketMedio,
      clientesUnicos,
      produtosVendidos
    };
  }, [vendasFiltradas]);

  const formasPagamento = useMemo(() => {
    return Array.from(new Set(vendas.map((v: any) => v.formaPagamento).filter(Boolean)));
  }, [vendas]);

  const handlePeriodoChange = (periodo: string) => {
    const hoje = new Date();
    let inicio = new Date();
    
    switch (periodo) {
      case "hoje":
        setDataInicio(hoje.toISOString().split('T')[0]);
        setDataFim(hoje.toISOString().split('T')[0]);
        break;
      case "ontem":
        inicio.setDate(hoje.getDate() - 1);
        setDataInicio(inicio.toISOString().split('T')[0]);
        setDataFim(inicio.toISOString().split('T')[0]);
        break;
      case "semana":
        inicio.setDate(hoje.getDate() - hoje.getDay());
        setDataInicio(inicio.toISOString().split('T')[0]);
        setDataFim(hoje.toISOString().split('T')[0]);
        break;
      case "mes":
        inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        setDataInicio(inicio.toISOString().split('T')[0]);
        setDataFim(hoje.toISOString().split('T')[0]);
        break;
      case "ano":
        inicio = new Date(hoje.getFullYear(), 0, 1);
        setDataInicio(inicio.toISOString().split('T')[0]);
        setDataFim(hoje.toISOString().split('T')[0]);
        break;
      case "todos":
        setDataInicio("");
        setDataFim("");
        break;
    }
  };

  const activeFiltersCount = (vendedorSelecionado !== "todos" ? 1 : 0) + 
                            (clienteSelecionado !== "todos" ? 1 : 0) + 
                            (formaPagamento !== "todos" ? 1 : 0);

  return (
    <div className="space-y-6">
      <ReportFilters
        dataInicio={dataInicio}
        dataFim={dataFim}
        onDataInicioChange={setDataInicio}
        onDataFimChange={setDataFim}
        onPeriodoChange={handlePeriodoChange}
        activeFiltersCount={activeFiltersCount}
        onClearFilters={() => {
          setVendedorSelecionado("todos");
          setClienteSelecionado("todos");
          setFormaPagamento("todos");
          setDataInicio("");
          setDataFim("");
        }}
        additionalFilters={
          <>
            <div>
              <Label className="text-sm font-medium mb-2 block">Vendedor</Label>
              <Select value={vendedorSelecionado} onValueChange={setVendedorSelecionado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {vendedores.map((v: any) => (
                    <SelectItem key={v._id} value={v.nome}>{v.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Cliente</Label>
              <Select value={clienteSelecionado} onValueChange={setClienteSelecionado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {clientes.map((c: any) => (
                    <SelectItem key={c._id} value={c.nome}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Forma de Pagamento</Label>
              <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  {formasPagamento.map((fp: string) => (
                    <SelectItem key={fp} value={fp}>{fp}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-background dark:from-green-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              Faturamento Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metricas.faturamentoTotal)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-background dark:from-blue-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-blue-600" />
              Total de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{metricas.totalVendas}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-background dark:from-purple-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              Ticket Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metricas.ticketMedio)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-background dark:from-orange-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-orange-600" />
              Clientes Atendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">{metricas.clientesUnicos}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-50 to-background dark:from-pink-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="h-4 w-4 text-pink-600" />
              Produtos Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-pink-600">{metricas.produtosVendidos}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <VendasPorCategoriaCard vendas={vendasFiltradas} produtos={produtos} />
      </div>

      <VendasEvolutionChart vendas={vendasFiltradas} />
    </div>
  );
};
