import { useState, useEffect } from "react";
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

const formas = ["Pix","Cartão de Crédito","Cartão de Débito","Dinheiro","Boleto","Transferência","Outro"] as const;

const schema = z.object({
  valor: z.string()
    .min(1, "Informe o valor")
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, "Valor deve ser maior que zero"),
  formaPagamento: z.enum(["Pix","Cartão de Crédito","Cartão de Débito","Dinheiro","Boleto","Transferência","Outro"], { required_error: "Selecione a forma de pagamento" }),
  observacoes: z.string().max(500).optional()
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
  
  const saldoRestante = (() => {
    if (!conta) return 0;
    const total = Number(conta.valor || 0);
    const pago = Number((tipo === 'pagar' ? conta.valorPago : conta.valorRecebido) || 0);
    return Math.max(total - pago, 0);
  })();
  
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { valor: "0", formaPagamento: undefined, observacoes: '' }
  });

  // Atualiza o valor default quando a conta muda
  useEffect(() => {
    if (conta && open) {
      form.reset({
        valor: saldoRestante.toFixed(2),
        formaPagamento: undefined,
        observacoes: ''
      });
    }
  }, [conta, open, saldoRestante]);

  const onSubmit = async (values: FormData) => {
    try {
      setLoading(true);
      if (!conta) return;
      
      console.log('📝 [FRONTEND] Iniciando registro de', tipo === 'pagar' ? 'pagamento' : 'recebimento');
      console.log('📝 [FRONTEND] Conta:', conta.numeroDocumento);
      console.log('📝 [FRONTEND] Valores do formulário:', values);
      
      const valorNumerico = parseFloat(values.valor);
      if (isNaN(valorNumerico) || valorNumerico <= 0) {
        console.error('❌ [FRONTEND] Valor inválido:', values.valor);
        toast.error('Valor inválido');
        return;
      }
      
      if (valorNumerico > saldoRestante) {
        console.error('❌ [FRONTEND] Valor excede saldo restante:', { valorNumerico, saldoRestante });
        toast.error('Valor excede o saldo restante');
        return;
      }
      
      console.log('✅ [FRONTEND] Validações passaram. Enviando para API...');
      
      if (tipo === 'pagar') {
        const payload = { 
          valorPago: valorNumerico, 
          formaPagamento: values.formaPagamento,
          observacoes: values.observacoes
        };
        console.log('📤 [FRONTEND] Payload de pagamento:', payload);
        
        await contasPagarAPI.pagar(conta.numeroDocumento, payload);
      } else {
        const payload = { 
          valorRecebido: valorNumerico, 
          formaPagamento: values.formaPagamento,
          observacoes: values.observacoes
        };
        console.log('📤 [FRONTEND] Payload de recebimento:', payload);
        
        await contasReceberAPI.receber(conta.numeroDocumento, payload);
      }
      
      const mensagem = tipo === 'pagar' 
        ? 'Pagamento registrado e lançado no caixa'
        : 'Recebimento registrado e lançado no caixa';
      
      console.log('✅ [FRONTEND] Operação concluída com sucesso');
      toast.success(mensagem);
      
      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (e: any) {
      console.error('❌ [FRONTEND] Erro ao registrar:', e);
      console.error('❌ [FRONTEND] Mensagem de erro:', e?.message);
      console.error('❌ [FRONTEND] Objeto completo do erro:', e);
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
            <div className="rounded-md border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm font-medium text-primary">
                ℹ️ Esta transação será automaticamente registrada no caixa aberto
              </p>
            </div>
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