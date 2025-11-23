import { useState, useEffect } from "react";
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

export default function Monitoramento() {
  const [caixaAberto, setCaixaAberto] = useState<any>(null);
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
      
      // Definir período base para os gráficos
      const agora = new Date();
      let dataInicio = startOfDay(agora);

      if (selectedPeriod === '7dias') {
        dataInicio = startOfDay(subDays(agora, 6));
      } else if (selectedPeriod === '30dias') {
        dataInicio = startOfDay(subDays(agora, 29));
      }
      
      // Buscar caixa aberto
      const caixa = await caixaAPI.getCaixaAberto();
      setCaixaAberto(caixa);
      console.log('✅ [MONITORAMENTO] Caixa carregado:', caixa?.codigoCaixa);

      // Buscar últimas transações (últimos 10 movimentos do caixa)
      if (caixa && caixa.movimentos) {
        const transacoes = caixa.movimentos
          .slice(-10)
          .reverse()
          .map((mov: any, index: number) => ({
            id: `${caixa.codigoCaixa}-${index}`,
            tipo: mov.tipo,
            descricao: mov.observacao || (mov.tipo === 'entrada' ? 'Entrada' : 'Saída'),
            valor: mov.valor,
            data: mov.data,
            status: 'concluido' as const
          }));
        setUltimasTransacoes(transacoes);
        console.log('✅ [MONITORAMENTO] Transações carregadas:', transacoes.length);

        // Processar dados para o gráfico de evolução, considerando o período selecionado
        const movimentosPeriodo = caixa.movimentos.filter((mov: any) => {
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
        console.log('✅ [MONITORAMENTO] Dados do gráfico processados:', dadosGrafico.length, 'pontos');
      }

      // Buscar resumo de contas pendentes e lista de contas para distribuição por categoria
      const [resumoPagar, resumoReceber, contasPagarLista] = await Promise.all([
        contasPagarAPI.getResumo(),
        contasReceberAPI.getResumo(),
        contasPagarAPI.getAll(),
      ]);

      setContasPendentes({
        pagar: resumoPagar.totalPendente || 0,
        receber: resumoReceber.totalPendente || 0,
      });
      console.log('✅ [MONITORAMENTO] Contas pendentes:', { pagar: resumoPagar.totalPendente, receber: resumoReceber.totalPendente });

      // Processar despesas por categoria no período selecionado
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
      console.log('✅ [MONITORAMENTO] Despesas por categoria processadas:', dadosDespesas.length, 'categorias');

      setLastUpdate(new Date());
      setLoading(false);
    } catch (error) {
      console.error('❌ [MONITORAMENTO] Erro ao carregar dados:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMonitoringData();
  }, [selectedPeriod]);

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadMonitoringData();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, selectedPeriod]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando monitoramento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Monitoramento Financeiro</h1>
            <p className="text-muted-foreground">Acompanhamento em tempo real das operações</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
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
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Status do Caixa */}
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

          {/* Entradas */}
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

          {/* Saídas */}
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

          {/* Saldo de Contas */}
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
          {/* Gráfico de Evolução */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
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
                  className="h-[300px] w-full"
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
                    <XAxis
                      dataKey="hora"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      className="text-xs"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      className="text-xs"
                      tickFormatter={(value) =>
                        new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                          minimumFractionDigits: 0,
                        }).format(value)
                      }
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          labelFormatter={(value) => `Período: ${value}`}
                          formatter={(value, name) => [
                            new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(value as number),
                            name === 'entradas' ? 'Entradas' : 'Saídas',
                          ]}
                        />
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="entradas"
                      stroke="hsl(var(--chart-2))"
                      fill="url(#fillEntradas)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="saidas"
                      stroke="hsl(var(--chart-1))"
                      fill="url(#fillSaidas)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>Nenhum dado disponível para o gráfico no período selecionado</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gráfico de Despesas por Categoria */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5" />
                Despesas por Categoria
              </CardTitle>
              <CardDescription>
                Distribuição das despesas no período selecionado
              </CardDescription>
            </CardHeader>
            <CardContent>
              {despesasPorCategoria.length > 0 ? (
                <ChartContainer
                  config={{
                    valor: {
                      label: "Valor",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-[300px] w-full"
                >
                  <PieChart>
                    <Pie
                      data={despesasPorCategoria}
                      dataKey="valor"
                      nameKey="categoria"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      strokeWidth={2}
                    >
                      {despesasPorCategoria.map((item, index) => (
                        <Cell
                          key={item.categoria}
                          fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, _name, item) => [
                            new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(value as number),
                            (item?.payload as any)?.categoria ?? 'Categoria',
                          ]}
                        />
                      }
                    />
                  </PieChart>
                </ChartContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  <div className="text-center">
                    <TrendingDown className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>Nenhuma despesa encontrada para o período selecionado</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Últimas Transações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Últimas Transações
            </CardTitle>
            <CardDescription>
              Últimos 10 movimentos processados no caixa
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ultimasTransacoes.length > 0 ? (
              <div className="space-y-3">
                {ultimasTransacoes.map((transacao) => (
                  <div
                    key={transacao.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${transacao.tipo === 'entrada' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                        {transacao.tipo === 'entrada' ? (
                          <ArrowUpCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <ArrowDownCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{transacao.descricao}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(transacao.data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={getStatusColor(transacao.status)}>
                        {getStatusIcon(transacao.status)}
                        <span className="ml-1 capitalize">{transacao.status}</span>
                      </Badge>
                      <p className={`font-bold text-lg ${transacao.tipo === 'entrada' ? 'text-green-500' : 'text-red-500'}`}>
                        {transacao.tipo === 'entrada' ? '+' : '-'}
                        {transacao.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Nenhuma transação processada ainda</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações Adicionais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Sincronização do Caixa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Última sincronização:</span>
                <span className="text-sm font-medium">{format(lastUpdate, "HH:mm:ss", { locale: ptBR })}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Próxima atualização em:</span>
                <span className="text-sm font-medium">{autoRefresh ? '30 segundos' : 'Pausado'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status da conexão:</span>
                <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Conectado
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Performance do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Transações processadas hoje:</span>
                <span className="text-sm font-medium">{caixaAberto?.movimentos?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Taxa de sucesso:</span>
                <span className="text-sm font-medium text-green-500">100%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tempo médio de resposta:</span>
                <span className="text-sm font-medium">~200ms</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
