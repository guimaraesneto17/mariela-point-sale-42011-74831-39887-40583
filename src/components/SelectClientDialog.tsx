import { useState } from "react";
import { Search, User, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { clientesAPI } from "@/lib/api";
import { maskPhone } from "@/lib/masks";
interface Cliente {
  codigo: string;
  nome: string;
}

interface SelectClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientes: Cliente[];
  onSelect: (cliente: Cliente) => void;
  onClienteAdded?: () => void;
}

export function SelectClientDialog({ open, onOpenChange, clientes, onSelect, onClienteAdded }: SelectClientDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientNome, setNewClientNome] = useState("");
  const [newClientTelefone, setNewClientTelefone] = useState("");
  const [newClientDataNascimento, setNewClientDataNascimento] = useState("");
  const [newClientObservacao, setNewClientObservacao] = useState("");
  const [saving, setSaving] = useState(false);

  const filteredClientes = clientes.filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generateNextCode = () => {
    if (clientes.length === 0) return "C001";
    const codes = clientes.map(c => parseInt(c.codigo.replace("C", "")));
    const maxCode = Math.max(...codes);
    return `C${String(maxCode + 1).padStart(3, "0")}`;
  };

  const handleSaveNewClient = async () => {
    if (!newClientNome.trim()) {
      toast.error("Digite o nome do cliente");
      return;
    }

    try {
      setSaving(true);
      const newClient = {
        codigoCliente: generateNextCode(),
        nome: newClientNome.trim(),
        telefone: newClientTelefone.trim() || undefined,
        dataNascimento: newClientDataNascimento || undefined,
        observacao: newClientObservacao.trim() || undefined,
      };

      await clientesAPI.create(newClient);
      
      toast.success("Cliente cadastrado com sucesso!");
      
      // Selecionar o cliente recém-criado
      onSelect({ codigo: newClient.codigoCliente, nome: newClient.nome });
      
      // Notificar que um cliente foi adicionado para recarregar a lista
      onClienteAdded?.();
      
      // Resetar form
      setNewClientNome("");
      setNewClientTelefone("");
      setNewClientDataNascimento("");
      setNewClientObservacao("");
      setShowNewClientForm(false);
      setSearchTerm("");
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Erro ao cadastrar cliente", {
        description: error.message || "Tente novamente"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) {
        setShowNewClientForm(false);
        setNewClientNome("");
        setNewClientTelefone("");
        setNewClientDataNascimento("");
        setNewClientObservacao("");
        setSearchTerm("");
      }
    }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {showNewClientForm ? "Cadastrar Novo Cliente" : "Selecionar Cliente"}
          </DialogTitle>
        </DialogHeader>
        
        {showNewClientForm ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Cliente *</Label>
              <Input
                id="nome"
                placeholder="Digite o nome completo"
                value={newClientNome}
                onChange={(e) => setNewClientNome(e.target.value)}
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone (Opcional)</Label>
              <Input
                id="telefone"
                placeholder="(00) 00000-0000"
                value={newClientTelefone}
                onChange={(e) => setNewClientTelefone(maskPhone(e.target.value))}
                maxLength={15}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataNascimento">Data de Nascimento (Opcional)</Label>
              <Input
                id="dataNascimento"
                type="date"
                value={newClientDataNascimento}
                onChange={(e) => setNewClientDataNascimento(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacao">Observações (Opcional)</Label>
              <textarea
                id="observacao"
                placeholder="Observações sobre o cliente..."
                value={newClientObservacao}
                onChange={(e) => setNewClientObservacao(e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                maxLength={500}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowNewClientForm(false);
                  setNewClientNome("");
                  setNewClientTelefone("");
                  setNewClientDataNascimento("");
                  setNewClientObservacao("");
                }}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleSaveNewClient}
                disabled={saving || !newClientNome.trim()}
              >
                {saving ? "Salvando..." : "Cadastrar e Selecionar"}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por nome ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Button
              variant="default"
              className="w-full mb-4 gap-2"
              onClick={() => setShowNewClientForm(true)}
            >
              <Plus className="h-4 w-4" />
              Cadastrar Novo Cliente
            </Button>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredClientes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum cliente encontrado</p>
                  {searchTerm && (
                    <Button
                      variant="link"
                      className="mt-2"
                      onClick={() => setShowNewClientForm(true)}
                    >
                      Cadastrar novo cliente
                    </Button>
                  )}
                </div>
              ) : (
                filteredClientes.map((cliente) => (
                  <Button
                    key={cliente.codigo}
                    variant="outline"
                    className="w-full justify-start h-auto p-4"
                    onClick={() => {
                      onSelect(cliente);
                      onOpenChange(false);
                      setSearchTerm("");
                    }}
                  >
                    <User className="h-5 w-5 text-primary mr-3" />
                    <div className="text-left">
                      <p className="font-medium">{cliente.nome}</p>
                      <p className="text-xs text-muted-foreground">{cliente.codigo}</p>
                    </div>
                  </Button>
                ))
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
