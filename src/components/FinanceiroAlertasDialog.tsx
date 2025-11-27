import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Calendar, DollarSign } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useContasPagar, useContasReceber } from "@/hooks/useQueryCache";
import { useNavigate } from "react-router-dom";

interface FinanceiroAlertasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FinanceiroAlertasDialog({ open, onOpenChange }: FinanceiroAlertasDialogProps) {
  const { data: contasPagarData = [] } = useContasPagar();
  const { data: contasReceberData = [] } = useContasReceber();
  const navigate = useNavigate();

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Filtra contas vencidas ou vencendo hoje
  const contasPagarUrgentes = contasPagarData.filter((conta: any) => {
    const statusLower = (conta.status || '').toLowerCase();
    if (statusLower === 'pago' || statusLower === 'paga') return false;
    
    const dataVencimento = new Date(conta.dataVencimento);
    dataVencimento.setHours(0, 0, 0, 0);
    return dataVencimento <= hoje;
  });

  const contasReceberUrgentes = contasReceberData.filter((conta: any) => {
    const statusLower = (conta.status || '').toLowerCase();
    if (statusLower === 'recebido' || statusLower === 'recebida') return false;
    
    const dataVencimento = new Date(conta.dataVencimento);
    dataVencimento.setHours(0, 0, 0, 0);
    return dataVencimento <= hoje;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getDiasAtraso = (dataVencimento: Date) => {
    return differenceInDays(hoje, dataVencimento);
  };

  const getSeveridade = (diasAtraso: number) => {
    if (diasAtraso > 30) return { color: 'destructive', label: 'CRÍTICO' };
    if (diasAtraso > 7) return { color: 'warning', label: 'ALTO' };
    if (diasAtraso > 0) return { color: 'secondary', label: 'ATENÇÃO' };
    return { color: 'default', label: 'HOJE' };
  };

  const handleNavigate = () => {
    onOpenChange(false);
    navigate('/financeiro');
  };

  const totalUrgentes = contasPagarUrgentes.length + contasReceberUrgentes.length;
  const valorTotalPagar = contasPagarUrgentes.reduce((acc: number, c: any) => acc + (c.valor || 0), 0);
  const valorTotalReceber = contasReceberUrgentes.reduce((acc: number, c: any) => acc + (c.valor || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl text-destructive">
            <AlertTriangle className="h-6 w-6" />
            Alertas Financeiros Urgentes
          </DialogTitle>
          <DialogDescription>
            Contas vencidas ou vencendo hoje que requerem atenção imediata
          </DialogDescription>
        </DialogHeader>

        {totalUrgentes === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Tudo em dia! 🎉</h3>
            <p className="text-muted-foreground">
              Não há contas vencidas ou vencendo hoje.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Resumo dos Alertas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-red-200 dark:border-red-900">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total de Contas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">
                    {totalUrgentes}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-red-200 dark:border-red-900">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    A Pagar (Urgente)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(valorTotalPagar)}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-200 dark:border-orange-900">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    A Receber (Urgente)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(valorTotalReceber)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contas a Pagar Urgentes */}
            {contasPagarUrgentes.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-red-600">Contas a Pagar - Urgente</h3>
                {contasPagarUrgentes.map((conta: any) => {
                  const dataVencimento = new Date(conta.dataVencimento);
                  const diasAtraso = getDiasAtraso(dataVencimento);
                  const severidade = getSeveridade(diasAtraso);
                  
                  return (
                    <Card key={conta.numeroDocumento} className="border-l-4 border-l-red-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <AlertTriangle className="h-5 w-5 text-red-600" />
                              <h4 className="font-semibold text-lg">{conta.descricao}</h4>
                              <Badge variant={severidade.color as any}>
                                {severidade.label}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-muted-foreground mt-3">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>Venc: {format(dataVencimento, 'dd/MM/yyyy', { locale: ptBR })}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                <span>{formatCurrency(conta.valor)}</span>
                              </div>
                              {diasAtraso > 0 && (
                                <div className="flex items-center gap-2 text-red-600 font-semibold">
                                  <AlertTriangle className="h-4 w-4" />
                                  <span>{diasAtraso} dia(s) em atraso</span>
                                </div>
                              )}
                              {diasAtraso === 0 && (
                                <div className="flex items-center gap-2 text-orange-600 font-semibold">
                                  <Calendar className="h-4 w-4" />
                                  <span>Vence HOJE</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Contas a Receber Urgentes */}
            {contasReceberUrgentes.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-orange-600">Contas a Receber - Urgente</h3>
                {contasReceberUrgentes.map((conta: any) => {
                  const dataVencimento = new Date(conta.dataVencimento);
                  const diasAtraso = getDiasAtraso(dataVencimento);
                  const severidade = getSeveridade(diasAtraso);
                  
                  return (
                    <Card key={conta.numeroDocumento} className="border-l-4 border-l-orange-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <AlertTriangle className="h-5 w-5 text-orange-600" />
                              <h4 className="font-semibold text-lg">{conta.descricao}</h4>
                              <Badge variant={severidade.color as any}>
                                {severidade.label}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-muted-foreground mt-3">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>Venc: {format(dataVencimento, 'dd/MM/yyyy', { locale: ptBR })}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                <span>{formatCurrency(conta.valor)}</span>
                              </div>
                              {diasAtraso > 0 && (
                                <div className="flex items-center gap-2 text-red-600 font-semibold">
                                  <AlertTriangle className="h-4 w-4" />
                                  <span>{diasAtraso} dia(s) em atraso</span>
                                </div>
                              )}
                              {diasAtraso === 0 && (
                                <div className="flex items-center gap-2 text-orange-600 font-semibold">
                                  <Calendar className="h-4 w-4" />
                                  <span>Vence HOJE</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Botão para ir ao Financeiro */}
            <div className="flex justify-center pt-4">
              <Button
                size="lg"
                onClick={handleNavigate}
                className="gap-2"
              >
                <DollarSign className="h-5 w-5" />
                Ir para Financeiro
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
