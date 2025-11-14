import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Plus, CreditCard, Calendar, Split, BarChart3, Edit, Trash2, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDeleteDialog } from "@/components/ui/alert-delete-dialog";
import { contasPagarAPI, contasReceberAPI } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ContaPagarDialog } from "@/components/ContaPagarDialog";
import { ContaReceberDialog } from "@/components/ContaReceberDialog";
import { FluxoCaixaReport } from "@/components/FluxoCaixaReport";
import { ParcelamentoDialog } from "@/components/ParcelamentoDialog";
import { FinanceNotifications } from "@/components/FinanceNotifications";
import { RegistrarPagamentoDialog } from "@/components/RegistrarPagamentoDialog";

const Financeiro = () => {
  const [loading, setLoading] = useState(true);
  const [contasPagar, setContasPagar] = useState<any[]>([]);
  const [contasReceber, setContasReceber] = useState<any[]>([]);
  const [resumoPagar, setResumoPagar] = useState<any>(null);
  const [resumoReceber, setResumoReceber] = useState<any>(null);
  const [contaPagarDialogOpen, setContaPagarDialogOpen] = useState(false);
  const [contaReceberDialogOpen, setContaReceberDialogOpen] = useState(false);
  const [parcelamentoDialogOpen, setParcelamentoDialogOpen] = useState(false);
  const [selectedContaPagar, setSelectedContaPagar] = useState<any>(null);
  const [selectedContaReceber, setSelectedContaReceber] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("resumo");
  const [registroDialogOpen, setRegistroDialogOpen] = useState(false);
  const [registroTipo, setRegistroTipo] = useState<'pagar'|'receber'>("pagar");
  const [registroConta, setRegistroConta] = useState<any | null>(null);
  const [filtroStatusPagar, setFiltroStatusPagar] = useState<string>("todos");
  const [filtroStatusReceber, setFiltroStatusReceber] = useState<string>("todos");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contaToDelete, setContaToDelete] = useState<{tipo: 'pagar'|'receber', numeroDocumento: string, descricao: string} | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pagarData, receberData, resumoP, resumoR] = await Promise.all([
        contasPagarAPI.getAll(),
        contasReceberAPI.getAll(),
        contasPagarAPI.getResumo(),
        contasReceberAPI.getResumo(),
      ]);
      setContasPagar(pagarData);
      setContasReceber(receberData);
      setResumoPagar(resumoP);
      setResumoReceber(resumoR);
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
      toast.error('Erro ao carregar dados financeiros');
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

  const saldoGeral = (resumoReceber?.totalRecebido || 0) - (resumoPagar?.totalPago || 0);
  const saldoPendente = (resumoReceber?.totalPendente || 0) - (resumoPagar?.totalPendente || 0);

  const handleDeleteConta = async () => {
    if (!contaToDelete) return;
    try {
      if (contaToDelete.tipo === 'pagar') {
        await contasPagarAPI.delete(contaToDelete.numeroDocumento);
        toast.success('Conta a pagar excluída com sucesso');
      } else {
        await contasReceberAPI.delete(contaToDelete.numeroDocumento);
        toast.success('Conta a receber excluída com sucesso');
      }
      loadData();
      setDeleteDialogOpen(false);
      setContaToDelete(null);
    } catch (error) {
      console.error('Erro ao deletar conta:', error);
      toast.error('Erro ao deletar conta');
    }
  };

  const contasPagarFiltradas = contasPagar.filter(conta => {
    if (filtroStatusPagar === "todos") return true;
    return conta.status === filtroStatusPagar;
  });

  const contasReceberFiltradas = contasReceber.filter(conta => {
    if (filtroStatusReceber === "todos") return true;
    return conta.status === filtroStatusReceber;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-2">Módulo Financeiro</h1>
        <p className="text-muted-foreground">
          Gestão completa de contas a pagar e receber
        </p>
      </div>

      {/* Notificações de Vencimento */}
      <FinanceNotifications />

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-card hover:shadow-elegant transition-all animate-fade-in hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo Geral
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${saldoGeral >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(saldoGeral)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Receitas - Despesas pagas
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elegant transition-all animate-fade-in hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              A Receber
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(resumoReceber?.totalPendente || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pendente de recebimento
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elegant transition-all animate-fade-in hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              A Pagar
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(resumoPagar?.totalPendente || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pendente de pagamento
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elegant transition-all animate-fade-in hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contas Vencidas
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency((resumoPagar?.totalVencido || 0) + (resumoReceber?.totalVencido || 0))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pagamentos e recebimentos vencidos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Botão de Ação Unificado */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setParcelamentoDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Conta Financeira
        </Button>
      </div>

      {/* Tabs de Contas */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="resumo">
            <DollarSign className="h-4 w-4 mr-2" />
            Resumo
          </TabsTrigger>
          <TabsTrigger value="pagar">
            <TrendingDown className="h-4 w-4 mr-2" />
            Contas a Pagar
          </TabsTrigger>
          <TabsTrigger value="receber">
            <TrendingUp className="h-4 w-4 mr-2" />
            Contas a Receber
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resumo">
          <FluxoCaixaReport />
        </TabsContent>

        <TabsContent value="pagar" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-foreground">Contas a Pagar</h2>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filtroStatusPagar} onValueChange={setFiltroStatusPagar}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Pago">Pago</SelectItem>
                  <SelectItem value="Vencido">Vencido</SelectItem>
                  <SelectItem value="Parcial">Parcial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4">
            {contasPagarFiltradas.map((conta) => (
              <Card key={conta.numeroDocumento} className="shadow-card hover:shadow-elegant transition-smooth hover-lift animate-fade-in">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-foreground">{conta.descricao}</h3>
                        {getStatusBadge(conta.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Doc: {conta.numeroDocumento} • {conta.categoria}
                      </p>
                      {conta.fornecedor?.nome && (
                        <p className="text-sm text-muted-foreground">
                          Fornecedor: {conta.fornecedor.nome}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Venc: {format(new Date(conta.dataVencimento), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </div>
                        {conta.formaPagamento && (
                          <div className="flex items-center gap-1">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{conta.formaPagamento}</span>
                          </div>
                        )}
                      </div>
                      {Array.isArray(conta.historicoPagamentos) && conta.historicoPagamentos.length > 0 && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Histórico: {conta.historicoPagamentos.slice(-2).map((h: any) => `${format(new Date(h.data), 'dd/MM')} ${formatCurrency(h.valor)}`).join(' • ')}
                        </div>
                      )}
                    </div>
                    <div className="text-right space-y-2">
                      <div className="text-2xl font-bold text-foreground">
                        {formatCurrency(conta.valor)}
                      </div>
                      {conta.valorPago > 0 && (
                        <div className="text-sm text-green-600">
                          Pago: {formatCurrency(conta.valorPago)}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => { setSelectedContaPagar(conta); setContaPagarDialogOpen(true); }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {conta.status === 'Pendente' || conta.status === 'Parcial' ? (
                          <Button size="sm" variant="outline" onClick={() => { setRegistroTipo('pagar'); setRegistroConta(conta); setRegistroDialogOpen(true); }}>Registrar Pagamento</Button>
                        ) : null}
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            setContaToDelete({ tipo: 'pagar', numeroDocumento: conta.numeroDocumento, descricao: conta.descricao });
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="receber" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-foreground">Contas a Receber</h2>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filtroStatusReceber} onValueChange={setFiltroStatusReceber}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Recebido">Recebido</SelectItem>
                  <SelectItem value="Vencido">Vencido</SelectItem>
                  <SelectItem value="Parcial">Parcial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4">
            {contasReceberFiltradas.map((conta) => (
              <Card key={conta.numeroDocumento} className="shadow-card hover:shadow-elegant transition-smooth hover-lift animate-fade-in">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-foreground">{conta.descricao}</h3>
                        {getStatusBadge(conta.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Doc: {conta.numeroDocumento} • {conta.categoria}
                      </p>
                      {conta.cliente?.nome && (
                        <p className="text-sm text-muted-foreground">
                          Cliente: {conta.cliente.nome}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Venc: {format(new Date(conta.dataVencimento), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </div>
                        {conta.formaPagamento && (
                          <div className="flex items-center gap-1">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{conta.formaPagamento}</span>
                          </div>
                        )}
                      </div>
                      {Array.isArray(conta.historicoRecebimentos) && conta.historicoRecebimentos.length > 0 && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Histórico: {conta.historicoRecebimentos.slice(-2).map((h: any) => `${format(new Date(h.data), 'dd/MM')} ${formatCurrency(h.valor)}`).join(' • ')}
                        </div>
                      )}
                    </div>
                    <div className="text-right space-y-2">
                      <div className="text-2xl font-bold text-foreground">
                        {formatCurrency(conta.valor)}
                      </div>
                      {conta.valorRecebido > 0 && (
                        <div className="text-sm text-green-600">
                          Recebido: {formatCurrency(conta.valorRecebido)}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => { setSelectedContaReceber(conta); setContaReceberDialogOpen(true); }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {conta.status === 'Pendente' || conta.status === 'Parcial' ? (
                          <Button size="sm" variant="outline" onClick={() => { setRegistroTipo('receber'); setRegistroConta(conta); setRegistroDialogOpen(true); }}>Registrar Recebimento</Button>
                        ) : null}
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            setContaToDelete({ tipo: 'receber', numeroDocumento: conta.numeroDocumento, descricao: conta.descricao });
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Diálogos */}
      <ContaPagarDialog 
        open={contaPagarDialogOpen}
        onOpenChange={setContaPagarDialogOpen}
        conta={selectedContaPagar}
        onSuccess={loadData}
      />
      
      <ContaReceberDialog 
        open={contaReceberDialogOpen}
        onOpenChange={setContaReceberDialogOpen}
        conta={selectedContaReceber}
        onSuccess={loadData}
      />

      <ParcelamentoDialog
        open={parcelamentoDialogOpen}
        onOpenChange={setParcelamentoDialogOpen}
        onSuccess={loadData}
      />

      <RegistrarPagamentoDialog
        open={registroDialogOpen}
        onOpenChange={(o)=>{ setRegistroDialogOpen(o); if(!o){ setRegistroConta(null);} }}
        tipo={registroTipo}
        conta={registroConta}
        onSuccess={loadData}
      />

      <AlertDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConta}
        title={contaToDelete?.tipo === 'pagar' ? 'Deletar Conta a Pagar' : 'Deletar Conta a Receber'}
        description={`Tem certeza que deseja deletar a conta "${contaToDelete?.descricao}"? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
};

export default Financeiro;
