import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { estoqueAPI } from "@/lib/api";

interface StockEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  codigoProduto: string;
  nomeProduto: string;
  onSuccess?: () => void;
}

export function StockEntryDialog({ open, onOpenChange, codigoProduto, nomeProduto, onSuccess }: StockEntryDialogProps) {
  const [origem, setOrigem] = useState<"entrada" | "compra">("entrada");
  const [quantidade, setQuantidade] = useState(1);
  const [fornecedor, setFornecedor] = useState("");
  const [observacao, setObservacao] = useState("");
  const [cor, setCor] = useState("");
  const [tamanho, setTamanho] = useState("");
  const [coresDisponiveis, setCoresDisponiveis] = useState<string[]>([]);
  const [tamanhosDisponiveis, setTamanhosDisponiveis] = useState<string[]>([]);

  const fornecedores = [
    "Elegance Fashion",
    "Moda Style",
    "Denim Co.",
    "Outros"
  ];

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
        const cores = Array.isArray(data.cor) ? data.cor : [data.cor];
        const tamanhos = Array.isArray(data.tamanho) ? data.tamanho : [data.tamanho];
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

    if (!cor) {
      toast.error("Selecione uma cor");
      return;
    }

    if (!tamanho) {
      toast.error("Selecione um tamanho");
      return;
    }

    try {
      const entradaData: any = {
        codigoProduto,
        quantidade,
        origem,
        cor,
        tamanho,
        observacao: observacao || undefined
      };

      if (origem === "compra" && fornecedor) {
        entradaData.fornecedor = fornecedor;
      }

      await estoqueAPI.registrarEntrada(entradaData);

      toast.success(`Entrada de ${quantidade} unidade(s) registrada com sucesso!`, {
        description: `${cor} - ${tamanho}`
      });
      onOpenChange(false);
      // Reset form
      setOrigem("entrada");
      setQuantidade(1);
      setFornecedor("");
      setObservacao("");
      setCor("");
      setTamanho("");
      // Reload data
      onSuccess?.();
    } catch (error: any) {
      toast.error("Erro ao registrar entrada", {
        description: error.message || "Tente novamente"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Entrada de Estoque</DialogTitle>
          <p className="text-sm text-muted-foreground">{nomeProduto} ({codigoProduto})</p>
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
            <Label>Origem *</Label>
            <RadioGroup value={origem} onValueChange={(value: "entrada" | "compra") => setOrigem(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="entrada" id="entrada" />
                <Label htmlFor="entrada" className="font-normal">Entrada</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="compra" id="compra" />
                <Label htmlFor="compra" className="font-normal">Compra</Label>
              </div>
            </RadioGroup>
          </div>

          {origem === "compra" && (
            <div>
              <Label>Fornecedor (Opcional)</Label>
              <Select value={fornecedor} onValueChange={setFornecedor}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  {fornecedores.map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
            <Label>Observação (Opcional)</Label>
            <Textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Adicione observações sobre a entrada..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleSubmit}>
              Confirmar Entrada
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
