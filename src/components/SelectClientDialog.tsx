import { useState, useMemo } from "react";
import { Search, User, Plus, Check, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { clientesAPI } from "@/lib/api";
import { maskPhone } from "@/lib/masks";
import { cn } from "@/lib/utils";

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

// Validation helpers
const validateNome = (value: string) => {
  if (!value.trim()) return { valid: false, message: "Nome é obrigatório" };
  if (value.trim().length < 3) return { valid: false, message: "Mínimo 3 caracteres" };
  if (value.trim().length > 100) return { valid: false, message: "Máximo 100 caracteres" };
  return { valid: true, message: "Nome válido" };
};

const validateTelefone = (value: string) => {
  if (!value) return { valid: true, message: "" }; // Optional field
  const cleaned = value.replace(/\D/g, "");
  if (cleaned.length < 10) return { valid: false, message: "Telefone incompleto" };
  if (cleaned.length > 11) return { valid: false, message: "Telefone inválido" };
  return { valid: true, message: "Telefone válido" };
};

const validateDataNascimento = (value: string) => {
  if (!value) return { valid: true, message: "" }; // Optional field
  const date = new Date(value);
  if (isNaN(date.getTime())) return { valid: false, message: "Data inválida" };
  if (date > new Date()) return { valid: false, message: "Data não pode ser futura" };
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 120);
  if (date < minDate) return { valid: false, message: "Data inválida" };
  return { valid: true, message: "Data válida" };
};

interface ValidationIndicatorProps {
  validation: { valid: boolean; message: string };
  touched: boolean;
  isEmpty: boolean;
}

function ValidationIndicator({ validation, touched, isEmpty }: ValidationIndicatorProps) {
  if (!touched || isEmpty) return null;
  
  return (
    <div className={cn(
      "flex items-center gap-1 text-xs mt-1",
      validation.valid ? "text-green-600" : "text-destructive"
    )}>
      {validation.valid ? (
        <Check className="h-3 w-3" />
      ) : (
        <AlertCircle className="h-3 w-3" />
      )}
      <span>{validation.message}</span>
    </div>
  );
}

export function SelectClientDialog({ open, onOpenChange, clientes, onSelect, onClienteAdded }: SelectClientDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientNome, setNewClientNome] = useState("");
  const [newClientTelefone, setNewClientTelefone] = useState("");
  const [newClientDataNascimento, setNewClientDataNascimento] = useState("");
  const [newClientObservacao, setNewClientObservacao] = useState("");
  const [saving, setSaving] = useState(false);
  
  // Track touched fields
  const [touchedFields, setTouchedFields] = useState({
    nome: false,
    telefone: false,
    dataNascimento: false,
  });

  const filteredClientes = clientes.filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Memoized validations
  const nomeValidation = useMemo(() => validateNome(newClientNome), [newClientNome]);
  const telefoneValidation = useMemo(() => validateTelefone(newClientTelefone), [newClientTelefone]);
  const dataNascimentoValidation = useMemo(() => validateDataNascimento(newClientDataNascimento), [newClientDataNascimento]);

  const isFormValid = useMemo(() => {
    return nomeValidation.valid && telefoneValidation.valid && dataNascimentoValidation.valid;
  }, [nomeValidation, telefoneValidation, dataNascimentoValidation]);

  const generateNextCode = () => {
    if (clientes.length === 0) return "C001";
    const codes = clientes.map(c => parseInt(c.codigo.replace("C", "")));
    const maxCode = Math.max(...codes);
    return `C${String(maxCode + 1).padStart(3, "0")}`;
  };

  const handleFieldBlur = (field: keyof typeof touchedFields) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
  };

  const handleSaveNewClient = async () => {
    // Mark all fields as touched to show validation
    setTouchedFields({ nome: true, telefone: true, dataNascimento: true });
    
    if (!isFormValid) {
      toast.error("Corrija os erros antes de salvar");
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
      resetForm();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Erro ao cadastrar cliente", {
        description: error.message || "Tente novamente"
      });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setNewClientNome("");
    setNewClientTelefone("");
    setNewClientDataNascimento("");
    setNewClientObservacao("");
    setShowNewClientForm(false);
    setSearchTerm("");
    setTouchedFields({ nome: false, telefone: false, dataNascimento: false });
  };

  const getInputClassName = (validation: { valid: boolean }, touched: boolean, isEmpty: boolean) => {
    if (!touched || isEmpty) return "";
    return validation.valid 
      ? "border-green-500 focus-visible:ring-green-500/30" 
      : "border-destructive focus-visible:ring-destructive/30";
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetForm();
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
              <Label htmlFor="nome" className="flex items-center gap-1">
                Nome do Cliente <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nome"
                placeholder="Digite o nome completo"
                value={newClientNome}
                onChange={(e) => setNewClientNome(e.target.value)}
                onBlur={() => handleFieldBlur("nome")}
                maxLength={100}
                className={cn(
                  "transition-colors",
                  getInputClassName(nomeValidation, touchedFields.nome, !newClientNome)
                )}
              />
              <ValidationIndicator 
                validation={nomeValidation} 
                touched={touchedFields.nome} 
                isEmpty={!newClientNome}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone (Opcional)</Label>
              <Input
                id="telefone"
                placeholder="(00) 00000-0000"
                value={newClientTelefone}
                onChange={(e) => setNewClientTelefone(maskPhone(e.target.value))}
                onBlur={() => handleFieldBlur("telefone")}
                maxLength={15}
                className={cn(
                  "transition-colors",
                  getInputClassName(telefoneValidation, touchedFields.telefone, !newClientTelefone)
                )}
              />
              <ValidationIndicator 
                validation={telefoneValidation} 
                touched={touchedFields.telefone} 
                isEmpty={!newClientTelefone}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataNascimento">Data de Nascimento (Opcional)</Label>
              <Input
                id="dataNascimento"
                type="date"
                value={newClientDataNascimento}
                onChange={(e) => setNewClientDataNascimento(e.target.value)}
                onBlur={() => handleFieldBlur("dataNascimento")}
                className={cn(
                  "transition-colors",
                  getInputClassName(dataNascimentoValidation, touchedFields.dataNascimento, !newClientDataNascimento)
                )}
              />
              <ValidationIndicator 
                validation={dataNascimentoValidation} 
                touched={touchedFields.dataNascimento} 
                isEmpty={!newClientDataNascimento}
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
                onClick={resetForm}
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