import { useState, useEffect } from "react";
import { Wallet, Plus, Minus, DollarSign, TrendingUp, TrendingDown, RefreshCw, XCircle, History, Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { caixaAPI, vendasAPI } from "@/lib/api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertDeleteDialog } from "@/components/ui/alert-delete-dialog";
import { CurrencyInput } from "@/components/ui/currency-input";

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

const Caixa = () => {
  const [caixaAberto, setCaixaAberto] = useState<Caixa | null>(null);
  const [loading, setLoading] = useState(true);
  const [historicoOpen, setHistoricoOpen] = useState(false);
  const [historicoCaixas, setHistoricoCaixas] = useState<Caixa[]>([]);
  const [filtroData, setFiltroData] = useState("");
  const [reabrirCaixaDialog, setReabrirCaixaDialog] = useState(false);
  const [caixaParaReabrir, setCaixaParaReabrir] = useState<string | null>(null);
  const [senhaReabrir, setSenhaReabrir] = useState("");
  
  // Dialogs
  const [abrirCaixaDialog, setAbrirCaixaDialog] = useState(false);
  const [movimentoDialog, setMovimentoDialog] = useState(false);
  const [tipoMovimento, setTipoMovimento] = useState<'entrada' | 'saida'>('entrada');
  const [fecharCaixaDialog, setFecharCaixaDialog] = useState(false);
  
  // Form states
  const [valorInicial, setValorInicial] = useState("");
  const [valorMovimento, setValorMovimento] = useState("");
  const [observacaoMovimento, setObservacaoMovimento] = useState("");
  
  // Estados para exclusão de movimentação
  const [movimentoParaExcluir, setMovimentoParaExcluir] = useState<number | null>(null);
  const [dialogExcluirMovimento, setDialogExcluirMovimento] = useState(false);

  useEffect(() => {
    carregarCaixaAberto();
  }, []);

  const carregarCaixaAberto = async () => {
    try {
      setLoading(true);
      const response = await caixaAPI.getCaixaAberto();
      setCaixaAberto(response);
    } catch (error: any) {
      console.log('Nenhum caixa aberto encontrado');
      setCaixaAberto(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirCaixa = async () => {
    try {
      const valor = parseFloat(valorInicial);
      
      if (isNaN(valor) || valor < 0) {
        toast.error("Valor inicial inválido");
        return;
      }

      const novoCaixa = await caixaAPI.abrirCaixa(valor);
      setCaixaAberto(novoCaixa);
      setAbrirCaixaDialog(false);
      setValorInicial("");
      toast.success("Caixa aberto com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao abrir caixa");
    }
  };

  const handleAdicionarMovimento = async () => {
    try {
      const valor = parseFloat(valorMovimento);
      
      if (isNaN(valor) || valor <= 0) {
        toast.error("Valor inválido");
        return;
      }

      const caixaAtualizado = await caixaAPI.adicionarMovimento(
        tipoMovimento,
        valor,
        observacaoMovimento || undefined
      );
      
      setCaixaAberto(caixaAtualizado);
      setMovimentoDialog(false);
      setValorMovimento("");
      setObservacaoMovimento("");
      
      toast.success(
        tipoMovimento === 'entrada' 
          ? "Entrada registrada com sucesso!" 
          : "Sangria registrada com sucesso!"
      );
    } catch (error: any) {
      toast.error(error.message || "Erro ao adicionar movimentação");
    }
  };

  const handleSincronizarVendas = async () => {
    try {
      const response = await caixaAPI.sincronizarVendas();
      setCaixaAberto(response.caixa);
      toast.success(response.message || "Vendas sincronizadas com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao sincronizar vendas");
    }
  };

  const handleFecharCaixa = async () => {
    try {
      const caixaFechado = await caixaAPI.fecharCaixa();
      setCaixaAberto(null);
      setFecharCaixaDialog(false);
      toast.success("Caixa fechado com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao fechar caixa");
    }
  };

  const abrirDialogMovimento = (tipo: 'entrada' | 'saida') => {
    setTipoMovimento(tipo);
    setMovimentoDialog(true);
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarData = (data: string) => {
    return format(new Date(data), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  const formatarDataCurta = (data: string) => {
    return format(new Date(data), "dd/MM/yyyy", { locale: ptBR });
  };

  const carregarHistorico = async () => {
    try {
      const caixas = await caixaAPI.getAll();
      setHistoricoCaixas(caixas);
    } catch (error: any) {
      toast.error("Erro ao carregar histórico de caixas");
    }
  };

  const handleAbrirHistorico = async () => {
    setHistoricoOpen(true);
    await carregarHistorico();
  };

  const historicoFiltrado = filtroData
    ? historicoCaixas.filter((caixa) => {
        const dataCaixa = format(new Date(caixa.dataAbertura), "yyyy-MM-dd");
        return dataCaixa === filtroData;
      })
    : historicoCaixas;

  const abrirDialogReabrirCaixa = (codigoCaixa: string) => {
    setCaixaParaReabrir(codigoCaixa);
    setReabrirCaixaDialog(true);
    setSenhaReabrir("");
  };

  const handleReabrirCaixa = async () => {
    if (senhaReabrir !== "abrecaixamariela") {
      toast.error("Senha incorreta!");
      return;
    }

    if (!caixaParaReabrir) return;

    try {
      await caixaAPI.reabrirCaixa(caixaParaReabrir);
      await carregarCaixaAberto();
      await carregarHistorico();
      setReabrirCaixaDialog(false);
      setCaixaParaReabrir(null);
      setSenhaReabrir("");
      setHistoricoOpen(false);
      toast.success("Caixa reaberto com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao reabrir caixa");
    }
  };

  const abrirDialogExcluirMovimento = (index: number) => {
    setMovimentoParaExcluir(index);
    setDialogExcluirMovimento(true);
  };

  const handleExcluirMovimento = async () => {
    if (movimentoParaExcluir === null || !caixaAberto) return;
    
    try {
      const movimento = caixaAberto.movimentos[movimentoParaExcluir];
      
      // Se for uma venda, excluir a venda também
      if (movimento.codigoVenda) {
        await vendasAPI.delete(movimento.codigoVenda);
      }
      
      // Excluir movimento do caixa
      await caixaAPI.excluirMovimento(movimentoParaExcluir);
      
      // Recarregar o caixa para atualizar os movimentos
      await carregarCaixaAberto();
      
      setDialogExcluirMovimento(false);
      setMovimentoParaExcluir(null);
      toast.success("Movimentação excluída com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir movimentação");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wallet className="h-8 w-8 text-primary" />
            Controle de Caixa
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie a abertura, movimentações e fechamento do caixa
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleAbrirHistorico} variant="outline" size="lg">
            <History className="h-5 w-5 mr-2" />
            Histórico de Caixas
          </Button>
          {!caixaAberto && (
            <Button onClick={() => setAbrirCaixaDialog(true)} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Abrir Caixa
            </Button>
          )}
        </div>
      </div>

      {!caixaAberto ? (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <XCircle className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum caixa aberto</h3>
            <p className="text-muted-foreground text-center mb-6">
              Abra um novo caixa para começar a registrar movimentações
            </p>
            <Button onClick={() => setAbrirCaixaDialog(true)} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Abrir Caixa
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Dashboard de Caixa */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card de Entrada */}
            <Card className="animate-fade-in hover-lift transition-smooth border-l-4 border-l-green-500 bg-gradient-to-br from-green-50/50 to-background dark:from-green-950/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total de Entradas
                  </CardTitle>
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {formatarMoeda(caixaAberto.entrada)}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <DollarSign className="h-3 w-3" />
                  <span>Valor inicial: {formatarMoeda(caixaAberto.valorInicial)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Card de Saída */}
            <Card className="animate-fade-in hover-lift transition-smooth border-l-4 border-l-red-500 bg-gradient-to-br from-red-50/50 to-background dark:from-red-950/20" style={{ animationDelay: '0.1s' }}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total de Saídas
                  </CardTitle>
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {formatarMoeda(caixaAberto.saida)}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Minus className="h-3 w-3" />
                  <span>Sangrias e retiradas</span>
                </div>
              </CardContent>
            </Card>

            {/* Card de Performance */}
            <Card className={`animate-fade-in hover-lift transition-smooth border-l-4 ${
              caixaAberto.performance >= 0 
                ? 'border-l-primary bg-gradient-to-br from-primary/10 to-background' 
                : 'border-l-orange-500 bg-gradient-to-br from-orange-50/50 to-background dark:from-orange-950/20'
            }`} style={{ animationDelay: '0.2s' }}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Performance do Caixa
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${
                    caixaAberto.performance >= 0 
                      ? 'bg-primary/10' 
                      : 'bg-orange-100 dark:bg-orange-900/30'
                  }`}>
                    <Wallet className={`h-5 w-5 ${
                      caixaAberto.performance >= 0 
                        ? 'text-primary' 
                        : 'text-orange-600 dark:text-orange-400'
                    }`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className={`text-3xl font-bold ${
                  caixaAberto.performance >= 0 
                    ? 'text-primary' 
                    : 'text-orange-600 dark:text-orange-400'
                }`}>
                  {formatarMoeda(caixaAberto.performance)}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span>Saldo atual (Inicial + Entradas - Saídas)</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Informações do Caixa */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Caixa {caixaAberto.codigoCaixa}</CardTitle>
                  <CardDescription>
                    Aberto em {formatarData(caixaAberto.dataAbertura)}
                  </CardDescription>
                </div>
                <Badge variant="default" className="bg-green-500">
                  Aberto
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Botões de Ação */}
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => abrirDialogMovimento('entrada')} variant="default">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Entrada (Injeção)
                </Button>
                <Button onClick={() => abrirDialogMovimento('saida')} variant="destructive">
                  <Minus className="h-4 w-4 mr-2" />
                  Nova Saída (Sangria)
                </Button>
                <Button onClick={handleSincronizarVendas} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sincronizar Vendas
                </Button>
                <Button onClick={() => setFecharCaixaDialog(true)} variant="secondary">
                  <XCircle className="h-4 w-4 mr-2" />
                  Fechar Caixa
                </Button>
              </div>

              {/* Tabela de Movimentações */}
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Movimentações ({caixaAberto.movimentos.length})
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {caixaAberto.movimentos.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            Nenhuma movimentação registrada
                          </TableCell>
                        </TableRow>
                      ) : (
                        caixaAberto.movimentos
                          .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                          .map((movimento, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">
                                {formatarData(movimento.data)}
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={movimento.tipo === 'entrada' ? 'default' : 'destructive'}
                                  className={movimento.tipo === 'entrada' ? 'bg-green-500' : ''}
                                >
                                  {movimento.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {movimento.observacao || '-'}
                                {movimento.codigoVenda && (
                                  <span className="text-xs text-muted-foreground ml-2">
                                    ({movimento.codigoVenda})
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className={`text-right font-semibold ${
                                movimento.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {movimento.tipo === 'entrada' ? '+' : '-'} {formatarMoeda(movimento.valor)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => abrirDialogExcluirMovimento(index)}
                                  className="h-8 w-8 p-0"
                                  title="Excluir movimentação"
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Dialog - Abrir Caixa */}
      <Dialog open={abrirCaixaDialog} onOpenChange={setAbrirCaixaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abrir Novo Caixa</DialogTitle>
            <DialogDescription>
              Informe o valor inicial em dinheiro no caixa
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="valorInicial">Valor Inicial</Label>
              <CurrencyInput
                id="valorInicial"
                value={valorInicial}
                onValueChange={(value) => setValorInicial(value)}
                placeholder="R$ 0,00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAbrirCaixaDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAbrirCaixa}>
              Abrir Caixa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog - Adicionar Movimentação */}
      <Dialog open={movimentoDialog} onOpenChange={setMovimentoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {tipoMovimento === 'entrada' ? 'Nova Entrada (Injeção)' : 'Nova Saída (Sangria)'}
            </DialogTitle>
            <DialogDescription>
              {tipoMovimento === 'entrada' 
                ? 'Registrar entrada de dinheiro no caixa' 
                : 'Registrar saída de dinheiro do caixa'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="valorMovimento">Valor</Label>
              <CurrencyInput
                id="valorMovimento"
                value={valorMovimento}
                onValueChange={(value) => setValorMovimento(value)}
                placeholder="R$ 0,00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="observacaoMovimento">Observação (opcional)</Label>
              <Input
                id="observacaoMovimento"
                placeholder="Motivo da movimentação"
                value={observacaoMovimento}
                onChange={(e) => setObservacaoMovimento(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMovimentoDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAdicionarMovimento}
              variant={tipoMovimento === 'entrada' ? 'default' : 'destructive'}
            >
              {tipoMovimento === 'entrada' ? 'Adicionar Entrada' : 'Registrar Sangria'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog - Histórico de Caixas */}
      <Dialog open={historicoOpen} onOpenChange={setHistoricoOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Caixas
            </DialogTitle>
            <DialogDescription>
              Visualize todos os registros de caixas anteriores
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Filtro por data */}
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="filtroData">Filtrar por data:</Label>
              <Input
                id="filtroData"
                type="date"
                value={filtroData}
                onChange={(e) => setFiltroData(e.target.value)}
                className="max-w-xs"
              />
              {filtroData && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFiltroData("")}
                >
                  Limpar
                </Button>
              )}
            </div>

            {/* Tabela de histórico */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Abertura</TableHead>
                    <TableHead>Fechamento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor Inicial</TableHead>
                    <TableHead className="text-right">Entradas</TableHead>
                    <TableHead className="text-right">Saídas</TableHead>
                    <TableHead className="text-right">Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historicoFiltrado.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        Nenhum registro encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    historicoFiltrado
                      .sort((a, b) => new Date(b.dataAbertura).getTime() - new Date(a.dataAbertura).getTime())
                      .map((caixa) => (
                        <TableRow key={caixa.codigoCaixa}>
                          <TableCell className="font-medium">{caixa.codigoCaixa}</TableCell>
                          <TableCell>{formatarDataCurta(caixa.dataAbertura)}</TableCell>
                          <TableCell>
                            {caixa.dataFechamento ? formatarDataCurta(caixa.dataFechamento) : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={caixa.status === 'aberto' ? 'default' : 'secondary'}>
                              {caixa.status === 'aberto' ? 'Aberto' : 'Fechado'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{formatarMoeda(caixa.valorInicial)}</TableCell>
                          <TableCell className="text-right text-green-600">
                            {formatarMoeda(caixa.entrada)}
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            {formatarMoeda(caixa.saida)}
                          </TableCell>
                          <TableCell className={`text-right font-semibold ${
                            caixa.performance >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatarMoeda(caixa.performance)}
                          </TableCell>
                          <TableCell>
                            {caixa.status === 'fechado' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => abrirDialogReabrirCaixa(caixa.codigoCaixa)}
                                className="text-xs"
                              >
                                Reabrir
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog - Confirmar Fechamento de Caixa */}
      <AlertDeleteDialog
        open={fecharCaixaDialog}
        onOpenChange={setFecharCaixaDialog}
        onConfirm={handleFecharCaixa}
        title="Confirmar Fechamento de Caixa"
        description="Tem certeza que deseja fechar o caixa? Esta ação não pode ser desfeita. Certifique-se de que todas as movimentações foram registradas corretamente."
      />

      {/* Alert Dialog - Confirmar Exclusão de Movimentação */}
      <AlertDeleteDialog
        open={dialogExcluirMovimento}
        onOpenChange={setDialogExcluirMovimento}
        onConfirm={handleExcluirMovimento}
        title="Confirmar Exclusão de Movimentação"
        description="Tem certeza que deseja excluir esta movimentação? Esta ação não pode ser desfeita. Se for uma venda, ela também será excluída do sistema."
      />

      {/* Dialog - Reabrir Caixa */}
      <Dialog open={reabrirCaixaDialog} onOpenChange={setReabrirCaixaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reabrir Caixa</DialogTitle>
            <DialogDescription>
              Digite a senha para reabrir o caixa {caixaParaReabrir}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="senhaReabrir">Senha *</Label>
              <Input
                id="senhaReabrir"
                type="password"
                placeholder="Digite a senha"
                value={senhaReabrir}
                onChange={(e) => setSenhaReabrir(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReabrirCaixaDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleReabrirCaixa}>
              Reabrir Caixa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Caixa;
