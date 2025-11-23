import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calendar, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { contasPagarAPI, contasReceberAPI } from "@/lib/api";
import { format, isAfter, isBefore, addDays, startOfDay, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = {
  pendente: '#f59e0b',
  pago: '#10b981',
  vencido: '#ef4444',
  parcial: '#6366f1'
};

export function DashboardParcelamentos() {
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

  // Filtrar apenas contas parceladas
  const contasParceladasPagar = contasPagar.filter(c => c.tipoCriacao === 'Parcelamento');
  const contasParceladasReceber = contasReceber.filter(c => c.tipoCriacao === 'Parcelamento');

  // Extrair todas as parcelas
  const todasParcelasPagar = contasParceladasPagar.flatMap(conta => 
    (conta.parcelas || []).map((parcela: any) => ({
      ...parcela,
      numeroConta: conta.numeroDocumento,
      descricaoConta: conta.descricao,
      tipo: 'pagar',
      categoria: conta.categoria
    }))
  );

  const todasParcelasReceber = contasParceladasReceber.flatMap(conta => 
    (conta.parcelas || []).map((parcela: any) => ({
      ...parcela,
      numeroConta: conta.numeroDocumento,
      descricaoConta: conta.descricao,
      tipo: 'receber',
      categoria: conta.categoria
    }))
  );

  // Parcelas a vencer nos próximos 7 dias
  const hoje = startOfDay(new Date());
  const daquiA7Dias = addDays(hoje, 7);

  const parcelasVencendoPagar = todasParcelasPagar.filter(parcela => {
    const dataVenc = startOfDay(new Date(parcela.dataVencimento));
    return (parcela.status === 'Pendente' || parcela.status === 'Parcial') &&
           isAfter(dataVenc, hoje) && 
           isBefore(dataVenc, daquiA7Dias);
  });

  const parcelasVencendoReceber = todasParcelasReceber.filter(parcela => {
    const dataVenc = startOfDay(new Date(parcela.dataVencimento));
    return (parcela.status === 'Pendente' || parcela.status === 'Parcial') &&
           isAfter(dataVenc, hoje) && 
           isBefore(dataVenc, daquiA7Dias);
  });

  // Métricas gerais
  const totalParcelasPagar = todasParcelasPagar.length;
  const totalParcelasReceber = todasParcelasReceber.length;
  const parcelasPagasPagar = todasParcelasPagar.filter(p => p.status === 'Pago').length;
  const parcelasPagasReceber = todasParcelasReceber.filter(p => p.status === 'Recebido').length;

  const taxaAdimplenciaPagar = totalParcelasPagar > 0 
    ? (parcelasPagasPagar / totalParcelasPagar) * 100 
    : 0;

  const taxaAdimplenciaReceber = totalParcelasReceber > 0 
    ? (parcelasPagasReceber / totalParcelasReceber) * 100 
    : 0;

  // Dados para gráfico de status
  const statusDataPagar = [
    { name: 'Pagas', value: todasParcelasPagar.filter(p => p.status === 'Pago').length, color: COLORS.pago },
    { name: 'Pendentes', value: todasParcelasPagar.filter(p => p.status === 'Pendente').length, color: COLORS.pendente },
    { name: 'Vencidas', value: todasParcelasPagar.filter(p => p.status === 'Vencido').length, color: COLORS.vencido },
    { name: 'Parciais', value: todasParcelasPagar.filter(p => p.status === 'Parcial').length, color: COLORS.parcial }
  ].filter(item => item.value > 0);

  const statusDataReceber = [
    { name: 'Recebidas', value: todasParcelasReceber.filter(p => p.status === 'Recebido').length, color: COLORS.pago },
    { name: 'Pendentes', value: todasParcelasReceber.filter(p => p.status === 'Pendente').length, color: COLORS.pendente },
    { name: 'Vencidas', value: todasParcelasReceber.filter(p => p.status === 'Vencido').length, color: COLORS.vencido },
    { name: 'Parciais', value: todasParcelasReceber.filter(p => p.status === 'Parcial').length, color: COLORS.parcial }
  ].filter(item => item.value > 0);

  // Dados para gráfico de evolução (próximos 30 dias)
  const evolucaoData: any[] = [];
  for (let i = 0; i <= 30; i += 5) {
    const dataRef = addDays(hoje, i);
    const parcelasPagarAteData = todasParcelasPagar.filter(p => {
      const dataVenc = new Date(p.dataVencimento);
      return isBefore(dataVenc, dataRef) || dataVenc.getTime() === dataRef.getTime();
    });
    const parcelasReceberAteData = todasParcelasReceber.filter(p => {
      const dataVenc = new Date(p.dataVencimento);
      return isBefore(dataVenc, dataRef) || dataVenc.getTime() === dataRef.getTime();
    });

    evolucaoData.push({
      dia: i === 0 ? 'Hoje' : `+${i}d`,
      aPagar: parcelasPagarAteData.length,
      aReceber: parcelasReceberAteData.length
    });
  }

  const getStatusBadge = (status: string) => {
    const variants: any = {
      'Pendente': 'secondary',
      'Pago': 'default',
      'Recebido': 'default',
      'Vencido': 'destructive',
      'Parcial': 'outline'
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Carregando análise de parcelamentos...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Parcelas (Pagar)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalParcelasPagar}</div>
            <Progress value={taxaAdimplenciaPagar} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {taxaAdimplenciaPagar.toFixed(1)}% pagas
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Parcelas (Receber)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalParcelasReceber}</div>
            <Progress value={taxaAdimplenciaReceber} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {taxaAdimplenciaReceber.toFixed(1)}% recebidas
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              A Vencer (7 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {parcelasVencendoPagar.length + parcelasVencendoReceber.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {parcelasVencendoPagar.length} pagar • {parcelasVencendoReceber.length} receber
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contas Parceladas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {contasParceladasPagar.length + contasParceladasReceber.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {contasParceladasPagar.length} pagar • {contasParceladasReceber.length} receber
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Status - Pagar */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Status das Parcelas a Pagar</CardTitle>
          </CardHeader>
          <CardContent>
            {statusDataPagar.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusDataPagar}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusDataPagar.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} parcelas`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma parcela a pagar</p>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Status - Receber */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Status das Parcelas a Receber</CardTitle>
          </CardHeader>
          <CardContent>
            {statusDataReceber.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusDataReceber}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusDataReceber.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} parcelas`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma parcela a receber</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Evolução */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Evolução de Vencimentos (Próximos 30 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={evolucaoData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dia" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="aPagar" fill="#ef4444" name="Parcelas a Pagar" />
              <Bar dataKey="aReceber" fill="#10b981" name="Parcelas a Receber" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Parcelas a Vencer nos Próximos 7 Dias */}
      {(parcelasVencendoPagar.length > 0 || parcelasVencendoReceber.length > 0) && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Parcelas a Vencer nos Próximos 7 Dias
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* A Pagar */}
            {parcelasVencendoPagar.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  A Pagar ({parcelasVencendoPagar.length})
                </h4>
                <div className="space-y-2">
                  {parcelasVencendoPagar.map((parcela, idx) => {
                    const diasRestantes = differenceInDays(new Date(parcela.dataVencimento), hoje);
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm text-foreground">{parcela.descricaoConta}</p>
                          <p className="text-xs text-muted-foreground">
                            Parcela {parcela.numeroParcela} • Doc: {parcela.numeroConta}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="font-semibold text-foreground">{formatCurrency(parcela.valor)}</p>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(parcela.status)}
                            <Badge variant="outline" className="text-xs">
                              {diasRestantes === 0 ? 'Hoje' : `${diasRestantes}d`}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* A Receber */}
            {parcelasVencendoReceber.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  A Receber ({parcelasVencendoReceber.length})
                </h4>
                <div className="space-y-2">
                  {parcelasVencendoReceber.map((parcela, idx) => {
                    const diasRestantes = differenceInDays(new Date(parcela.dataVencimento), hoje);
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm text-foreground">{parcela.descricaoConta}</p>
                          <p className="text-xs text-muted-foreground">
                            Parcela {parcela.numeroParcela} • Doc: {parcela.numeroConta}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="font-semibold text-foreground">{formatCurrency(parcela.valor)}</p>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(parcela.status)}
                            <Badge variant="outline" className="text-xs">
                              {diasRestantes === 0 ? 'Hoje' : `${diasRestantes}d`}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
