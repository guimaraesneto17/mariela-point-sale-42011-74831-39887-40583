import { useState, useMemo } from "react";
import { Search, Package, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EstoqueConsultaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estoque: any[];
}

export function EstoqueConsultaDialog({ 
  open, 
  onOpenChange, 
  estoque 
}: EstoqueConsultaDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const estoqueFiltrado = useMemo(() => {
    if (!searchTerm) return estoque;
    const search = searchTerm.toLowerCase();
    return estoque.filter((item: any) =>
      item.nomeProduto?.toLowerCase().includes(search) ||
      item.codigoProduto?.toLowerCase().includes(search) ||
      item.categoria?.toLowerCase().includes(search)
    );
  }, [estoque, searchTerm]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Consultar Estoque
          </DialogTitle>
          <DialogDescription>
            Visualize os produtos disponíveis em estoque
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, código ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <ScrollArea className="h-[60vh]">
          <div className="space-y-2 pr-4">
            {estoqueFiltrado.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum produto encontrado
              </p>
            ) : (
              estoqueFiltrado.map((item: any) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.nomeProduto}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                      <span>{item.codigoProduto}</span>
                      {item.categoria && (
                        <Badge variant="outline" className="text-xs">
                          {item.categoria}
                        </Badge>
                      )}
                      {item.emPromocao && (
                        <Badge variant="destructive" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          Promoção
                        </Badge>
                      )}
                      {item.isNovidade && (
                        <Badge className="text-xs bg-blue-500/20 text-blue-600">
                          Novidade
                        </Badge>
                      )}
                    </div>
                    {/* Mostrar variantes se existirem */}
                    {item.variantes && item.variantes.length > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        <span className="font-medium">Variantes: </span>
                        {item.variantes.map((v: any, idx: number) => (
                          <span key={idx}>
                            {v.cor} ({v.tamanhos?.map((t: any) => `${t.tamanho}: ${t.quantidade}`).join(', ') || v.quantidade})
                            {idx < item.variantes.length - 1 && ' | '}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold text-foreground">
                      {item.emPromocao && item.precoPromocional ? (
                        <>
                          <span className="line-through text-muted-foreground text-sm mr-2">
                            {formatCurrency(item.precoVenda)}
                          </span>
                          <span className="text-green-600">
                            {formatCurrency(item.precoPromocional)}
                          </span>
                        </>
                      ) : (
                        formatCurrency(item.precoVenda)
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantidadeTotal || item.quantidade || 0} un. total
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
