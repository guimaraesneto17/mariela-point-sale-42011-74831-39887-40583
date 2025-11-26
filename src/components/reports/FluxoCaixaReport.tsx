import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Calendar, DollarSign } from "lucide-react";
import { addDays, format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface FluxoCaixaReportProps {
  contasPagar: any[];
  contasReceber: any[];
}

export function FluxoCaixaReport({ contasPagar, contasReceber }: FluxoCaixaReportProps) {
  
  const calcularFluxo = (dias: number = 30) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataFinal = addDays(hoje, dias);
    
    const fluxoDiario: { [key: string]: { data: Date, entradas: number, saidas: number, saldo: number } } = {};
    
    // Inicializar todos os dias
    for (let i = 0; i <= dias; i++) {
      const data = addDays(hoje, i);
      const key = format(data, 'yyyy-MM-dd');
      fluxoDiario[key] = {
        data,
        entradas: 0,
        saidas: 0,
        saldo: 0
      };
    }
    
    // Processar contas a receber (entradas)
    contasReceber.forEach((conta: any) => {
      if (conta.tipoCriacao === 'Parcelamento' || conta.tipoCriacao === 'Replica') {
        conta.parcelas?.forEach((parcela: any) => {
          if (parcela.status === 'Pendente' || parcela.status === 'Parcial' || parcela.status === 'Vencido') {
            const dataVenc = new Date(parcela.dataVencimento);
            const key = format(dataVenc, 'yyyy-MM-dd');
            if (fluxoDiario[key]) {
              const valorRestante = parcela.valor - (parcela.recebimento?.valor || 0);
              fluxoDiario[key].entradas += valorRestante;
            }
          }
        });
      } else if (conta.status === 'Pendente' || conta.status === 'Parcial' || conta.status === 'Vencido') {
        const dataVenc = new Date(conta.dataVencimento);
        const key = format(dataVenc, 'yyyy-MM-dd');
        if (fluxoDiario[key]) {
          const valorRestante = conta.valor - (conta.recebimento?.valor || 0);
          fluxoDiario[key].entradas += valorRestante;
        }
      }
    });
    
    // Processar contas a pagar (saídas)
    contasPagar.forEach((conta: any) => {
      if (conta.tipoCriacao === 'Parcelamento' || conta.tipoCriacao === 'Replica') {
        conta.parcelas?.forEach((parcela: any) => {
          if (parcela.status === 'Pendente' || parcela.status === 'Parcial' || parcela.status === 'Vencido') {
            const dataVenc = new Date(parcela.dataVencimento);
            const key = format(dataVenc, 'yyyy-MM-dd');
            if (fluxoDiario[key]) {
              const valorRestante = parcela.valor - (parcela.pagamento?.valor || 0);
              fluxoDiario[key].saidas += valorRestante;
            }
          }
        });
      } else if (conta.status === 'Pendente' || conta.status === 'Parcial' || conta.status === 'Vencido') {
        const dataVenc = new Date(conta.dataVencimento);
        const key = format(dataVenc, 'yyyy-MM-dd');
        if (fluxoDiario[key]) {
          const valorRestante = conta.valor - (conta.pagamento?.valor || 0);
          fluxoDiario[key].saidas += valorRestante;
        }
      }
    });
    
    // Calcular saldo acumulado
    let saldoAcumulado = 0;
    Object.keys(fluxoDiario).sort().forEach(key => {
      saldoAcumulado += fluxoDiario[key].entradas - fluxoDiario[key].saidas;
      fluxoDiario[key].saldo = saldoAcumulado;
    });
    
    return Object.values(fluxoDiario).sort((a, b) => a.data.getTime() - b.data.getTime());
  };
  
  const fluxo30dias = calcularFluxo(30);
  const fluxo7dias = calcularFluxo(7);
  
  const totalEntradas30d = fluxo30dias.reduce((sum, d) => sum + d.entradas, 0);
  const totalSaidas30d = fluxo30dias.reduce((sum, d) => sum + d.saidas, 0);
  const saldoProjetado30d = totalEntradas30d - totalSaidas30d;
  
  const totalEntradas7d = fluxo7dias.reduce((sum, d) => sum + d.entradas, 0);
  const totalSaidas7d = fluxo7dias.reduce((sum, d) => sum + d.saidas, 0);
  const saldoProjetado7d = totalEntradas7d - totalSaidas7d;
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };
  
  const chartData = fluxo30dias.map(d => ({
    data: format(d.data, 'dd/MM', { locale: ptBR }),
    Entradas: d.entradas,
    Saídas: d.saidas,
    Saldo: d.saldo
  }));

  return (
    <div className="space-y-6">
      {/* Estatísticas Próximos 7 e 30 Dias */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Próximos 7 Dias
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Entradas</span>
              </div>
              <span className="text-lg font-bold text-green-600">{formatCurrency(totalEntradas7d)}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">Saídas</span>
              </div>
              <span className="text-lg font-bold text-red-600">{formatCurrency(totalSaidas7d)}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border-2 border-primary">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Saldo Projetado</span>
              </div>
              <span className={`text-lg font-bold ${saldoProjetado7d >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(saldoProjetado7d)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Próximos 30 Dias
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Entradas</span>
              </div>
              <span className="text-lg font-bold text-green-600">{formatCurrency(totalEntradas30d)}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">Saídas</span>
              </div>
              <span className="text-lg font-bold text-red-600">{formatCurrency(totalSaidas30d)}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border-2 border-primary">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Saldo Projetado</span>
              </div>
              <span className={`text-lg font-bold ${saldoProjetado30d >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(saldoProjetado30d)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Evolução */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução do Fluxo de Caixa (30 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="data" />
              <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="Entradas" stroke="hsl(var(--chart-1))" strokeWidth={2} />
              <Line type="monotone" dataKey="Saídas" stroke="hsl(var(--chart-2))" strokeWidth={2} />
              <Line type="monotone" dataKey="Saldo" stroke="hsl(var(--primary))" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detalhamento Diário */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento dos Próximos 30 Dias</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Entradas</TableHead>
                <TableHead className="text-right">Saídas</TableHead>
                <TableHead className="text-right">Saldo Acumulado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fluxo30dias
                .filter(d => d.entradas > 0 || d.saidas > 0)
                .map((dia, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">
                      {format(dia.data, "dd/MM/yyyy (EEEE)", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right text-green-600 font-medium">
                      {dia.entradas > 0 ? formatCurrency(dia.entradas) : '-'}
                    </TableCell>
                    <TableCell className="text-right text-red-600 font-medium">
                      {dia.saidas > 0 ? formatCurrency(dia.saidas) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={dia.saldo >= 0 ? "default" : "destructive"}>
                        {formatCurrency(dia.saldo)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
