import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, startOfYear, endOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { contasPagarAPI, contasReceberAPI } from "@/lib/api";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, ComposedChart, Area } from "recharts";

export function FluxoCaixaReport() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [contasPagar, setContasPagar] = useState<any[]>([]);
  const [contasReceber, setContasReceber] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"realizado" | "previsto">("realizado");

  useEffect(() => {
    loadData();
  }, [dateRange]);

  useEffect(() => {
    if (contasPagar.length > 0 || contasReceber.length > 0) {
      processChartData(contasPagar, contasReceber);
    }
  }, [viewMode]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pagarData, receberData] = await Promise.all([
        contasPagarAPI.getAll(),
        contasReceberAPI.getAll(),
      ]);
      setContasPagar(pagarData);
      setContasReceber(receberData);
      processChartData(pagarData, receberData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar relatório de fluxo de caixa');
    } finally {
      setLoading(false);
    }
  };

  const processChartData = (pagar: any[], receber: any[]) => {
    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    
    let saldoAcumulado = 0;
    
    const data = days.map(day => {
      const dayStr = format(day, 'dd/MMM', { locale: ptBR });
      
      // Valores realizados (pagos/recebidos)
      const entradasRealizadas = receber
        .filter(c => {
          const dataVenc = new Date(c.dataVencimento);
          return format(dataVenc, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
        })
        .reduce((sum, c) => sum + (c.valorRecebido || 0), 0);

      const saidasRealizadas = pagar
        .filter(c => {
          const dataVenc = new Date(c.dataVencimento);
          return format(dataVenc, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
        })
        .reduce((sum, c) => sum + (c.valorPago || 0), 0);

      // Valores previstos (total das contas)
      const entradasPrevistas = receber
        .filter(c => {
          const dataVenc = new Date(c.dataVencimento);
          return format(dataVenc, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
        })
        .reduce((sum, c) => sum + c.valor, 0);

      const saidasPrevistas = pagar
        .filter(c => {
          const dataVenc = new Date(c.dataVencimento);
          return format(dataVenc, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
        })
        .reduce((sum, c) => sum + c.valor, 0);

      const entradas = viewMode === "realizado" ? entradasRealizadas : entradasPrevistas;
      const saidas = viewMode === "realizado" ? saidasRealizadas : saidasPrevistas;
      const saldo = entradas - saidas;
      
      saldoAcumulado += saldo;

      return {
        dia: dayStr,
        entradas,
        saidas,
        saldo,
        saldoAcumulado,
        entradasPrevistas,
        saidasPrevistas,
        entradasRealizadas,
        saidasRealizadas,
      };
    });

    setChartData(data);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const totalEntradas = chartData.reduce((sum, d) => sum + d.entradas, 0);
  const totalSaidas = chartData.reduce((sum, d) => sum + d.saidas, 0);
  const saldoTotal = totalEntradas - totalSaidas;
  const saldoFinal = chartData.length > 0 ? chartData[chartData.length - 1].saldoAcumulado : 0;

  const setPeriodoRapido = (tipo: string) => {
    const hoje = new Date();
    let from: Date;
    let to: Date;

    switch (tipo) {
      case "mes":
        from = startOfMonth(hoje);
        to = endOfMonth(hoje);
        break;
      case "3meses":
        from = startOfMonth(subMonths(hoje, 2));
        to = endOfMonth(hoje);
        break;
      case "6meses":
        from = startOfMonth(subMonths(hoje, 5));
        to = endOfMonth(hoje);
        break;
      case "ano":
        from = startOfYear(hoje);
        to = endOfYear(hoje);
        break;
      default:
        from = startOfMonth(hoje);
        to = endOfMonth(hoje);
    }

    setDateRange({ from, to });
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
          <p className="text-sm font-medium mb-2">{data.dia}</p>
          <p className="text-sm text-green-600">
            Entradas: {formatCurrency(data.entradas)}
          </p>
          <p className="text-sm text-red-600">
            Saídas: {formatCurrency(data.saidas)}
          </p>
          <p className="text-sm font-bold mt-1 border-t pt-1">
            Saldo do Dia: {formatCurrency(data.saldo)}
          </p>
          <p className="text-sm font-bold text-primary">
            Saldo Acumulado: {formatCurrency(data.saldoAcumulado)}
          </p>
          {viewMode === "previsto" && (
            <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
              <p>Realizado:</p>
              <p className="text-green-600">↑ {formatCurrency(data.entradasRealizadas)}</p>
              <p className="text-red-600">↓ {formatCurrency(data.saidasRealizadas)}</p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Fluxo de Caixa</h2>
            <p className="text-muted-foreground">Visualize entradas e saídas por período</p>
          </div>

          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-background z-50" align="end">
                <div className="p-3 space-y-2">
                  <div>
                    <p className="text-sm font-medium mb-2">Período Inicial</p>
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => date && setDateRange(prev => ({ ...prev, from: date }))}
                      className="pointer-events-auto"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Período Final</p>
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => date && setDateRange(prev => ({ ...prev, to: date }))}
                      className="pointer-events-auto"
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Botões de Período Rápido */}
        <div className="flex flex-wrap gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setPeriodoRapido("mes")}
          >
            Este Mês
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setPeriodoRapido("3meses")}
          >
            Últimos 3 Meses
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setPeriodoRapido("6meses")}
          >
            Últimos 6 Meses
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setPeriodoRapido("ano")}
          >
            Este Ano
          </Button>
        </div>

        {/* Toggle Realizado vs Previsto */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="realizado">Realizado</TabsTrigger>
            <TabsTrigger value="previsto">Previsto</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Entradas
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalEntradas)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Receitas no período
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Saídas
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalSaidas)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Despesas no período
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo do Período
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${saldoTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(saldoTotal)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Entradas - Saídas
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo Acumulado
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${saldoFinal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(saldoFinal)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Saldo final acumulado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Barras */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Entradas vs Saídas</CardTitle>
          <CardDescription>Comparação diária de movimentações financeiras</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="dia" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="entradas" fill="hsl(142, 71%, 45%)" name="Entradas" />
                <Bar dataKey="saidas" fill="hsl(0, 84%, 60%)" name="Saídas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Linha - Saldo Acumulado */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Saldo Acumulado</CardTitle>
          <CardDescription>Evolução do saldo ao longo do período</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="dia" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="saldoAcumulado" 
                  fill="hsl(var(--primary) / 0.2)" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Saldo Acumulado" 
                />
                <Line 
                  type="monotone" 
                  dataKey="saldo" 
                  stroke="hsl(var(--accent))" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Saldo do Dia" 
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
