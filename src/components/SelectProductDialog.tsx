import { useState } from "react";
import { Search, Package, Tag } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ItemEstoque {
  codigoProduto: string;
  nomeProduto: string;
  precoVenda: number;
  cor: string;
  tamanho: string;
  quantidade: number;
  categoria?: string;
  emPromocao?: boolean;
  isNovidade?: boolean;
}

interface SelectProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estoque: ItemEstoque[];
  onSelect: (item: ItemEstoque) => void;
}

export function SelectProductDialog({ open, onOpenChange, estoque, onSelect }: SelectProductDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredEstoque = estoque.filter(item => 
    item.nomeProduto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.codigoProduto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.cor && item.cor.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Selecionar Produto do Estoque</DialogTitle>
        </DialogHeader>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por nome, código ou cor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
          {filteredEstoque.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum produto encontrado no estoque</p>
            </div>
          ) : (
            filteredEstoque.map((item, index) => (
              <Button
                key={`${item.codigoProduto}-${item.cor}-${item.tamanho}-${index}`}
                variant="outline"
                className="w-full justify-between h-auto p-4 hover:bg-primary/5"
                onClick={() => {
                  if (item.quantidade <= 0) {
                    return; // Não permitir selecionar item sem estoque
                  }
                  onSelect(item);
                  onOpenChange(false);
                  setSearchTerm("");
                }}
                disabled={item.quantidade <= 0}
              >
                <div className="flex items-start gap-3 flex-1">
                  <Package className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div className="text-left flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{item.nomeProduto}</p>
                      {item.emPromocao && (
                        <Badge variant="secondary" className="text-xs bg-accent text-accent-foreground">
                          Promoção
                        </Badge>
                      )}
                      {item.isNovidade && (
                        <Badge variant="secondary" className="text-xs bg-green-600 text-white">
                          Novidade
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Código: {item.codigoProduto}
                      {item.categoria && ` • ${item.categoria}`}
                    </p>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        Cor: <strong>{item.cor}</strong>
                      </span>
                      <span>
                        Tamanho: <strong>{item.tamanho}</strong>
                      </span>
                      <span className={item.quantidade <= 5 ? 'text-orange-600 font-bold' : 'text-green-600'}>
                        Estoque: <strong>{item.quantidade} un.</strong>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 ml-3">
                  <span className="font-bold text-lg">R$ {item.precoVenda.toFixed(2)}</span>
                  {item.quantidade <= 0 && (
                    <Badge variant="destructive" className="text-xs">
                      Esgotado
                    </Badge>
                  )}
                  {item.quantidade > 0 && item.quantidade <= 5 && (
                    <Badge variant="outline" className="text-xs text-orange-600 border-orange-600">
                      Estoque baixo
                    </Badge>
                  )}
                </div>
              </Button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
