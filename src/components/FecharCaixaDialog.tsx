import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Wallet, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

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
  status: 'aberto' | 'fechado';
  valorInicial: number;
  entrada: number;
  saida: number;
  performance: number;
  movimentos: Movimento[];
}

interface FecharCaixaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  caixa: Caixa | null;
}

export function FecharCaixaDialog({ open, onOpenChange, onConfirm, caixa }: FecharCaixaDialogProps) {
  if (!caixa) return null;

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const saldoFinal = caixa.valorInicial + caixa.entrada - caixa.saida;
  const totalMovimentacoes = caixa.movimentos.length;
  const vendasRegistradas = caixa.movimentos.filter(m => m.codigoVenda).length;
  const injecoesRegistradas = caixa.movimentos.filter(m => m.tipo === 'entrada' && !m.codigoVenda).length;
  const sangriasRegistradas = caixa.movimentos.filter(m => m.tipo === 'saida').length;

  const temAlerta = caixa.performance < 0 || caixa.saida > caixa.entrada;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-background via-background to-primary/5">
        <DialogHeader className="space-y-3 pb-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Confirmar Fechamento de Caixa
              </DialogTitle>
              <DialogDescription className="text-base mt-1">
                Revise o resumo detalhado antes de fechar o caixa <span className="font-bold text-primary">{caixa.codigoCaixa}</span>
              </DialogDescription>
            </div>
          </div>

          {temAlerta && (
            <div className="flex items-center gap-3 p-4 bg-orange-500/10 border-2 border-orange-500/30 rounded-xl animate-pulse-glow">
              <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                  Atenção: Performance negativa detectada
                </p>
                <p className="text-xs text-orange-600/80 dark:text-orange-400/80 mt-1">
                  O caixa apresenta mais saídas que entradas. Verifique todas as movimentações antes de fechar.
                </p>
              </div>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Cards de resumo financeiro */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-2 border-green-500/30 bg-gradient-to-br from-green-50/50 to-background dark:from-green-950/20 hover-lift">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Total Entradas</span>
                  <div className="p-1.5 bg-green-500/20 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatarMoeda(caixa.entrada)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  + Valor inicial: {formatarMoeda(caixa.valorInicial)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-red-500/30 bg-gradient-to-br from-red-50/50 to-background dark:from-red-950/20 hover-lift">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Total Saídas</span>
                  <div className="p-1.5 bg-red-500/20 rounded-lg">
                    <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatarMoeda(caixa.saida)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Sangrias e retiradas
                </p>
              </CardContent>
            </Card>

            <Card className={`border-2 ${
              saldoFinal >= 0 
                ? 'border-primary/30 bg-gradient-to-br from-primary/10 to-background' 
                : 'border-orange-500/30 bg-gradient-to-br from-orange-50/50 to-background dark:from-orange-950/20'
            } hover-lift`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Saldo Final</span>
                  <div className={`p-1.5 rounded-lg ${
                    saldoFinal >= 0 ? 'bg-primary/20' : 'bg-orange-500/20'
                  }`}>
                    <DollarSign className={`h-4 w-4 ${
                      saldoFinal >= 0 
                        ? 'text-primary' 
                        : 'text-orange-600 dark:text-orange-400'
                    }`} />
                  </div>
                </div>
                <p className={`text-2xl font-bold ${
                  saldoFinal >= 0 
                    ? 'text-primary' 
                    : 'text-orange-600 dark:text-orange-400'
                }`}>
                  {formatarMoeda(saldoFinal)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Performance: {formatarMoeda(caixa.performance)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Separator className="my-4" />

          {/* Resumo de movimentações */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5">
            <CardContent className="p-5">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-gradient-to-r from-primary to-accent animate-pulse"></div>
                Resumo de Movimentações
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-semibold uppercase">Total</p>
                  <p className="text-2xl font-bold text-primary">{totalMovimentacoes}</p>
                  <Badge variant="outline" className="text-xs">Movimentações</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-semibold uppercase">Vendas</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{vendasRegistradas}</p>
                  <Badge className="text-xs bg-green-500">Registradas</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-semibold uppercase">Injeções</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{injecoesRegistradas}</p>
                  <Badge className="text-xs bg-blue-500">Entradas</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-semibold uppercase">Sangrias</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{sangriasRegistradas}</p>
                  <Badge className="text-xs bg-red-500">Saídas</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Checklist de verificação */}
          <Card className="border-2 border-accent/20 bg-gradient-to-br from-card to-accent/5">
            <CardContent className="p-5">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-accent" />
                Verificação Final
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border border-border/50">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <p className="text-sm text-foreground">Todas as vendas foram sincronizadas</p>
                </div>
                <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border border-border/50">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <p className="text-sm text-foreground">Valores conferidos e validados</p>
                </div>
                <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border border-border/50">
                  {temAlerta ? (
                    <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  )}
                  <p className="text-sm text-foreground">
                    {temAlerta ? 'Performance negativa - revisar movimentações' : 'Performance positiva confirmada'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Aviso importante */}
          <div className="flex items-start gap-3 p-4 bg-destructive/10 border-2 border-destructive/30 rounded-xl">
            <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-destructive">
                Ação Irreversível
              </p>
              <p className="text-xs text-destructive/80 mt-1">
                Após o fechamento, o caixa não poderá ser reaberto automaticamente. Certifique-se de que todos os valores estão corretos antes de prosseguir.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-3 pt-4 border-t border-border/50">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="min-w-[120px]"
          >
            Cancelar
          </Button>
          <Button 
            onClick={onConfirm}
            className="min-w-[120px] bg-gradient-to-r from-destructive to-red-600 hover:from-destructive/90 hover:to-red-600/90 text-destructive-foreground shadow-lg"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Fechar Caixa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
