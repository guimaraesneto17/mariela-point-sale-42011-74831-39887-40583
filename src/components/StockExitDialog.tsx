import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { produtosAPI } from "@/lib/api";

interface StockExitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  codigoProduto: string;
  nomeProduto: string;
  cor: string;
  tamanho: string;
  quantidadeDisponivel: number;
  onSuccess?: () => void;
}

export function StockExitDialog({ open, onOpenChange, codigoProduto, nomeProduto, cor, tamanho, quantidadeDisponivel, onSuccess }: StockExitDialogProps) {
  const [quantidade, setQuantidade] = useState(1);
  const [motivo, setMotivo] = useState("");
  const [observacao, setObservacao] = useState("");

  const handleSubmit = async () => {
    if (quantidade <= 0) {
      toast.error("Quantidade deve ser maior que zero");
      return;
    }

    if (!motivo.trim()) {
      toast.error("Por favor, informe o motivo da saída");
      return;
    }

    if (quantidade > quantidadeDisponivel) {
      toast.error(`Quantidade insuficiente. Disponível: ${quantidadeDisponivel}`);
      return;
    }

    try {
      await produtosAPI.registrarSaida(codigoProduto, {
        quantidade,
        origem: 'baixa no estoque',
        motivo,
        cor,
        tamanho,
        observacao: observacao || undefined
      });

      toast.success(`Saída de ${quantidade} unidade(s) registrada com sucesso!`, {
        description: `${cor} - ${tamanho}`
      });
      onOpenChange(false);
      // Reset form
      setQuantidade(1);
      setMotivo("");
      setObservacao("");
      // Reload data
      onSuccess?.();
    } catch (error: any) {
      toast.error("Erro ao registrar saída", {
        description: error.message || "Tente novamente"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Saída de Estoque</DialogTitle>
          <p className="text-sm text-muted-foreground">{nomeProduto} ({codigoProduto})</p>
          <p className="text-sm font-semibold">{cor} - {tamanho}</p>
          <p className="text-xs text-muted-foreground">Disponível: {quantidadeDisponivel} un. | Origem: Baixa no estoque</p>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Quantidade *</Label>
            <Input
              type="number"
              min="1"
              value={quantidade}
              onChange={(e) => setQuantidade(parseInt(e.target.value) || 1)}
            />
          </div>

          <div>
            <Label>Motivo *</Label>
            <Input
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex: Produto danificado, amostra, etc."
            />
          </div>

          <div>
            <Label>Observação (Opcional)</Label>
            <Textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Adicione observações sobre a saída..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleSubmit}>
              Confirmar Saída
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
