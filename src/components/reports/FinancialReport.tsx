import { useMemo, useState } from "react";
import { ReportFilters } from "./ReportFilters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  Calendar,
  CreditCard,
  Wallet
} from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area, AreaChart } from "recharts";

interface FinancialReportProps {
  contasPagar: any[];
  contasReceber: any[];
  vendas: any[];
  caixas: any[];
}

export const FinancialReport = ({ contasPagar, contasReceber, vendas, caixas }: FinancialReportProps) => {
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const analiseFinanceira = useMemo(() => {
    const hoje = new Date();
    const proximosMes = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Análise de Contas a Pagar
    const contasPagarPendentes = contasPagar.filter((c: any) => 
      c.status === 'Pendente' || c.status === 'Parcial'
    );
    const contasPagarVencidas = contasPagar.filter((c: any) => {
      const vencimento = new Date(c.dataVencimento);
      return (c.status === 'Pendente' || c.status === 'Parcial') && vencimento < hoje;
    });
    const contasPagarVencerMes = contasPagar.filter((c: any) => {
      const vencimento = new Date(c.dataVencimento);
      return (c.status === 'Pendente' || c.status === 'Parcial') && 
             vencimento >= hoje && vencimento <= proximosMes;
    });

    const totalPagar = contasPagarPendentes.reduce((sum: number, c: any) => 
      sum + (c.valor - (c.valorPago || 0)), 0
    );
    const totalPagarVencido = contasPagarVencidas.reduce((sum: number, c: any) => 
      sum + (c.valor - (c.valorPago || 0)), 0
    );
    const totalPagarVencerMes = contasPagarVencerMes.reduce((sum: number, c: any) => 
      sum + (c.valor - (c.valorPago || 0)), 0
    );

    // Análise de Contas a Receber
    const contasReceberPendentes = contasReceber.filter((c: any) => 
      c.status === 'Pendente' || c.status === 'Parcial'
    );
    const contasReceberVencidas = contasReceber.filter((c: any) => {
      const vencimento = new Date(c.dataVencimento);
      return (c.status === 'Pendente' || c.status === 'Parcial') && vencimento < hoje;
    });
    const contasReceberVencerMes = contasReceber.filter((c: any) => {
      const vencimento = new Date(c.dataVencimento);
      return (c.status === 'Pendente' || c.status === 'Parcial') && 
             vencimento >= hoje && vencimento <= proximosMes;
    });

    const totalReceber = contasReceberPendentes.reduce((sum: number, c: any) => 
      sum + (c.valor - (c.valorRecebido || 0)), 0
    );
    const totalReceberVencido = contasReceberVencidas.reduce((sum: number, c: any) => 
      sum + (c.valor - (c.valorRecebido || 0)), 0
    );
    const totalReceberVencerMes = contasReceberVencerMes.reduce((sum: number, c: any) => 
      sum + (c.valor - (c.valorRecebido || 0)), 0
    );

    // Fluxo de Caixa (últimos 30 dias)
    const dias30Atras = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const fluxoCaixaDiario = new Map<string, { data: string; entradas: number; saidas: number; saldo: number }>();

    // Processar vendas (entradas)
    vendas.forEach((venda: any) => {
      const dataVenda = new Date(venda.data || venda.dataVenda);
      if (dataVenda >= dias30Atras && dataVenda <= hoje) {
        const dataKey = dataVenda.toLocaleDateString('pt-BR', { 
          day: '2-digit', 
          month: '2-digit'
        });
        
        const existing = fluxoCaixaDiario.get(dataKey) || { data: dataKey, entradas: 0, saidas: 0, saldo: 0 };
        existing.entradas += venda.valorTotal || 0;
        fluxoCaixaDiario.set(dataKey, existing);
      }
    });

    // Processar contas pagas (saídas)
    contasPagar.forEach((conta: any) => {
      if (conta.dataPagamento) {
        const dataPagamento = new Date(conta.dataPagamento);
        if (dataPagamento >= dias30Atras && dataPagamento <= hoje) {
          const dataKey = dataPagamento.toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: '2-digit'
          });
          
          const existing = fluxoCaixaDiario.get(dataKey) || { data: dataKey, entradas: 0, saidas: 0, saldo: 0 };
          existing.saidas += conta.valorPago || 0;
          fluxoCaixaDiario.set(dataKey, existing);
        }
      }
    });

    // Calcular saldo acumulado
    const fluxoCaixaArray = Array.from(fluxoCaixaDiario.values()).sort((a, b) => {
      const [diaA, mesA] = a.data.split('/').map(Number);
      const [diaB, mesB] = b.data.split('/').map(Number);
      const dateA = new Date(2024, mesA - 1, diaA);
      const dateB = new Date(2024, mesB - 1, diaB);
      return dateA.getTime() - dateB.getTime();
    });

    let saldoAcumulado = 0;
    fluxoCaixaArray.forEach(item => {
      saldoAcumulado += item.entradas - item.saidas;
      item.saldo = saldoAcumulado;
    });

    // Projeção para próximos 30 dias
    const mediaEntradasDiaria = fluxoCaixaArray.reduce((sum, item) => sum + item.entradas, 0) / (fluxoCaixaArray.length || 1);
    const mediaSaidasDiaria = fluxoCaixaArray.reduce((sum, item) => sum + item.saidas, 0) / (fluxoCaixaArray.length || 1);

    const projecao30dias = [];
    for (let i = 1; i <= 30; i++) {
      const dataProjecao = new Date(hoje.getTime() + i * 24 * 60 * 60 * 1000);
      const dataKey = dataProjecao.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit'
      });
      
      saldoAcumulado += mediaEntradasDiaria - mediaSaidasDiaria;
      
      projecao30dias.push({
        data: dataKey,
        entradas: mediaEntradasDiaria,
        saidas: mediaSaidasDiaria,
        saldo: saldoAcumulado
      });
    }

    // Saldo atual do caixa
    const caixaAberto = caixas.find((c: any) => c.status === 'Aberto');
    const saldoCaixaAtual = caixaAberto?.valorAtual || 0;

    // Saldo projetado (considerando contas a receber e pagar)
    const saldoProjetado = saldoCaixaAtual + totalReceber - totalPagar;

    return {
      // Contas a Pagar
      totalPagar,
      totalPagarVencido,
      totalPagarVencerMes,
      contasPagarPendentes: contasPagarPendentes.length,
      contasPagarVencidas: contasPagarVencidas.length,

      // Contas a Receber
      totalReceber,
      totalReceberVencido,
      totalReceberVencerMes,
      contasReceberPendentes: contasReceberPendentes.length,
      contasReceberVencidas: contasReceberVencidas.length,

      // Fluxo de Caixa
      fluxoCaixaArray,
      saldoCaixaAtual,
      saldoProjetado,
      projecao30dias,

      // Médias
      mediaEntradasDiaria,
      mediaSaidasDiaria,

      // Listas detalhadas
      contasPagarVencidasList: contasPagarVencidas,
      contasReceberVencidasList: contasReceberVencidas
    };
  }, [contasPagar, contasReceber, vendas, caixas, dataInicio, dataFim]);

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

      {/* Visão Geral */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-background dark:from-green-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              A Receber
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(analiseFinanceira.totalReceber)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {analiseFinanceira.contasReceberPendentes} contas pendentes
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-background dark:from-red-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              A Pagar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(analiseFinanceira.totalPagar)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {analiseFinanceira.contasPagarPendentes} contas pendentes
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-background dark:from-blue-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4 text-blue-600" />
              Saldo em Caixa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(analiseFinanceira.saldoCaixaAtual)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">saldo atual</p>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${
          analiseFinanceira.saldoProjetado >= 0
            ? 'from-purple-50 to-background dark:from-purple-950/20'
            : 'from-orange-50 to-background dark:from-orange-950/20'
        }`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CreditCard className={`h-4 w-4 ${analiseFinanceira.saldoProjetado >= 0 ? 'text-purple-600' : 'text-orange-600'}`} />
              Saldo Projetado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${analiseFinanceira.saldoProjetado >= 0 ? 'text-purple-600' : 'text-orange-600'}`}>
              {formatCurrency(analiseFinanceira.saldoProjetado)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">contas futuras incluídas</p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de Vencimento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              Contas Vencidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">A Pagar Vencidas</p>
                <p className="text-xl font-bold text-red-600">
                  {formatCurrency(analiseFinanceira.totalPagarVencido)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {analiseFinanceira.contasPagarVencidas} contas
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">A Receber Vencidas</p>
                <p className="text-xl font-bold text-orange-600">
                  {formatCurrency(analiseFinanceira.totalReceberVencido)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {analiseFinanceira.contasReceberVencidas} contas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 dark:border-yellow-900">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-yellow-600">
              <Calendar className="h-4 w-4" />
              Vencimento nos Próximos 30 dias
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">A Pagar</p>
                <p className="text-xl font-bold text-yellow-600">
                  {formatCurrency(analiseFinanceira.totalPagarVencerMes)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">A Receber</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(analiseFinanceira.totalReceberVencerMes)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fluxo de Caixa - Últimos 30 dias */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Fluxo de Caixa - Últimos 30 Dias
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Média diária: {formatCurrency(analiseFinanceira.mediaEntradasDiaria)} entrada | {formatCurrency(analiseFinanceira.mediaSaidasDiaria)} saída
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={analiseFinanceira.fluxoCaixaArray}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="data" 
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: any) => formatCurrency(value)}
                />
                <Legend />
                <Bar dataKey="entradas" fill="hsl(142, 76%, 36%)" name="Entradas" />
                <Bar dataKey="saidas" fill="hsl(0, 84%, 60%)" name="Saídas" />
                <Line 
                  type="monotone" 
                  dataKey="saldo" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  name="Saldo"
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Projeção de Fluxo de Caixa - Próximos 30 dias */}
      <Card className="bg-gradient-to-br from-blue-50/50 to-background dark:from-blue-950/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                Projeção de Fluxo de Caixa - Próximos 30 Dias
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Baseado na média dos últimos 30 dias
              </p>
            </div>
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              Estimativa
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analiseFinanceira.projecao30dias}>
                <defs>
                  <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="data" 
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: any) => formatCurrency(value)}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="saldo" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  fill="url(#colorSaldo)"
                  name="Saldo Projetado"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
