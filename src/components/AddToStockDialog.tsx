import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { estoqueAPI } from "@/lib/api";
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
  const [tamanho, setTamanho] = useState("U");
  const [cor, setCor] = useState("");
  const [loading, setLoading] = useState(false);
  const handleSubmit = async () => {
    if (!cor.trim()) {
      toast.error("Cor é obrigatória");
      return;
    }
    try {
      setLoading(true);
      const estoqueData = {
        codigoProduto: produto.codigoProduto,
        cor: cor.trim(),
        quantidade: 1,
        tamanho: tamanho,
        emPromocao: false,
        isNovidade: false,
        logMovimentacao: [{
          tipo: 'entrada',
          quantidade: 1,
          data: new Date().toISOString().split('.')[0] + 'Z',
          origem: 'entrada',
          observacao: 'Entrada inicial automática'
        }]
      };
      await estoqueAPI.create(estoqueData);
      toast.success(`${produto.nome} adicionado ao estoque!`, {
        description: `Cor: ${cor.trim()} | Tamanho: ${tamanho} | Qtd: 1`
      });
      onOpenChange(false);
      onSuccess?.();
      // Reset
      setTamanho("U");
      setCor("");
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Tente novamente";
      if (errorMessage.includes("Já existe estoque")) {
        toast.error("Estoque duplicado", {
          description: "Já existe estoque para essa cor e tamanho deste produto. Escolha uma combinação diferente."
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Cor *</Label>
              <Input value={cor} onChange={e => setCor(e.target.value)} placeholder="Ex: Azul, Vermelho, Estampado" />
            </div>

            <div>
              <Label>Tamanho *</Label>
              <Select value={tamanho} onValueChange={setTamanho}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PP">PP</SelectItem>
                  <SelectItem value="P">P</SelectItem>
                  <SelectItem value="M">M</SelectItem>
                  <SelectItem value="G">G</SelectItem>
                  <SelectItem value="GG">GG</SelectItem>
                  <SelectItem value="U">U (Único)</SelectItem>
                </SelectContent>
              </Select>
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