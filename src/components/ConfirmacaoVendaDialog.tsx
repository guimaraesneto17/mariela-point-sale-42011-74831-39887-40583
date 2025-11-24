import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { User, UserCheck, CreditCard, ShoppingCart, TrendingDown, Wallet, AlertCircle } from "lucide-react";
import { caixaAPI } from "@/lib/api";
import { toast } from "sonner";
import { CurrencyInput } from "@/components/ui/currency-input";

interface ItemVenda {
  codigoProduto: string;
  nomeProduto: string;
  cor: string;
  tamanho: string;
  quantidade: number;
  precoUnitario: number;
  descontoAplicado: number;
  descontoValor?: number;
  tipoDesconto: "porcentagem" | "valor";
  subtotal: number;
  emPromocao?: boolean;
}

interface ConfirmacaoVendaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  clienteSelecionado: { codigo: string; nome: string } | null;
  vendedorSelecionado: { codigo: string; nome: string } | null;
  formaPagamento: string;
  itensVenda: ItemVenda[];
  subtotalItens: number;
  valorDescontoTotal: number;
  totalFinal: number;
  taxaMaquininha: number;
  valorTaxaMaquininha: number;
  valorRecebidoLojista: number;
  parcelas: number;
}

export function ConfirmacaoVendaDialog({
  open,
  onOpenChange,
  onConfirm,
  clienteSelecionado,
  vendedorSelecionado,
  formaPagamento,
  itensVenda,
  subtotalItens,
  valorDescontoTotal,
  totalFinal,
  taxaMaquininha,
  valorTaxaMaquininha,
  valorRecebidoLojista,
  parcelas,
}: ConfirmacaoVendaDialogProps) {
  const [caixaAberto, setCaixaAberto] = useState<any>(null);
  const [verificandoCaixa, setVerificandoCaixa] = useState(false);
  const [mostrarAbrirCaixa, setMostrarAbrirCaixa] = useState(false);
  const [valorInicial, setValorInicial] = useState("0");
  const [abindoCaixa, setAbindoCaixa] = useState(false);

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  useEffect(() => {
    if (open) {
      verificarCaixaAberto();
    }
  }, [open]);

  const verificarCaixaAberto = async () => {
    try {
      setVerificandoCaixa(true);
      const response = await caixaAPI.getCaixaAberto();
      setCaixaAberto(response);
      setMostrarAbrirCaixa(false);
    } catch (error) {
      console.log('Nenhum caixa aberto encontrado');
      setCaixaAberto(null);
      setMostrarAbrirCaixa(true);
    } finally {
      setVerificandoCaixa(false);
    }
  };

  const handleAbrirCaixa = async () => {
    try {
      const valor = parseFloat(valorInicial);
      
      if (isNaN(valor) || valor < 0) {
        toast.error("Valor inicial inválido");
        return;
      }

      setAbindoCaixa(true);
      const novoCaixa = await caixaAPI.abrirCaixa(valor);
      setCaixaAberto(novoCaixa);
      setMostrarAbrirCaixa(false);
      setValorInicial("0");
      toast.success("Caixa aberto com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao abrir caixa");
    } finally {
      setAbindoCaixa(false);
    }
  };

  const handleConfirmarVenda = () => {
    if (!caixaAberto) {
      toast.error("É necessário ter um caixa aberto para finalizar a venda");
      return;
    }
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Confirmar Venda</DialogTitle>
          <DialogDescription>
            Revise todas as informações antes de finalizar a venda
          </DialogDescription>
        </DialogHeader>

        {verificandoCaixa ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="text-sm text-muted-foreground">Verificando caixa...</p>
            </div>
          </div>
        ) : mostrarAbrirCaixa ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-orange-900 dark:text-orange-100">Caixa Fechado</p>
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  É necessário abrir um caixa para finalizar vendas. Informe o valor inicial do caixa abaixo.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valorInicial">Valor Inicial do Caixa</Label>
              <CurrencyInput
                id="valorInicial"
                value={valorInicial}
                onValueChange={setValorInicial}
                placeholder="R$ 0,00"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleAbrirCaixa}
                disabled={abindoCaixa}
              >
                <Wallet className="h-4 w-4 mr-2" />
                {abindoCaixa ? "Abrindo..." : "Abrir Caixa"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
          {/* Cliente e Vendedor */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <User className="h-4 w-4" />
                Cliente
              </div>
              <div>
                <p className="font-medium">{clienteSelecionado?.nome}</p>
                <p className="text-sm text-muted-foreground">{clienteSelecionado?.codigo}</p>
              </div>
            </div>

            <div className="space-y-2 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <UserCheck className="h-4 w-4" />
                Vendedor
              </div>
              <div>
                <p className="font-medium">{vendedorSelecionado?.nome}</p>
                <p className="text-sm text-muted-foreground">{vendedorSelecionado?.codigo}</p>
              </div>
            </div>
          </div>

          {/* Forma de Pagamento */}
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-2">
              <CreditCard className="h-4 w-4" />
              Forma de Pagamento
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-primary">{formaPagamento}</Badge>
              {formaPagamento === "Cartão de Crédito" && parcelas > 1 && (
                <Badge variant="outline">{parcelas}x de {formatCurrency(totalFinal / parcelas)}</Badge>
              )}
            </div>
          </div>

          {/* Itens da Venda */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <ShoppingCart className="h-4 w-4" />
              Itens da Venda ({itensVenda.length})
            </div>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {itensVenda.map((item, idx) => (
                <div key={idx} className="p-3 bg-background border rounded-lg">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex-1">
                      <p className="font-medium">{item.nomeProduto}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.codigoProduto} • {item.cor} • {item.tamanho}
                      </p>
                    </div>
                    <Badge variant="outline" className="ml-2">x{item.quantidade}</Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex gap-2 items-center">
                      {item.tipoDesconto === "porcentagem" && item.descontoAplicado > 0 ? (
                        <>
                          <span className="text-muted-foreground line-through">
                            {formatCurrency(item.precoUnitario)}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            -{item.descontoAplicado}%
                          </Badge>
                        </>
                      ) : item.tipoDesconto === "valor" && item.descontoValor && item.descontoValor > 0 ? (
                        <>
                          <span className="text-muted-foreground line-through">
                            {formatCurrency(item.precoUnitario)}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            -{formatCurrency(item.descontoValor)}
                          </Badge>
                        </>
                      ) : null}
                    </div>
                    <span className="font-semibold">{formatCurrency(item.subtotal)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resumo Financeiro */}
          <div className="space-y-2 p-4 bg-accent/5 rounded-lg border-2 border-accent/20">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal dos itens:</span>
              <span className="font-medium">{formatCurrency(subtotalItens)}</span>
            </div>
            
            {valorDescontoTotal > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" />
                  Desconto total:
                </span>
                <span className="font-medium text-orange-600">- {formatCurrency(valorDescontoTotal)}</span>
              </div>
            )}
            
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total da Venda:</span>
              <span className="text-primary">{formatCurrency(totalFinal)}</span>
            </div>

            {taxaMaquininha > 0 && (
              <>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Taxa maquininha ({taxaMaquininha.toFixed(2)}%):</span>
                  <span>- {formatCurrency(valorTaxaMaquininha)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-accent border-t pt-2">
                  <span>Recebido pelo Lojista:</span>
                  <span>{formatCurrency(valorRecebidoLojista)}</span>
                </div>
              </>
            )}
          </div>

            {/* Status do Caixa */}
            {caixaAberto && (
              <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <Wallet className="h-4 w-4 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    Caixa {caixaAberto.codigoCaixa} está aberto
                  </p>
                  <p className="text-xs text-green-800 dark:text-green-200">
                    A venda será registrada automaticamente neste caixa
                  </p>
                </div>
              </div>
            )}

            {/* Botões */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Revisar Venda
              </Button>
              <Button
                className="flex-1"
                onClick={handleConfirmarVenda}
                disabled={!caixaAberto}
              >
                Confirmar e Finalizar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
