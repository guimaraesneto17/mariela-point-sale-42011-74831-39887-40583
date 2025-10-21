import { useState, useEffect } from "react";
import { Search, Plus, CheckCircle2, AlertCircle, Package, Edit, Trash2, X } from "lucide-react";
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
import { produtosAPI } from "@/lib/api";

type ProdutoFormData = z.infer<typeof produtoSchema>;

const Produtos = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [manualCode, setManualCode] = useState(false);

  const form = useForm<ProdutoFormData>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      codigoProduto: "",
      nome: "",
      descricao: "",
      categoria: "Outro",
      cor: "",
      precoCusto: 0,
      precoVenda: 0,
      margemLucro: undefined,
      precoPromocional: undefined,
    },
  });

  const [produtos, setProdutos] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    loadProdutos();
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

  const filteredProdutos = produtos.filter(produto =>
    produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produto.codigoProduto.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generateNextCode = () => {
    if (produtos.length === 0) return "P001";
    const codes = produtos.map(p => parseInt(p.codigoProduto.replace("P", "")));
    const maxCode = Math.max(...codes);
    return `P${String(maxCode + 1).padStart(3, "0")}`;
  };

  const precoCusto = form.watch("precoCusto") || 0;
  const precoVenda = form.watch("precoVenda") || 0;
  const margemLucro = form.watch("margemLucro");
  
  const calcularLucro = () => {
    if (precoCusto === 0) return 0;
    return parseFloat((((precoVenda - precoCusto) / precoCusto) * 100).toFixed(2));
  };

  const handleMargemChange = (margem: number) => {
    if (precoCusto > 0) {
      const novoPrecoVenda = precoCusto * (1 + margem / 100);
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
        cor: data.cor,
        precoCusto: data.precoCusto,
        precoVenda: data.precoVenda,
        precoPromocional: data.precoPromocional,
        imagens: [],
      };

      if (editingProduct) {
        await produtosAPI.update(editingProduct._id, produtoData);
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
    const margem = product.precoCusto > 0 
      ? parseFloat((((product.preco - product.precoCusto) / product.precoCusto) * 100).toFixed(2))
      : 0;
    
    form.reset({
      codigoProduto: product.codigoProduto,
      nome: product.nome,
      descricao: product.descricao,
      categoria: product.categoria,
      cor: product.cor,
      precoCusto: product.precoCusto,
      precoVenda: product.preco,
      margemLucro: margem,
      precoPromocional: product.precoPromocional || undefined,
    });
    setManualCode(true);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este produto?")) {
      try {
        await produtosAPI.delete(id);
        toast.success("Produto excluído com sucesso!");
        loadProdutos();
      } catch (error: any) {
        toast.error("Erro ao excluir produto", {
          description: error.message || "Tente novamente",
        });
      }
    }
  };

  const handleOpenDialog = () => {
    setEditingProduct(null);
    form.reset({
      codigoProduto: generateNextCode(),
      nome: "",
      descricao: "",
      categoria: "Outro",
      cor: "",
      precoCusto: 0,
      precoVenda: 0,
      margemLucro: undefined,
      precoPromocional: undefined,
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
        </div>
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
                              placeholder="Descrição detalhada do produto (mínimo 10 caracteres)"
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

                    <div>
                      <Label className="text-sm font-semibold text-foreground">Imagem do Produto (URL)</Label>
                      <Input 
                        placeholder="Cole a URL da imagem do produto (ex: https://exemplo.com/imagem.jpg)"
                        className="transition-all focus:ring-2 focus:ring-primary/30 focus:border-primary mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Cole o link direto da imagem. Você pode usar serviços como Imgur ou Google Drive.
                      </p>
                    </div>

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
                        name="cor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-foreground">Cor *</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="Ex: Azul, Vermelho, Estampado"
                                className="transition-all focus:ring-2 focus:ring-primary/30 focus:border-primary"
                              />
                            </FormControl>
                            <FormMessage className="text-xs flex items-center gap-1">
                              {form.formState.errors.cor && (
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
                            <FormLabel className="text-sm font-semibold text-foreground">Preço de Custo *</FormLabel>
                            <FormControl>
                              <Input 
                                {...field}
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                            <FormLabel className="text-sm font-semibold text-foreground">Preço de Venda *</FormLabel>
                            <FormControl>
                              <Input 
                                {...field}
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                        name="margemLucro"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-foreground">Margem de Lucro (%)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field}
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={field.value ?? calcularLucro()}
                                onChange={(e) => {
                                  const margem = parseFloat(e.target.value) || 0;
                                  field.onChange(margem);
                                  handleMargemChange(margem);
                                }}
                                className="transition-all focus:ring-2 focus:ring-primary/30 focus:border-primary"
                              />
                            </FormControl>
                            <FormMessage className="text-xs flex items-center gap-1">
                              {form.formState.errors.margemLucro && (
                                <AlertCircle className="h-3 w-3" />
                              )}
                            </FormMessage>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="precoPromocional"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-foreground">Preço Promocional (Opcional)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              value={field.value || ""}
                              className="transition-all focus:ring-2 focus:ring-primary/30 focus:border-primary"
                            />
                          </FormControl>
                          <FormMessage className="text-xs flex items-center gap-1">
                            {form.formState.errors.precoPromocional && (
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
      </div>

      <Card className="p-6 shadow-card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            placeholder="Buscar por código ou nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
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
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(produto)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(produto._id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
                  <span className="text-muted-foreground">Cor:</span>
                  <span className="font-medium">{produto.cor}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Preço de Custo:</span>
                  <span className="font-medium">R$ {produto.precoCusto?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Preço de Venda:</span>
                  <span className="font-medium">R$ {produto.preco.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Lucro (%):</span>
                  <span className="font-semibold text-green-600">
                    {produto.precoCusto 
                      ? (((produto.preco - produto.precoCusto) / produto.precoCusto) * 100).toFixed(2) 
                      : '0.00'}%
                  </span>
                </div>
                {produto.emPromocao && produto.precoPromocional && (
                  <div className="flex justify-between text-sm mt-2 pt-2 border-t">
                    <span className="text-muted-foreground">Preço Promocional:</span>
                    <span className="font-semibold text-primary">
                      R$ {produto.precoPromocional.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Produtos;