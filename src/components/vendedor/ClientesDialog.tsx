import { useState, useMemo } from "react";
import { Search, Users, Plus, Edit, Phone, Calendar, Check, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { toast } from "sonner";
import { clientesAPI } from "@/lib/api";
import { maskPhone, maskDate } from "@/lib/masks";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";

interface ClientesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientes: any[];
  onClienteUpdated: () => void;
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
  // Handle DD/MM/YYYY format
  const parts = value.split('/');
  if (parts.length !== 3) return { valid: false, message: "Data incompleta" };
  const [day, month, year] = parts;
  if (!day || !month || !year || year.length < 4) return { valid: false, message: "Data incompleta" };
  const date = new Date(`${year}-${month}-${day}`);
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

export function ClientesDialog({ 
  open, 
  onOpenChange, 
  clientes,
  onClienteUpdated 
}: ClientesDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCliente, setEditingCliente] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [observacao, setObservacao] = useState("");

  // Track touched fields
  const [touchedFields, setTouchedFields] = useState({
    nome: false,
    telefone: false,
    dataNascimento: false,
  });

  const clientesFiltrados = useMemo(() => {
    if (!searchTerm) return clientes;
    const search = searchTerm.toLowerCase();
    return clientes.filter((cliente: any) =>
      cliente.nome?.toLowerCase().includes(search) ||
      cliente.telefone?.includes(search) ||
      cliente.codigoCliente?.toLowerCase().includes(search)
    );
  }, [clientes, searchTerm]);

  // Memoized validations
  const nomeValidation = useMemo(() => validateNome(nome), [nome]);
  const telefoneValidation = useMemo(() => validateTelefone(telefone), [telefone]);
  const dataNascimentoValidation = useMemo(() => validateDataNascimento(dataNascimento), [dataNascimento]);

  const isFormValid = useMemo(() => {
    return nomeValidation.valid && telefoneValidation.valid && dataNascimentoValidation.valid;
  }, [nomeValidation, telefoneValidation, dataNascimentoValidation]);

  const generateNextCode = () => {
    const codigosNumericos = clientes
      .map((c: any) => {
        const match = (c.codigoCliente || '').match(/\d+/);
        return match ? parseInt(match[0]) : 0;
      })
      .filter((n: number) => !isNaN(n));
    
    const maxCodigo = codigosNumericos.length > 0 ? Math.max(...codigosNumericos) : 0;
    return `C${String(maxCodigo + 1).padStart(3, '0')}`;
  };

  const handleFieldBlur = (field: keyof typeof touchedFields) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
  };

  const resetForm = () => {
    setNome("");
    setTelefone("");
    setDataNascimento("");
    setObservacao("");
    setShowForm(false);
    setIsEditing(false);
    setEditingCliente(null);
    setTouchedFields({ nome: false, telefone: false, dataNascimento: false });
  };

  const handleEditCliente = (cliente: any) => {
    setEditingCliente(cliente);
    setNome(cliente.nome || "");
    setTelefone(cliente.telefone || "");
    setDataNascimento(cliente.dataNascimento ? format(new Date(cliente.dataNascimento), "dd/MM/yyyy") : "");
    setObservacao(cliente.observacao || "");
    setIsEditing(true);
    setShowForm(true);
    setTouchedFields({ nome: false, telefone: false, dataNascimento: false });
  };

  const handleSave = async () => {
    // Mark all fields as touched to show validation
    setTouchedFields({ nome: true, telefone: true, dataNascimento: true });

    if (!isFormValid) {
      toast.error("Corrija os erros antes de salvar");
      return;
    }

    setIsLoading(true);
    try {
      // Converter data para formato ISO
      let dataNascimentoISO: string | undefined = undefined;
      if (dataNascimento) {
        const parts = dataNascimento.split('/');
        if (parts.length === 3) {
          dataNascimentoISO = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }

      if (isEditing && editingCliente) {
        await clientesAPI.update(editingCliente.codigoCliente, {
          nome: nome.trim(),
          telefone: telefone || undefined,
          dataNascimento: dataNascimentoISO,
          observacao: observacao.trim() || undefined,
        });
        toast.success("Cliente atualizado com sucesso!");
      } else {
        const novoCliente = {
          codigoCliente: generateNextCode(),
          nome: nome.trim(),
          telefone: telefone || undefined,
          dataNascimento: dataNascimentoISO,
          observacao: observacao.trim() || undefined,
        };
        await clientesAPI.create(novoCliente);
        toast.success("Cliente cadastrado com sucesso!");
      }

      resetForm();
      onClienteUpdated();
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      toast.error("Erro ao salvar cliente");
    } finally {
      setIsLoading(false);
    }
  };

  const getInputClassName = (validation: { valid: boolean }, touched: boolean, isEmpty: boolean) => {
    if (!touched || isEmpty) return "";
    return validation.valid 
      ? "border-green-500 focus-visible:ring-green-500/30" 
      : "border-destructive focus-visible:ring-destructive/30";
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Clientes
          </DialogTitle>
          <DialogDescription>
            Visualize, cadastre e edite clientes
          </DialogDescription>
        </DialogHeader>

        {!showForm ? (
          <>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, telefone ou código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => setShowForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Cliente
              </Button>
            </div>

            <ScrollArea className="h-[55vh]">
              <div className="space-y-2 pr-4">
                {clientesFiltrados.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum cliente encontrado
                  </p>
                ) : (
                  clientesFiltrados.map((cliente: any) => (
                    <Card key={cliente._id} className="hover:bg-muted/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate">{cliente.nome}</p>
                              <span className="text-xs text-muted-foreground">
                                {cliente.codigoCliente}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                              {cliente.telefone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {cliente.telefone}
                                </span>
                              )}
                              {cliente.dataNascimento && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(cliente.dataNascimento), "dd/MM/yyyy")}
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCliente(cliente)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <Label className="flex items-center gap-1">
                  Nome <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  onBlur={() => handleFieldBlur("nome")}
                  placeholder="Nome do cliente"
                  maxLength={100}
                  className={cn(
                    "transition-colors",
                    getInputClassName(nomeValidation, touchedFields.nome, !nome)
                  )}
                />
                <ValidationIndicator 
                  validation={nomeValidation} 
                  touched={touchedFields.nome} 
                  isEmpty={!nome}
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  value={telefone}
                  onChange={(e) => setTelefone(maskPhone(e.target.value))}
                  onBlur={() => handleFieldBlur("telefone")}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  className={cn(
                    "transition-colors",
                    getInputClassName(telefoneValidation, touchedFields.telefone, !telefone)
                  )}
                />
                <ValidationIndicator 
                  validation={telefoneValidation} 
                  touched={touchedFields.telefone} 
                  isEmpty={!telefone}
                />
              </div>
              <div>
                <Label>Data de Nascimento</Label>
                <Input
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(maskDate(e.target.value))}
                  onBlur={() => handleFieldBlur("dataNascimento")}
                  placeholder="DD/MM/AAAA"
                  maxLength={10}
                  className={cn(
                    "transition-colors",
                    getInputClassName(dataNascimentoValidation, touchedFields.dataNascimento, !dataNascimento)
                  )}
                />
                <ValidationIndicator 
                  validation={dataNascimentoValidation} 
                  touched={touchedFields.dataNascimento} 
                  isEmpty={!dataNascimento}
                />
              </div>
              <div>
                <Label>Observações</Label>
                <textarea
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Observações sobre o cliente..."
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  maxLength={500}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? "Salvando..." : (isEditing ? "Salvar Alterações" : "Cadastrar Cliente")}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
