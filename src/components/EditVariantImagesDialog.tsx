import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Plus, Image as ImageIcon, GripVertical, Star, Upload, Link as LinkIcon, Edit } from "lucide-react";
import { toast } from "sonner";
import { estoqueAPI } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageEditorDialog } from "@/components/ImageEditorDialog";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface EditVariantImagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produto: any;
  variante: any;
  onSuccess?: () => void;
}

// Componente para item arrastável com destaque
function SortableImageItem({ 
  id, 
  img, 
  index, 
  isDestaque,
  onRemove,
  onSetDestaque,
  onEdit
}: { 
  id: string; 
  img: string; 
  index: number; 
  isDestaque: boolean;
  onRemove: () => void;
  onSetDestaque: () => void;
  onEdit: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {/* Indicador de destaque */}
      {isDestaque && (
        <div className="absolute -top-2 -right-2 z-20 bg-yellow-500 text-white rounded-full p-1.5 shadow-lg border-2 border-background">
          <Star className="h-3 w-3 fill-current" />
        </div>
      )}
      
      {/* Handle de arrastar */}
      <div className="absolute top-2 left-2 cursor-move z-10" {...attributes} {...listeners}>
        <div className="bg-background/90 backdrop-blur-sm p-1 rounded-md border border-border shadow-md hover:bg-background transition-colors">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      
      {/* Imagem */}
      <img
        src={img}
        alt={`Imagem ${index + 1}`}
        className={`w-full h-40 object-cover rounded-lg border-2 transition-all ${
          isDestaque ? 'border-yellow-500 ring-2 ring-yellow-500/20' : 'border-border'
        }`}
        onError={(e) => {
          e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3EErro%3C/text%3E%3C/svg%3E";
        }}
      />
      
      {/* Botões de ação */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!isDestaque && (
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="h-7 w-7 bg-background/90 backdrop-blur-sm hover:bg-yellow-500 hover:text-white transition-colors"
            onClick={onSetDestaque}
            title="Definir como imagem destaque"
          >
            <Star className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="h-7 w-7 bg-background/90 backdrop-blur-sm hover:bg-blue-500 hover:text-white transition-colors"
          onClick={onEdit}
          title="Editar imagem"
        >
          <Edit className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="destructive"
          className="h-7 w-7"
          onClick={onRemove}
          title="Remover imagem"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      
      {/* Número da posição */}
      <div className={`absolute bottom-2 left-2 backdrop-blur-sm px-2 py-1 rounded-md border text-xs font-semibold ${
        isDestaque 
          ? 'bg-yellow-500/90 border-yellow-600 text-white' 
          : 'bg-background/90 border-border text-foreground'
      }`}>
        {isDestaque ? 'DESTAQUE' : `#${index + 1}`}
      </div>
    </div>
  );
}

export function EditVariantImagesDialog({
  open,
  onOpenChange,
  produto,
  variante,
  onSuccess,
}: EditVariantImagesDialogProps) {
  const [imagens, setImagens] = useState<string[]>([]);
  const [novaImagemUrl, setNovaImagemUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingUrl, setUploadingUrl] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [imageToEdit, setImageToEdit] = useState<string>("");
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (open && variante) {
      setImagens(variante.imagens || []);
    }
  }, [open, variante]);

  const handleAddImagemUrl = async () => {
    if (!novaImagemUrl.trim()) {
      toast.error("Digite uma URL válida");
      return;
    }

    try {
      setUploadingUrl(true);
      
      const testImg = new Image();
      testImg.crossOrigin = "anonymous";
      
      await new Promise((resolve, reject) => {
        testImg.onload = resolve;
        testImg.onerror = () => reject(new Error("URL inválida ou inacessível"));
        testImg.src = novaImagemUrl;
      });

      setImagens([...imagens, novaImagemUrl]);
      setNovaImagemUrl("");
      toast.success("Imagem adicionada!");
    } catch (error) {
      console.error("Erro ao validar URL:", error);
      toast.error("Não foi possível carregar a imagem desta URL");
    } finally {
      setUploadingUrl(false);
    }
  };

  const removeImage = (index: number) => {
    const imagemRemovida = imagens[index];
    setImagens(imagens.filter((_, i) => i !== index));
    
    if (index === 0 && imagens.length > 1) {
      toast.info("A próxima imagem se tornou a imagem destaque");
    }
  };

  const setImagemDestaque = (index: number) => {
    if (index === 0) return; // Já é destaque
    
    const novasImagens = [...imagens];
    const [imagemDestaque] = novasImagens.splice(index, 1);
    novasImagens.unshift(imagemDestaque);
    setImagens(novasImagens);
    
    toast.success("Imagem definida como destaque!");
  };

  const handleEditImage = (index: number) => {
    setImageToEdit(imagens[index]);
    setEditingIndex(index);
    setShowImageEditor(true);
  };

  const handleSaveEditedImage = (blob: Blob) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      const novasImagens = [...imagens];
      novasImagens[editingIndex] = base64;
      setImagens(novasImagens);
      toast.success("Imagem editada com sucesso!");
    };
    reader.readAsDataURL(blob);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingFile(true);
      const novasImagens: string[] = [];

      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} não é uma imagem válida`);
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} é muito grande. Máximo 5MB`);
          continue;
        }

        const img = new Image();
        const imageUrl = URL.createObjectURL(file);
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = imageUrl;
        });

        const maxSize = 1200;
        let width = img.width;
        let height = img.height;

        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else {
            width = (width / height) * maxSize;
            height = maxSize;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const base64 = canvas.toDataURL('image/jpeg', 0.85);
          novasImagens.push(base64);
        }

        URL.revokeObjectURL(imageUrl);
      }

      if (novasImagens.length > 0) {
        setImagens([...imagens, ...novasImagens]);
        toast.success(`${novasImagens.length} imagem(ns) otimizada(s) e adicionada(s)!`);
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao processar imagens');
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setImagens((items) => {
        const oldIndex = items.findIndex((_, i) => `image-${i}` === active.id);
        const newIndex = items.findIndex((_, i) => `image-${i}` === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      toast.success("Ordem atualizada! Não esqueça de salvar.");
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      await estoqueAPI.updateVariantImages(produto.codigoProduto, {
        cor: variante.cor,
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Gerenciar Imagens da Variante
          </DialogTitle>
          <DialogDescription className="flex flex-col gap-1">
            <span className="font-semibold">{produto?.nomeProduto}</span>
            <span className="text-sm">Cor: {variante?.cor}</span>
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="url" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url" className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              URL da Imagem
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload de Arquivo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>URL da Imagem</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://exemplo.com/imagem.jpg"
                  value={novaImagemUrl}
                  onChange={(e) => setNovaImagemUrl(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddImagemUrl()}
                />
                <Button 
                  onClick={handleAddImagemUrl}
                  disabled={uploadingUrl}
                  className="gap-2"
                >
                  {uploadingUrl ? "Validando..." : <><Plus className="h-4 w-4" /> Adicionar</>}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Cole a URL de uma imagem hospedada online
              </p>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Selecionar Arquivos</Label>
              <div className="flex items-center gap-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="cursor-pointer"
                  disabled={uploadingFile}
                />
                {uploadingFile && (
                  <span className="text-sm text-muted-foreground">Processando...</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Selecione uma ou mais imagens (máx 5MB cada). As imagens serão otimizadas automaticamente.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Grid de imagens com drag & drop */}
        <div className="space-y-4 mt-6">
          {imagens.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <Label className="text-base">
                  Imagens ({imagens.length})
                </Label>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                  <span>Primeira = Destaque</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Arraste para reordenar • Clique na estrela para definir como destaque • A primeira imagem é exibida como principal
              </p>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={imagens.map((_, i) => `image-${i}`)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {imagens.map((img, index) => (
                      <SortableImageItem
                        key={`image-${index}`}
                        id={`image-${index}`}
                        img={img}
                        index={index}
                        isDestaque={index === 0}
                        onRemove={() => removeImage(index)}
                        onSetDestaque={() => setImagemDestaque(index)}
                        onEdit={() => handleEditImage(index)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-border rounded-lg bg-muted/20">
              <ImageIcon className="h-16 w-16 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium text-foreground mb-1">Nenhuma imagem adicionada</p>
              <p className="text-xs text-muted-foreground">
                Use as abas acima para adicionar imagens via URL ou upload
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={loading}
            className="flex-1 sm:flex-none"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || imagens.length === 0}
            className="flex-1 sm:flex-none"
          >
            {loading ? "Salvando..." : `Salvar ${imagens.length} Imagem(ns)`}
          </Button>
        </DialogFooter>
      </DialogContent>

      <ImageEditorDialog
        open={showImageEditor}
        onOpenChange={setShowImageEditor}
        imageUrl={imageToEdit}
        onSave={handleSaveEditedImage}
      />
    </Dialog>
  );
}
