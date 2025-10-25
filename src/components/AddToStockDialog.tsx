import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

export function AddToStockDialog({ open, onOpenChange, produto, onSuccess }: AddToStockDialogProps) {
  const [quantidade, setQuantidade] = useState(1);
  const [tamanho, setTamanho] = useState(produto?.tamanho || "U");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (quantidade <= 0) {
      toast.error("Quantidade deve ser maior que zero");
      return;
    }

    try {
      setLoading(true);
      const estoqueData = {
        codigoProduto: produto.codigoProduto,
        quantidade: quantidade,
        tamanho: tamanho,
        precoCusto: produto.precoCusto,
        precoVenda: produto.preco,
        margemDeLucro: produto.margemLucro || 0,
        emPromocao: false,
        isNovidade: false,
        logMovimentacao: [{
          tipo: 'entrada',
          quantidade: quantidade,
          data: new Date(),
          origem: 'entrada',
          observacao: 'Adicionado ao estoque via cadastro de produto'
        }]
      };

      await estoqueAPI.create(estoqueData);
      toast.success(`${produto.nome} adicionado ao estoque!`);
      onOpenChange(false);
      onSuccess?.();
      // Reset
      setQuantidade(1);
      setTamanho(produto?.tamanho || "U");
    } catch (error: any) {
      toast.error("Erro ao adicionar ao estoque", {
        description: error.message || "Tente novamente",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar ao Estoque</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {produto?.nome} ({produto?.codigoProduto})
          </p>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Quantidade Inicial *</Label>
            <Input
              type="number"
              min="1"
              value={quantidade}
              onChange={(e) => setQuantidade(parseInt(e.target.value) || 1)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              O produto só aparecerá no estoque se a quantidade for maior que 1
            </p>
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

          <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
            <p><strong>Cor:</strong> {produto?.cor}</p>
            <p><strong>Preço de Custo:</strong> R$ {produto?.precoCusto?.toFixed(2)}</p>
            <p><strong>Preço de Venda:</strong> R$ {produto?.preco?.toFixed(2)}</p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button 
              className="flex-1" 
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Adicionando..." : "Adicionar ao Estoque"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
