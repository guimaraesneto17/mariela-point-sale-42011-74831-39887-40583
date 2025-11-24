import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp, TrendingDown, Wallet, DollarSign, Activity, CalendarIcon, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Movimento {
  tipo: 'entrada' | 'saida';
  valor: number;
  data: string;
  codigoVenda?: string | null;
  formaPagamento?: string | null;
  observacao?: string | null;
}

interface Caixa {
  codigoCaixa: string;
  dataAbertura: string;
  dataFechamento?: string | null;
  status: 'aberto' | 'fechado';
  valorInicial: number;
  entrada: number;
  saida: number;
  performance: number;
  movimentos: Movimento[];
}

interface CaixaAnalysisReportProps {
  caixas: Caixa[];
}

export function CaixaAnalysisReport({ caixas }: CaixaAnalysisReportProps) {
  const [dataInicio, setDataInicio] = useState<Date | undefined>(undefined);
  const [dataFim, setDataFim] = useState<Date | undefined>(undefined);

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarData = (data: string) => {
    try {
      return format(new Date(data), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return data;
    }
  };

  // Preparar dados para os gráficos
  const caixasFechados = caixas
    .filter(c => c.status === 'fechado')
    .filter(c => {
      // Filtrar por período se datas foram selecionadas
      if (!dataInicio && !dataFim) return true;
      
      const dataAbertura = new Date(c.dataAbertura);
      
      if (dataInicio && dataFim) {
        const inicio = new Date(dataInicio);
        const fim = new Date(dataFim);
        inicio.setHours(0, 0, 0, 0);
        fim.setHours(23, 59, 59, 999);
        return dataAbertura >= inicio && dataAbertura <= fim;
      } else if (dataInicio) {
        const inicio = new Date(dataInicio);
        inicio.setHours(0, 0, 0, 0);
        return dataAbertura >= inicio;
      } else if (dataFim) {
        const fim = new Date(dataFim);
        fim.setHours(23, 59, 59, 999);
        return dataAbertura <= fim;
      }
      return true;
    })
    .sort((a, b) => new Date(a.dataAbertura).getTime() - new Date(b.dataAbertura).getTime());

  // Dados para gráfico de linha (evolução)
  const dadosEvolucao = caixasFechados.map(caixa => ({
    nome: caixa.codigoCaixa,
    data: formatarData(caixa.dataAbertura),
    performance: caixa.performance,
    entrada: caixa.entrada,
    saida: caixa.saida,
  }));

  // Dados para gráfico de barras (comparativo)
  const dadosComparativo = caixasFechados.slice(-10).map(caixa => ({
    nome: caixa.codigoCaixa.replace('CAIXA', ''),
    'Valor Inicial': caixa.valorInicial,
    'Entradas': caixa.entrada,
    'Saídas': caixa.saida,
  }));

  // Estatísticas gerais
  const totalCaixas = caixasFechados.length;
  const mediaPerformance = totalCaixas > 0 
    ? caixasFechados.reduce((acc, c) => acc + c.performance, 0) / totalCaixas 
    : 0;
  const mediaEntradas = totalCaixas > 0 
    ? caixasFechados.reduce((acc, c) => acc + c.entrada, 0) / totalCaixas 
    : 0;
  const mediaSaidas = totalCaixas > 0 
    ? caixasFechados.reduce((acc, c) => acc + c.saida, 0) / totalCaixas 
    : 0;
  const melhorPerformance = caixasFechados.length > 0
    ? caixasFechados.reduce((max, c) => c.performance > max.performance ? c : max, caixasFechados[0])
    : null;
  const piorPerformance = caixasFechados.length > 0
    ? caixasFechados.reduce((min, c) => c.performance < min.performance ? c : min, caixasFechados[0])
    : null;

  // Análise de tendência (últimos 5 vs 5 anteriores)
  const ultimos5 = caixasFechados.slice(-5);
  const anteriores5 = caixasFechados.slice(-10, -5);
  
  const mediaUltimos5 = ultimos5.length > 0
    ? ultimos5.reduce((acc, c) => acc + c.performance, 0) / ultimos5.length
    : 0;
  const mediaAnteriores5 = anteriores5.length > 0
    ? anteriores5.reduce((acc, c) => acc + c.performance, 0) / anteriores5.length
    : 0;
  
  const tendencia = mediaAnteriores5 > 0 
    ? ((mediaUltimos5 - mediaAnteriores5) / mediaAnteriores5) * 100 
    : 0;

  if (caixasFechados.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Análise Comparativa de Caixas
          </CardTitle>
          <CardDescription>
            Evolução de performance ao longo do tempo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filtros de Período */}
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">Período de análise:</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "justify-start text-left font-normal",
                            !dataInicio && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dataInicio ? format(dataInicio, "dd/MM/yyyy", { locale: ptBR }) : "Data inicial"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dataInicio}
                          onSelect={setDataInicio}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>

                    <span className="text-muted-foreground">até</span>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "justify-start text-left font-normal",
                            !dataFim && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dataFim ? format(dataFim, "dd/MM/yyyy", { locale: ptBR }) : "Data final"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dataFim}
                          onSelect={setDataFim}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {(dataInicio || dataFim) && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="gap-2">
                        Período ativo
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDataInicio(undefined);
                          setDataFim(undefined);
                        }}
                        className="h-8 gap-1"
                      >
                        <X className="h-3 w-3" />
                        Limpar filtros
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="text-center py-8 text-muted-foreground">
              Nenhum caixa fechado encontrado para o período selecionado
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros de Período */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Período de análise:</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !dataInicio && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataInicio ? format(dataInicio, "dd/MM/yyyy", { locale: ptBR }) : "Data inicial"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataInicio}
                    onSelect={setDataInicio}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              <span className="text-muted-foreground">até</span>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !dataFim && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataFim ? format(dataFim, "dd/MM/yyyy", { locale: ptBR }) : "Data final"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataFim}
                    onSelect={setDataFim}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {(dataInicio || dataFim) && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-2">
                  Período ativo
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDataInicio(undefined);
                    setDataFim(undefined);
                  }}
                  className="h-8 gap-1"
                >
                  <X className="h-3 w-3" />
                  Limpar filtros
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-background dark:from-blue-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Caixas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">{totalCaixas}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Caixas fechados</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-background dark:from-green-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Média de Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold text-green-600">
                {formatarMoeda(mediaPerformance)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Por caixa fechado</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-background dark:from-orange-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tendência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {tendencia >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
              <span className={`text-2xl font-bold ${tendencia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {tendencia >= 0 ? '+' : ''}{tendencia.toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Últimos 5 vs anteriores</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-background dark:from-purple-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Melhor Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-purple-600" />
              <span className="text-2xl font-bold text-purple-600">
                {melhorPerformance ? formatarMoeda(melhorPerformance.performance) : '—'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2 truncate">
              {melhorPerformance ? melhorPerformance.codigoCaixa : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Evolução */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Evolução de Performance
          </CardTitle>
          <CardDescription>
            Performance ao longo do tempo para todos os caixas fechados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={dadosEvolucao}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="data" 
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `R$ ${value.toFixed(0)}`}
              />
              <Tooltip 
                formatter={(value: number) => formatarMoeda(value)}
                labelStyle={{ color: '#000' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="performance" 
                stroke="#8b5cf6" 
                name="Performance" 
                strokeWidth={3}
                dot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="entrada" 
                stroke="#22c55e" 
                name="Entradas" 
                strokeWidth={2}
                strokeDasharray="5 5"
              />
              <Line 
                type="monotone" 
                dataKey="saida" 
                stroke="#ef4444" 
                name="Saídas" 
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico Comparativo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Comparativo Detalhado
          </CardTitle>
          <CardDescription>
            Últimos 10 caixas - valores iniciais, entradas e saídas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={dadosComparativo}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="nome" 
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `R$ ${value.toFixed(0)}`}
              />
              <Tooltip 
                formatter={(value: number) => formatarMoeda(value)}
                labelStyle={{ color: '#000' }}
              />
              <Legend />
              <Bar dataKey="Valor Inicial" fill="#3b82f6" />
              <Bar dataKey="Entradas" fill="#22c55e" />
              <Bar dataKey="Saídas" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabela de Detalhes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Detalhamento por Caixa
          </CardTitle>
          <CardDescription>
            Últimos 10 caixas com detalhes completos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {caixasFechados.slice(-10).reverse().map((caixa) => (
              <div 
                key={caixa.codigoCaixa}
                className="p-4 rounded-lg border bg-gradient-to-r from-background to-muted/20"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold">{caixa.codigoCaixa}</h4>
                    <p className="text-xs text-muted-foreground">
                      {formatarData(caixa.dataAbertura)}
                    </p>
                  </div>
                  <Badge 
                    variant={caixa.performance >= 0 ? "default" : "destructive"}
                    className="text-sm"
                  >
                    {formatarMoeda(caixa.performance)}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Valor Inicial</p>
                    <p className="font-medium">{formatarMoeda(caixa.valorInicial)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Entradas</p>
                    <p className="font-medium text-green-600">{formatarMoeda(caixa.entrada)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Saídas</p>
                    <p className="font-medium text-red-600">{formatarMoeda(caixa.saida)}</p>
                  </div>
                </div>
                
                <div className="mt-2 text-xs text-muted-foreground">
                  {caixa.movimentos.length} movimentações
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
