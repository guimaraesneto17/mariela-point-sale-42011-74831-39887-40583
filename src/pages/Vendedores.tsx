import { useState, useEffect } from "react";
import { Search, Plus, UserCheck, CheckCircle2, AlertCircle, Edit, Trash2, X, TrendingUp, DollarSign, RefreshCw } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { vendedorSchema } from "@/lib/validationSchemas";
import { maskPhone } from "@/lib/masks";
import { z } from "zod";
import { vendedoresAPI, recalculoAPI } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { AlertDeleteDialog } from "@/components/ui/alert-delete-dialog";

type VendedorFormData = z.infer<typeof vendedorSchema>;

const Vendedores = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingVendedor, setEditingVendedor] = useState<any>(null);
  const [manualCode, setManualCode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vendedorToDelete, setVendedorToDelete] = useState<string | null>(null);

  const form = useForm<VendedorFormData>({
    resolver: zodResolver(vendedorSchema),
    defaultValues: {
      codigoVendedor: "",
      nome: "",
      telefone: "",
      dataNascimento: "",
      ativo: true,
      metaMensal: undefined,
      vendasRealizadas: 0,
      totalVendido: 0,
      observacao: "",
    },
  });

  const [vendedores, setVendedores] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    loadVendedores();
  }, []);

  const loadVendedores = async () => {
    try {
      setIsLoadingData(true);
      const data = await vendedoresAPI.getAll();
      setVendedores(data);
    } catch (error) {
      toast.error("Erro ao carregar vendedores", {
        description: "Verifique se o servidor está rodando",
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const filteredVendedores = vendedores.filter(vendedor =>
    vendedor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendedor.codigoVendedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendedor.telefone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generateNextCode = () => {
    if (vendedores.length === 0) return "V001";
    const codes = vendedores.map(v => parseInt(v.codigoVendedor.replace("V", "")));
    const maxCode = Math.max(...codes);
    return `V${String(maxCode + 1).padStart(3, "0")}`;
  };

  const onSubmit = async (data: VendedorFormData) => {
    setIsLoading(true);
    try {
      // Limpar campos vazios antes de enviar
      const cleanData = {
        ...data,
        telefone: data.telefone || undefined,
        dataNascimento: data.dataNascimento || undefined,
        ativo: data.ativo ?? true,
        metaMensal: data.metaMensal || undefined,
        vendasRealizadas: data.vendasRealizadas ?? 0,
        totalVendido: data.totalVendido ?? 0,
        observacao: data.observacao || undefined,
      };

      if (editingVendedor) {
        await vendedoresAPI.update(editingVendedor.codigoVendedor, cleanData);
        toast.success("✅ Vendedor atualizado com sucesso!", {
          description: `${data.nome} foi atualizado no sistema`,
        });
      } else {
        await vendedoresAPI.create(cleanData);
        toast.success("✅ Vendedor cadastrado com sucesso!", {
          description: `${data.nome} foi adicionado ao sistema`,
        });
      }
      
      setIsDialogOpen(false);
      setEditingVendedor(null);
      form.reset();
      setManualCode(false);
      loadVendedores();
    } catch (error: any) {
      toast.error("❌ Erro ao salvar vendedor", {
        description: error.message || "Verifique sua conexão e tente novamente",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (vendedor: any) => {
    setEditingVendedor(vendedor);
    form.reset({
      codigoVendedor: vendedor.codigoVendedor,
      nome: vendedor.nome,
      telefone: vendedor.telefone,
      dataNascimento: vendedor.dataNascimento,
      ativo: vendedor.ativo ?? true,
      metaMensal: vendedor.metaMensal,
      vendasRealizadas: vendedor.vendasRealizadas ?? 0,
      totalVendido: vendedor.totalVendido ?? 0,
      observacao: vendedor.observacao || "",
    });
    setManualCode(true);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    setVendedorToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!vendedorToDelete) return;
    
    const vendedor = vendedores.find(v => v._id === vendedorToDelete);
    if (!vendedor) return;
    
    try {
      await vendedoresAPI.delete(vendedor.codigoVendedor);
      toast.success("Vendedor excluído com sucesso!");
      loadVendedores();
    } catch (error: any) {
      toast.error("Erro ao excluir vendedor", {
        description: error.message || "Tente novamente",
      });
    } finally {
      setDeleteDialogOpen(false);
      setVendedorToDelete(null);
    }
  };

  const handleOpenDialog = () => {
    setEditingVendedor(null);
    form.reset({
      codigoVendedor: generateNextCode(),
      nome: "",
      telefone: "",
      dataNascimento: "",
      ativo: true,
      metaMensal: undefined,
      vendasRealizadas: 0,
      totalVendido: 0,
      observacao: "",
    });
    setManualCode(false);
    setIsDialogOpen(true);
  };

  const handleRecalcularTotais = async () => {
    try {
      setIsLoadingData(true);
      toast.loading("Recalculando totais...");
      const result = await recalculoAPI.recalcularTotais();
      toast.dismiss();
      toast.success("Totais recalculados com sucesso!", {
        description: `${result.vendedoresAtualizados} vendedores atualizados`,
      });
      loadVendedores();
    } catch (error: any) {
      toast.dismiss();
      toast.error("Erro ao recalcular totais", {
        description: error.message || "Tente novamente",
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Vendedores</h1>
          <p className="text-muted-foreground">
            Gerenciamento de vendedores
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-sm">
              <UserCheck className="h-3 w-3 mr-1" />
              {vendedores.length} {vendedores.length === 1 ? 'vendedor cadastrado' : 'vendedores cadastrados'}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="gap-2" 
            onClick={handleRecalcularTotais}
            disabled={isLoadingData}
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingData ? 'animate-spin' : ''}`} />
            Recalcular Totais
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={handleOpenDialog}>
                <Plus className="h-4 w-4" />
                Novo Vendedor
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-background via-background to-primary/5">
            <DialogHeader className="pb-4 border-b border-border/50">
              <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                {editingVendedor ? "Editar Vendedor" : "Cadastrar Novo Vendedor"}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-base mt-2">
                {editingVendedor ? "Atualize as informações do vendedor" : "Preencha os dados do vendedor. Campos com * são obrigatórios."}
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card className="border-2 border-primary/10 bg-gradient-to-br from-card via-card to-primary/5 shadow-xl">
                  <CardContent className="pt-6 space-y-5">
                    <FormField
                      control={form.control}
                      name="codigoVendedor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-foreground">Código do Vendedor *</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="V001"
                                disabled={editingVendedor || !manualCode}
                                className="transition-all focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-70"
                              />
                            </FormControl>
                            {!editingVendedor && (
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                  setManualCode(!manualCode);
                                  if (manualCode) {
                                    form.setValue("codigoVendedor", generateNextCode());
                                  }
                                }}
                                className="shrink-0"
                              >
                                {manualCode ? <X className="h-4 w-4" /> : "✎"}
                              </Button>
                            )}
                          </div>
                          <FormMessage className="text-xs flex items-center gap-1">
                            {form.formState.errors.codigoVendedor && (
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FormField
                        control={form.control}
                        name="ativo"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between space-y-0 rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-sm font-semibold text-foreground">Status</FormLabel>
                              <p className="text-xs text-muted-foreground">
                                {field.value ? "Ativo no sistema" : "Inativo no sistema"}
                              </p>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="metaMensal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-foreground">Meta Mensal (R$)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field}
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                className="transition-all focus:ring-2 focus:ring-primary/30 focus:border-primary"
                              />
                            </FormControl>
                            <FormMessage className="text-xs flex items-center gap-1">
                              {form.formState.errors.metaMensal && (
                                <AlertCircle className="h-3 w-3" />
                              )}
                            </FormMessage>
                          </FormItem>
                        )}
                      />
                    </div>

                    {editingVendedor && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 bg-muted/30 rounded-lg border">
                        <FormField
                          control={form.control}
                          name="vendasRealizadas"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" />
                                Vendas Realizadas
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
                          name="totalVendido"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                Total Vendido (R$)
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
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name="observacao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-foreground">Observações</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field}
                              placeholder="Informações adicionais sobre o vendedor (experiência, horário, etc.)"
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
                      setEditingVendedor(null);
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
                        {editingVendedor ? "Atualizar Vendedor" : "Salvar Vendedor"}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        </div>
      </div>
      
      <Card className="p-4 md:p-6 shadow-card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar vendedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVendedores.map((vendedor) => (
          <Card key={vendedor._id} className="p-4 md:p-6 bg-gradient-card hover:shadow-elegant transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md">
                  <UserCheck className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{vendedor.nome}</h3>
                  <p className="text-sm text-muted-foreground">{vendedor.codigoVendedor}</p>
                  <Badge 
                    variant={vendedor.ativo ? "default" : "secondary"}
                    className="mt-1"
                  >
                    {vendedor.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEdit(vendedor)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(vendedor._id)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Telefone:</span>
                <span className="font-medium">{vendedor.telefone || "-"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Nascimento:</span>
                <span className="font-medium">{formatDate(vendedor.dataNascimento)}</span>
              </div>
              
              <div className="pt-2 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Vendas:
                  </span>
                  <span className="font-medium">{vendedor.vendasRealizadas || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Total Vendido:
                  </span>
                  <span className="font-medium">
                    R$ {(vendedor.totalVendido || 0).toFixed(2)}
                  </span>
                </div>
                {vendedor.metaMensal && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Meta Mensal:</span>
                    <span className="font-medium">R$ {vendedor.metaMensal.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {vendedor.observacao && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">{vendedor.observacao}</p>
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
        title="Confirmar exclusão de vendedor"
        description="Tem certeza que deseja excluir este vendedor? Esta ação não pode ser desfeita."
      />
    </div>
  );
};

export default Vendedores;
