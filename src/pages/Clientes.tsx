import { useState } from "react";
import { Search, Plus, User, CheckCircle2, AlertCircle, Edit, Trash2, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { clienteSchema } from "@/lib/validationSchemas";
import { maskPhone } from "@/lib/masks";
import { z } from "zod";

type ClienteFormData = z.infer<typeof clienteSchema>;

const Clientes = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingCliente, setEditingCliente] = useState<any>(null);
  const [manualCode, setManualCode] = useState(false);
  
  const form = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      codigoCliente: "",
      nome: "",
      telefone: "",
      dataNascimento: "",
      observacao: "",
    },
  });

  const [clientes] = useState([
    {
      _id: "1",
      codigoCliente: "C001",
      nome: "Ana Souza",
      telefone: "(11) 98765-4321",
      dataNascimento: "1990-05-12",
      observacao: "Endereço: Rua das Flores, 123"
    },
    {
      _id: "2",
      codigoCliente: "C002",
      nome: "Fernanda Ribeiro",
      telefone: "(21) 99876-1122",
      dataNascimento: "1985-11-22",
      observacao: "Cliente VIP"
    },
  ]);

  const filteredClientes = clientes.filter(cliente =>
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.telefone.includes(searchTerm)
  );

  // Gera código automático incremental
  const generateNextCode = () => {
    if (clientes.length === 0) return "C001";
    const codes = clientes.map(c => parseInt(c.codigoCliente.replace("C", "")));
    const maxCode = Math.max(...codes);
    return `C${String(maxCode + 1).padStart(3, "0")}`;
  };

  const onSubmit = async (data: ClienteFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:3000/api/clientes", {
        method: editingCliente ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          _id: editingCliente?._id,
          dataCadastro: editingCliente?.dataCadastro || new Date().toISOString(),
        }),
      });

      if (response.ok) {
        toast.success(editingCliente ? "✅ Cliente atualizado com sucesso!" : "✅ Cliente cadastrado com sucesso!", {
          description: `${data.nome} foi ${editingCliente ? "atualizado" : "adicionado"} ao sistema`,
        });
        setIsDialogOpen(false);
        setEditingCliente(null);
        form.reset();
        setManualCode(false);
      } else {
        const error = await response.json();
        toast.error("❌ Erro ao salvar cliente", {
          description: error.error || "Verifique os dados e tente novamente",
        });
      }
    } catch (error) {
      toast.error("❌ Erro ao conectar com o servidor", {
        description: "Verifique sua conexão e tente novamente",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (cliente: any) => {
    setEditingCliente(cliente);
    form.reset({
      codigoCliente: cliente.codigoCliente,
      nome: cliente.nome,
      telefone: cliente.telefone,
      dataNascimento: cliente.dataNascimento,
      observacao: cliente.observacao || "",
    });
    setManualCode(true);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este cliente?")) {
      toast.success("Cliente excluído com sucesso!");
      // Aqui você implementaria a lógica de exclusão com a API
    }
  };

  const handleOpenDialog = () => {
    setEditingCliente(null);
    form.reset({
      codigoCliente: generateNextCode(),
      nome: "",
      telefone: "",
      dataNascimento: "",
      observacao: "",
    });
    setManualCode(false);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Clientes</h1>
          <p className="text-muted-foreground">
            Gerenciamento de clientes
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={handleOpenDialog}>
              <Plus className="h-4 w-4" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-background via-background to-primary/5">
            <DialogHeader className="pb-4 border-b border-border/50">
              <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                {editingCliente ? "Editar Cliente" : "Cadastrar Novo Cliente"}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-base mt-2">
                {editingCliente ? "Atualize as informações do cliente" : "Preencha os dados do cliente. Campos com * são obrigatórios."}
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card className="border-2 border-primary/10 bg-gradient-to-br from-card via-card to-primary/5 shadow-xl">
                  <CardContent className="pt-6 space-y-5">
                    {/* Código do Cliente */}
                    <FormField
                      control={form.control}
                      name="codigoCliente"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-foreground">Código do Cliente *</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="C001"
                                disabled={editingCliente || !manualCode}
                                className="transition-all focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-70"
                              />
                            </FormControl>
                            {!editingCliente && (
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                  setManualCode(!manualCode);
                                  if (manualCode) {
                                    form.setValue("codigoCliente", generateNextCode());
                                  }
                                }}
                                className="shrink-0"
                              >
                                {manualCode ? <X className="h-4 w-4" /> : "✎"}
                              </Button>
                            )}
                          </div>
                          <FormMessage className="text-xs flex items-center gap-1">
                            {form.formState.errors.codigoCliente && (
                              <AlertCircle className="h-3 w-3" />
                            )}
                          </FormMessage>
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Nome */}
                      <FormField
                        control={form.control}
                        name="nome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-foreground">Nome Completo *</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="Digite o nome completo"
                                className="transition-all focus:ring-2 focus:ring-primary/30 focus:border-primary"
                              />
                            </FormControl>
                            <FormMessage className="text-xs flex items-center gap-1">
                              {form.formState.errors.nome && (
                                <AlertCircle className="h-3 w-3" />
                              )}
                            </FormMessage>
                          </FormItem>
                        )}
                      />

                      {/* Telefone */}
                      <FormField
                        control={form.control}
                        name="telefone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-foreground">Telefone</FormLabel>
                            <FormControl>
                              <Input 
                                {...field}
                                placeholder="(99) 99999-9999"
                                onChange={(e) => field.onChange(maskPhone(e.target.value))}
                                className="transition-all focus:ring-2 focus:ring-primary/30 focus:border-primary"
                              />
                            </FormControl>
                            <FormMessage className="text-xs flex items-center gap-1">
                              {form.formState.errors.telefone && (
                                <AlertCircle className="h-3 w-3" />
                              )}
                            </FormMessage>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Data de Nascimento */}
                    <FormField
                      control={form.control}
                      name="dataNascimento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-foreground">Data de Nascimento</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              type="date"
                              className="transition-all focus:ring-2 focus:ring-primary/30 focus:border-primary"
                            />
                          </FormControl>
                          <FormMessage className="text-xs flex items-center gap-1">
                            {form.formState.errors.dataNascimento && (
                              <AlertCircle className="h-3 w-3" />
                            )}
                          </FormMessage>
                        </FormItem>
                      )}
                    />

                    {/* Observação */}
                    <FormField
                      control={form.control}
                      name="observacao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-foreground">Observações</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field}
                              placeholder="Informações adicionais sobre o cliente (endereço, preferências, etc.)"
                              rows={3}
                              className="transition-all focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                            />
                          </FormControl>
                          <FormMessage className="text-xs flex items-center gap-1">
                            {form.formState.errors.observacao && (
                              <AlertCircle className="h-3 w-3" />
                            )}
                          </FormMessage>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingCliente(null);
                      form.reset();
                      setManualCode(false);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>Salvando...</>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        {editingCliente ? "Atualizar Cliente" : "Salvar Cliente"}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-6 shadow-card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClientes.map((cliente) => (
          <Card key={cliente._id} className="p-6 bg-gradient-card hover:shadow-elegant transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{cliente.nome}</h3>
                  <p className="text-sm text-muted-foreground">{cliente.codigoCliente}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEdit(cliente)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(cliente._id)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Telefone:</span>
                <span className="font-medium">{cliente.telefone}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Nascimento:</span>
                <span className="font-medium">{new Date(cliente.dataNascimento).toLocaleDateString('pt-BR')}</span>
              </div>
              {cliente.observacao && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">{cliente.observacao}</p>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Clientes;