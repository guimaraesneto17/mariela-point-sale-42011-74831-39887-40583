import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { estoqueAPI } from "@/lib/api";
import { SingleSelectBadges } from "@/components/ui/single-select-badges";
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
  const [tamanho, setTamanho] = useState<string>("");
  const [cor, setCor] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [imagemURL, setImagemURL] = useState("");
  const [imagens, setImagens] = useState<string[]>([]);
  
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

  const addImagemURL = () => {
    if (imagemURL.trim()) {
      setImagens(prev => [...prev, imagemURL.trim()]);
      setImagemURL("");
    }
  };

  const removeImage = (index: number) => {
    setImagens(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!cor) {
      toast.error("Selecione uma cor");
      return;
    }
    if (!tamanho) {
      toast.error("Selecione um tamanho");
      return;
    }

    try {
      setLoading(true);
      const estoqueData = {
        codigoProduto: produto.codigoProduto,
        cor: cor,
        tamanho: tamanho,
        quantidade: 1,
        imagens: imagens,
        emPromocao: false,
        isNovidade: false,
        logMovimentacao: [{
          tipo: 'entrada',
          cor: cor,
          tamanho: tamanho,
          quantidade: 1,
          data: new Date().toISOString().split('.')[0] + 'Z',
          origem: 'entrada',
          observacao: 'Entrada inicial automática'
        }]
      };
      await estoqueAPI.create(estoqueData);
      toast.success(`${produto.nome} adicionado ao estoque!`, {
        description: `Cor: ${cor} | Tamanho: ${tamanho}`
      });
      onOpenChange(false);
      onSuccess?.();
      // Reset
      setTamanho("");
      setCor("");
      setImagens([]);
      setImagemURL("");
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Tente novamente";
      if (errorMessage.includes("Já existe estoque")) {
        toast.error("Estoque duplicado", {
          description: "Já existe estoque para essa combinação de cor e tamanho."
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
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar ao Estoque</DialogTitle>
          <DialogDescription>
            {produto?.nome} ({produto?.codigoProduto})
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
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
            </div>

            <div>
              <Label>Tamanho *</Label>
              <SingleSelectBadges
                value={tamanho}
                onChange={setTamanho}
                options={tamanhosDisponiveis}
                placeholder="Digite um novo tamanho"
                onCreateOption={handleCreateTamanho}
                onDeleteOption={handleDeleteTamanho}
              />
            </div>
          </div>

          <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
            <p><strong>Preço de Custo:</strong> R$ {produto?.precoCusto?.toFixed(2)}</p>
            <p><strong>Preço de Venda:</strong> R$ {produto?.precoVenda?.toFixed(2)}</p>
            <p><strong>Margem de Lucro:</strong> {produto?.margemDeLucro?.toFixed(2)}%</p>
          </div>

          <div className="space-y-2">
            <Label>Imagens da Variante (Opcional)</Label>
            <div className="flex gap-2">
              <input
                type="text"
                value={imagemURL}
                onChange={(e) => setImagemURL(e.target.value)}
                placeholder="Cole a URL da imagem (ex: https://fastimg.org/imagem.jpg)"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <Button
                type="button"
                onClick={addImagemURL}
                variant="outline"
                className="shrink-0"
              >
                Adicionar
              </Button>
            </div>

            {/* Preview das Imagens */}
            {imagens.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {imagens.map((img, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={img} 
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border-2 border-border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            <p className="text-xs text-muted-foreground">
              Use o <a href="https://www.fastimg.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">fastimg.org</a> para hospedar suas imagens
            </p>
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