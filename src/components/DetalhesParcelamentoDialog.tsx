import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calendar, CreditCard, CheckCircle2, Clock, AlertCircle, FileImage, ImagePlus, Download } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { RegistrarPagamentoDialog } from "./RegistrarPagamentoDialog";
import { ComprovanteDialog } from "./ComprovanteDialog";

interface DetalhesParcelamentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conta: any | null;
  tipo: 'pagar' | 'receber';
  onSuccess: () => void;
}

export function DetalhesParcelamentoDialog({ open, onOpenChange, conta, tipo, onSuccess }: DetalhesParcelamentoDialogProps) {
  const [registroDialogOpen, setRegistroDialogOpen] = useState(false);
  const [parcelaParaPagar, setParcelaParaPagar] = useState<number | undefined>(undefined);
  const [comprovanteDialogOpen, setComprovanteDialogOpen] = useState(false);
  const [comprovanteAtual, setComprovanteAtual] = useState<string | undefined>(undefined);

  if (!conta || (conta.tipoCriacao !== 'Parcelamento' && conta.tipoCriacao !== 'Replica')) return null;

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pago':
      case 'Recebido':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'Vencido':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'Parcial':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const isReplica = conta.tipoCriacao === 'Replica';
  const detalhes = isReplica ? conta.detalhesReplica : conta.detalhesParcelamento;
  const tituloDialog = isReplica ? 'Detalhes da Réplica' : 'Detalhes do Parcelamento';
  const labelItem = isReplica ? 'réplica' : 'parcela';
  const labelItems = isReplica ? 'réplicas' : 'parcelas';

  const parcelasPagas = conta.parcelas?.filter((p: any) => 
    p.status === (tipo === 'pagar' ? 'Pago' : 'Recebido')
  ).length || 0;
  const totalParcelas = conta.parcelas?.length || 0;
  const progressoPercentual = totalParcelas > 0 ? (parcelasPagas / totalParcelas) * 100 : 0;

  const valorTotalPago = conta.parcelas?.reduce((sum: number, p: any) => {
    const valorPago = tipo === 'pagar' 
      ? (p.pagamento?.valor || 0) 
      : (p.recebimento?.valor || 0);
    return sum + valorPago;
  }, 0) || 0;

  const valorTotal = isReplica 
    ? (detalhes?.valor || 0) * (detalhes?.quantidadeReplicas || 0)
    : (detalhes?.valorTotal || 0);

  const handlePagarParcela = (numeroParcela: number) => {
    setParcelaParaPagar(numeroParcela);
    setRegistroDialogOpen(true);
  };

  const handleSuccessRegistro = () => {
    onSuccess(); // Atualiza instantaneamente
  };

  const handleViewComprovante = (comprovante: string) => {
    setComprovanteAtual(comprovante);
    setComprovanteDialogOpen(true);
  };

  const handleDownloadComprovante = (comprovante: string, numeroParcela: number) => {
    const link = document.createElement('a');
    link.href = comprovante;
    link.download = `comprovante-${conta.numeroDocumento}-parcela-${numeroParcela}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{tituloDialog} - {conta.numeroDocumento}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Informações Gerais */}
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Descrição</p>
                    <p className="font-semibold text-foreground">{conta.descricao}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Categoria</p>
                    <p className="font-semibold text-foreground">{conta.categoria}</p>
                  </div>
                  {tipo === 'pagar' && conta.fornecedor?.nome && (
                    <div>
                      <p className="text-sm text-muted-foreground">Fornecedor</p>
                      <p className="font-semibold text-foreground">{conta.fornecedor.nome}</p>
                    </div>
                  )}
                  {tipo === 'receber' && conta.cliente?.nome && (
                    <div>
                      <p className="text-sm text-muted-foreground">Cliente</p>
                      <p className="font-semibold text-foreground">{conta.cliente.nome}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Total</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(valorTotal)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Progresso do Parcelamento/Replica */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Progresso</p>
                      <p className="text-lg font-semibold text-foreground">
                        {parcelasPagas} de {totalParcelas} {labelItems} {tipo === 'pagar' ? 'pagas' : 'recebidas'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">{tipo === 'pagar' ? 'Pago' : 'Recebido'}</p>
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(valorTotalPago)}
                      </p>
                    </div>
                  </div>
                  <Progress value={progressoPercentual} className="h-3" />
                  <p className="text-xs text-muted-foreground text-center">
                    {progressoPercentual.toFixed(1)}% completo
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Tabela de Parcelas/Réplicas */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground capitalize">{labelItems}</h3>
              {conta.parcelas?.map((parcela: any) => {
                const pagamentoParcela = tipo === 'pagar' ? parcela.pagamento : parcela.recebimento;
                const valorPago = pagamentoParcela?.valor || 0;
                const saldoParcela = parcela.valor - valorPago;
                const isPaga = parcela.status === (tipo === 'pagar' ? 'Pago' : 'Recebido');

                return (
                  <Card key={parcela.numeroParcela} className="shadow-card hover:shadow-elegant transition-smooth">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          {getStatusIcon(parcela.status)}
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-foreground">
                                {isReplica ? `Mês ${parcela.numeroParcela}/${totalParcelas}` : `Parcela ${parcela.numeroParcela}/${totalParcelas}`}
                              </h4>
                              {getStatusBadge(parcela.status)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>Venc: {format(new Date(parcela.dataVencimento), 'dd/MM/yyyy', { locale: ptBR })}</span>
                              </div>
                              {pagamentoParcela?.formaPagamento && (
                                <div className="flex items-center gap-1">
                                  <CreditCard className="h-4 w-4" />
                                  <span>{pagamentoParcela.formaPagamento}</span>
                                </div>
                              )}
                            </div>
                            {pagamentoParcela?.data && (
                              <p className="text-xs text-muted-foreground">
                                {tipo === 'pagar' ? 'Pago' : 'Recebido'} em: {format(new Date(pagamentoParcela.data), 'dd/MM/yyyy', { locale: ptBR })}
                              </p>
                            )}
                            {pagamentoParcela?.observacoes && (
                              <p className="text-xs text-muted-foreground italic">
                                {pagamentoParcela.observacoes}
                              </p>
                            )}
                            {pagamentoParcela?.comprovante && (
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="mt-1 h-auto p-0 text-xs text-primary hover:text-primary/80"
                                  onClick={() => handleViewComprovante(pagamentoParcela.comprovante)}
                                >
                                  <FileImage className="h-3 w-3 mr-1" />
                                  Ver comprovante
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="mt-1 h-auto p-0 text-xs text-green-600 hover:text-green-700"
                                  onClick={() => handleDownloadComprovante(pagamentoParcela.comprovante, parcela.numeroParcela)}
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  Baixar
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <div>
                            <p className="text-sm text-muted-foreground">Valor</p>
                            <p className="text-lg font-bold text-foreground">
                              {formatCurrency(parcela.valor)}
                            </p>
                          </div>
                          {valorPago > 0 && (
                            <div>
                              <p className="text-xs text-muted-foreground">{tipo === 'pagar' ? 'Pago' : 'Recebido'}</p>
                              <p className="text-sm font-semibold text-green-600">
                                {formatCurrency(valorPago)}
                              </p>
                            </div>
                          )}
                          {!isPaga && saldoParcela > 0 && parcela.status !== 'Parcial' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handlePagarParcela(parcela.numeroParcela)}
                            >
                              {tipo === 'pagar' ? 'Pagar' : 'Receber'}
                            </Button>
                          )}
                          {parcela.status === 'Parcial' && (
                            <Badge variant="outline" className="text-xs">
                              Edição bloqueada
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <RegistrarPagamentoDialog
        open={registroDialogOpen}
        onOpenChange={setRegistroDialogOpen}
        tipo={tipo}
        conta={conta}
        numeroParcela={parcelaParaPagar}
        onSuccess={handleSuccessRegistro}
      />

      <ComprovanteDialog
        open={comprovanteDialogOpen}
        onOpenChange={setComprovanteDialogOpen}
        comprovante={comprovanteAtual}
        readonly={true}
      />
    </>
  );
}
