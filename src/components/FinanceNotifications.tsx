import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Bell, AlertCircle, Calendar } from "lucide-react";
import { contasPagarAPI, contasReceberAPI } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { format, differenceInDays, isToday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

interface Conta {
  numeroDocumento: string;
  descricao: string;
  dataVencimento: string;
  valor: number;
  status: string;
  categoria: string;
}

export const FinanceNotifications = () => {
  const [contasProximas, setContasProximas] = useState<{pagar: Conta[], receber: Conta[]}>({ pagar: [], receber: [] });
  const [contasVencendoHoje, setContasVencendoHoje] = useState<{pagar: Conta[], receber: Conta[]}>({ pagar: [], receber: [] });
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    verificarContasProximas();
  }, []);

  const verificarContasProximas = async () => {
    try {
      const [contasPagar, contasReceber] = await Promise.all([
        contasPagarAPI.getAll(),
        contasReceberAPI.getAll(),
      ]);

      const hoje = new Date();
      
      const proximas = {
        pagar: [] as Conta[],
        receber: [] as Conta[]
      };

      const vencendoHoje = {
        pagar: [] as Conta[],
        receber: [] as Conta[]
      };

      // Verificar contas a pagar
      contasPagar.forEach((conta: Conta) => {
        if (conta.status === 'Pendente' || conta.status === 'Parcial') {
          const dataVencimento = parseISO(conta.dataVencimento);
          const diasRestantes = differenceInDays(dataVencimento, hoje);

          if (isToday(dataVencimento)) {
            vencendoHoje.pagar.push(conta);
          } else if (diasRestantes > 0 && diasRestantes <= 7) {
            proximas.pagar.push(conta);
          }
        }
      });

      // Verificar contas a receber
      contasReceber.forEach((conta: Conta) => {
        if (conta.status === 'Pendente' || conta.status === 'Parcial') {
          const dataVencimento = parseISO(conta.dataVencimento);
          const diasRestantes = differenceInDays(dataVencimento, hoje);

          if (isToday(dataVencimento)) {
            vencendoHoje.receber.push(conta);
          } else if (diasRestantes > 0 && diasRestantes <= 7) {
            proximas.receber.push(conta);
          }
        }
      });

      setContasProximas(proximas);
      setContasVencendoHoje(vencendoHoje);
    } catch (error) {
      console.error('Erro ao verificar contas próximas:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const totalNotifications = 
    contasVencendoHoje.pagar.length + 
    contasVencendoHoje.receber.length + 
    contasProximas.pagar.length + 
    contasProximas.receber.length;

  if (totalNotifications === 0) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-6">
      <Alert className="border-orange-500/50 bg-gradient-to-br from-orange-500/10 to-orange-500/5">
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full flex items-center justify-between p-0 h-auto hover:bg-transparent"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bell className="h-5 w-5 text-orange-600" />
                {totalNotifications > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-600 rounded-full flex items-center justify-center">
                    <span className="text-[10px] text-white font-bold">{totalNotifications}</span>
                  </div>
                )}
              </div>
              <AlertTitle className="mb-0 text-orange-900 dark:text-orange-400">
                Alertas de Vencimento
              </AlertTitle>
            </div>
            <ChevronDown className={`h-5 w-5 text-orange-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-4">
          <AlertDescription className="space-y-4">
            {/* Contas Vencendo Hoje */}
            {(contasVencendoHoje.pagar.length > 0 || contasVencendoHoje.receber.length > 0) && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-semibold text-red-700 dark:text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <span>Vencendo Hoje</span>
                </div>
                
                {contasVencendoHoje.pagar.map((conta) => (
                  <div key={conta.numeroDocumento} className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{conta.descricao}</p>
                      <p className="text-xs text-muted-foreground">Doc: {conta.numeroDocumento}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">A Pagar</Badge>
                      <span className="font-bold text-red-600">{formatCurrency(conta.valor)}</span>
                    </div>
                  </div>
                ))}

                {contasVencendoHoje.receber.map((conta) => (
                  <div key={conta.numeroDocumento} className="flex items-center justify-between p-3 bg-orange-500/10 rounded-lg border border-orange-500/30">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{conta.descricao}</p>
                      <p className="text-xs text-muted-foreground">Doc: {conta.numeroDocumento}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-orange-600 text-white">A Receber</Badge>
                      <span className="font-bold text-orange-600">{formatCurrency(conta.valor)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Contas Próximas (7 dias) */}
            {(contasProximas.pagar.length > 0 || contasProximas.receber.length > 0) && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-semibold text-orange-700 dark:text-orange-400">
                  <Calendar className="h-4 w-4" />
                  <span>Próximos 7 Dias</span>
                </div>
                
                {contasProximas.pagar.map((conta) => {
                  const diasRestantes = differenceInDays(parseISO(conta.dataVencimento), new Date());
                  return (
                    <div key={conta.numeroDocumento} className="flex items-center justify-between p-3 bg-orange-500/5 rounded-lg border border-orange-500/20">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{conta.descricao}</p>
                        <p className="text-xs text-muted-foreground">
                          Vence em {diasRestantes} dia{diasRestantes !== 1 ? 's' : ''} - {format(parseISO(conta.dataVencimento), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">A Pagar</Badge>
                        <span className="font-bold text-foreground">{formatCurrency(conta.valor)}</span>
                      </div>
                    </div>
                  );
                })}

                {contasProximas.receber.map((conta) => {
                  const diasRestantes = differenceInDays(parseISO(conta.dataVencimento), new Date());
                  return (
                    <div key={conta.numeroDocumento} className="flex items-center justify-between p-3 bg-green-500/5 rounded-lg border border-green-500/20">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{conta.descricao}</p>
                        <p className="text-xs text-muted-foreground">
                          Vence em {diasRestantes} dia{diasRestantes !== 1 ? 's' : ''} - {format(parseISO(conta.dataVencimento), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-600 text-white">A Receber</Badge>
                        <span className="font-bold text-foreground">{formatCurrency(conta.valor)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </AlertDescription>
        </CollapsibleContent>
      </Alert>
    </Collapsible>
  );
};
