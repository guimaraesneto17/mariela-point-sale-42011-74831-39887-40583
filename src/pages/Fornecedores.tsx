import { useState } from "react";
import { Search, Plus, Building, CheckCircle2, AlertCircle, Edit, Trash2, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { fornecedorSchema } from "@/lib/validationSchemas";
import { maskPhone, maskCNPJ, maskCEP, maskInstagram } from "@/lib/masks";
import { z } from "zod";

type FornecedorFormData = z.infer<typeof fornecedorSchema>;

const Fornecedores = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState<any>(null);
  const [manualCode, setManualCode] = useState(false);

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

  const [fornecedores] = useState([
    {
      _id: "1",
      codigoFornecedor: "F001",
      nome: "Confecções Silva Ltda",
      cnpj: "12.345.678/0001-90",
      telefone: "(11) 3456-7890",
      email: "contato@confeccoessilva.com.br",
      endereco: "Rua das Confecções, 100 - Brás, São Paulo/SP",
      instagram: "@confeccoessilva"
    },
    {
      _id: "2",
      codigoFornecedor: "F002",
      nome: "Moda Prime Atacado",
      cnpj: "23.456.789/0001-81",
      telefone: "(21) 2345-6789",
      email: "vendas@modaprime.com.br",
      endereco: "Av. Brasil, 500 - Centro, Rio de Janeiro/RJ",
      instagram: "@modaprimerio"
    },
  ]);

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
      const response = await fetch("http://localhost:3000/api/fornecedores", {
        method: editingFornecedor ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          _id: editingFornecedor?._id,
          dataCadastro: editingFornecedor?.dataCadastro || new Date().toISOString(),
        }),
      });

      if (response.ok) {
        toast.success(editingFornecedor ? "✅ Fornecedor atualizado com sucesso!" : "✅ Fornecedor cadastrado com sucesso!", {
          description: `${data.nome} foi ${editingFornecedor ? "atualizado" : "adicionado"} ao sistema`,
        });
        setIsDialogOpen(false);
        setEditingFornecedor(null);
        form.reset();
        setManualCode(false);
      } else {
        const error = await response.json();
        toast.error("❌ Erro ao salvar fornecedor", {
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

  const handleEdit = (fornecedor: any) => {
    setEditingFornecedor(fornecedor);
    form.reset({
      codigoFornecedor: fornecedor.codigoFornecedor,
      nome: fornecedor.nome,
      telefone: fornecedor.telefone,
      cnpj: fornecedor.cnpj,
      instagram: fornecedor.instagram,
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
    setManualCode(true);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este fornecedor?")) {
      toast.success("Fornecedor excluído com sucesso!");
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Fornecedores</h1>
          <p className="text-muted-foreground">
            Gerenciamento de fornecedores
          </p>
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
      
      <Card className="p-6 shadow-card">
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
          <Card key={fornecedor._id} className="p-6 bg-gradient-card hover:shadow-elegant transition-all">
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
              <div className="text-sm text-muted-foreground pt-2 border-t">
                {fornecedor.endereco}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Fornecedores;