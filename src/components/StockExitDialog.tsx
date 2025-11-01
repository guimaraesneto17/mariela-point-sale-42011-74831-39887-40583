import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { estoqueAPI } from "@/lib/api";

interface StockExitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  codigoProduto: string;
  nomeProduto: string;
  onSuccess?: () => void;
}

export function StockExitDialog({ open, onOpenChange, codigoProduto, nomeProduto, onSuccess }: StockExitDialogProps) {
  const [quantidade, setQuantidade] = useState(1);
  const [motivo, setMotivo] = useState("");
  const [observacao, setObservacao] = useState("");
  const [cor, setCor] = useState("");
  const [tamanho, setTamanho] = useState("");
  const [coresDisponiveis, setCoresDisponiveis] = useState<string[]>([]);
  const [tamanhosDisponiveis, setTamanhosDisponiveis] = useState<string[]>([]);

  // Carregar as cores e tamanhos disponíveis para este produto
  useEffect(() => {
    if (open && codigoProduto) {
      loadEstoqueInfo();
    }
  }, [open, codigoProduto]);

  const loadEstoqueInfo = async () => {
    try {
      const data = await estoqueAPI.getByCodigo(codigoProduto);
      if (data) {
        const cores = Array.isArray(data.cor) ? data.cor.filter(c => c) : [data.cor].filter(c => c);
        const tamanhos = Array.isArray(data.tamanho) ? data.tamanho.filter(t => t) : [data.tamanho].filter(t => t);
        setCoresDisponiveis(cores);
        setTamanhosDisponiveis(tamanhos);
        // Selecionar primeiro automaticamente
        if (cores.length > 0) setCor(cores[0]);
        if (tamanhos.length > 0) setTamanho(tamanhos[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar informações do estoque:', error);
    }
  };

  const handleSubmit = async () => {
    if (quantidade <= 0) {
      toast.error("Quantidade deve ser maior que zero");
      return;
    }

    if (!motivo.trim()) {
      toast.error("Por favor, informe o motivo da saída");
      return;
    }

    if (!cor) {
      toast.error("Selecione uma cor");
      return;
    }

    if (!tamanho) {
      toast.error("Selecione um tamanho");
      return;
    }

    try {
      await estoqueAPI.registrarSaida({
        codigoProduto,
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
      setCor("");
      setTamanho("");
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
          <p className="text-xs text-muted-foreground">Origem: Baixa no estoque</p>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Cor *</Label>
              <Select value={cor} onValueChange={setCor}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a cor" />
                </SelectTrigger>
                <SelectContent>
                  {coresDisponiveis.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tamanho *</Label>
              <Select value={tamanho} onValueChange={setTamanho}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tamanho" />
                </SelectTrigger>
                <SelectContent>
                  {tamanhosDisponiveis.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

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
