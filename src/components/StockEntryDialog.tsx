import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface StockEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  codigoProduto: string;
  nomeProduto: string;
}

export function StockEntryDialog({ open, onOpenChange, codigoProduto, nomeProduto }: StockEntryDialogProps) {
  const [origem, setOrigem] = useState<"entrada" | "compra">("entrada");
  const [quantidade, setQuantidade] = useState(1);
  const [fornecedor, setFornecedor] = useState("");
  const [observacao, setObservacao] = useState("");

  const fornecedores = [
    "Elegance Fashion",
    "Moda Style",
    "Denim Co.",
    "Outros"
  ];

  const handleSubmit = () => {
    if (quantidade <= 0) {
      toast.error("Quantidade deve ser maior que zero");
      return;
    }

    toast.success(`Entrada de ${quantidade} unidade(s) registrada com sucesso!`);
    onOpenChange(false);
    // Reset form
    setOrigem("entrada");
    setQuantidade(1);
    setFornecedor("");
    setObservacao("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Entrada de Estoque</DialogTitle>
          <p className="text-sm text-muted-foreground">{nomeProduto} ({codigoProduto})</p>
        </DialogHeader>
        
        <div className="space-y-4">
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
