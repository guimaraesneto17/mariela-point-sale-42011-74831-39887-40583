import { useState } from "react";
import { Search, Package } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Produto {
  codigo: string;
  nome: string;
  preco: number;
  categoria?: string;
}

interface SelectProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produtos: Produto[];
  onSelect: (produto: Produto) => void;
}

export function SelectProductDialog({ open, onOpenChange, produtos, onSelect }: SelectProductDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProdutos = produtos.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Selecionar Produto</DialogTitle>
        </DialogHeader>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por nome ou código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {filteredProdutos.map((produto) => (
            <Button
              key={produto.codigo}
              variant="outline"
              className="w-full justify-between h-auto p-4"
              onClick={() => {
                onSelect(produto);
                onOpenChange(false);
                setSearchTerm("");
              }}
            >
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="font-medium">{produto.nome}</p>
                  <p className="text-xs text-muted-foreground">{produto.codigo}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {produto.categoria && (
                  <Badge variant="secondary" className="text-xs">
                    {produto.categoria}
                  </Badge>
                )}
                <span className="font-bold">R$ {produto.preco.toFixed(2)}</span>
              </div>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
