import { useState } from "react";
import { Search, UserCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Vendedor {
  codigo: string;
  nome: string;
}

interface SelectVendedorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendedores: Vendedor[];
  onSelect: (vendedor: Vendedor) => void;
}

export function SelectVendedorDialog({ open, onOpenChange, vendedores, onSelect }: SelectVendedorDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredVendedores = vendedores.filter(v => 
    v.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Selecionar Vendedor</DialogTitle>
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
          {filteredVendedores.map((vendedor) => (
            <Button
              key={vendedor.codigo}
              variant="outline"
              className="w-full justify-start h-auto p-4"
              onClick={() => {
                onSelect(vendedor);
                onOpenChange(false);
                setSearchTerm("");
              }}
            >
              <UserCheck className="h-5 w-5 text-primary mr-3" />
              <div className="text-left">
                <p className="font-medium">{vendedor.nome}</p>
                <p className="text-xs text-muted-foreground">{vendedor.codigo}</p>
              </div>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
