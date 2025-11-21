import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { estoqueAPI } from "@/lib/api";
import { SingleSelectBadges } from "@/components/ui/single-select-badges";
import { MultiSelect } from "@/components/ui/multi-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Upload, Link as LinkIcon, X, GripVertical } from "lucide-react";
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
interface AddToStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produto: any;
  onSuccess?: () => void;
}
export function AddToStockDialog({
  open,
  onOpenChange,
  produto,
  onSuccess
}: AddToStockDialogProps) {
  const [tamanhos, setTamanhos] = useState<string[]>([]);
  const [cor, setCor] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [imagemURL, setImagemURL] = useState("");
  const [imagens, setImagens] = useState<string[]>([]);
  const [uploadingUrl, setUploadingUrl] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Opções disponíveis (podem ser expandidas)
  const [tamanhosDisponiveis, setTamanhosDisponiveis] = useState<string[]>([
    "PP", "P", "M", "G", "GG", "XG", "U"
  ]);
  const [coresDisponiveis, setCoresDisponiveis] = useState<string[]>([
    "Preto", "Branco", "Azul", "Vermelho", "Verde", "Amarelo", "Rosa", "Cinza"
  ]);

  // Carregar opções salvas do localStorage
  useEffect(() => {
    const savedTamanhos = localStorage.getItem('mariela-tamanhos-options');
    const savedCores = localStorage.getItem('mariela-cores-options');
    
    if (savedTamanhos) {
      setTamanhosDisponiveis(JSON.parse(savedTamanhos));
    }
    if (savedCores) {
      setCoresDisponiveis(JSON.parse(savedCores));
    }
  }, []);

  const handleCreateTamanho = (novoTamanho: string) => {
    const updated = [...tamanhosDisponiveis, novoTamanho];
    setTamanhosDisponiveis(updated);
    localStorage.setItem('mariela-tamanhos-options', JSON.stringify(updated));
  };

  const handleCreateCor = (novaCor: string) => {
    const updated = [...coresDisponiveis, novaCor];
    setCoresDisponiveis(updated);
    localStorage.setItem('mariela-cores-options', JSON.stringify(updated));
  };

  const handleDeleteTamanho = (tamanho: string) => {
    const updated = tamanhosDisponiveis.filter(t => t !== tamanho);
    setTamanhosDisponiveis(updated);
    localStorage.setItem('mariela-tamanhos-options', JSON.stringify(updated));
  };

  const handleDeleteCor = (cor: string) => {
    const updated = coresDisponiveis.filter(c => c !== cor);
    setCoresDisponiveis(updated);
    localStorage.setItem('mariela-cores-options', JSON.stringify(updated));
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddImagemUrl = async () => {
    if (!imagemURL.trim()) {
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
        testImg.src = imagemURL;
      });

      setImagens([...imagens, imagemURL]);
      setImagemURL("");
      toast.success("Imagem adicionada!");
    } catch (error) {
      console.error("Erro ao validar URL:", error);
      toast.error("Não foi possível carregar a imagem desta URL");
    } finally {
      setUploadingUrl(false);
    }
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
        toast.success(`${novasImagens.length} imagem(ns) adicionada(s)!`);
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

  const removeImage = (index: number) => {
    setImagens(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setImagens((items) => {
        const oldIndex = items.findIndex((_, i) => `image-${i}` === active.id);
        const newIndex = items.findIndex((_, i) => `image-${i}` === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSubmit = async () => {
    if (!cor) {
      toast.error("Selecione uma cor");
      return;
    }
    if (tamanhos.length === 0) {
      toast.error("Selecione pelo menos um tamanho");
      return;
    }

    try {
      setLoading(true);
      const estoqueData = {
        codigoProduto: produto.codigoProduto,
        variantes: [{
          cor: cor,
          tamanhos: tamanhos,
          quantidade: 1,
          imagens: imagens
        }],
        emPromocao: false,
        isNovidade: false,
        logMovimentacao: [{
          tipo: 'entrada',
          cor: cor,
          tamanho: tamanhos.join(', '),
          quantidade: 1,
          data: new Date().toISOString().split('.')[0] + 'Z',
          origem: 'entrada',
          observacao: 'Entrada inicial automática - criação da variante'
        }]
      };
      await estoqueAPI.create(estoqueData);
      toast.success(`${produto.nome} adicionado ao estoque!`, {
        description: `Cor: ${cor} | Tamanhos: ${tamanhos.join(', ')}`
      });
      onOpenChange(false);
      onSuccess?.();
      // Reset
      setTamanhos([]);
      setCor("");
      setImagens([]);
      setImagemURL("");
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Tente novamente";
      if (errorMessage.includes("Já existe")) {
        toast.error("Estoque duplicado", {
          description: "Já existe uma variante com essa cor."
        });
      } else {
        toast.error("Erro ao adicionar ao estoque", {
          description: errorMessage
        });
      }
    } finally {
      setLoading(false);
    }
  };
  // Componente para item arrastável
  function SortableImageItem({ id, img, index, onRemove }: { id: string; img: string; index: number; onRemove: () => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div ref={setNodeRef} style={style} className="relative group">
        <div className="absolute top-1 left-1 cursor-move z-10" {...attributes} {...listeners}>
          <div className="bg-background/90 backdrop-blur-sm p-1 rounded-md border border-border shadow-md">
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>
        <img 
          src={img} 
          alt={`Preview ${index + 1}`}
          className="w-full h-24 object-cover rounded-lg border-2 border-border"
          onError={(e) => {
            e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3EErro%3C/text%3E%3C/svg%3E";
          }}
        />
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onRemove}
        >
          <X className="h-3 w-3" />
        </Button>
        <div className="absolute bottom-1 left-1 bg-background/90 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-semibold border border-border">
          #{index + 1}
        </div>
      </div>
    );
  }

  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar ao Estoque</DialogTitle>
          <DialogDescription>
            {produto?.nome} ({produto?.codigoProduto})
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label>Cor *</Label>
              <SingleSelectBadges
                value={cor}
                onChange={setCor}
                options={coresDisponiveis}
                placeholder="Digite uma nova cor"
                onCreateOption={handleCreateCor}
                onDeleteOption={handleDeleteCor}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Cada cor terá sua própria variante
              </p>
            </div>

            <div>
              <Label>Tamanhos * (múltipla seleção)</Label>
              <MultiSelect
                value={tamanhos}
                onChange={setTamanhos}
                options={tamanhosDisponiveis}
                placeholder="Selecione os tamanhos disponíveis"
                onCreateOption={handleCreateTamanho}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Selecione todos os tamanhos disponíveis para esta cor
              </p>
            </div>
          </div>

          <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
            <p><strong>Preço de Custo:</strong> R$ {produto?.precoCusto?.toFixed(2)}</p>
            <p><strong>Preço de Venda:</strong> R$ {produto?.precoVenda?.toFixed(2)}</p>
            <p><strong>Margem de Lucro:</strong> {produto?.margemDeLucro?.toFixed(2)}%</p>
          </div>

          <div className="space-y-3">
            <Label>Imagens da Variante (Opcional)</Label>
            
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

              <TabsContent value="url" className="space-y-3 mt-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="https://exemplo.com/imagem.jpg"
                    value={imagemURL}
                    onChange={(e) => setImagemURL(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddImagemUrl()}
                  />
                  <Button
                    type="button"
                    onClick={handleAddImagemUrl}
                    disabled={uploadingUrl}
                    className="gap-2 shrink-0"
                  >
                    {uploadingUrl ? "Validando..." : <><Plus className="h-4 w-4" /> Adicionar</>}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="upload" className="space-y-3 mt-3">
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
                  <p className="text-sm text-muted-foreground">Processando imagens...</p>
                )}
              </TabsContent>
            </Tabs>

            {/* Preview das Imagens com drag & drop */}
            {imagens.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Arraste para reordenar • Primeira imagem = Destaque ({imagens.length} {imagens.length === 1 ? 'imagem' : 'imagens'})
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
                    <div className="grid grid-cols-3 gap-3">
                      {imagens.map((img, index) => (
                        <SortableImageItem
                          key={`image-${index}`}
                          id={`image-${index}`}
                          img={img}
                          index={index}
                          onRemove={() => removeImage(index)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={loading}>
              {loading ? "Adicionando..." : "Adicionar ao Estoque"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
}