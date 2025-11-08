import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Plus, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { estoqueAPI } from "@/lib/api";

interface EditVariantImagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produto: any;
  variante: any;
  onSuccess?: () => void;
}

export function EditVariantImagesDialog({
  open,
  onOpenChange,
  produto,
  variante,
  onSuccess,
}: EditVariantImagesDialogProps) {
  const [imagens, setImagens] = useState<string[]>(variante?.imagens || []);
  const [imagemURL, setImagemURL] = useState("");
  const [loading, setLoading] = useState(false);

  const addImagemURL = () => {
    if (!imagemURL.trim()) {
      toast.error("Por favor, insira uma URL válida");
      return;
    }
    
    if (imagens.includes(imagemURL.trim())) {
      toast.error("Esta imagem já foi adicionada");
      return;
    }

    setImagens([...imagens, imagemURL.trim()]);
    setImagemURL("");
  };

  const removeImage = (index: number) => {
    setImagens(imagens.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      await estoqueAPI.updateVariantImages(produto.codigoProduto, {
        cor: variante.cor,
        tamanho: variante.tamanho,
        imagens: imagens,
      });

      toast.success("Imagens atualizadas com sucesso!");
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao atualizar imagens:", error);
      toast.error("Erro ao atualizar imagens");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Imagens da Variante</DialogTitle>
          <DialogDescription>
            {produto?.nomeProduto} - {variante?.cor} / {variante?.tamanho}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Campo para adicionar URL de imagem */}
          <div className="space-y-2">
            <Label>Adicionar Imagem (URL)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Cole o link da imagem aqui..."
                value={imagemURL}
                onChange={(e) => setImagemURL(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addImagemURL()}
              />
              <Button type="button" onClick={addImagemURL} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Você pode hospedar suas imagens em serviços como Imgur, Cloudinary, Google Drive, etc.
            </p>
          </div>

          {/* Grid de imagens */}
          {imagens.length > 0 ? (
            <div className="space-y-2">
              <Label>Imagens Adicionadas ({imagens.length})</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {imagens.map((img, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={img}
                      alt={`Imagem ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-border"
                      onError={(e) => {
                        e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3EErro%3C/text%3E%3C/svg%3E";
                      }}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 border border-dashed border-border rounded-lg">
              <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhuma imagem adicionada</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Salvando..." : "Salvar Imagens"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
