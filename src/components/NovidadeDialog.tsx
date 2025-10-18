import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { estoqueAPI } from "@/lib/api";

interface NovidadeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  codigoProduto: string;
  nomeProduto: string;
  isNovidade: boolean;
  onSuccess?: () => void;
}

export function NovidadeDialog({ 
  open, 
  onOpenChange, 
  codigoProduto, 
  nomeProduto,
  isNovidade,
  onSuccess 
}: NovidadeDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await estoqueAPI.toggleNovidade(codigoProduto, !isNovidade);

      if (isNovidade) {
        toast.success(`"${nomeProduto}" removido das novidades!`);
      } else {
        toast.success(`"${nomeProduto}" marcado como novidade!`);
      }
      
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error('Erro ao atualizar novidade', {
        description: 'Verifique se o servidor está rodando'
      });
    } finally {
      setIsLoading(false);
    }
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
          <DialogDescription className="sr-only">
            Confirme a remoção do produto das novidades
          </DialogDescription>
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
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              className="flex-1"
              onClick={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? "Removendo..." : "Confirmar Remoção"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-green-600" />
            </div>
            <DialogTitle className="text-xl">Marcar como Novidade?</DialogTitle>
          </div>
          <DialogDescription className="sr-only">
            Confirme para marcar o produto como novidade
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Deseja marcar <span className="font-semibold text-foreground">"{nomeProduto}"</span> como novidade?
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
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Salvando..." : "Confirmar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}