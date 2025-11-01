import { Tag, Calendar, DollarSign, Percent } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

interface LogPromocao {
  dataInicio: string;
  dataFim?: string;
  precoPromocional: number;
  ativo: boolean;
  observacao?: string;
  tipoDeDesconto?: "valorDireto" | "porcentagem" | null;
  valorDesconto?: number | null;
}

interface PromocaoHistoricoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  codigoProduto: string;
  nomeProduto: string;
  logPromocao: LogPromocao[];
  precoOriginal?: number;
}

export const PromocaoHistoricoDialog = ({
  open,
  onOpenChange,
  codigoProduto,
  nomeProduto,
  logPromocao = [],
  precoOriginal = 0,
}: PromocaoHistoricoDialogProps) => {
  // Ordenar do mais recente para o mais antigo
  const promocoesOrdenadas = [...logPromocao].sort((a, b) => 
    new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime()
  );

  const calcularDesconto = (preco: number, precoPromocional: number) => {
    if (preco <= 0) return 0;
    return ((preco - precoPromocional) / preco) * 100;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] bg-gradient-to-br from-background via-background to-purple-500/5">
        <DialogHeader className="pb-4 border-b border-border/50">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-purple-500 to-accent bg-clip-text text-transparent flex items-center gap-2">
            <Tag className="h-6 w-6 text-purple-600" />
            Histórico de Promoções
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-base mt-2">
            <span className="font-semibold">{nomeProduto}</span> - Código: {codigoProduto}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {promocoesOrdenadas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Tag className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma promoção registrada para este produto.</p>
              </div>
            ) : (
              promocoesOrdenadas.map((promo, idx) => {
                const desconto = calcularDesconto(precoOriginal, promo.precoPromocional);
                
                return (
                  <div 
                    key={idx} 
                    className={`p-5 rounded-lg border ${
                      promo.ativo 
                        ? 'border-purple-500/50 bg-gradient-to-br from-purple-500/10 via-card to-purple-500/5' 
                        : 'border-border bg-gradient-to-br from-card via-card to-muted/30'
                    } hover:shadow-md transition-all`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          promo.ativo 
                            ? "bg-purple-500/20 text-purple-600" 
                            : "bg-muted text-muted-foreground"
                        }`}>
                          <Tag className="h-6 w-6" />
                        </div>
                        
                        <div>
                          <h4 className="text-lg font-semibold flex items-center gap-2">
                            Promoção #{promocoesOrdenadas.length - idx}
                            {promo.ativo && (
                              <Badge className="bg-purple-600 text-white">
                                Ativa
                              </Badge>
                            )}
                          </h4>
                          {promo.observacao && (
                            <p className="text-sm text-muted-foreground mt-1">{promo.observacao}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Período */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Início:</span>
                          <span className="text-muted-foreground">
                            {formatDateTime(promo.dataInicio)}
                          </span>
                        </div>
                        
                        {promo.dataFim && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Fim:</span>
                            <span className="text-muted-foreground">
                              {formatDateTime(promo.dataFim)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Preços e Desconto */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Preço Promocional:</span>
                          <span className="text-lg font-bold text-purple-600">
                            R$ {promo.precoPromocional.toFixed(2)}
                          </span>
                        </div>
                        
                        {precoOriginal > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <Percent className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Desconto:</span>
                            <span className="text-green-600 font-semibold">
                              {desconto.toFixed(1)}% OFF
                            </span>
                          </div>
                        )}
                        
                        {promo.tipoDeDesconto && promo.valorDesconto && (
                          <div className="flex items-center gap-2 text-sm">
                            <Tag className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Tipo:</span>
                            <Badge variant="outline">
                              {promo.tipoDeDesconto === "valorDireto" 
                                ? `R$ ${promo.valorDesconto.toFixed(2)} OFF` 
                                : `${promo.valorDesconto}% OFF`}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
