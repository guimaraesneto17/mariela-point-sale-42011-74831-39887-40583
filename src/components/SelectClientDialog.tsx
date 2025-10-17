import { useState } from "react";
import { Search, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Cliente {
  codigo: string;
  nome: string;
}

interface SelectClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientes: Cliente[];
  onSelect: (cliente: Cliente) => void;
}

export function SelectClientDialog({ open, onOpenChange, clientes, onSelect }: SelectClientDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredClientes = clientes.filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Selecionar Cliente</DialogTitle>
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
          {filteredClientes.map((cliente) => (
            <Button
              key={cliente.codigo}
              variant="outline"
              className="w-full justify-start h-auto p-4"
              onClick={() => {
                onSelect(cliente);
                onOpenChange(false);
                setSearchTerm("");
              }}
            >
              <User className="h-5 w-5 text-primary mr-3" />
              <div className="text-left">
                <p className="font-medium">{cliente.nome}</p>
                <p className="text-xs text-muted-foreground">{cliente.codigo}</p>
              </div>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
