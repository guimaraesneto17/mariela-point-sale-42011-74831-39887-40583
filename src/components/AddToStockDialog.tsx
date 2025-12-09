import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { estoqueAPI } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Upload, Link as LinkIcon, X, Trash2, Image as ImageIcon, Check, AlertCircle } from "lucide-react";
import { useImageCompression } from "@/hooks/useImageCompression";
import { AlertDeleteDialog } from "@/components/ui/alert-delete-dialog";

// Validation helpers
const validateCor = (cor: string): { valid: boolean; message: string } => {
  if (!cor.trim()) return { valid: false, message: "Digite uma cor" };
  if (cor.trim().length < 2) return { valid: false, message: "Cor deve ter pelo menos 2 caracteres" };
  return { valid: true, message: "Cor válida" };
};

const validateVariantes = (variantes: Variante[]): { valid: boolean; message: string } => {
  if (variantes.length === 0) return { valid: false, message: "Adicione pelo menos uma variante" };
  return { valid: true, message: `${variantes.length} variante(s) adicionada(s)` };
};

const validateVarianteTamanhos = (variante: Variante): { valid: boolean; message: string } => {
  if (variante.tamanhos.length === 0) return { valid: false, message: "Adicione pelo menos um tamanho" };
  return { valid: true, message: `${variante.tamanhos.length} tamanho(s) com total de ${variante.tamanhos.reduce((sum, t) => sum + t.quantidade, 0)} un.` };
};

// Validation indicator component
const ValidationIndicator = ({ isValid, message, show }: { isValid: boolean; message: string; show: boolean }) => {
  if (!show) return null;
  return (
    <div className={`flex items-center gap-1 text-xs mt-1 ${isValid ? 'text-green-600' : 'text-destructive'}`}>
      {isValid ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
      <span>{message}</span>
    </div>
  );
};

interface Tamanho {
  tamanho: string;
  quantidade: number;
}

interface Variante {
  cor: string;
  tamanhos: Tamanho[];
  imagens: string[];
}

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
  const [loading, setLoading] = useState(false);
  const [variantes, setVariantes] = useState<Variante[]>([]);
  const [novaCor, setNovaCor] = useState("");
  const [novoTamanho, setNovoTamanho] = useState("");
  const [varianteSelecionada, setVarianteSelecionada] = useState<number | null>(null);
  const [imagemURL, setImagemURL] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: 'cor' | 'tamanho'; item: string } | null>(null);

  const { compressing, compressImages, validateImageUrl } = useImageCompression();

  // Opções disponíveis
  const [coresDisponiveis, setCoresDisponiveis] = useState<string[]>([
    "Preto", "Branco", "Azul", "Vermelho", "Verde", "Amarelo", "Rosa", "Cinza"
  ]);
  const [tamanhosDisponiveis, setTamanhosDisponiveis] = useState<string[]>([
    "PP", "P", "M", "G", "GG", "XG", "U"
  ]);

  // Touched fields state
  const [touchedFields, setTouchedFields] = useState<{ cor: boolean; variantes: boolean }>({
    cor: false,
    variantes: false
  });

  const handleFieldTouch = (field: keyof typeof touchedFields) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
  };

  // Carregar opções do localStorage
  useEffect(() => {
    const savedCores = localStorage.getItem('mariela-cores-options');
    const savedTamanhos = localStorage.getItem('mariela-tamanhos-options');
    
    if (savedCores) setCoresDisponiveis(JSON.parse(savedCores));
    if (savedTamanhos) setTamanhosDisponiveis(JSON.parse(savedTamanhos));
  }, []);

  // Resetar ao fechar o dialog
  useEffect(() => {
    if (!open) {
      setVariantes([]);
      setNovaCor("");
      setNovoTamanho("");
      setVarianteSelecionada(null);
      setImagemURL("");
      setTouchedFields({ cor: false, variantes: false });
    }
  }, [open]);

  const adicionarCor = () => {
    if (!novaCor.trim()) {
      toast.error("Digite uma cor");
      return;
    }

    // Verificar se já existe uma variante com essa cor
    if (variantes.some(v => v.cor.toLowerCase() === novaCor.toLowerCase())) {
      toast.error("Já existe uma variante com essa cor");
      return;
    }

    // Adicionar cor às opções se não existir
    if (!coresDisponiveis.includes(novaCor)) {
      const updated = [...coresDisponiveis, novaCor];
      setCoresDisponiveis(updated);
      localStorage.setItem('mariela-cores-options', JSON.stringify(updated));
    }

    const novaVariante = { cor: novaCor, tamanhos: [], imagens: [] };
    setVariantes([...variantes, novaVariante]);
    setVarianteSelecionada(variantes.length); // Selecionar automaticamente
    setNovaCor("");
    toast.success(`Cor "${novaCor}" adicionada`);
  };

  const removerVariante = (index: number) => {
    setVariantes(variantes.filter((_, i) => i !== index));
    if (varianteSelecionada === index) {
      setVarianteSelecionada(null);
    }
  };

  const adicionarTamanho = () => {
    if (!novoTamanho.trim()) {
      toast.error("Digite um tamanho");
      return;
    }

    // Adicionar tamanho às opções se não existir
    if (!tamanhosDisponiveis.includes(novoTamanho)) {
      const updated = [...tamanhosDisponiveis, novoTamanho];
      setTamanhosDisponiveis(updated);
      localStorage.setItem('mariela-tamanhos-options', JSON.stringify(updated));
      toast.success(`Tamanho "${novoTamanho}" adicionado às opções!`);
    }
    setNovoTamanho("");
  };

  const removerOpcaoTamanho = (tamanho: string) => {
    const updated = tamanhosDisponiveis.filter(t => t !== tamanho);
    setTamanhosDisponiveis(updated);
    localStorage.setItem('mariela-tamanhos-options', JSON.stringify(updated));
    toast.success(`Tamanho "${tamanho}" removido das opções`);
  };

  const removerOpcaoCor = (cor: string) => {
    const updated = coresDisponiveis.filter(c => c !== cor);
    setCoresDisponiveis(updated);
    localStorage.setItem('mariela-cores-options', JSON.stringify(updated));
    toast.success(`Cor "${cor}" removida das opções`);
  };

  const adicionarTamanhoRapido = (varianteIndex: number, tamanho: string) => {
    const variante = variantes[varianteIndex];
    const tamanhoExistente = variante.tamanhos.find(t => t.tamanho === tamanho);
    
    if (tamanhoExistente) {
      // Remover se já existe
      removerTamanho(varianteIndex, tamanho);
    } else {
      // Adicionar se não existe com quantidade padrão 1
      const novasVariantes = [...variantes];
      novasVariantes[varianteIndex].tamanhos.push({ tamanho, quantidade: 1 });
      setVariantes(novasVariantes);
      toast.success(`${tamanho} adicionado! Edite a quantidade se necessário.`);
    }
  };

  const removerTamanho = (varianteIndex: number, tamanho: string) => {
    const novasVariantes = [...variantes];
    novasVariantes[varianteIndex].tamanhos = novasVariantes[varianteIndex].tamanhos.filter(t => t.tamanho !== tamanho);
    setVariantes(novasVariantes);
  };

  const atualizarQuantidadeTamanho = (varianteIndex: number, tamanho: string, novaQuantidade: number) => {
    const novasVariantes = [...variantes];
    const tamanhoObj = novasVariantes[varianteIndex].tamanhos.find(t => t.tamanho === tamanho);
    if (tamanhoObj) {
      tamanhoObj.quantidade = Math.max(1, novaQuantidade);
      setVariantes(novasVariantes);
    }
  };

  const handleAddImagemUrl = async () => {
    if (varianteSelecionada === null) {
      toast.error("Selecione uma variante para adicionar imagens");
      return;
    }

    if (!imagemURL.trim()) {
      toast.error("Digite uma URL válida");
      return;
    }

    try {
      await validateImageUrl(imagemURL);
      const novasVariantes = [...variantes];
      novasVariantes[varianteSelecionada].imagens.push(imagemURL);
      setVariantes(novasVariantes);
      setImagemURL("");
      toast.success("Imagem adicionada!");
    } catch (error) {
      toast.error("Não foi possível carregar a imagem desta URL");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (varianteSelecionada === null) {
      toast.error("Selecione uma variante para adicionar imagens");
      return;
    }

    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const compressedImages = await compressImages(Array.from(files));
      
      if (compressedImages.length > 0) {
        const novasVariantes = [...variantes];
        novasVariantes[varianteSelecionada].imagens.push(...compressedImages);
        setVariantes(novasVariantes);
        toast.success(`${compressedImages.length} imagem(ns) adicionada(s)!`);
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao processar imagens');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removerImagem = (varianteIndex: number, imagemIndex: number) => {
    const novasVariantes = [...variantes];
    novasVariantes[varianteIndex].imagens = novasVariantes[varianteIndex].imagens.filter((_, i) => i !== imagemIndex);
    setVariantes(novasVariantes);
  };

  const handleSubmit = async () => {
    if (variantes.length === 0) {
      toast.error("Adicione pelo menos uma variante");
      return;
    }

    // Validar que todas as variantes têm pelo menos um tamanho
    const variantesSemTamanho = variantes.filter(v => v.tamanhos.length === 0);
    if (variantesSemTamanho.length > 0) {
      toast.error("Todas as variantes devem ter pelo menos um tamanho", {
        description: `Cores sem tamanho: ${variantesSemTamanho.map(v => v.cor).join(', ')}`
      });
      return;
    }

    try {
      setLoading(true);

      // Criar registros de estoque para cada variante
      for (const variante of variantes) {
        // Calcular quantidade total da variante
        const quantidadeTotal = variante.tamanhos.reduce((total, t) => total + t.quantidade, 0);
        
        const estoqueData = {
          codigoProduto: produto.codigoProduto,
          variantes: [{
            cor: variante.cor,
            tamanhos: variante.tamanhos,
            quantidade: quantidadeTotal,
            imagens: variante.imagens
          }],
          emPromocao: false,
          isNovidade: false,
          logMovimentacao: [{
            tipo: 'entrada',
            cor: variante.cor,
            tamanho: variante.tamanhos.map(t => t.tamanho).join(', '),
            quantidade: quantidadeTotal,
            data: new Date().toISOString().split('.')[0] + 'Z',
            origem: 'entrada',
            observacao: 'Entrada inicial automática - criação da variante'
          }]
        };

        await estoqueAPI.create(estoqueData);
      }

      toast.success(`${variantes.length} variante(s) adicionada(s) ao estoque!`, {
        description: `${produto.nome}`
      });

      onOpenChange(false);
      onSuccess?.();
      
      // Reset
      setVariantes([]);
      setVarianteSelecionada(null);
      setNovaCor("");
      setImagemURL("");
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Tente novamente";
      toast.error("Erro ao adicionar variantes", {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar ao Estoque</DialogTitle>
          <DialogDescription>
            {produto?.nome} ({produto?.codigoProduto})
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Painel Esquerdo - Adicionar Variantes */}
          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-primary/5">
              <Label className="text-base font-semibold mb-2 block">1. Adicionar Cores</Label>
              <p className="text-xs text-muted-foreground mb-3">
                Cada cor será uma variante separada
              </p>
              
              {/* Campo para adicionar cor personalizada */}
              <div className="space-y-3 mb-4">
                <Label className="text-sm font-semibold">Adicionar Cor Personalizada</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ex: Azul Marinho, Verde Oliva"
                    value={novaCor}
                    onChange={(e) => setNovaCor(e.target.value)}
                    onBlur={() => handleFieldTouch('cor')}
                    onKeyPress={(e) => e.key === 'Enter' && adicionarCor()}
                    className={`${
                      touchedFields.cor && novaCor.trim()
                        ? validateCor(novaCor).valid
                          ? 'border-green-500 focus-visible:ring-green-500'
                          : 'border-destructive focus-visible:ring-destructive'
                        : ''
                    }`}
                  />
                  <Button onClick={adicionarCor} className="shrink-0">
                    <Plus className="h-4 w-4 mr-1" /> Adicionar
                  </Button>
                </div>
                <ValidationIndicator 
                  isValid={validateCor(novaCor).valid} 
                  message={validateCor(novaCor).message} 
                  show={touchedFields.cor && novaCor.trim().length > 0} 
                />
              </div>

              {/* Cores disponíveis com opção de excluir */}
              <div className="space-y-3">
                <Label className="text-sm">Selecione as Cores Disponíveis</Label>
                
                <div className="grid grid-cols-2 gap-2">
                  {coresDisponiveis.map((cor) => (
                    <div key={cor} className="relative group">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full hover:bg-primary hover:text-primary-foreground"
                        onClick={() => {
                          setNovaCor(cor);
                          adicionarCor();
                        }}
                      >
                        {cor}
                      </Button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteDialog({ open: true, type: 'cor', item: cor });
                        }}
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Lista de Variantes Adicionadas */}
            {variantes.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label className="text-base font-semibold">Variantes Adicionadas ({variantes.length})</Label>
                  <Check className="h-4 w-4 text-green-600" />
                </div>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {variantes.map((variante, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-3 cursor-pointer transition-all ${
                        varianteSelecionada === index
                          ? 'bg-primary/10 border-primary'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setVarianteSelecionada(index)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-primary" />
                          <span className="font-semibold">{variante.cor}</span>
                          {variante.imagens.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              <ImageIcon className="h-3 w-3 mr-1" />
                              {variante.imagens.length}
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            removerVariante(index);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-2">
                        {variante.tamanhos.length > 0 ? (
                          variante.tamanhos.map((tamObj) => (
                            <Badge key={tamObj.tamanho} variant="secondary" className="text-xs">
                              {tamObj.tamanho} ({tamObj.quantidade})
                              <X
                                className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removerTamanho(index, tamObj.tamanho);
                                }}
                              />
                            </Badge>
                          ))
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-destructive">
                            <AlertCircle className="h-3 w-3" />
                            <span className="italic">Nenhum tamanho adicionado</span>
                          </div>
                        )}
                      </div>

                      {/* Total da variante com validation */}
                      <div className={`text-xs ${variante.tamanhos.length > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {variante.tamanhos.length > 0 ? (
                          <div className="flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            <span>Total: {variante.tamanhos.reduce((sum, t) => sum + t.quantidade, 0)} un.</span>
                          </div>
                        ) : (
                          <span>Total: 0 un.</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label className="text-base font-semibold text-muted-foreground">Variantes Adicionadas (0)</Label>
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </div>
                <p className="text-xs text-destructive">Adicione pelo menos uma cor para criar variantes</p>
              </div>
            )}
          </div>

          {/* Painel Direito - Editar Variante Selecionada */}
          <div className="space-y-4">
            {varianteSelecionada !== null ? (
              <>
                <div className="border rounded-lg p-4 bg-primary/5">
                  <Label className="text-base font-semibold mb-3 block">
                    2. Editando: {variantes[varianteSelecionada].cor}
                  </Label>

                  {/* Campo para adicionar tamanho personalizado */}
                  <div className="space-y-3 mb-4">
                    <Label className="text-sm font-semibold">Adicionar Tamanho Personalizado</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ex: 44, GG, XL"
                        value={novoTamanho}
                        onChange={(e) => setNovoTamanho(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && adicionarTamanho()}
                      />
                      <Button onClick={adicionarTamanho} className="shrink-0">
                        <Plus className="h-4 w-4 mr-1" /> Adicionar
                      </Button>
                    </div>
                  </div>

                  {/* Tamanhos com quantidade e opção de excluir */}
                  <div className="space-y-3">
                    <Label className="text-sm">Selecione os Tamanhos e Quantidades</Label>
                    
                    <div className="grid grid-cols-2 gap-2">
                      {tamanhosDisponiveis.map((tam) => {
                        const tamanhoObj = variantes[varianteSelecionada].tamanhos.find(t => t.tamanho === tam);
                        const isSelected = !!tamanhoObj;
                        
                        return (
                          <div key={tam} className="space-y-1 relative group">
                            <Button
                              type="button"
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              className="w-full"
                              onClick={() => adicionarTamanhoRapido(varianteSelecionada, tam)}
                            >
                              {tam}
                            </Button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteDialog({ open: true, type: 'tamanho', item: tam });
                              }}
                              className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            >
                              <X className="h-3 w-3" />
                            </button>
                            {isSelected && (
                              <Input
                                type="number"
                                min="1"
                                value={tamanhoObj.quantidade}
                                onChange={(e) => atualizarQuantidadeTamanho(
                                  varianteSelecionada,
                                  tam,
                                  parseInt(e.target.value) || 1
                                )}
                                className="h-8 text-xs"
                                placeholder="Qtd"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Imagens */}
                <div className="border rounded-lg p-4">
                  <Label className="text-sm font-semibold mb-3 block">Imagens da Variante</Label>
                  
                  <Tabs defaultValue="url" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-3">
                      <TabsTrigger value="url" className="text-xs">
                        <LinkIcon className="h-3 w-3 mr-1" />
                        URL
                      </TabsTrigger>
                      <TabsTrigger value="upload" className="text-xs">
                        <Upload className="h-3 w-3 mr-1" />
                        Upload
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="url" className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="https://exemplo.com/imagem.jpg"
                          value={imagemURL}
                          onChange={(e) => setImagemURL(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddImagemUrl()}
                          className="text-sm"
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleAddImagemUrl}
                          className="shrink-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="upload" className="space-y-2">
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileUpload}
                        className="cursor-pointer text-sm"
                        disabled={compressing}
                      />
                      {compressing && (
                        <p className="text-xs text-muted-foreground">Processando imagens...</p>
                      )}
                    </TabsContent>
                  </Tabs>

                  {/* Preview das imagens */}
                  {variantes[varianteSelecionada].imagens.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        {variantes[varianteSelecionada].imagens.length} imagem(ns)
                      </Label>
                      <div className="grid grid-cols-3 gap-2">
                        {variantes[varianteSelecionada].imagens.map((img, imgIndex) => (
                          <div key={imgIndex} className="relative group">
                            <img
                              src={img}
                              alt={`Preview ${imgIndex + 1}`}
                              className="w-full h-20 object-cover rounded border"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-0.5 right-0.5 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removerImagem(varianteSelecionada, imgIndex)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                            <div className="absolute bottom-0.5 left-0.5 bg-background/80 px-1 rounded text-xs">
                              #{imgIndex + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="border rounded-lg p-8 text-center text-muted-foreground">
                <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Selecione uma variante para editar</p>
              </div>
            )}
          </div>
        </div>

        {/* Informações do Produto */}
        <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
          <p><strong>Preço de Custo:</strong> R$ {produto?.precoCusto?.toFixed(2)}</p>
          <p><strong>Preço de Venda:</strong> R$ {produto?.precoVenda?.toFixed(2)}</p>
          <p><strong>Margem de Lucro:</strong> {produto?.margemDeLucro?.toFixed(2)}%</p>
        </div>

        {/* Botões de ação */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1"
            disabled={loading || variantes.length === 0}
          >
            {loading ? "Salvando..." : `Adicionar ${variantes.length} Variante(s)`}
          </Button>
        </div>
      </DialogContent>

      <AlertDeleteDialog
        open={deleteDialog?.open || false}
        onOpenChange={(open) => !open && setDeleteDialog(null)}
        onConfirm={() => {
          if (deleteDialog) {
            if (deleteDialog.type === 'cor') {
              removerOpcaoCor(deleteDialog.item);
            } else {
              removerOpcaoTamanho(deleteDialog.item);
            }
            setDeleteDialog(null);
          }
        }}
        title={`Excluir ${deleteDialog?.type === 'cor' ? 'Cor' : 'Tamanho'}`}
        description={`Tem certeza que deseja excluir ${deleteDialog?.type === 'cor' ? 'a cor' : 'o tamanho'} "${deleteDialog?.item}" das opções? Esta ação não pode ser desfeita.`}
        itemName={deleteDialog?.item}
      />
    </Dialog>
  );
}