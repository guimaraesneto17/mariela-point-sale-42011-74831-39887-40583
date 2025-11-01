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