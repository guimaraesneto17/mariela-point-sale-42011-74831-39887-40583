import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Edit2, Trash2, GripVertical, Tag, DollarSign, ShoppingCart, Home, Zap, Droplet, Wifi, TrendingUp, FileText, Star } from "lucide-react";
import { categoriasFinanceirasAPI } from "@/lib/api";
import { toast } from "sonner";

const categoriaSchema = z.object({
  nome: z.string().min(2, "Nome deve ter no mínimo 2 caracteres").max(50),
  tipo: z.enum(['pagar', 'receber', 'ambos']),
  cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida"),
  icone: z.string().min(1, "Ícone é obrigatório"),
  descricao: z.string().optional(),
});

type CategoriaFormData = z.infer<typeof categoriaSchema>;

const icones = [
  { value: 'Tag', icon: Tag, label: 'Tag' },
  { value: 'DollarSign', icon: DollarSign, label: 'Dinheiro' },
  { value: 'ShoppingCart', icon: ShoppingCart, label: 'Compras' },
  { value: 'Home', icon: Home, label: 'Casa' },
  { value: 'Zap', icon: Zap, label: 'Energia' },
  { value: 'Droplet', icon: Droplet, label: 'Água' },
  { value: 'Wifi', icon: Wifi, label: 'Internet' },
  { value: 'TrendingUp', icon: TrendingUp, label: 'Crescimento' },
  { value: 'FileText', icon: FileText, label: 'Documento' },
  { value: 'Star', icon: Star, label: 'Estrela' },
];

const cores = [
  '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6',
  '#EF4444', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
];

interface CategoriasFinanceirasManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipo?: 'pagar' | 'receber';
}

export function CategoriasFinanceirasManager({ open, onOpenChange, tipo }: CategoriasFinanceirasManagerProps) {
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  const form = useForm<CategoriaFormData>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: {
      nome: "",
      tipo: tipo || 'ambos',
      cor: cores[0],
      icone: 'Tag',
      descricao: "",
    }
  });

  useEffect(() => {
    if (open) {
      loadCategorias();
    }
  }, [open, tipo]);

  useEffect(() => {
    if (editingCategoria) {
      form.reset({
        nome: editingCategoria.nome,
        tipo: editingCategoria.tipo,
        cor: editingCategoria.cor,
        icone: editingCategoria.icone,
        descricao: editingCategoria.descricao || "",
      });
      setShowForm(true);
    } else {
      form.reset({
        nome: "",
        tipo: tipo || 'ambos',
        cor: cores[0],
        icone: 'Tag',
        descricao: "",
      });
    }
  }, [editingCategoria, tipo]);

  const loadCategorias = async () => {
    try {
      setLoading(true);
      const data = await categoriasFinanceirasAPI.getAll(tipo);
      setCategorias(data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      toast.error('Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CategoriaFormData) => {
    try {
      setLoading(true);
      if (editingCategoria) {
        await categoriasFinanceirasAPI.update(editingCategoria._id, data);
        toast.success("Categoria atualizada com sucesso!");
      } else {
        await categoriasFinanceirasAPI.create(data);
        toast.success("Categoria criada com sucesso!");
      }
      await loadCategorias();
      setShowForm(false);
      setEditingCategoria(null);
      form.reset();
    } catch (error: any) {
      console.error('Erro ao salvar categoria:', error);
      toast.error(error.message || "Erro ao salvar categoria");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente desativar esta categoria?')) return;
    
    try {
      await categoriasFinanceirasAPI.delete(id);
      toast.success("Categoria desativada com sucesso!");
      loadCategorias();
    } catch (error) {
      console.error('Erro ao desativar categoria:', error);
      toast.error("Erro ao desativar categoria");
    }
  };

  const getIconComponent = (iconName: string) => {
    const iconObj = icones.find(i => i.value === iconName);
    return iconObj ? iconObj.icon : Tag;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Categorias Financeiras</DialogTitle>
          <DialogDescription>
            Crie e organize suas categorias personalizadas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!showForm ? (
            <>
              <Button onClick={() => setShowForm(true)} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Nova Categoria
              </Button>

              <div className="grid gap-3">
                {categorias.map((cat) => {
                  const IconComponent = getIconComponent(cat.icone);
                  return (
                    <Card key={cat._id} className="shadow-card hover:shadow-elegant transition-all animate-fade-in">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: cat.cor }}
                            >
                              <IconComponent className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-foreground">{cat.nome}</h4>
                              <p className="text-sm text-muted-foreground">{cat.descricao}</p>
                            </div>
                            <Badge variant="secondary" className="capitalize">
                              {cat.tipo}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => setEditingCategoria(cat)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleDelete(cat._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Categoria*</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Fornecedores" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo*</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-background">
                          <SelectItem value="pagar">Contas a Pagar</SelectItem>
                          <SelectItem value="receber">Contas a Receber</SelectItem>
                          <SelectItem value="ambos">Ambos</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="icone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ícone*</FormLabel>
                      <div className="grid grid-cols-5 gap-2">
                        {icones.map((icone) => {
                          const Icon = icone.icon;
                          return (
                            <button
                              key={icone.value}
                              type="button"
                              onClick={() => field.onChange(icone.value)}
                              className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                                field.value === icone.value 
                                  ? 'border-primary bg-primary/10' 
                                  : 'border-border hover:border-primary/50'
                              }`}
                            >
                              <Icon className="h-6 w-6 mx-auto" />
                            </button>
                          );
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor*</FormLabel>
                      <div className="grid grid-cols-5 gap-2">
                        {cores.map((cor) => (
                          <button
                            key={cor}
                            type="button"
                            onClick={() => field.onChange(cor)}
                            className={`h-12 rounded-lg border-2 transition-all hover:scale-105 ${
                              field.value === cor 
                                ? 'border-foreground scale-105' 
                                : 'border-transparent'
                            }`}
                            style={{ backgroundColor: cor }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Descrição opcional" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowForm(false);
                      setEditingCategoria(null);
                      form.reset();
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1">
                    {editingCategoria ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
