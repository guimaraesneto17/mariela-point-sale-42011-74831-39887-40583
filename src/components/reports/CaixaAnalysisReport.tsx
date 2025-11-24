import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, subDays, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp, TrendingDown, Wallet, DollarSign, Activity, CalendarIcon, X, Download, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";

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

  // Função para definir período predefinido
  const setPeriodoPredefinido = (tipo: 'semana' | 'mes' | '3meses') => {
    const hoje = new Date();
    
    switch (tipo) {
      case 'semana':
        setDataInicio(subDays(hoje, 7));
        setDataFim(hoje);
        break;
      case 'mes':
        setDataInicio(subMonths(hoje, 1));
        setDataFim(hoje);
        break;
      case '3meses':
        setDataInicio(subMonths(hoje, 3));
        setDataFim(hoje);
        break;
    }
  };

  // Função para exportar PDF
  const exportarPDF = () => {
    const doc = new jsPDF();
    
    // Configurações
    const margemEsquerda = 15;
    const margemDireita = 195;
    let yPos = 20;
    const lineHeight = 7;
    
    // Cabeçalho
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("RELATÓRIO DE ANÁLISE DE CAIXAS", margemEsquerda, yPos);
    
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, margemEsquerda, yPos);
    
    yPos += 5;
    if (dataInicio || dataFim) {
      const periodo = `Período: ${dataInicio ? format(dataInicio, "dd/MM/yyyy", { locale: ptBR }) : 'Início'} até ${dataFim ? format(dataFim, "dd/MM/yyyy", { locale: ptBR }) : 'Hoje'}`;
      doc.text(periodo, margemEsquerda, yPos);
    } else {
      doc.text("Período: Todos os caixas", margemEsquerda, yPos);
    }
    
    yPos += 15;
    
    // Estatísticas Gerais
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Estatísticas Gerais", margemEsquerda, yPos);
    
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(margemEsquerda, yPos - 5, 180, 30, 3, 3, 'FD');
    
    doc.text(`Total de Caixas: ${totalCaixas}`, margemEsquerda + 5, yPos);
    yPos += lineHeight;
    doc.text(`Média de Performance: ${formatarMoeda(mediaPerformance)}`, margemEsquerda + 5, yPos);
    yPos += lineHeight;
    doc.text(`Média de Entradas: ${formatarMoeda(mediaEntradas)}`, margemEsquerda + 5, yPos);
    yPos += lineHeight;
    doc.text(`Média de Saídas: ${formatarMoeda(mediaSaidas)}`, margemEsquerda + 5, yPos);
    
    yPos += 15;
    
    // Melhor e Pior Performance
    if (melhorPerformance && piorPerformance) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Destaques", margemEsquerda, yPos);
      
      yPos += 10;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      doc.setTextColor(34, 139, 34);
      doc.text(`Melhor Performance: ${melhorPerformance.codigoCaixa} - ${formatarMoeda(melhorPerformance.performance)}`, margemEsquerda, yPos);
      yPos += lineHeight;
      
      doc.setTextColor(220, 38, 38);
      doc.text(`Pior Performance: ${piorPerformance.codigoCaixa} - ${formatarMoeda(piorPerformance.performance)}`, margemEsquerda, yPos);
      
      doc.setTextColor(0, 0, 0);
      yPos += 15;
    }
    
    // Listagem de Caixas
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Detalhamento dos Caixas", margemEsquerda, yPos);
    
    yPos += 10;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    
    // Cabeçalho da tabela
    doc.text("Código", margemEsquerda, yPos);
    doc.text("Data", margemEsquerda + 40, yPos);
    doc.text("Inicial", margemEsquerda + 75, yPos);
    doc.text("Entradas", margemEsquerda + 105, yPos);
    doc.text("Saídas", margemEsquerda + 135, yPos);
    doc.text("Performance", margemEsquerda + 160, yPos);
    yPos += 5;
    
    doc.setDrawColor(200, 200, 200);
    doc.line(margemEsquerda, yPos, margemDireita, yPos);
    yPos += 5;
    
    doc.setFont("helvetica", "normal");
    
    caixasFechados.slice(-15).forEach((caixa) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.text(caixa.codigoCaixa.replace('CAIXA', ''), margemEsquerda, yPos);
      doc.text(formatarData(caixa.dataAbertura), margemEsquerda + 40, yPos);
      doc.text(formatarMoeda(caixa.valorInicial), margemEsquerda + 75, yPos);
      doc.setTextColor(34, 139, 34);
      doc.text(formatarMoeda(caixa.entrada), margemEsquerda + 105, yPos);
      doc.setTextColor(220, 38, 38);
      doc.text(formatarMoeda(caixa.saida), margemEsquerda + 135, yPos);
      
      if (caixa.performance >= 0) {
        doc.setTextColor(34, 139, 34);
      } else {
        doc.setTextColor(220, 38, 38);
      }
      doc.text(formatarMoeda(caixa.performance), margemEsquerda + 160, yPos);
      doc.setTextColor(0, 0, 0);
      
      yPos += 6;
    });
    
    // Rodapé
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Mariela PDV - Análise de Caixas | Página ${i} de ${totalPages}`,
        margemDireita,
        290,
        { align: 'right' }
      );
    }
    
    doc.save(`Analise_Caixas_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`);
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

  // Dados para gráfico de pizza (distribuição de formas de pagamento)
  const formasPagamentoMap = new Map<string, number>();
  const formasPagamentoQtdMap = new Map<string, number>();
  
  caixasFechados.forEach(caixa => {
    caixa.movimentos
      .filter(mov => mov.tipo === 'entrada' && mov.formaPagamento)
      .forEach(mov => {
        const forma = mov.formaPagamento || 'Não especificado';
        const valorAtual = formasPagamentoMap.get(forma) || 0;
        const qtdAtual = formasPagamentoQtdMap.get(forma) || 0;
        formasPagamentoMap.set(forma, valorAtual + mov.valor);
        formasPagamentoQtdMap.set(forma, qtdAtual + 1);
      });
  });

  const dadosFormasPagamento = Array.from(formasPagamentoMap.entries())
    .map(([name, value]) => ({ 
      name, 
      value,
      quantidade: formasPagamentoQtdMap.get(name) || 0,
      ticketMedio: value / (formasPagamentoQtdMap.get(name) || 1)
    }))
    .sort((a, b) => b.value - a.value);

  const totalFormasPagamento = dadosFormasPagamento.reduce((acc, item) => acc + item.value, 0);

  // Cores para o gráfico de pizza
  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

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
                <div className="space-y-4">
                  {/* Atalhos de Período */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Atalhos:</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPeriodoPredefinido('semana')}
                    >
                      Última Semana
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPeriodoPredefinido('mes')}
                    >
                      Último Mês
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPeriodoPredefinido('3meses')}
                    >
                      Últimos 3 Meses
                    </Button>
                  </div>

                  {/* Seleção Manual de Datas */}
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium">Período customizado:</span>
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
          <div className="space-y-4">
            {/* Botão de Exportar */}
            <div className="flex justify-end">
              <Button onClick={exportarPDF} className="gap-2">
                <Download className="h-4 w-4" />
                Exportar PDF
              </Button>
            </div>

            {/* Atalhos de Período */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Atalhos:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPeriodoPredefinido('semana')}
              >
                Última Semana
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPeriodoPredefinido('mes')}
              >
                Último Mês
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPeriodoPredefinido('3meses')}
              >
                Últimos 3 Meses
              </Button>
            </div>

            {/* Seleção Manual de Datas */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">Período customizado:</span>
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

      {/* Gráfico de Pizza - Distribuição de Formas de Pagamento */}
      {dadosFormasPagamento.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Distribuição de Formas de Pagamento
            </CardTitle>
            <CardDescription>
              Análise das entradas por forma de pagamento nos caixas filtrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={dadosFormasPagamento}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dadosFormasPagamento.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatarMoeda(value)}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>

            {/* Tabela de detalhamento */}
            <div className="mt-6 space-y-2">
              <h4 className="font-semibold text-sm">Detalhamento por Forma de Pagamento:</h4>
              <div className="grid gap-2">
                {dadosFormasPagamento.map((forma, index) => (
                  <div 
                    key={forma.name} 
                    className="p-4 rounded-lg bg-muted/50 border border-border"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-semibold text-base">{forma.name}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {forma.quantidade} transações
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Total</div>
                        <div className="font-semibold text-sm">{formatarMoeda(forma.value)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Ticket Médio</div>
                        <div className="font-semibold text-sm text-primary">{formatarMoeda(forma.ticketMedio)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">% do Total</div>
                        <div className="font-semibold text-sm">
                          {((forma.value / totalFormasPagamento) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
