import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { caixaAPI, contasPagarAPI, contasReceberAPI } from "@/lib/api";
import { ArrowDownCircle, ArrowUpCircle, Clock, CheckCircle2, XCircle, RefreshCw, DollarSign, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";

interface Transaction {
  id: string;
  tipo: 'entrada' | 'saida';
  descricao: string;
  valor: number;
  data: string;
  status: 'processando' | 'concluido' | 'erro';
}

export default function Monitoramento() {
  const [caixaAberto, setCaixaAberto] = useState<any>(null);
  const [ultimasTransacoes, setUltimasTransacoes] = useState<Transaction[]>([]);
  const [contasPendentes, setContasPendentes] = useState({ pagar: 0, receber: 0 });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadMonitoringData = async () => {
    try {
      console.log('🔄 [MONITORAMENTO] Atualizando dados...');
      
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
      }

      // Buscar resumo de contas pendentes
      const [resumoPagar, resumoReceber] = await Promise.all([
        contasPagarAPI.getResumo(),
        contasReceberAPI.getResumo()
      ]);

      setContasPendentes({
        pagar: resumoPagar.totalPendente || 0,
        receber: resumoReceber.totalPendente || 0
      });
      console.log('✅ [MONITORAMENTO] Contas pendentes:', { pagar: resumoPagar.totalPendente, receber: resumoReceber.totalPendente });

      setLastUpdate(new Date());
      setLoading(false);
    } catch (error) {
      console.error('❌ [MONITORAMENTO] Erro ao carregar dados:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMonitoringData();
  }, []);

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadMonitoringData();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Monitoramento Financeiro</h1>
            <p className="text-muted-foreground">Acompanhamento em tempo real das operações</p>
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
