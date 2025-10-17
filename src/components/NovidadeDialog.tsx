import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface NovidadeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  codigoProduto: string;
  nomeProduto: string;
  isNovidade: boolean;
}

export function NovidadeDialog({ 
  open, 
  onOpenChange, 
  codigoProduto, 
  nomeProduto,
  isNovidade 
}: NovidadeDialogProps) {
  
  const handleConfirm = () => {
    if (isNovidade) {
      toast.success(`"${nomeProduto}" removido das novidades!`);
    } else {
      toast.success(`"${nomeProduto}" marcado como novidade!`);
    }
    onOpenChange(false);
    // Aqui você implementaria a lógica com a API
  };

  if (isNovidade) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <DialogTitle className="text-xl">Remover Novidade?</DialogTitle>
            </div>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja remover <span className="font-semibold text-foreground">"{nomeProduto}"</span> das novidades?
            </p>
            <p className="text-sm text-muted-foreground">
              Código: <span className="font-medium">{codigoProduto}</span>
            </p>
          </div>

          <div className="flex gap-3 mt-6">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button 
              className="flex-1"
              onClick={handleConfirm}
            >
              Confirmar Remoção
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}