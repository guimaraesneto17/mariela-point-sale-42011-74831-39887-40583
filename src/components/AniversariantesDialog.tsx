import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Calendar, Send, Users, Cake, MessageCircle, CheckCircle2, Clock, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { format, isSameDay, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Cliente {
  _id: string;
  codigoCliente: string;
  nome: string;
  telefone?: string;
  dataNascimento?: string;
}

interface AniversariantesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientes: Cliente[];
}

export function AniversariantesDialog({ open, onOpenChange, clientes }: AniversariantesDialogProps) {
  const [mensagem, setMensagem] = useState(
    "🎉 Feliz Aniversário! 🎂\n\nA Mariela PDV deseja um dia maravilhoso repleto de alegrias e conquistas! ✨\n\nComo presente especial, você ganhou 10% de desconto na sua próxima compra! 🎁\n\nVenha nos visitar! 💜"
  );
  const [clientesSelecionados, setClientesSelecionados] = useState<Set<string>>(new Set());
  const [agendamento, setAgendamento] = useState<'hoje' | 'amanha' | 'semana' | 'mes'>('hoje');
  const [enviando, setEnviando] = useState(false);

  // Filtrar aniversariantes com base no agendamento
  const getAniversariantes = () => {
    const hoje = new Date();
    const amanha = addDays(hoje, 1);
    const fimSemana = addDays(hoje, 7);
    const fimMes = addDays(hoje, 30);

    return clientes.filter((cliente) => {
      if (!cliente.dataNascimento || !cliente.telefone) return false;
      
      const dataNasc = new Date(cliente.dataNascimento);
      const mesNasc = dataNasc.getMonth();
      const diaNasc = dataNasc.getDate();

      const dataAtual = new Date();
      dataAtual.setFullYear(hoje.getFullYear());
      dataAtual.setMonth(mesNasc);
      dataAtual.setDate(diaNasc);

      if (agendamento === 'hoje') {
        return isSameDay(dataAtual, hoje);
      } else if (agendamento === 'amanha') {
        return isSameDay(dataAtual, amanha);
      } else if (agendamento === 'semana') {
        return dataAtual >= hoje && dataAtual <= fimSemana;
      } else {
        return dataAtual >= hoje && dataAtual <= fimMes;
      }
    });
  };

  const aniversariantes = getAniversariantes();

  // Selecionar todos ao mudar o filtro
  useEffect(() => {
    setClientesSelecionados(new Set(aniversariantes.map(c => c._id)));
  }, [agendamento, open]);

  const toggleCliente = (clienteId: string) => {
    const novosClientes = new Set(clientesSelecionados);
    if (novosClientes.has(clienteId)) {
      novosClientes.delete(clienteId);
    } else {
      novosClientes.add(clienteId);
    }
    setClientesSelecionados(novosClientes);
  };

  const selecionarTodos = () => {
    if (clientesSelecionados.size === aniversariantes.length) {
      setClientesSelecionados(new Set());
    } else {
      setClientesSelecionados(new Set(aniversariantes.map(c => c._id)));
    }
  };

  const enviarMensagens = async () => {
    if (clientesSelecionados.size === 0) {
      toast.error("Selecione pelo menos um cliente");
      return;
    }

    if (!mensagem.trim()) {
      toast.error("Digite uma mensagem");
      return;
    }

    setEnviando(true);

    try {
      const clientesFiltrados = aniversariantes.filter(c => clientesSelecionados.has(c._id));
      
      // Simular envio de mensagens via WhatsApp
      for (const cliente of clientesFiltrados) {
        const telefone = cliente.telefone?.replace(/\D/g, '');
        if (telefone) {
          const mensagemPersonalizada = `Olá ${cliente.nome}!\n\n${mensagem}`;
          const urlWhatsApp = `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagemPersonalizada)}`;
          
          // Abrir WhatsApp em nova aba (apenas o primeiro, para não bloquear popup)
          if (clientesFiltrados.indexOf(cliente) === 0) {
            window.open(urlWhatsApp, '_blank');
          }
          
          // Simular delay entre mensagens
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      toast.success(`${clientesSelecionados.size} mensagem(ns) enviada(s)!`, {
        description: "As conversas do WhatsApp foram abertas para você enviar as mensagens"
      });

      // Fechar diálogo após sucesso
      setTimeout(() => {
        onOpenChange(false);
        setClientesSelecionados(new Set());
      }, 1500);
    } catch (error) {
      toast.error("Erro ao enviar mensagens");
      console.error(error);
    } finally {
      setEnviando(false);
    }
  };

  const formatarDataAniversario = (dataNascimento: string) => {
    const data = new Date(dataNascimento);
    return format(data, "dd 'de' MMMM", { locale: ptBR });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
        <DialogHeader className="pb-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl animate-float">
              <Cake className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Mensagens de Aniversário
              </DialogTitle>
              <DialogDescription className="text-base mt-1">
                Envie mensagens personalizadas para os aniversariantes via WhatsApp
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4">
          {/* Seletor de período */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              variant={agendamento === 'hoje' ? 'default' : 'outline'}
              onClick={() => setAgendamento('hoje')}
              className="gap-2"
            >
              <Calendar className="h-4 w-4" />
              Hoje ({clientes.filter(c => {
                if (!c.dataNascimento) return false;
                const dataNasc = new Date(c.dataNascimento);
                const hoje = new Date();
                return dataNasc.getDate() === hoje.getDate() && dataNasc.getMonth() === hoje.getMonth();
              }).length})
            </Button>
            <Button
              variant={agendamento === 'amanha' ? 'default' : 'outline'}
              onClick={() => setAgendamento('amanha')}
              className="gap-2"
            >
              <Clock className="h-4 w-4" />
              Amanhã ({clientes.filter(c => {
                if (!c.dataNascimento) return false;
                const dataNasc = new Date(c.dataNascimento);
                const amanha = addDays(new Date(), 1);
                return dataNasc.getDate() === amanha.getDate() && dataNasc.getMonth() === amanha.getMonth();
              }).length})
            </Button>
            <Button
              variant={agendamento === 'semana' ? 'default' : 'outline'}
              onClick={() => setAgendamento('semana')}
              className="gap-2"
            >
              <Users className="h-4 w-4" />
              7 dias
            </Button>
            <Button
              variant={agendamento === 'mes' ? 'default' : 'outline'}
              onClick={() => setAgendamento('mes')}
              className="gap-2"
            >
              <CalendarIcon className="h-4 w-4" />
              Mês ({clientes.filter(c => {
                if (!c.dataNascimento) return false;
                const dataNasc = new Date(c.dataNascimento);
                const hoje = new Date();
                const fimMes = addDays(hoje, 30);
                const dataAtual = new Date();
                dataAtual.setFullYear(hoje.getFullYear());
                dataAtual.setMonth(dataNasc.getMonth());
                dataAtual.setDate(dataNasc.getDate());
                return dataAtual >= hoje && dataAtual <= fimMes;
              }).length})
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-hidden">
            {/* Lista de aniversariantes */}
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5 flex flex-col">
              <CardContent className="p-4 flex flex-col h-full overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Aniversariantes ({aniversariantes.length})
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selecionarTodos}
                    className="text-xs"
                  >
                    {clientesSelecionados.size === aniversariantes.length ? 'Desmarcar' : 'Selecionar'} Todos
                  </Button>
                </div>

                <ScrollArea className="flex-1 -mx-4 px-4">
                  {aniversariantes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Cake className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Nenhum aniversariante encontrado</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {aniversariantes.map((cliente) => (
                        <div
                          key={cliente._id}
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer hover:scale-[1.02] ${
                            clientesSelecionados.has(cliente._id)
                              ? 'border-primary bg-primary/10'
                              : 'border-border bg-background hover:border-primary/50'
                          }`}
                          onClick={() => toggleCliente(cliente._id)}
                        >
                          <Checkbox
                            checked={clientesSelecionados.has(cliente._id)}
                            onCheckedChange={() => toggleCliente(cliente._id)}
                            className="pointer-events-none"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-foreground truncate">
                              {cliente.nome}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {cliente.telefone}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatarDataAniversario(cliente.dataNascimento!)}
                              </span>
                            </div>
                          </div>
                          {clientesSelecionados.has(cliente._id) && (
                            <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Mensagem */}
            <Card className="border-2 border-accent/20 bg-gradient-to-br from-card to-accent/5 flex flex-col">
              <CardContent className="p-4 flex flex-col h-full">
                <Label className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-accent" />
                  Mensagem Personalizada
                </Label>
                <Textarea
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  placeholder="Digite sua mensagem de aniversário..."
                  className="flex-1 resize-none font-sans text-sm"
                  rows={10}
                />
                <div className="mt-3 p-3 bg-muted/50 rounded-lg border border-border/50">
                  <p className="text-xs text-muted-foreground">
                    💡 <span className="font-semibold">Dica:</span> A mensagem será personalizada com o nome de cada cliente automaticamente.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resumo */}
          {clientesSelecionados.size > 0 && (
            <Card className="border-2 border-green-500/30 bg-gradient-to-br from-green-50/50 to-background dark:from-green-950/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Send className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {clientesSelecionados.size} mensagem(ns) será(ão) enviada(s)
                      </p>
                      <p className="text-xs text-muted-foreground">
                        As conversas do WhatsApp serão abertas automaticamente
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-500 text-white">
                    Pronto para enviar
                  </Badge>
                </div>
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
            onClick={enviarMensagens}
            disabled={clientesSelecionados.size === 0 || enviando}
            className="min-w-[120px] bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg"
          >
            <Send className="h-4 w-4 mr-2" />
            {enviando ? 'Enviando...' : `Enviar ${clientesSelecionados.size > 0 ? `(${clientesSelecionados.size})` : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
