import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { contasPagarAPI, contasReceberAPI } from "@/lib/api";
import { toast } from "sonner";

const formas = ["Dinheiro","PIX","Débito","Crédito","Boleto","Transferência","Outro"] as const;

const schema = z.object({
  valor: z.number({ required_error: "Informe o valor" }).positive("Valor deve ser positivo"),
  formaPagamento: z.enum(["Dinheiro","PIX","Débito","Crédito","Boleto","Transferência","Outro"], { required_error: "Selecione a forma de pagamento" }),
  observacoes: z.string().max(500).optional(),
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
    defaultValues: { valor: 0, formaPagamento: undefined, observacoes: '' }
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
      if (values.valor > saldoRestante) {
        toast.error('Valor excede o saldo restante');
        return;
      }
      if (tipo === 'pagar') {
        await contasPagarAPI.pagar(conta.numeroDocumento, { valorPago: values.valor, formaPagamento: values.formaPagamento });
      } else {
        await contasReceberAPI.receber(conta.numeroDocumento, { valorRecebido: values.valor, formaPagamento: values.formaPagamento });
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
                <FormLabel>Valor</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min={0} max={saldoRestante} value={field.value ?? ''} onChange={(e)=>field.onChange(parseFloat(e.target.value))} />
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
