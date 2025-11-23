import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { caixaAPI, contasPagarAPI, contasReceberAPI } from "@/lib/api";
import { ArrowDownCircle, ArrowUpCircle, Clock, CheckCircle2, XCircle, RefreshCw, DollarSign, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { format, startOfDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell } from "recharts";

interface Transaction {
  id: string;
  tipo: 'entrada' | 'saida';
  descricao: string;
  valor: number;
  data: string;
  status: 'processando' | 'concluido' | 'erro';
}

interface ChartDataPoint {
  hora: string;
  entradas: number;
  saidas: number;
}

interface ExpenseCategoryData {
  categoria: string;
  valor: number;
}

type Period = 'hoje' | '7dias' | '30dias';

const CATEGORY_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
] as const;

interface MonitoramentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caixaAberto: any;
}

export function MonitoramentoDialog({ open, onOpenChange, caixaAberto }: MonitoramentoDialogProps) {
  const [ultimasTransacoes, setUltimasTransacoes] = useState<Transaction[]>([]);
  const [contasPendentes, setContasPendentes] = useState({ pagar: 0, receber: 0 });
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [despesasPorCategoria, setDespesasPorCategoria] = useState<ExpenseCategoryData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('hoje');
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadMonitoringData = async () => {
    try {
      console.log('🔄 [MONITORAMENTO] Atualizando dados...');
      
      const agora = new Date();
      let dataInicio = startOfDay(agora);

      if (selectedPeriod === '7dias') {
        dataInicio = startOfDay(subDays(agora, 6));
      } else if (selectedPeriod === '30dias') {
        dataInicio = startOfDay(subDays(agora, 29));
      }

      if (caixaAberto && caixaAberto.movimentos) {
        const transacoes = caixaAberto.movimentos
          .slice(-10)
          .reverse()
          .map((mov: any, index: number) => ({
            id: `${caixaAberto.codigoCaixa}-${index}`,
            tipo: mov.tipo,
            descricao: mov.observacao || (mov.tipo === 'entrada' ? 'Entrada' : 'Saída'),
            valor: mov.valor,
            data: mov.data,
            status: 'concluido' as const
          }));
        setUltimasTransacoes(transacoes);

        const movimentosPeriodo = caixaAberto.movimentos.filter((mov: any) => {
          const movData = new Date(mov.data);
          return movData >= dataInicio && movData <= agora;
        });

        const dadosPorPeriodo: { [key: string]: { entradas: number; saidas: number } } = {};

        movimentosPeriodo.forEach((mov: any) => {
          const movData = new Date(mov.data);
          let chave: string;
          if (selectedPeriod === 'hoje') {
            chave = `${movData.getHours().toString().padStart(2, '0')}:00`;
          } else {
            chave = format(movData, "dd/MM");
          }

          if (!dadosPorPeriodo[chave]) {
            dadosPorPeriodo[chave] = { entradas: 0, saidas: 0 };
          }

          if (mov.tipo === 'entrada') {
            dadosPorPeriodo[chave].entradas += mov.valor;
          } else {
            dadosPorPeriodo[chave].saidas += mov.valor;
          }
        });

        const dadosGrafico = Object.entries(dadosPorPeriodo)
          .map(([label, valores]) => ({
            hora: label,
            entradas: valores.entradas,
            saidas: valores.saidas,
          }))
          .sort((a, b) => a.hora.localeCompare(b.hora));

        setChartData(dadosGrafico);
      }

      const [resumoPagar, resumoReceber, contasPagarLista] = await Promise.all([
        contasPagarAPI.getResumo(),
        contasReceberAPI.getResumo(),
        contasPagarAPI.getAll(),
      ]);

      setContasPendentes({
        pagar: resumoPagar.totalPendente || 0,
        receber: resumoReceber.totalPendente || 0,
      });

      const despesasPorCategoriaMap: { [categoria: string]: number } = {};

      contasPagarLista.forEach((conta: any) => {
        const categoria = conta.categoria || 'Outros';
        const valorConta = Number(conta.valorPago ?? conta.valor ?? 0);
        if (!valorConta) return;
        const dataRef = conta.dataPagamento || conta.dataVencimento;
        if (!dataRef) return;
        const dataConta = new Date(dataRef);
        if (dataConta < dataInicio || dataConta > agora) return;
        despesasPorCategoriaMap[categoria] = (despesasPorCategoriaMap[categoria] || 0) + valorConta;
      });

      const dadosDespesas = Object.entries(despesasPorCategoriaMap)
        .map(([categoria, valor]) => ({ categoria, valor }))
        .sort((a, b) => b.valor - a.valor);

      setDespesasPorCategoria(dadosDespesas);
      setLastUpdate(new Date());
      setLoading(false);
    } catch (error) {
      console.error('❌ [MONITORAMENTO] Erro ao carregar dados:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadMonitoringData();
    }
  }, [open, selectedPeriod]);

  useEffect(() => {
    if (!autoRefresh || !open) return;
    const interval = setInterval(() => {
      loadMonitoringData();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, selectedPeriod, open]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluido':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'processando':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'erro':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'concluido':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'processando':
        return <Clock className="h-4 w-4" />;
      case 'erro':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Monitoramento Financeiro</DialogTitle>
          <DialogDescription>Acompanhamento em tempo real das operações</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Carregando monitoramento...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Controles */}
            <div className="flex flex-wrap items-center gap-4 justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Período:</span>
                <div className="inline-flex rounded-md border bg-background p-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={"h-7 px-3 text-xs " + (selectedPeriod === 'hoje' ? 'bg-primary/10 text-primary' : '')}
                    onClick={() => setSelectedPeriod('hoje')}
                  >
                    Hoje
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={"h-7 px-3 text-xs " + (selectedPeriod === '7dias' ? 'bg-primary/10 text-primary' : '')}
                    onClick={() => setSelectedPeriod('7dias')}
                  >
                    Últimos 7 dias
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={"h-7 px-3 text-xs " + (selectedPeriod === '30dias' ? 'bg-primary/10 text-primary' : '')}
                    onClick={() => setSelectedPeriod('30dias')}
                  >
                    Últimos 30 dias
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Activity className="h-4 w-4" />
                  Última atualização: {format(lastUpdate, "HH:mm:ss", { locale: ptBR })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={autoRefresh ? 'border-primary' : ''}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                  {autoRefresh ? 'Auto-refresh' : 'Pausado'}
                </Button>
                <Button size="sm" onClick={loadMonitoringData}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
              </div>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    Status do Caixa
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {caixaAberto ? (
                    <div className="space-y-2">
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Aberto
                      </Badge>
                      <p className="text-2xl font-bold">
                        {caixaAberto.performance?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                      <p className="text-xs text-muted-foreground">{caixaAberto.codigoCaixa}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                        <XCircle className="h-3 w-3 mr-1" />
                        Fechado
                      </Badge>
                      <p className="text-sm text-muted-foreground">Nenhum caixa aberto</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <ArrowUpCircle className="h-4 w-4 text-green-500" />
                    Entradas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-500">
                    {caixaAberto?.entrada?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {caixaAberto?.movimentos?.filter((m: any) => m.tipo === 'entrada').length || 0} movimentos
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <ArrowDownCircle className="h-4 w-4 text-red-500" />
                    Saídas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-500">
                    {caixaAberto?.saida?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {caixaAberto?.movimentos?.filter((m: any) => m.tipo === 'saida').length || 0} movimentos
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    Saldo de Contas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-green-500">A Receber:</span>
                      <span className="text-sm font-semibold text-green-500">
                        {contasPendentes.receber.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-red-500">A Pagar:</span>
                      <span className="text-sm font-semibold text-red-500">
                        {contasPendentes.pagar.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium">Saldo:</span>
                      <span className={`text-sm font-bold ${(contasPendentes.receber - contasPendentes.pagar) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {(contasPendentes.receber - contasPendentes.pagar).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-5 w-5" />
                    Evolução de Entradas e Saídas
                  </CardTitle>
                  <CardDescription>
                    Movimentações financeiras ao longo do período selecionado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {chartData.length > 0 ? (
                    <ChartContainer
                      config={{
                        entradas: {
                          label: "Entradas",
                          color: "hsl(var(--chart-2))",
                        },
                        saidas: {
                          label: "Saídas",
                          color: "hsl(var(--chart-1))",
                        },
                      }}
                      className="h-[200px] w-full"
                    >
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="fillEntradas" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1} />
                          </linearGradient>
                          <linearGradient id="fillSaidas" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="hora" tickLine={false} axisLine={false} tickMargin={8} className="text-xs" />
                        <YAxis tickLine={false} axisLine={false} tickMargin={8} className="text-xs" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area
                          dataKey="entradas"
                          type="monotone"
                          fill="url(#fillEntradas)"
                          stroke="hsl(var(--chart-2))"
                          strokeWidth={2}
                        />
                        <Area
                          dataKey="saidas"
                          type="monotone"
                          fill="url(#fillSaidas)"
                          stroke="hsl(var(--chart-1))"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ChartContainer>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                      Nenhum dado disponível para o período selecionado
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingDown className="h-5 w-5" />
                    Distribuição de Despesas
                  </CardTitle>
                  <CardDescription>
                    Despesas por categoria no período selecionado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {despesasPorCategoria.length > 0 ? (
                    <ChartContainer
                      config={despesasPorCategoria.reduce((acc, item, idx) => {
                        acc[item.categoria] = {
                          label: item.categoria,
                          color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
                        };
                        return acc;
                      }, {} as any)}
                      className="h-[200px] w-full"
                    >
                      <PieChart>
                        <Pie
                          data={despesasPorCategoria}
                          dataKey="valor"
                          nameKey="categoria"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={(entry) => `${entry.categoria}: ${entry.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
                        >
                          {despesasPorCategoria.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ChartContainer>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                      Nenhuma despesa registrada no período selecionado
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Últimas Transações */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Últimas Transações</CardTitle>
                <CardDescription>10 movimentações mais recentes do caixa</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {ultimasTransacoes.length === 0 ? (
                    <p className="text-center py-4 text-muted-foreground">Nenhuma transação registrada</p>
                  ) : (
                    ultimasTransacoes.map((transacao) => (
                      <div
                        key={transacao.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${transacao.tipo === 'entrada' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                            {transacao.tipo === 'entrada' ? (
                              <ArrowUpCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                            ) : (
                              <ArrowDownCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{transacao.descricao}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(transacao.data), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className={getStatusColor(transacao.status)}>
                            {getStatusIcon(transacao.status)}
                            <span className="ml-1 capitalize">{transacao.status}</span>
                          </Badge>
                          <p className={`font-bold text-sm ${transacao.tipo === 'entrada' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {transacao.tipo === 'entrada' ? '+' : '-'} {transacao.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
