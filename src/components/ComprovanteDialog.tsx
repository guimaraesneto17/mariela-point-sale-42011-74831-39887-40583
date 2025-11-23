import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ImagePlus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ComprovanteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comprovante?: string;
  readonly?: boolean;
  onSave?: (comprovante: string) => void;
}

export function ComprovanteDialog({ 
  open, 
  onOpenChange, 
  comprovante: initialComprovante, 
  readonly = false,
  onSave 
}: ComprovanteDialogProps) {
  const [comprovante, setComprovante] = useState<string | null>(initialComprovante || null);
  const [loading, setLoading] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Imagem muito grande. Máximo 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setComprovante(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!comprovante) {
      toast.error('Selecione uma imagem');
      return;
    }
    
    setLoading(true);
    try {
      if (onSave) {
        await onSave(comprovante);
      }
      toast.success('Comprovante salvo com sucesso');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar comprovante');
    } finally {
      setLoading(false);
    }
  };

  const removeImage = () => {
    setComprovante(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {readonly ? 'Comprovante de Pagamento' : 'Adicionar Comprovante'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!comprovante && !readonly ? (
            <label className="flex items-center justify-center gap-2 p-8 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-smooth">
              <ImagePlus className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Anexar comprovante (máx 5MB)</span>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageUpload}
              />
            </label>
          ) : comprovante ? (
            <div className="relative">
              <img 
                src={comprovante} 
                alt="Comprovante" 
                className="w-full max-h-96 object-contain rounded-lg border border-border"
              />
              {!readonly && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              Nenhum comprovante anexado
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              {readonly ? 'Fechar' : 'Cancelar'}
            </Button>
            {!readonly && (
              <Button 
                type="button" 
                onClick={handleSave}
                disabled={loading || !comprovante}
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}