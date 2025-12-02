import { useState, useEffect } from "react";
import { Search, Plus, Building, CheckCircle2, AlertCircle, Edit, Trash2, X } from "lucide-react";
import { FornecedoresSkeleton } from "@/components/FornecedoresSkeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { fornecedorSchema } from "@/lib/validationSchemas";
import { maskPhone, maskCNPJ, maskCEP, maskInstagram } from "@/lib/masks";
import { z } from "zod";
import { fornecedoresAPI } from "@/lib/api";
import { AlertDeleteDialog } from "@/components/ui/alert-delete-dialog";
import { PermissionGuard } from "@/components/PermissionGuard";
import { useFornecedores, useCreateFornecedor, useUpdateFornecedor, useDeleteFornecedor } from "@/hooks/useQueryCache";
import { RetryProgressIndicator } from "@/components/RetryProgressIndicator";

type FornecedorFormData = z.infer<typeof fornecedorSchema>;

const Fornecedores = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState<any>(null);
  const [manualCode, setManualCode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fornecedorToDelete, setFornecedorToDelete] = useState<string | null>(null);

  const form = useForm<FornecedorFormData>({
    resolver: zodResolver(fornecedorSchema),
    defaultValues: {
      codigoFornecedor: "",
      nome: "",
      telefone: "",
      cnpj: "",
      instagram: "",
      endereco: {
        rua: "",
        numero: "",
        bairro: "",
        cidade: "",
        estado: "",
        cep: "",
      },
      observacao: "",
    },
  });

  // React Query hooks com optimistic updates
  const { data: fornecedores = [], isLoading: isLoadingData, error, refetch } = useFornecedores();
  const createFornecedorMutation = useCreateFornecedor();
  const updateFornecedorMutation = useUpdateFornecedor();
  const deleteFornecedorMutation = useDeleteFornecedor();

  const filteredFornecedores = fornecedores.filter(fornecedor =>
    fornecedor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fornecedor.telefone.includes(searchTerm) ||
    fornecedor.codigoFornecedor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generateNextCode = () => {
    if (fornecedores.length === 0) return "F001";
    const codes = fornecedores.map(f => parseInt(f.codigoFornecedor.replace("F", "")));
    const maxCode = Math.max(...codes);
    return `F${String(maxCode + 1).padStart(3, "0")}`;
  };

  const onSubmit = async (data: FornecedorFormData) => {
    setIsLoading(true);
    try {
      // Limpar campos vazios do endereço antes de enviar
      const cleanData = {
        ...data,
        telefone: data.telefone || undefined,
        cnpj: data.cnpj || undefined,
        instagram: data.instagram || undefined,
        endereco: {
          rua: data.endereco.rua || undefined,
          numero: data.endereco.numero || undefined,
          bairro: data.endereco.bairro || undefined,
          cidade: data.endereco.cidade,
          estado: data.endereco.estado,
          cep: data.endereco.cep || undefined,
        },
        observacao: data.observacao || undefined,
      };

      if (editingFornecedor) {
        await updateFornecedorMutation.mutateAsync({
          id: editingFornecedor.codigoFornecedor,
          data: cleanData,
        });
        toast.success("✅ Fornecedor atualizado com sucesso!", {
          description: `${data.nome} foi atualizado no sistema`,
        });
      } else {
        await createFornecedorMutation.mutateAsync(cleanData);
        toast.success("✅ Fornecedor cadastrado com sucesso!", {
          description: `${data.nome} foi adicionado ao sistema`,
        });
      }
      
      setIsDialogOpen(false);
      setEditingFornecedor(null);
      form.reset();
      setManualCode(false);
    } catch (error: any) {
      toast.error("❌ Erro ao salvar fornecedor", {
        description: error.message || "Verifique sua conexão e tente novamente",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (fornecedor: any) => {
    setEditingFornecedor(fornecedor);
    form.reset({
      codigoFornecedor: fornecedor.codigoFornecedor,
      nome: fornecedor.nome,
      telefone: fornecedor.telefone,
      cnpj: fornecedor.cnpj,
      instagram: fornecedor.instagram,
      endereco: fornecedor.endereco || {
        rua: "",
        numero: "",
        bairro: "",
        cidade: "",
        estado: "",
        cep: "",
      },
      observacao: fornecedor.observacao || "",
    });
    setManualCode(true);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    setFornecedorToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!fornecedorToDelete) return;
    
    const fornecedor = fornecedores.find((f: any) => f._id === fornecedorToDelete);
    if (!fornecedor) return;
    
    try {
      await deleteFornecedorMutation.mutateAsync(fornecedor.codigoFornecedor);
      toast.success("Fornecedor excluído com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao excluir fornecedor", {
        description: error.message || "Tente novamente",
      });
    } finally {
      setDeleteDialogOpen(false);
      setFornecedorToDelete(null);
    }
  };

  const handleOpenDialog = () => {
    setEditingFornecedor(null);
    form.reset({
      codigoFornecedor: generateNextCode(),
      nome: "",
      telefone: "",
      cnpj: "",
      instagram: "",
      endereco: {
        rua: "",
        numero: "",
        bairro: "",
        cidade: "",
        estado: "",
        cep: "",
      },
      observacao: "",
    });
    setManualCode(false);
    setIsDialogOpen(true);
  };

  if (isLoadingData) {
    return <FornecedoresSkeleton />;
  }

  return (
    <>
      <RetryProgressIndicator
        isRetrying={createFornecedorMutation.isPending || updateFornecedorMutation.isPending || deleteFornecedorMutation.isPending}
        retryAttempt={1}
        maxRetries={3}
        error={error?.message}
        onRetry={() => refetch()}
      />
      <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Fornecedores</h1>
          <p className="text-muted-foreground">
            Gerenciamento de fornecedores
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-sm">
              <Building className="h-3 w-3 mr-1" />
              {fornecedores.length} {fornecedores.length === 1 ? 'fornecedor cadastrado' : 'fornecedores cadastrados'}
            </Badge>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={handleOpenDialog}>
              <Plus className="h-4 w-4" />
              Novo Fornecedor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-background via-background to-primary/5">
            <DialogHeader className="pb-4 border-b border-border/50">
              <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                {editingFornecedor ? "Editar Fornecedor" : "Cadastrar Novo Fornecedor"}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-base mt-2">
                {editingFornecedor ? "Atualize as informações do fornecedor" : "Preencha os dados do fornecedor. Campos com * são obrigatórios."}
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card className="border-2 border-primary/10 bg-gradient-to-br from-card via-card to-primary/5 shadow-xl">
                  <CardContent className="pt-6 space-y-5">
                    <FormField
                      control={form.control}
                      name="codigoFornecedor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-foreground">Código do Fornecedor *</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="F001"
                                disabled={editingFornecedor || !manualCode}
                                className="transition-all focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-70"
                              />
                            </FormControl>
                            {!editingFornecedor && (
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                  setManualCode(!manualCode);
                                  if (manualCode) {
                                    form.setValue("codigoFornecedor", generateNextCode());
                                  }
                                }}
                                className="shrink-0"
                              >
                                {manualCode ? <X className="h-4 w-4" /> : "✎"}
                              </Button>
                            )}
                          </div>
                          <FormMessage className="text-xs flex items-center gap-1">
                            {form.formState.errors.codigoFornecedor && (
                              <AlertCircle className="h-3 w-3" />
                            )}
                          </FormMessage>
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FormField
                        control={form.control}
                        name="nome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-foreground">Nome do Fornecedor *</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="Digite o nome da empresa"
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

                      <FormField
                        control={form.control}
                        name="cnpj"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-foreground">CNPJ</FormLabel>
                            <FormControl>
                              <Input 
                                {...field}
                                placeholder="99.999.999/9999-99"
                                onChange={(e) => field.onChange(maskCNPJ(e.target.value))}
                                className="transition-all focus:ring-2 focus:ring-primary/30 focus:border-primary"
                              />
                            </FormControl>
                            <FormMessage className="text-xs flex items-center gap-1">
                              {form.formState.errors.cnpj && (
                                <AlertCircle className="h-3 w-3" />
                              )}
                            </FormMessage>
                          </FormItem>
                        )}
                      />

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

                      <FormField
                        control={form.control}
                        name="instagram"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-foreground">Instagram</FormLabel>
                            <FormControl>
                              <Input 
                                {...field}
                                placeholder="@fornecedor"
                                onChange={(e) => field.onChange(maskInstagram(e.target.value))}
                                className="transition-all focus:ring-2 focus:ring-primary/30 focus:border-primary"
                              />
                            </FormControl>
                            <FormMessage className="text-xs flex items-center gap-1">
                              {form.formState.errors.instagram && (
                                <AlertCircle className="h-3 w-3" />
                              )}
                            </FormMessage>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="pt-4 border-t">
                      <h3 className="text-lg font-semibold mb-4">Endereço</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="endereco.rua"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold">Rua</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="Nome da rua"
                                  className="transition-all focus:ring-2 focus:ring-primary/30"
                                />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="endereco.numero"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold">Número</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="Número"
                                  className="transition-all focus:ring-2 focus:ring-primary/30"
                                />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="endereco.bairro"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold">Bairro</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="Bairro"
                                  className="transition-all focus:ring-2 focus:ring-primary/30"
                                />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="endereco.cidade"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold">Cidade *</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="Cidade"
                                  className="transition-all focus:ring-2 focus:ring-primary/30"
                                />
                              </FormControl>
                              <FormMessage className="text-xs flex items-center gap-1">
                                {form.formState.errors.endereco?.cidade && (
                                  <AlertCircle className="h-3 w-3" />
                                )}
                              </FormMessage>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="endereco.estado"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold">Estado (UF) *</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field}
                                  placeholder="SP"
                                  maxLength={2}
                                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                  className="transition-all focus:ring-2 focus:ring-primary/30"
                                />
                              </FormControl>
                              <FormMessage className="text-xs flex items-center gap-1">
                                {form.formState.errors.endereco?.estado && (
                                  <AlertCircle className="h-3 w-3" />
                                )}
                              </FormMessage>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="endereco.cep"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold">CEP</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field}
                                  placeholder="99999-999"
                                  onChange={(e) => field.onChange(maskCEP(e.target.value))}
                                  className="transition-all focus:ring-2 focus:ring-primary/30"
                                />
                              </FormControl>
                              <FormMessage className="text-xs flex items-center gap-1">
                                {form.formState.errors.endereco?.cep && (
                                  <AlertCircle className="h-3 w-3" />
                                )}
                              </FormMessage>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="observacao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-foreground">Observações</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field}
                              placeholder="Informações adicionais (políticas de entrega, pagamento, etc.)"
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
                      setEditingFornecedor(null);
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
                        {editingFornecedor ? "Atualizar Fornecedor" : "Salvar Fornecedor"}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card className="p-4 md:p-6 shadow-card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            placeholder="Buscar por nome, CNPJ ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFornecedores.map((fornecedor) => (
          <Card key={fornecedor._id} className="p-4 md:p-6 bg-gradient-card hover:shadow-elegant transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                  <Building className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{fornecedor.nome}</h3>
                  <p className="text-sm text-muted-foreground">{fornecedor.codigoFornecedor}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEdit(fornecedor)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(fornecedor._id)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm">
                <span className="text-muted-foreground">CNPJ:</span> {fornecedor.cnpj}
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Telefone:</span> {fornecedor.telefone}
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Instagram:</span> {fornecedor.instagram}
              </div>
              {fornecedor.observacao && (
                <div className="text-sm pt-2 border-t">
                  <span className="text-muted-foreground font-semibold">Observação:</span>
                  <p className="mt-1 text-foreground">{fornecedor.observacao}</p>
                </div>
              )}
              {fornecedor.endereco && (
                <div className="text-sm text-muted-foreground pt-2 border-t">
                  {[
                    fornecedor.endereco.rua && `${fornecedor.endereco.rua}${fornecedor.endereco.numero ? `, ${fornecedor.endereco.numero}` : ''}`,
                    fornecedor.endereco.bairro,
                    fornecedor.endereco.cidade && fornecedor.endereco.estado ? `${fornecedor.endereco.cidade} - ${fornecedor.endereco.estado}` : fornecedor.endereco.cidade || fornecedor.endereco.estado,
                    fornecedor.endereco.cep
                  ].filter(Boolean).join(' • ')}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <AlertDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Confirmar exclusão de fornecedor"
        description="Tem certeza que deseja excluir este fornecedor? Esta ação não pode ser desfeita."
      />
      </div>
    </>
  );
};

export default Fornecedores;
