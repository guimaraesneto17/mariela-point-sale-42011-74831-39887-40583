import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { format, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { contasPagarAPI, contasReceberAPI } from "@/lib/api";
import { toast } from "sonner";
import { CurrencyInput } from "@/components/ui/currency-input";

const parcelamentoSchema = z.object({
  valorTotal: z.string().min(1, "Valor total é obrigatório"),
  numeroParcelas: z.string().min(1, "Número de parcelas é obrigatório"),
  descricaoBase: z.string().min(3, "Descrição base é obrigatória"),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  tipo: z.enum(["pagar", "receber"], { required_error: "Tipo é obrigatório" }),
  dataInicio: z.string().min(1, "Data de início é obrigatória"),
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

  const form = useForm<ParcelamentoFormData>({
    resolver: zodResolver(parcelamentoSchema),
    defaultValues: {
      valorTotal: "",
      numeroParcelas: "",
      descricaoBase: "",
      categoria: "",
      tipo: "pagar",
      dataInicio: format(new Date(), 'yyyy-MM-dd'),
    }
  });

  const watchValorTotal = form.watch("valorTotal");
  const watchNumeroParcelas = form.watch("numeroParcelas");
  const watchDataInicio = form.watch("dataInicio");

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
      if (parcelas.length === 0) {
        toast.error("Configure as parcelas antes de criar");
        return;
      }

      setLoading(true);
      const api = data.tipo === "pagar" ? contasPagarAPI : contasReceberAPI;
      
      for (const parcela of parcelas) {
        const payload = {
          isParcelamento: true,
          numeroParcela: parcela.numero,
          totalParcelas: parcelas.length,
          descricao: `${data.descricaoBase} - Parcela ${parcela.numero}/${parcelas.length}`,
          valor: parcela.valor,
          categoria: data.categoria,
          dataVencimento: parcela.dataVencimento.toISOString(),
        };

        await api.create(payload);
      }

      toast.success(`${parcelas.length} parcelas criadas com sucesso!`);
      onSuccess();
      onOpenChange(false);
      form.reset();
      setParcelas([]);
    } catch (error: any) {
      console.error('Erro ao criar parcelamento:', error);
      toast.error(error.message || "Erro ao criar parcelamento");
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
          <DialogTitle>Criar Parcelamento</DialogTitle>
          <DialogDescription>
            Divida um valor em múltiplas parcelas com vencimentos mensais
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
                    <FormLabel>Categoria*</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Fornecedores, Aluguel, Venda..." maxLength={100} />
                    </FormControl>
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
                  <FormLabel>Descrição Base*</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: Compra de Equipamentos" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
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
                          setTimeout(calcularParcelas, 100);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

              <FormField
                control={form.control}
                name="dataInicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da 1ª Parcela*</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="date"
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
            </div>

            {parcelas.length > 0 && (
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
              <Button type="submit" disabled={loading || parcelas.length === 0}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar {parcelas.length} Parcela{parcelas.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
