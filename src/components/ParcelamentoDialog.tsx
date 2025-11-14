import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Settings } from "lucide-react";
import { format, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { contasPagarAPI, contasReceberAPI, categoriasFinanceirasAPI } from "@/lib/api";
import { toast } from "sonner";
import { CurrencyInput } from "@/components/ui/currency-input";
import { CategoriasFinanceirasManager } from "@/components/CategoriasFinanceirasManager";

const parcelamentoSchema = z.object({
  valorTotal: z.string()
    .min(1, "Valor total é obrigatório")
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, "Valor total deve ser maior que zero"),
  numeroParcelas: z.string().min(1, "Número de parcelas é obrigatório").optional(),
  descricaoBase: z.string().min(3, "Descrição base é obrigatória"),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  tipo: z.enum(["pagar", "receber"], { required_error: "Tipo é obrigatório" }),
  dataInicio: z.string().min(1, "Data de início é obrigatória"),
  parcelar: z.boolean().default(false),
});

type ParcelamentoFormData = z.infer<typeof parcelamentoSchema>;

interface ParcelamentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ParcelamentoDialog({ open, onOpenChange, onSuccess }: ParcelamentoDialogProps) {
  const [loading, setLoading] = useState(false);
  const [parcelas, setParcelas] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [showCategoriesManager, setShowCategoriesManager] = useState(false);

  const form = useForm<ParcelamentoFormData>({
    resolver: zodResolver(parcelamentoSchema),
    defaultValues: {
      valorTotal: "",
      numeroParcelas: "",
      descricaoBase: "",
      categoria: "",
      tipo: "pagar",
      dataInicio: format(new Date(), 'yyyy-MM-dd'),
      parcelar: false,
    }
  });

  useEffect(() => {
    if (open) {
      loadCategorias();
    }
  }, [open]);

  const watchTipo = form.watch("tipo");

  useEffect(() => {
    loadCategorias();
  }, [watchTipo]);

  const loadCategorias = async () => {
    try {
      const tipo = form.getValues("tipo");
      const data = await categoriasFinanceirasAPI.getAll(tipo);
      setCategorias(data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const watchValorTotal = form.watch("valorTotal");
  const watchNumeroParcelas = form.watch("numeroParcelas");
  const watchDataInicio = form.watch("dataInicio");
  const watchParcelar = form.watch("parcelar");

  const calcularParcelas = () => {
    const valor = parseFloat(watchValorTotal);
    const numParcelas = parseInt(watchNumeroParcelas);
    const dataInicio = new Date(watchDataInicio);

    if (!valor || !numParcelas || numParcelas < 1 || !dataInicio) {
      setParcelas([]);
      return;
    }

    const valorParcela = valor / numParcelas;
    const novasParcelas = [];

    for (let i = 0; i < numParcelas; i++) {
      const dataVencimento = addMonths(dataInicio, i);
      novasParcelas.push({
        numero: i + 1,
        valor: valorParcela,
        dataVencimento: dataVencimento,
      });
    }

    setParcelas(novasParcelas);
  };

  useState(() => {
    if (watchValorTotal && watchNumeroParcelas && watchDataInicio) {
      calcularParcelas();
    }
  });

  const onSubmit = async (data: ParcelamentoFormData) => {
    try {
      setLoading(true);
      const api = data.tipo === "pagar" ? contasPagarAPI : contasReceberAPI;
      
      if (data.parcelar) {
        // Criar parcelamento
        if (parcelas.length === 0) {
          toast.error("Configure as parcelas antes de criar");
          return;
        }

        for (const parcela of parcelas) {
          const payload = {
            isParcelamento: true,
            numeroParcela: parcela.numero,
            totalParcelas: parcelas.length,
            descricao: `${data.descricaoBase} - Parcela ${parcela.numero}/${parcelas.length}`,
            valor: parcela.valor,
            categoria: data.categoria,
            dataEmissao: new Date().toISOString(),
            dataVencimento: parcela.dataVencimento.toISOString(),
            status: 'Pendente'
          };

          await api.create(payload);
        }

        toast.success(`${parcelas.length} parcelas criadas com sucesso!`);
      } else {
        // Criar conta simples
        const payload = {
          descricao: data.descricaoBase,
          valor: parseFloat(data.valorTotal),
          categoria: data.categoria,
          dataEmissao: new Date().toISOString(),
          dataVencimento: new Date(data.dataInicio).toISOString(),
          status: 'Pendente'
        };

        await api.create(payload);
        toast.success(`Conta a ${data.tipo === "pagar" ? "pagar" : "receber"} criada com sucesso!`);
      }

      onSuccess();
      onOpenChange(false);
      form.reset();
      setParcelas([]);
    } catch (error: any) {
      console.error('Erro ao criar conta:', error);
      toast.error(error.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Conta Financeira</DialogTitle>
          <DialogDescription>
            Crie uma conta avulsa ou divida em parcelas
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo*</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background z-50">
                        <SelectItem value="pagar">Conta a Pagar</SelectItem>
                        <SelectItem value="receber">Conta a Receber</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Categoria*</FormLabel>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowCategoriesManager(true)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background z-50">
                        {categorias.map((cat) => (
                          <SelectItem key={cat._id || cat} value={cat.nome || cat}>
                            {cat.nome || cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="descricaoBase"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição*</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: Compra de Equipamentos" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parcelar"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2">
                  <FormControl>
                    <input 
                      type="checkbox" 
                      checked={field.value}
                      onChange={(e) => {
                        field.onChange(e.target.checked);
                        if (!e.target.checked) {
                          setParcelas([]);
                        }
                      }}
                      className="h-4 w-4 rounded border-input"
                    />
                  </FormControl>
                  <FormLabel className="!mt-0 cursor-pointer">Dividir em parcelas</FormLabel>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="valorTotal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Total*</FormLabel>
                    <FormControl>
                      <CurrencyInput 
                        {...field} 
                        placeholder="R$ 0,00"
                        onValueChange={(value) => {
                          field.onChange(value);
                          if (watchParcelar) {
                            setTimeout(calcularParcelas, 100);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dataInicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Vencimento*</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="date"
                        onChange={(e) => {
                          field.onChange(e);
                          if (watchParcelar) {
                            setTimeout(calcularParcelas, 100);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {watchParcelar && (
              <FormField
                control={form.control}
                name="numeroParcelas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Parcelas*</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        min="1" 
                        placeholder="Ex: 12"
                        onChange={(e) => {
                          field.onChange(e);
                          setTimeout(calcularParcelas, 100);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {watchParcelar && parcelas.length > 0 && (
              <div className="border rounded-lg p-4 bg-muted/50">
                <h3 className="text-sm font-medium mb-3">Parcelas a Criar</h3>
                <div className="max-h-[300px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">Nº</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parcelas.map((parcela) => (
                        <TableRow key={parcela.numero}>
                          <TableCell className="font-medium">
                            {parcela.numero}/{parcelas.length}
                          </TableCell>
                          <TableCell>
                            {format(parcela.dataVencimento, 'dd/MM/yyyy', { locale: ptBR })}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(parcela.valor)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-3 pt-3 border-t flex justify-between items-center">
                  <span className="text-sm font-medium">Total:</span>
                  <span className="text-lg font-bold text-primary">
                    {formatCurrency(parcelas.reduce((sum, p) => sum + p.valor, 0))}
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {watchParcelar ? `Criar ${parcelas.length} Parcela${parcelas.length !== 1 ? 's' : ''}` : 'Criar Conta'}
              </Button>
            </div>
          </form>
        </Form>

        <CategoriasFinanceirasManager
          open={showCategoriesManager}
          onOpenChange={(open) => {
            setShowCategoriesManager(open);
            if (!open) {
              loadCategorias();
            }
          }}
          tipo={form.getValues("tipo")}
        />
      </DialogContent>
    </Dialog>
  );
}
