import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, CheckCircle2, AlertCircle, Package, Edit, Trash2, X, PackagePlus, Building } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { produtoSchema } from "@/lib/validationSchemas";
import { z } from "zod";
import { produtosAPI, fornecedoresAPI, estoqueAPI } from "@/lib/api";
import { AddToStockDialog } from "@/components/AddToStockDialog";
import { AlertDeleteDialog } from "@/components/ui/alert-delete-dialog";
import { CurrencyInput } from "@/components/ui/currency-input";
import { PermissionGuard } from "@/components/PermissionGuard";

type ProdutoFormData = z.infer<typeof produtoSchema>;

const Produtos = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("todas");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [manualCode, setManualCode] = useState(false);
  const [showAddToStockDialog, setShowAddToStockDialog] = useState(false);
  const [selectedProductForStock, setSelectedProductForStock] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const form = useForm<ProdutoFormData>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      codigoProduto: "",
      nome: "",
      descricao: "",
      categoria: "Outro",
      precoCusto: undefined,
      precoVenda: undefined,
      margemDeLucro: undefined,
      fornecedor: null,
    },
  });

  const [produtos, setProdutos] = useState<any[]>([]);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [estoque, setEstoque] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    loadProdutos();
    loadFornecedores();
    loadEstoque();
  }, []);

  const loadProdutos = async () => {
    try {
      setIsLoadingData(true);
      const data = await produtosAPI.getAll();
      setProdutos(data);
    } catch (error) {
      toast.error("Erro ao carregar produtos", {
        description: "Verifique se o servidor está rodando",
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadFornecedores = async () => {
    try {
      const data = await fornecedoresAPI.getAll();
      setFornecedores(data);
    } catch (error) {
      console.error("Erro ao carregar fornecedores", error);
    }
  };

  const loadEstoque = async () => {
    try {
      const data = await estoqueAPI.getAll();
      setEstoque(data);
    } catch (error) {
      console.error("Erro ao carregar estoque", error);
    }
  };

  const filteredProdutos = produtos.filter(produto => {
    const matchesSearch = produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produto.codigoProduto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (produto.fornecedor?.nome && produto.fornecedor.nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (produto.fornecedor?.codigoFornecedor && produto.fornecedor.codigoFornecedor.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const categoria = typeof produto.categoria === 'string' ? produto.categoria : produto.categoria?.nome;
    const matchesCategoria = categoriaFiltro === "todas" || categoria === categoriaFiltro;
    
    return matchesSearch && matchesCategoria;
  });

  const generateNextCode = () => {
    if (produtos.length === 0) return "P001";
    const codes = produtos.map(p => parseInt(p.codigoProduto.replace("P", "")));
    const maxCode = Math.max(...codes);
    return `P${String(maxCode + 1).padStart(3, "0")}`;
  };

  const precoCusto = form.watch("precoCusto") || 0;
  const precoVenda = form.watch("precoVenda") || 0;
  const margemDeLucro = form.watch("margemDeLucro") || 0;

  const handlePrecoCustoChange = (value: number) => {
    form.setValue("precoCusto", value);
    if (margemDeLucro > 0) {
      const novoPrecoVenda = value * (1 + margemDeLucro / 100);
      form.setValue("precoVenda", parseFloat(novoPrecoVenda.toFixed(2)));
    }
  };

  const handlePrecoVendaChange = (value: number) => {
    form.setValue("precoVenda", value);
    if (precoCusto > 0) {
      const novaMargem = ((value - precoCusto) / precoCusto) * 100;
      form.setValue("margemDeLucro", parseFloat(novaMargem.toFixed(2)));
    }
  };

  const handleMargemDeLucroChange = (value: number) => {
    form.setValue("margemDeLucro", value);
    if (precoCusto > 0) {
      const novoPrecoVenda = precoCusto * (1 + value / 100);
      form.setValue("precoVenda", parseFloat(novoPrecoVenda.toFixed(2)));
    }
  };

  const onSubmit = async (data: ProdutoFormData) => {
    setIsLoading(true);
    try {
      const produtoData = {
        codigoProduto: data.codigoProduto,
        nome: data.nome,
        descricao: data.descricao,
        categoria: data.categoria,
        precoCusto: data.precoCusto,
        precoVenda: data.precoVenda,
        margemDeLucro: data.margemDeLucro,
        fornecedor: data.fornecedor || null,
      };

      if (editingProduct) {
        await produtosAPI.update(editingProduct.codigoProduto, produtoData);
        toast.success("✅ Produto atualizado com sucesso!", {
          description: `${data.nome} foi atualizado no sistema`,
        });
      } else {
        await produtosAPI.create(produtoData);
        toast.success("✅ Produto cadastrado com sucesso!", {
          description: `${data.nome} foi adicionado ao sistema`,
        });
      }
      
      setIsDialogOpen(false);
      setEditingProduct(null);
      form.reset();
      setManualCode(false);
      loadProdutos();
    } catch (error: any) {
      toast.error("❌ Erro ao salvar produto", {
        description: error.message || "Verifique sua conexão e tente novamente",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    
    form.reset({
      codigoProduto: product.codigoProduto,
      nome: product.nome,
      descricao: product.descricao,
      categoria: product.categoria,
      precoCusto: product.precoCusto,
      precoVenda: product.precoVenda,
      margemDeLucro: product.margemDeLucro,
      fornecedor: product.fornecedor || null,
    });
    
    setManualCode(true);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    setProductToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    
    const produto = produtos.find(p => p._id === productToDelete);
    if (!produto) return;
    
    try {
      await produtosAPI.delete(produto.codigoProduto);
      toast.success("Produto excluído com sucesso!");
      loadProdutos();
    } catch (error: any) {
      toast.error("Erro ao excluir produto", {
        description: error.message || "Tente novamente",
      });
    } finally {
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const handleOpenDialog = () => {
    setEditingProduct(null);
    form.reset({
      codigoProduto: generateNextCode(),
      nome: "",
      descricao: "",
      categoria: "Outro",
      precoCusto: undefined,
      precoVenda: undefined,
      margemDeLucro: undefined,
      fornecedor: null,
    });
    setManualCode(false);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Produtos</h1>
          <p className="text-muted-foreground">
            Catálogo e gerenciamento de produtos
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-sm">
              <Package className="h-3 w-3 mr-1" />
              {produtos.length} {produtos.length === 1 ? 'produto cadastrado' : 'produtos cadastrados'}
            </Badge>
          </div>
        </div>
        <PermissionGuard module="produtos" action="create">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={handleOpenDialog}>
                <Plus className="h-4 w-4" />
                Novo Produto
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-background via-background to-primary/5">
            <DialogHeader className="pb-4 border-b border-border/50">
              <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                {editingProduct ? "Editar Produto" : "Cadastrar Novo Produto"}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-base mt-2">
                {editingProduct ? "Atualize as informações do produto" : "Preencha os dados do produto. Campos com * são obrigatórios."}
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card className="border-2 border-primary/10 bg-gradient-to-br from-card via-card to-primary/5 shadow-xl">
                  <CardContent className="pt-6 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FormField
                        control={form.control}
                        name="codigoProduto"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-foreground">Código do Produto *</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="P001"
                                  disabled={editingProduct || !manualCode}
                                  className="transition-all focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-70"
                                />
                              </FormControl>
                              {!editingProduct && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() => {
                                    setManualCode(!manualCode);
                                    if (manualCode) {
                                      form.setValue("codigoProduto", generateNextCode());
                                    }
                                  }}
                                  className="shrink-0"
                                >
                                  {manualCode ? <X className="h-4 w-4" /> : "✎"}
                                </Button>
                              )}
                            </div>
                            <FormMessage className="text-xs flex items-center gap-1">
                              {form.formState.errors.codigoProduto && (
                                <AlertCircle className="h-3 w-3" />
                              )}
                            </FormMessage>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="nome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-foreground">Nome do Produto *</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="Digite o nome do produto"
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
                    </div>

                    <FormField
                      control={form.control}
                      name="descricao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-foreground">Descrição</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field}
                              placeholder="Descrição detalhada do produto (opcional)"
                              rows={3}
                              className="transition-all focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                            />
                          </FormControl>
                          <FormMessage className="text-xs flex items-center gap-1">
                            {form.formState.errors.descricao && (
                              <AlertCircle className="h-3 w-3" />
                            )}
                          </FormMessage>
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FormField
                        control={form.control}
                        name="categoria"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-foreground">Categoria *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/30">
                                  <SelectValue placeholder="Selecione uma categoria" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Calça">Calça</SelectItem>
                                <SelectItem value="Saia">Saia</SelectItem>
                                <SelectItem value="Vestido">Vestido</SelectItem>
                                <SelectItem value="Blusa">Blusa</SelectItem>
                                <SelectItem value="Bolsa">Bolsa</SelectItem>
                                <SelectItem value="Acessório">Acessório</SelectItem>
                                <SelectItem value="Short-Saia">Short-Saia</SelectItem>
                                <SelectItem value="Short">Short</SelectItem>
                                <SelectItem value="Conjunto">Conjunto</SelectItem>
                                <SelectItem value="Outro">Outro</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-xs flex items-center gap-1">
                              {form.formState.errors.categoria && (
                                <AlertCircle className="h-3 w-3" />
                              )}
                            </FormMessage>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="fornecedor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-foreground">Fornecedor (Opcional)</FormLabel>
                            <Select 
                              onValueChange={(value) => {
                                if (value === "none") {
                                  field.onChange(null);
                                } else {
                                  const fornecedor = fornecedores.find(f => f.codigoFornecedor === value);
                                  if (fornecedor) {
                                    field.onChange({
                                      codigoFornecedor: fornecedor.codigoFornecedor,
                                      nome: fornecedor.nome,
                                    });
                                  }
                                }
                              }}
                              value={field.value?.codigoFornecedor || "none"}
                            >
                              <FormControl>
                                <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/30">
                                  <SelectValue placeholder="Selecione um fornecedor" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">Sem fornecedor</SelectItem>
                                {fornecedores.map((fornecedor) => (
                                  <SelectItem key={fornecedor.codigoFornecedor} value={fornecedor.codigoFornecedor}>
                                    {fornecedor.nome} ({fornecedor.codigoFornecedor})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-xs flex items-center gap-1">
                              {form.formState.errors.fornecedor && (
                                <AlertCircle className="h-3 w-3" />
                              )}
                            </FormMessage>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <FormField
                        control={form.control}
                        name="precoCusto"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-foreground flex items-center gap-2">
                              Preço de Custo *
                            </FormLabel>
                            <FormControl>
                              <CurrencyInput 
                                value={field.value}
                                onValueChange={(value) => handlePrecoCustoChange(parseFloat(value) || 0)}
                                placeholder="R$ 0,00"
                                min={0}
                                max={999999}
                                className="transition-all focus:ring-2 focus:ring-primary/30 focus:border-primary"
                              />
                            </FormControl>
                            <FormMessage className="text-xs flex items-center gap-1">
                              {form.formState.errors.precoCusto && (
                                <AlertCircle className="h-3 w-3" />
                              )}
                            </FormMessage>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="precoVenda"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-foreground flex items-center gap-2">
                              Preço de Venda *
                            </FormLabel>
                            <FormControl>
                              <CurrencyInput 
                                value={field.value}
                                onValueChange={(value) => handlePrecoVendaChange(parseFloat(value) || 0)}
                                placeholder="R$ 0,00"
                                min={0}
                                max={999999}
                                className="transition-all focus:ring-2 focus:ring-primary/30 focus:border-primary"
                              />
                            </FormControl>
                            <FormMessage className="text-xs flex items-center gap-1">
                              {form.formState.errors.precoVenda && (
                                <AlertCircle className="h-3 w-3" />
                              )}
                            </FormMessage>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="margemDeLucro"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-foreground flex items-center gap-2">
                              Margem de Lucro *
                              <span className="text-xs text-muted-foreground font-normal">(%)</span>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                {...field}
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={field.value ?? ''}
                                onChange={(e) => handleMargemDeLucroChange(parseFloat(e.target.value) || 0)}
                                className="transition-all focus:ring-2 focus:ring-primary/30 focus:border-primary"
                              />
                            </FormControl>
                            <FormMessage className="text-xs flex items-center gap-1">
                              {form.formState.errors.margemDeLucro && (
                                <AlertCircle className="h-3 w-3" />
                              )}
                            </FormMessage>
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingProduct(null);
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
                        {editingProduct ? "Atualizar Produto" : "Salvar Produto"}
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

      <Card className="p-4 md:p-6 shadow-card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              placeholder="Buscar por código, nome ou fornecedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="w-full md:w-64">
            <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as Categorias</SelectItem>
                <SelectItem value="Calça">Calça</SelectItem>
                <SelectItem value="Saia">Saia</SelectItem>
                <SelectItem value="Vestido">Vestido</SelectItem>
                <SelectItem value="Blusa">Blusa</SelectItem>
                <SelectItem value="Bolsa">Bolsa</SelectItem>
                <SelectItem value="Acessório">Acessório</SelectItem>
                <SelectItem value="Short-Saia">Short-Saia</SelectItem>
                <SelectItem value="Short">Short</SelectItem>
                <SelectItem value="Conjunto">Conjunto</SelectItem>
                <SelectItem value="Outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProdutos.map((produto) => (
          <Card key={produto._id} className="bg-gradient-card hover:shadow-elegant transition-all">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="secondary" className="w-fit">
                  {produto.categoria}
                </Badge>
                <div className="flex gap-2">
                  {produto.emPromocao && (
                    <Badge className="bg-gradient-to-r from-red-500 to-red-600">
                      PROMOÇÃO
                    </Badge>
                  )}
                  {produto.isNovidade && (
                    <Badge className="bg-gradient-to-r from-green-500 to-green-600">
                      NOVIDADE
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-start justify-between">
                <CardTitle className="text-xl flex items-center gap-2 flex-1">
                  <Package className="h-5 w-5 text-primary" />
                  {produto.nome}
                </CardTitle>
                <div className="flex gap-1">
                  <PermissionGuard module="produtos" action="edit">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(produto)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </PermissionGuard>
                  <PermissionGuard module="produtos" action="delete">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(produto._id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </PermissionGuard>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4 text-sm">{produto.descricao}</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Código:</span>
                  <span className="font-medium">{produto.codigoProduto}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Preço de Custo:</span>
                  <span className="font-medium">R$ {Number(produto.precoCusto ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Preço de Venda:</span>
                  <span className="font-medium">R$ {Number(produto.precoVenda ?? produto.preco ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Lucro (%):</span>
                  <span className="font-semibold text-green-600">
                    {produto.precoCusto 
                      ? ((((Number(produto.precoVenda ?? produto.preco ?? 0) - Number(produto.precoCusto)) / Number(produto.precoCusto)) * 100)).toFixed(2)
                      : '0.00'}%
                  </span>
                </div>
              </div>

              {produto.fornecedor && (
                <div className="flex items-center gap-2 p-2 rounded-md bg-primary/5 border border-primary/20 mt-3">
                  <Building className="h-4 w-4 text-primary flex-shrink-0" />
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <span className="text-xs text-muted-foreground">Fornecedor</span>
                    <span className="font-medium text-sm text-foreground truncate">
                      {produto.fornecedor.nome}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {produto.fornecedor.codigoFornecedor}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => {
                    setSelectedProductForStock(produto);
                    setShowAddToStockDialog(true);
                  }}
                >
                  <PackagePlus className="h-4 w-4" />
                  Adicionar ao Estoque
                </Button>
                {/* Botão para ver no estoque - só aparece se tem estoque */}
                {(() => {
                  const estoqueItem = estoque.find((e: any) => e.codigoProduto === produto.codigoProduto);
                  // Calcular quantidade total somando todas as variantes
                  let quantidadeTotal = 0;
                  if (estoqueItem && estoqueItem.variantes && Array.isArray(estoqueItem.variantes)) {
                    quantidadeTotal = estoqueItem.variantes.reduce((total: number, v: any) => {
                      return total + (v.quantidade || 0);
                    }, 0);
                  }
                  
                  if (quantidadeTotal > 0) {
                    return (
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1 gap-2"
                        onClick={() => navigate(`/estoque?produto=${produto.codigoProduto}`)}
                      >
                        <Package className="h-4 w-4" />
                        Ver no Estoque
                      </Button>
                    );
                  }
                  return null;
                })()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedProductForStock && (
        <AddToStockDialog
          open={showAddToStockDialog}
          onOpenChange={setShowAddToStockDialog}
          produto={selectedProductForStock}
          onSuccess={loadProdutos}
        />
      )}

      <AlertDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Confirmar exclusão de produto"
        description="Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita e removerá também todos os registros de estoque associados."
      />
    </div>
  );
};

export default Produtos;
