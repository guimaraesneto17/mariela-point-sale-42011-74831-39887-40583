import { useMemo, useState } from "react";
import { ReportFilters } from "./ReportFilters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  AlertCircle,
  ShoppingCart,
  Clock
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface ClientsReportProps {
  clientes: any[];
  vendas: any[];
}

export const ClientsReport = ({ clientes, vendas }: ClientsReportProps) => {
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const analiseClientes = useMemo(() => {
    const hoje = new Date();
    const dias30 = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);
    const dias60 = new Date(hoje.getTime() - 60 * 24 * 60 * 60 * 1000);
    const dias90 = new Date(hoje.getTime() - 90 * 24 * 60 * 60 * 1000);

    const clientesComAnalise = clientes.map((cliente: any) => {
      const vendasCliente = vendas.filter((v: any) => 
        v.codigoCliente === cliente.codigoCliente || 
        v.cliente?.codigoCliente === cliente.codigoCliente
      );

      // Filtrar por período se definido
      const vendasFiltradas = vendasCliente.filter((v: any) => {
        const dataVenda = new Date(v.data || v.dataVenda);
        if (dataInicio && dataVenda < new Date(dataInicio)) return false;
        if (dataFim && dataVenda > new Date(dataFim)) return false;
        return true;
      });

      const totalCompras = vendasFiltradas.length;
      const valorTotal = vendasFiltradas.reduce((sum: number, v: any) => sum + (v.valorTotal || 0), 0);
      const ticketMedio = totalCompras > 0 ? valorTotal / totalCompras : 0;

      // Última compra
      const ultimaCompra = vendasCliente.length > 0
        ? new Date(Math.max(...vendasCliente.map((v: any) => new Date(v.data || v.dataVenda).getTime())))
        : null;

      // Frequência (intervalo médio entre compras em dias)
      let frequenciaMedia = 0;
      if (vendasCliente.length > 1) {
        const datas = vendasCliente
          .map((v: any) => new Date(v.data || v.dataVenda).getTime())
          .sort((a, b) => a - b);
        
        const intervalos = [];
        for (let i = 1; i < datas.length; i++) {
          intervalos.push((datas[i] - datas[i - 1]) / (1000 * 60 * 60 * 24));
        }
        frequenciaMedia = intervalos.reduce((sum, val) => sum + val, 0) / intervalos.length;
      }

      // Categorizar por inatividade
      let statusInatividade = "ativo";
      let diasSemCompra = 0;
      if (ultimaCompra) {
        diasSemCompra = Math.floor((hoje.getTime() - ultimaCompra.getTime()) / (1000 * 60 * 60 * 24));
        if (diasSemCompra > 90) statusInatividade = "90dias";
        else if (diasSemCompra > 60) statusInatividade = "60dias";
        else if (diasSemCompra > 30) statusInatividade = "30dias";
      } else {
        statusInatividade = "nunca";
      }

      return {
        ...cliente,
        totalCompras,
        valorTotal,
        ticketMedio,
        lifetimeValue: valorTotal,
        ultimaCompra,
        diasSemCompra,
        frequenciaMedia: Math.round(frequenciaMedia),
        statusInatividade
      };
    });

    // Métricas gerais
    const totalClientes = clientesComAnalise.length;
    const clientesAtivos = clientesComAnalise.filter((c: any) => c.statusInatividade === "ativo").length;
    const clientesSem30dias = clientesComAnalise.filter((c: any) => c.statusInatividade === "30dias").length;
    const clientesSem60dias = clientesComAnalise.filter((c: any) => c.statusInatividade === "60dias").length;
    const clientesSem90dias = clientesComAnalise.filter((c: any) => c.statusInatividade === "90dias").length;
    const clientesNuncaCompraram = clientesComAnalise.filter((c: any) => c.statusInatividade === "nunca").length;

    const ticketMedioGeral = clientesComAnalise.reduce((sum: number, c: any) => sum + c.ticketMedio, 0) / (totalClientes || 1);
    const lifetimeValueTotal = clientesComAnalise.reduce((sum: number, c: any) => sum + c.lifetimeValue, 0);
    const frequenciaMediaGeral = clientesComAnalise.reduce((sum: number, c: any) => sum + (c.frequenciaMedia || 0), 0) / (totalClientes || 1);

    // Top clientes por LTV
    const topClientes = [...clientesComAnalise]
      .sort((a: any, b: any) => b.lifetimeValue - a.lifetimeValue)
      .slice(0, 10);

    // Distribuição por inatividade
    const distribuicaoInatividade = [
      { name: "Ativos (<30d)", value: clientesAtivos, color: "hsl(142, 76%, 36%)" },
      { name: "30-60 dias", value: clientesSem30dias, color: "hsl(48, 96%, 53%)" },
      { name: "60-90 dias", value: clientesSem60dias, color: "hsl(25, 95%, 53%)" },
      { name: "+90 dias", value: clientesSem90dias, color: "hsl(0, 84%, 60%)" },
      { name: "Nunca compraram", value: clientesNuncaCompraram, color: "hsl(220, 13%, 69%)" }
    ];

    return {
      totalClientes,
      clientesAtivos,
      clientesSem30dias,
      clientesSem60dias,
      clientesSem90dias,
      clientesNuncaCompraram,
      ticketMedioGeral,
      lifetimeValueTotal,
      frequenciaMediaGeral,
      topClientes,
      distribuicaoInatividade,
      todosClientes: clientesComAnalise
    };
  }, [clientes, vendas, dataInicio, dataFim]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="space-y-6">
      <ReportFilters
        dataInicio={dataInicio}
        dataFim={dataFim}
        onDataInicioChange={setDataInicio}
        onDataFimChange={setDataFim}
        activeFiltersCount={0}
        onClearFilters={() => {
          setDataInicio("");
          setDataFim("");
        }}
      />

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-background dark:from-blue-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Total de Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{analiseClientes.totalClientes}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {analiseClientes.clientesAtivos} ativos
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-background dark:from-green-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              Ticket Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(analiseClientes.ticketMedioGeral)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">por compra</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-background dark:from-purple-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              Lifetime Value Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">
              {formatCurrency(analiseClientes.lifetimeValueTotal)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">valor total gerado</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-background dark:from-orange-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-600" />
              Frequência Média
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">
              {Math.round(analiseClientes.frequenciaMediaGeral)} dias
            </p>
            <p className="text-xs text-muted-foreground mt-1">entre compras</p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de Inatividade */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-yellow-200 dark:border-yellow-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              30-60 dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">
              {analiseClientes.clientesSem30dias}
            </p>
            <p className="text-xs text-muted-foreground">sem compra</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 dark:border-orange-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              60-90 dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">
              {analiseClientes.clientesSem60dias}
            </p>
            <p className="text-xs text-muted-foreground">sem compra</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              +90 dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {analiseClientes.clientesSem90dias}
            </p>
            <p className="text-xs text-muted-foreground">sem compra</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 dark:border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-600" />
              Nunca compraram
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-600">
              {analiseClientes.clientesNuncaCompraram}
            </p>
            <p className="text-xs text-muted-foreground">clientes</p>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição de Inatividade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Distribuição de Clientes por Atividade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analiseClientes.distribuicaoInatividade}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analiseClientes.distribuicaoInatividade.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top 10 Clientes por LTV */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Top 10 Clientes por Lifetime Value
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analiseClientes.topClientes.map((cliente: any, index: number) => (
              <div 
                key={cliente.codigoCliente}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-background to-primary/5 rounded-lg border"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{cliente.nome}</h4>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <ShoppingCart className="h-3 w-3" />
                        {cliente.totalCompras} compras
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        Ticket: {formatCurrency(cliente.ticketMedio)}
                      </span>
                      {cliente.frequenciaMedia > 0 && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          A cada {cliente.frequenciaMedia} dias
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(cliente.lifetimeValue)}
                  </p>
                  <p className="text-xs text-muted-foreground">lifetime value</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
