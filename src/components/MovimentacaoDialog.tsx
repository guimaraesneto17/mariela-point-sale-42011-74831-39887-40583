import { TrendingUp, TrendingDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MovimentacaoLog {
  data: string;
  tipo: "entrada" | "saida";
  quantidade: number;
  fornecedor?: string;
  codigoVenda?: string;
  observacao?: string;
}

interface MovimentacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  codigoProduto: string;
  nomeProduto: string;
  logMovimentacao: MovimentacaoLog[];
}

export const MovimentacaoDialog = ({
  open,
  onOpenChange,
  codigoProduto,
  nomeProduto,
  logMovimentacao = [],
}: MovimentacaoDialogProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] bg-gradient-to-br from-background via-background to-primary/5">
        <DialogHeader className="pb-4 border-b border-border/50">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
            Histórico de Movimentações
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-base mt-2">
            <span className="font-semibold">{nomeProduto}</span> - Código: {codigoProduto}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-3">
            {logMovimentacao.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma movimentação registrada para este produto.
              </div>
            ) : (
              logMovimentacao.map((log, idx) => (
                <div 
                  key={idx} 
                  className="p-4 rounded-lg border border-border bg-gradient-to-br from-card via-card to-primary/5 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      log.tipo === "entrada" 
                        ? "bg-green-500/10 text-green-600" 
                        : "bg-red-500/10 text-red-600"
                    }`}>
                      {log.tipo === "entrada" ? (
                        <TrendingUp className="h-6 w-6" />
                      ) : (
                        <TrendingDown className="h-6 w-6" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className={`text-lg font-semibold ${
                          log.tipo === "entrada" ? "text-green-600" : "text-red-600"
                        }`}>
                          {log.tipo === "entrada" ? "Entrada" : "Saída"}
                        </h4>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(log.data)}
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Quantidade:</span>
                          <span className="font-semibold">{log.quantidade} un.</span>
                        </div>
                        
                        {log.fornecedor && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Fornecedor:</span>
                            <span className="font-medium">{log.fornecedor}</span>
                          </div>
                        )}
                        
                        {log.codigoVenda && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Código da Venda:</span>
                            <span className="font-medium">{log.codigoVenda}</span>
                          </div>
                        )}
                        
                        {log.observacao && (
                          <div className="pt-2 border-t border-border/50">
                            <span className="text-muted-foreground">Observação:</span>
                            <p className="text-foreground mt-1">{log.observacao}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
