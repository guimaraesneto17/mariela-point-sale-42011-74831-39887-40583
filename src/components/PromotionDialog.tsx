import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface PromotionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  codigoProduto: string;
  nomeProduto: string;
  precoOriginal: number;
  emPromocao?: boolean;
}

export function PromotionDialog({ 
  open, 
  onOpenChange, 
  codigoProduto, 
  nomeProduto, 
  precoOriginal = 0,
  emPromocao = false
}: PromotionDialogProps) {
  const [tipoDesconto, setTipoDesconto] = useState<"valor" | "porcentagem">("valor");
  const [valor, setValor] = useState(0);

  const calcularPrecoPromocional = () => {
    const preco = precoOriginal || 0;
    if (tipoDesconto === "valor") {
      return Math.max(0, preco - valor);
    } else {
      return Math.max(0, preco * (1 - valor / 100));
    }
  };

  const precoPromocional = calcularPrecoPromocional();

  const handleSubmit = () => {
    if (valor <= 0) {
      toast.error("Informe um valor válido para o desconto");
      return;
    }

    if (precoPromocional <= 0) {
      toast.error("O preço promocional não pode ser zero ou negativo");
      return;
    }

    toast.success(`Promoção aplicada! Novo preço: R$ ${precoPromocional.toFixed(2)}`);
    onOpenChange(false);
    // Reset
    setValor(0);
    setTipoDesconto("valor");
  };

  const handleRemovePromotion = () => {
    toast.success(`Promoção removida de "${nomeProduto}"!`);
    onOpenChange(false);
    // Aqui você implementaria a lógica com a API
  };

  if (emPromocao) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <DialogTitle className="text-xl">Cancelar Promoção?</DialogTitle>
            </div>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja cancelar a promoção de <span className="font-semibold text-foreground">"{nomeProduto}"</span>?
            </p>
            <p className="text-sm text-muted-foreground">
              O produto voltará ao preço original de <span className="font-semibold text-foreground">R$ {precoOriginal.toFixed(2)}</span>
            </p>
          </div>

          <div className="flex gap-3 mt-6">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Manter Promoção
            </Button>
            <Button 
              className="flex-1"
              onClick={handleRemovePromotion}
            >
              Cancelar Promoção
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Colocar em Promoção</DialogTitle>
          <p className="text-sm text-muted-foreground">{nomeProduto} ({codigoProduto})</p>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Preço Original</p>
            <p className="text-2xl font-bold">R$ {precoOriginal.toFixed(2)}</p>
          </div>

          <div>
            <Label>Tipo de Desconto</Label>
            <RadioGroup value={tipoDesconto} onValueChange={(value: "valor" | "porcentagem") => setTipoDesconto(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="valor" id="valor" />
                <Label htmlFor="valor" className="font-normal">Valor direto (R$)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="porcentagem" id="porcentagem" />
                <Label htmlFor="porcentagem" className="font-normal">Porcentagem (%)</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label>{tipoDesconto === "valor" ? "Valor do Desconto (R$)" : "Porcentagem do Desconto (%)"}</Label>
            <Input
              type="number"
              min="0"
              step={tipoDesconto === "valor" ? "0.01" : "1"}
              max={tipoDesconto === "porcentagem" ? "100" : undefined}
              value={valor}
              onChange={(e) => setValor(parseFloat(e.target.value) || 0)}
              placeholder={tipoDesconto === "valor" ? "0.00" : "0"}
            />
          </div>

          <div className="p-3 bg-primary/10 rounded-lg border-2 border-primary">
            <p className="text-sm text-muted-foreground">Preço Promocional</p>
            <p className="text-2xl font-bold text-primary">R$ {precoPromocional.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Economia de R$ {(precoOriginal - precoPromocional).toFixed(2)}
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleSubmit}>
              Aplicar Promoção
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}