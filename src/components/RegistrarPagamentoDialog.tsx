import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { contasPagarAPI, contasReceberAPI } from "@/lib/api";
import { toast } from "sonner";
import { CurrencyInput } from "@/components/ui/currency-input";

const formas = ["Dinheiro","PIX","Débito","Crédito","Boleto","Transferência","Outro"] as const;

const schema = z.object({
  valor: z.string()
    .min(1, "Informe o valor")
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, "Valor deve ser maior que zero"),
  formaPagamento: z.enum(["Dinheiro","PIX","Débito","Crédito","Boleto","Transferência","Outro"], { required_error: "Selecione a forma de pagamento" }),
  observacoes: z.string().max(500).optional(),
  registrarNoCaixa: z.boolean().default(true)
});

type FormData = z.infer<typeof schema>;

interface RegistrarPagamentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipo: 'pagar' | 'receber';
  conta: any | null;
  onSuccess: () => void;
}

export function RegistrarPagamentoDialog({ open, onOpenChange, tipo, conta, onSuccess }: RegistrarPagamentoDialogProps) {
  const [loading, setLoading] = useState(false);
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { valor: "0", formaPagamento: undefined, observacoes: '', registrarNoCaixa: true }
  });

  const saldoRestante = (() => {
    if (!conta) return 0;
    const total = Number(conta.valor || 0);
    const pago = Number((tipo === 'pagar' ? conta.valorPago : conta.valorRecebido) || 0);
    return Math.max(total - pago, 0);
  })();

  const onSubmit = async (values: FormData) => {
    try {
      setLoading(true);
      if (!conta) return;
      
      const valorNumerico = parseFloat(values.valor);
      if (isNaN(valorNumerico) || valorNumerico <= 0) {
        toast.error('Valor inválido');
        return;
      }
      
      if (valorNumerico > saldoRestante) {
        toast.error('Valor excede o saldo restante');
        return;
      }
      
      if (tipo === 'pagar') {
        await contasPagarAPI.pagar(conta.numeroDocumento, { 
          valorPago: valorNumerico, 
          formaPagamento: values.formaPagamento,
          observacoes: values.observacoes,
          registrarNoCaixa: values.registrarNoCaixa
        });
      } else {
        await contasReceberAPI.receber(conta.numeroDocumento, { 
          valorRecebido: valorNumerico, 
          formaPagamento: values.formaPagamento,
          observacoes: values.observacoes,
          registrarNoCaixa: values.registrarNoCaixa
        });
      }
      toast.success(tipo === 'pagar' ? 'Pagamento registrado' : 'Recebimento registrado');
      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tipo === 'pagar' ? 'Registrar Pagamento' : 'Registrar Recebimento'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Saldo restante: <span className="font-semibold text-foreground">{saldoRestante.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
            <FormField name="valor" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Valor*</FormLabel>
                <FormControl>
                  <CurrencyInput 
                    {...field} 
                    placeholder="R$ 0,00"
                    onValueChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="formaPagamento" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Forma de Pagamento</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {formas.map(f => (<SelectItem key={f} value={f}>{f}</SelectItem>))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="observacoes" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Observações</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Opcional" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="registrarNoCaixa" control={form.control} render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Registrar movimentação no caixa</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Esta transação será automaticamente lançada no caixa aberto
                  </p>
                </div>
              </FormItem>
            )} />
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
