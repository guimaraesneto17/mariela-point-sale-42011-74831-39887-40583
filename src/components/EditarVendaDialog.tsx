import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { vendasAPI } from "@/lib/api";
import { Lock, Save } from "lucide-react";

interface EditarVendaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venda: any;
  onSuccess: () => void;
}

const SENHA_EDICAO = "reabrirvendamariela";

export function EditarVendaDialog({ open, onOpenChange, venda, onSuccess }: EditarVendaDialogProps) {
  const [senhaDigitada, setSenhaDigitada] = useState("");
  const [autenticado, setAutenticado] = useState(false);
  const [observacoes, setObservacoes] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (open) {
      setSenhaDigitada("");
      setAutenticado(false);
      setObservacoes(venda?.observacoes || "");
    }
  }, [open, venda]);

  const handleVerificarSenha = () => {
    if (senhaDigitada === SENHA_EDICAO) {
      setAutenticado(true);
      toast.success("Acesso autorizado!");
    } else {
      toast.error("Senha incorreta!");
      setSenhaDigitada("");
    }
  };

  const handleSalvar = async () => {
    try {
      setSalvando(true);
      await vendasAPI.update(venda.codigoVenda || venda.codigo, {
        ...venda,
        observacoes
      });
      toast.success("Venda atualizada com sucesso!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Erro ao atualizar venda", {
        description: error.message || "Tente novamente"
      });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Editar Venda
          </DialogTitle>
          <DialogDescription>
            {!autenticado 
              ? "Digite a senha para autorizar a edição da venda"
              : `Editando venda ${venda?.codigoVenda || venda?.codigo}`
            }
          </DialogDescription>
        </DialogHeader>

        {!autenticado ? (
          <div className="space-y-4">
            <div>
              <Label>Senha de Autorização</Label>
              <Input
                type="password"
                value={senhaDigitada}
                onChange={(e) => setSenhaDigitada(e.target.value)}
                placeholder="Digite a senha"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleVerificarSenha();
                  }
                }}
              />
            </div>
            <Button 
              onClick={handleVerificarSenha} 
              className="w-full"
              disabled={!senhaDigitada}
            >
              Verificar Senha
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Código:</span>
                <span className="font-medium">{venda?.codigoVenda || venda?.codigo}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cliente:</span>
                <span className="font-medium">{venda?.cliente?.nome}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-medium">R$ {Number(venda?.total || 0).toFixed(2)}</span>
              </div>
            </div>

            <div>
              <Label>Observações</Label>
              <Input
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Adicione observações sobre a venda"
              />
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSalvar}
                disabled={salvando}
                className="flex-1 gap-2"
              >
                <Save className="h-4 w-4" />
                {salvando ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
