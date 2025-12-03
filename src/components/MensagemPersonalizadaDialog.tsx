import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Send, MessageCircle, User, Phone } from "lucide-react";
import { toast } from "sonner";

interface Cliente {
  _id: string;
  codigoCliente: string;
  nome: string;
  telefone?: string;
}

interface MensagemPersonalizadaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente: Cliente | null;
}

export function MensagemPersonalizadaDialog({ open, onOpenChange, cliente }: MensagemPersonalizadaDialogProps) {
  const [mensagem, setMensagem] = useState(
    "Olá! 💜\n\nA Mariela Moda Feminina tem novidades especiais para você! ✨\n\nVenha conferir nossas novas peças e aproveitar condições exclusivas! 🛍️\n\nAguardamos sua visita! 💕"
  );
  const [enviando, setEnviando] = useState(false);

  const enviarMensagem = async () => {
    if (!cliente) {
      toast.error("Cliente não selecionado");
      return;
    }

    if (!cliente.telefone) {
      toast.error("Cliente não possui telefone cadastrado");
      return;
    }

    if (!mensagem.trim()) {
      toast.error("Digite uma mensagem");
      return;
    }

    setEnviando(true);

    try {
      const telefone = cliente.telefone.replace(/\D/g, '');
      const mensagemPersonalizada = `Olá ${cliente.nome}!\n\n${mensagem}`;
      const urlWhatsApp = `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagemPersonalizada)}`;
      
      window.open(urlWhatsApp, '_blank');

      toast.success("Conversa do WhatsApp aberta!", {
        description: `Mensagem pronta para enviar para ${cliente.nome}`
      });

      setTimeout(() => {
        onOpenChange(false);
      }, 1000);
    } catch (error) {
      toast.error("Erro ao abrir WhatsApp");
      console.error(error);
    } finally {
      setEnviando(false);
    }
  };

  if (!cliente) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
        <DialogHeader className="pb-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl">
              <MessageCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Enviar Mensagem
              </DialogTitle>
              <DialogDescription className="text-base mt-1">
                Envie uma mensagem personalizada via WhatsApp
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4">
          {/* Informações do cliente */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-lg text-foreground">{cliente.nome}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {cliente.codigoCliente}
                    </Badge>
                    {cliente.telefone && (
                      <Badge variant="secondary" className="text-xs flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {cliente.telefone}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Área de mensagem */}
          <Card className="border-2 border-accent/20 bg-gradient-to-br from-card to-accent/5 flex-1 flex flex-col">
            <CardContent className="p-4 flex flex-col h-full">
              <Label className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-accent" />
                Mensagem Personalizada
              </Label>
              <Textarea
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="flex-1 resize-none font-sans text-sm min-h-[200px]"
              />
              <div className="mt-3 p-3 bg-muted/50 rounded-lg border border-border/50">
                <p className="text-xs text-muted-foreground">
                  💡 <span className="font-semibold">Dica:</span> A mensagem será automaticamente prefixada com "Olá {cliente.nome}!"
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Aviso se não tiver telefone */}
          {!cliente.telefone && (
            <Card className="border-2 border-destructive/30 bg-gradient-to-br from-destructive/10 to-background">
              <CardContent className="p-4">
                <p className="text-sm text-destructive font-medium">
                  ⚠️ Este cliente não possui telefone cadastrado. Atualize o cadastro para enviar mensagens.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <Separator />

        <DialogFooter className="gap-3 pt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={enviando}
            className="min-w-[120px]"
          >
            Cancelar
          </Button>
          <Button 
            onClick={enviarMensagem}
            disabled={!cliente.telefone || enviando}
            className="min-w-[120px] bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg"
          >
            <Send className="h-4 w-4 mr-2" />
            {enviando ? 'Abrindo...' : 'Enviar via WhatsApp'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
