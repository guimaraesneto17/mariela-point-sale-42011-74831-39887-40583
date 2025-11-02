import { useState, useEffect } from "react";
import { Wallet, Plus, Minus, DollarSign, TrendingUp, TrendingDown, RefreshCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { caixaAPI } from "@/lib/api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  
  // Dialogs
  const [abrirCaixaDialog, setAbrirCaixaDialog] = useState(false);
  const [movimentoDialog, setMovimentoDialog] = useState(false);
  const [tipoMovimento, setTipoMovimento] = useState<'entrada' | 'saida'>('entrada');
  
  // Form states
  const [valorInicial, setValorInicial] = useState("");
  const [valorMovimento, setValorMovimento] = useState("");
  const [observacaoMovimento, setObservacaoMovimento] = useState("");

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
        
        {!caixaAberto && (
          <Button onClick={() => setAbrirCaixaDialog(true)} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Abrir Caixa
          </Button>
        )}
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
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Valor Inicial
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-blue-500" />
                  <span className="text-2xl font-bold">
                    {formatarMoeda(caixaAberto.valorInicial)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Entradas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <span className="text-2xl font-bold text-green-600">
                    {formatarMoeda(caixaAberto.entrada)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Saídas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  <span className="text-2xl font-bold text-red-600">
                    {formatarMoeda(caixaAberto.saida)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  <span className={`text-2xl font-bold ${
                    caixaAberto.performance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatarMoeda(caixaAberto.performance)}
                  </span>
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
                <Button onClick={handleFecharCaixa} variant="secondary">
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {caixaAberto.movimentos.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
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
              <Label htmlFor="valorInicial">Valor Inicial (R$)</Label>
              <Input
                id="valorInicial"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={valorInicial}
                onChange={(e) => setValorInicial(e.target.value)}
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
              <Label htmlFor="valorMovimento">Valor (R$)</Label>
              <Input
                id="valorMovimento"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0,00"
                value={valorMovimento}
                onChange={(e) => setValorMovimento(e.target.value)}
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
    </div>
  );
};

export default Caixa;
