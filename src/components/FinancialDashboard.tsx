import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { contasPagarAPI, contasReceberAPI } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'];

export function FinancialDashboard() {
  const [periodo, setPeriodo] = useState<string>("mes-atual");
  const [loading, setLoading] = useState(true);
  const [contasPagar, setContasPagar] = useState<any[]>([]);
  const [contasReceber, setContasReceber] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pagarData, receberData] = await Promise.all([
        contasPagarAPI.getAll(),
        contasReceberAPI.getAll(),
      ]);
      setContasPagar(pagarData);
      setContasReceber(receberData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getDateRange = () => {
    const hoje = new Date();
    let inicio: Date, fim: Date;

    switch (periodo) {
      case "mes-atual":
        inicio = startOfMonth(hoje);
        fim = endOfMonth(hoje);
        break;
      case "mes-anterior":
        const mesAnterior = subMonths(hoje, 1);
        inicio = startOfMonth(mesAnterior);
        fim = endOfMonth(mesAnterior);
        break;
      case "ultimos-3-meses":
        inicio = startOfMonth(subMonths(hoje, 2));
        fim = endOfMonth(hoje);
        break;
      case "ultimos-6-meses":
        inicio = startOfMonth(subMonths(hoje, 5));
        fim = endOfMonth(hoje);
        break;
      default:
        inicio = startOfMonth(hoje);
        fim = endOfMonth(hoje);
    }

    return { inicio, fim };
  };

  const filtrarPorPeriodo = (contas: any[]) => {
    const { inicio, fim } = getDateRange();
    return contas.filter(conta => {
      const dataVencimento = new Date(conta.dataVencimento);
      return dataVencimento >= inicio && dataVencimento <= fim;
    });
  };

  const contasPagarPeriodo = filtrarPorPeriodo(contasPagar);
  const contasReceberPeriodo = filtrarPorPeriodo(contasReceber);

  // Dados para o gráfico de barras (Comparativo Mensal)
  const graficoComparativo = () => {
    const meses = new Map<string, { pagar: number; receber: number }>();

    contasPagarPeriodo.forEach(conta => {
      const mes = format(new Date(conta.dataVencimento), 'MMM/yy', { locale: ptBR });
      if (!meses.has(mes)) {
        meses.set(mes, { pagar: 0, receber: 0 });
      }
      if (conta.status === 'Pago') {
        meses.get(mes)!.pagar += conta.valor;
      }
    });

    contasReceberPeriodo.forEach(conta => {
      const mes = format(new Date(conta.dataVencimento), 'MMM/yy', { locale: ptBR });
      if (!meses.has(mes)) {
        meses.set(mes, { pagar: 0, receber: 0 });
      }
      if (conta.status === 'Recebido') {
        meses.get(mes)!.receber += conta.valor;
      }
    });

    return Array.from(meses.entries()).map(([mes, valores]) => ({
      mes,
      pagar: valores.pagar,
      receber: valores.receber,
      saldo: valores.receber - valores.pagar
    }));
  };

  // Dados para o gráfico de linha (Evolução)
  const graficoEvolucao = () => {
    const dias = new Map<string, { pagar: number; receber: number }>();

    contasPagarPeriodo.forEach(conta => {
      if (conta.status === 'Pago') {
        const dia = format(new Date(conta.dataPagamento || conta.dataVencimento), 'dd/MM', { locale: ptBR });
        if (!dias.has(dia)) {
          dias.set(dia, { pagar: 0, receber: 0 });
        }
        dias.get(dia)!.pagar += conta.valor;
      }
    });

    contasReceberPeriodo.forEach(conta => {
      if (conta.status === 'Recebido') {
        const dia = format(new Date(conta.dataPagamento || conta.dataVencimento), 'dd/MM', { locale: ptBR });
        if (!dias.has(dia)) {
          dias.set(dia, { pagar: 0, receber: 0 });
        }
        dias.get(dia)!.receber += conta.valor;
      }
    });

    return Array.from(dias.entries())
      .sort((a, b) => {
        const [diaA, mesA] = a[0].split('/').map(Number);
        const [diaB, mesB] = b[0].split('/').map(Number);
        return mesA === mesB ? diaA - diaB : mesA - mesB;
      })
      .map(([dia, valores]) => ({
        dia,
        pagar: valores.pagar,
        receber: valores.receber
      }));
  };

  // Dados para o gráfico de pizza (Status)
  const graficoPizza = (tipo: 'pagar' | 'receber') => {
    const contas = tipo === 'pagar' ? contasPagarPeriodo : contasReceberPeriodo;
    const status = new Map<string, number>();

    contas.forEach(conta => {
      const s = conta.status;
      status.set(s, (status.get(s) || 0) + 1);
    });

    return Array.from(status.entries()).map(([name, value]) => ({ name, value }));
  };

  // Totalizadores
  const totalPago = contasPagarPeriodo
    .filter(c => c.status === 'Pago')
    .reduce((sum, c) => sum + c.valor, 0);

  const totalRecebido = contasReceberPeriodo
    .filter(c => c.status === 'Recebido')
    .reduce((sum, c) => sum + c.valor, 0);

  const totalPendentePagar = contasPagarPeriodo
    .filter(c => c.status === 'Pendente')
    .reduce((sum, c) => sum + c.valor, 0);

  const totalPendenteReceber = contasReceberPeriodo
    .filter(c => c.status === 'Pendente')
    .reduce((sum, c) => sum + c.valor, 0);

  if (loading) {
    return <div className="flex items-center justify-center p-8">Carregando indicadores...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filtro de Período */}
      <div className="flex items-center gap-4">
        <Calendar className="h-5 w-5 text-muted-foreground" />
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Selecione o período" />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            <SelectItem value="mes-atual">Mês Atual</SelectItem>
            <SelectItem value="mes-anterior">Mês Anterior</SelectItem>
            <SelectItem value="ultimos-3-meses">Últimos 3 Meses</SelectItem>
            <SelectItem value="ultimos-6-meses">Últimos 6 Meses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-card hover:shadow-elegant transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pago
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalPago)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {contasPagarPeriodo.filter(c => c.status === 'Pago').length} contas
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elegant transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Recebido
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalRecebido)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {contasReceberPeriodo.filter(c => c.status === 'Recebido').length} contas
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elegant transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendente Pagar
            </CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(totalPendentePagar)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {contasPagarPeriodo.filter(c => c.status === 'Pendente').length} contas
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elegant transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo do Período
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalRecebido - totalPago >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalRecebido - totalPago)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Receitas - Despesas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico Comparativo Mensal */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Comparativo Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={graficoComparativo()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                />
                <Legend />
                <Bar dataKey="pagar" fill="#ef4444" name="Pago" />
                <Bar dataKey="receber" fill="#10b981" name="Recebido" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Evolução */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Evolução Diária</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={graficoEvolucao()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dia" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                />
                <Legend />
                <Line type="monotone" dataKey="pagar" stroke="#ef4444" name="Pago" strokeWidth={2} />
                <Line type="monotone" dataKey="receber" stroke="#10b981" name="Recebido" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico Pizza - Contas a Pagar */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Status - Contas a Pagar</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={graficoPizza('pagar')}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {graficoPizza('pagar').map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico Pizza - Contas a Receber */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Status - Contas a Receber</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={graficoPizza('receber')}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {graficoPizza('receber').map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
