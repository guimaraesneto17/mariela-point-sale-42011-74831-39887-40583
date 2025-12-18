import { useState, useEffect } from "react";
import { Search, Plus, User, CheckCircle2, AlertCircle, Edit, Trash2, X, ShoppingCart, DollarSign, Calendar, RefreshCw, Cake, MessageCircle } from "lucide-react";
import { ClientesSkeleton } from "@/components/ClientesSkeleton";
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
import { clienteSchema } from "@/lib/validationSchemas";
import { maskPhone } from "@/lib/masks";
import { z } from "zod";
import { clientesAPI, recalculoAPI } from "@/lib/api";
import { fetchAllPages } from "@/lib/pagination";
import { formatDate } from "@/lib/utils";
import { AlertDeleteDialog } from "@/components/ui/alert-delete-dialog";
import { AniversariantesDialog } from "@/components/AniversariantesDialog";
import { MensagemPersonalizadaDialog } from "@/components/MensagemPersonalizadaDialog";
import { PermissionGuard } from "@/components/PermissionGuard";
import { useCreateCliente, useUpdateCliente, useDeleteCliente } from "@/hooks/useQueryCache";
import { RetryProgressIndicator } from "@/components/RetryProgressIndicator";
import { PaginationControls } from "@/components/PaginationControls";
import { useDebounce } from "@/hooks/useDebounce";
import { usePersistedLimit } from "@/hooks/usePersistedLimit";

type ClienteFormData = z.infer<typeof clienteSchema>;

const Clientes = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingCliente, setEditingCliente] = useState<any>(null);
  const [manualCode, setManualCode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState<string | null>(null);
  const [aniversariantesDialogOpen, setAniversariantesDialogOpen] = useState(false);
  const [mensagemDialogOpen, setMensagemDialogOpen] = useState(false);
  const [clienteParaMensagem, setClienteParaMensagem] = useState<any>(null);
  
  // Estados de paginação
  const [clientes, setClientes] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [loadMode, setLoadMode] = useState<'paginated' | 'all'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalServer, setTotalServer] = useState<number | undefined>(undefined);
  const [error, setError] = useState<any>(null);
  const { limit, setLimit } = usePersistedLimit('clientes');
  
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  const form = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      codigoCliente: "",
      nome: "",
      telefone: "",
      dataNascimento: "",
      valorTotalComprado: 0,
      quantidadeCompras: 0,
      dataUltimaCompra: undefined,
      observacao: "",
    },
  });

  const createClienteMutation = useCreateCliente();
  const updateClienteMutation = useUpdateCliente();
  const deleteClienteMutation = useDeleteCliente();

  useEffect(() => {
    loadClientes(1, true);
  }, []);

  useEffect(() => {
    if (loadMode === 'paginated') {
      loadClientes(1, true);
    }
  }, [debouncedSearchTerm, loadMode]);

  const loadClientes = async (pageNum: number = 1, reset: boolean = false) => {
    try {
      if (reset) {
        setIsLoadingData(true);
        setClientes([]);
        setPage(1);
      }

      if (loadMode === 'all') {
        const { items, pagination } = await fetchAllPages<any>((p, lim) => clientesAPI.getAll(p, lim), { limit: limit });
        setClientes(items);
        setTotalServer(pagination?.total || items.length);
        setTotalPages(1);
        setPage(1);
      } else {
        const searchParam = debouncedSearchTerm || undefined;
        const response = await clientesAPI.getAll(pageNum, limit, searchParam);
        const data = response.data || response;
        const pagination = response.pagination;

        setClientes(Array.isArray(data) ? data : []);
        setTotalServer(pagination?.total);
        setTotalPages(pagination?.pages || 1);
        setPage(pageNum);
      }
    } catch (err: any) {
      setError(err);
      toast.error("Erro ao carregar clientes");
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleToggleLoadMode = () => {
    const newMode = loadMode === 'paginated' ? 'all' : 'paginated';
    setLoadMode(newMode);
    setClientes([]);
    setPage(1);
    setTimeout(() => loadClientes(1, true), 0);
  };

  const handlePageChange = (newPage: number) => {
    loadClientes(newPage, true);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
    setTimeout(() => loadClientes(1, true), 0);
  };

  const refetch = () => loadClientes(page, true);

  const filteredClientes = loadMode === 'paginated' && debouncedSearchTerm
    ? clientes
    : clientes.filter(cliente =>
        cliente.nome.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        cliente.telefone?.includes(debouncedSearchTerm)
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
      // Limpar campos vazios antes de enviar
      const cleanData = {
        ...data,
        telefone: data.telefone || undefined,
        dataNascimento: data.dataNascimento || undefined,
        valorTotalComprado: data.valorTotalComprado ?? 0,
        quantidadeCompras: data.quantidadeCompras ?? 0,
        dataUltimaCompra: data.dataUltimaCompra || undefined,
        observacao: data.observacao || undefined,
      };

      if (editingCliente) {
        await updateClienteMutation.mutateAsync({
          id: editingCliente.codigoCliente,
          data: cleanData,
        });
        toast.success("✅ Cliente atualizado com sucesso!", {
          description: `${data.nome} foi atualizado no sistema`,
        });
      } else {
        await createClienteMutation.mutateAsync(cleanData);
        toast.success("✅ Cliente cadastrado com sucesso!", {
          description: `${data.nome} foi adicionado ao sistema`,
        });
      }
      
      setIsDialogOpen(false);
      setEditingCliente(null);
      form.reset();
      setManualCode(false);
    } catch (error: any) {
      toast.error("❌ Erro ao salvar cliente", {
        description: error.message || "Verifique sua conexão e tente novamente",
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
      valorTotalComprado: cliente.valorTotalComprado ?? 0,
      quantidadeCompras: cliente.quantidadeCompras ?? 0,
      dataUltimaCompra: cliente.dataUltimaCompra ? new Date(cliente.dataUltimaCompra).toISOString().split('T')[0] : undefined,
      observacao: cliente.observacao || "",
    });
    setManualCode(true);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    setClienteToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!clienteToDelete) return;
    
    const cliente = clientes.find((c: any) => c._id === clienteToDelete);
    if (!cliente) return;
    
    try {
      await deleteClienteMutation.mutateAsync(cliente.codigoCliente);
      toast.success("Cliente excluído com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao excluir cliente", {
        description: error.message || "Tente novamente",
      });
    } finally {
      setDeleteDialogOpen(false);
      setClienteToDelete(null);
    }
  };

  const handleOpenDialog = () => {
    setEditingCliente(null);
    form.reset({
      codigoCliente: generateNextCode(),
      nome: "",
      telefone: "",
      dataNascimento: "",
      valorTotalComprado: 0,
      quantidadeCompras: 0,
      dataUltimaCompra: undefined,
      observacao: "",
    });
    setManualCode(false);
    setIsDialogOpen(true);
  };

  const handleRecalcularTotais = async () => {
    try {
      toast.loading("Recalculando totais...");
      const result = await recalculoAPI.recalcularTotais();
      toast.dismiss();
      toast.success("Totais recalculados com sucesso!", {
        description: `${result.clientesAtualizados} clientes atualizados`,
      });
      refetch();
    } catch (error: any) {
      toast.dismiss();
      toast.error("Erro ao recalcular totais", {
        description: error.message || "Tente novamente",
      });
    }
  };

  if (isLoadingData) {
    return <ClientesSkeleton />;
  }

  return (
    <>
      <RetryProgressIndicator
        isRetrying={createClienteMutation.isPending || updateClienteMutation.isPending || deleteClienteMutation.isPending}
        retryAttempt={1}
        maxRetries={3}
        error={error?.message}
        onRetry={() => refetch()}
      />
      <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Clientes</h1>
          <p className="text-muted-foreground">
            Gerenciamento de clientes
          </p>
          <PaginationControls
            totalLocal={filteredClientes.length}
            totalServer={totalServer}
            loadMode={loadMode}
            onToggleMode={handleToggleLoadMode}
            isLoading={isLoadingData}
            entityName="cliente cadastrado"
            entityNamePlural="clientes cadastrados"
            icon={<User className="h-3 w-3 mr-1" />}
            currentPage={page}
            totalPages={totalPages}
            limit={limit}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
          />
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="gap-2 bg-gradient-to-br from-background to-primary/5 border-primary/20 hover:border-primary/40" 
            onClick={() => setAniversariantesDialogOpen(true)}
          >
            <Cake className="h-4 w-4" />
            Mensagens de Aniversário
          </Button>
          <PermissionGuard module="clientes" action="edit">
            <Button 
              variant="outline" 
              className="gap-2" 
              onClick={handleRecalcularTotais}
              disabled={isLoadingData}
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingData ? 'animate-spin' : ''}`} />
              Recalcular Totais
            </Button>
          </PermissionGuard>
          <PermissionGuard module="clientes" action="create">
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

                    {/* Estatísticas do Cliente (somente leitura) */}
                    {editingCliente && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-4 bg-muted/30 rounded-lg border">
                        <FormField
                          control={form.control}
                          name="quantidadeCompras"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <ShoppingCart className="h-4 w-4" />
                                Compras Realizadas
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  {...field}
                                  type="number"
                                  value={field.value ?? 0}
                                  disabled
                                  className="bg-muted"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="valorTotalComprado"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                Total Comprado (R$)
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  {...field}
                                  type="number"
                                  step="0.01"
                                  value={field.value ?? 0}
                                  disabled
                                  className="bg-muted"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="dataUltimaCompra"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Última Compra
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  {...field}
                                  type="date"
                                  value={field.value || ""}
                                  disabled
                                  className="bg-muted"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

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
        </PermissionGuard>
        </div>
      </div>

      <Card className="p-4 md:p-6 shadow-card">
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
          <Card key={cliente._id} className="p-4 md:p-6 bg-gradient-card hover:shadow-elegant transition-all">
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
                  onClick={() => {
                    setClienteParaMensagem(cliente);
                    setMensagemDialogOpen(true);
                  }}
                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                  title="Enviar mensagem"
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
                <PermissionGuard module="clientes" action="edit">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(cliente)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </PermissionGuard>
                <PermissionGuard module="clientes" action="delete">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(cliente._id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </PermissionGuard>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Telefone:</span>
                <span className="font-medium">{cliente.telefone || "-"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Nascimento:</span>
                <span className="font-medium">{formatDate(cliente.dataNascimento)}</span>
              </div>
              
              <div className="pt-2 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <ShoppingCart className="h-3 w-3" />
                    Compras:
                  </span>
                  <span className="font-medium">{cliente.quantidadeCompras || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Total Comprado:
                  </span>
                  <span className="font-medium">
                    R$ {(cliente.valorTotalComprado || 0).toFixed(2)}
                  </span>
                </div>
                {cliente.dataUltimaCompra && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Última Compra:
                    </span>
                    <span className="font-medium">{formatDate(cliente.dataUltimaCompra)}</span>
                  </div>
                )}
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

      <AlertDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Confirmar exclusão de cliente"
        description="Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita."
      />

      <AniversariantesDialog
        open={aniversariantesDialogOpen}
        onOpenChange={setAniversariantesDialogOpen}
        clientes={clientes}
      />
      
      <MensagemPersonalizadaDialog
        open={mensagemDialogOpen}
        onOpenChange={setMensagemDialogOpen}
        cliente={clienteParaMensagem}
      />
      </div>
    </>
  );
};

export default Clientes;
