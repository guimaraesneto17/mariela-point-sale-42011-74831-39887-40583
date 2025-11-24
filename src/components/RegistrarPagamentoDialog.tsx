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
import { ImagePlus, X, Loader2 } from "lucide-react";
import { useImageCompression } from "@/hooks/useImageCompression";

const formas = ["Pix","Cartão de Crédito","Cartão de Débito","Dinheiro","Boleto","Transferência","Outro"] as const;

const schema = z.object({
  valor: z.string()
    .min(1, "Informe o valor")
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, "Valor deve ser maior que zero"),
  formaPagamento: z.enum(["Pix","Cartão de Crédito","Cartão de Débito","Dinheiro","Boleto","Transferência","Outro"], { required_error: "Selecione a forma de pagamento" }),
  observacoes: z.string().max(500).optional(),
  numeroParcela: z.number().optional(),
  comprovante: z.string().optional()
});

type FormData = z.infer<typeof schema>;

interface RegistrarPagamentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipo: 'pagar' | 'receber';
  conta: any | null;
  onSuccess: () => void;
  numeroParcela?: number; // Número da parcela (se for parcelamento)
}

export function RegistrarPagamentoDialog({ open, onOpenChange, tipo, conta, onSuccess, numeroParcela }: RegistrarPagamentoDialogProps) {
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { compressing, compressImage } = useImageCompression();
  
  // Verifica se é parcelamento e se tem parcela específica
  const isParcelamento = conta?.tipoCriacao === 'Parcelamento';
  const parcelaEspecifica = isParcelamento && numeroParcela !== undefined 
    ? conta?.parcelas?.find((p: any) => p.numeroParcela === numeroParcela)
    : null;
  
  const saldoRestante = (() => {
    if (!conta) return 0;
    
    // Se é parcela específica, retorna o saldo da parcela
    if (parcelaEspecifica) {
      const valorParcela = Number(parcelaEspecifica.valor || 0);
      const pagoParcela = Number((tipo === 'pagar' ? parcelaEspecifica.pagamento?.valor : parcelaEspecifica.recebimento?.valor) || 0);
      return Math.max(valorParcela - pagoParcela, 0);
    }
    
    // Caso contrário, usa lógica normal (conta única)
    const total = Number(conta.valor || 0);
    const pago = Number((tipo === 'pagar' ? conta.valorPago : conta.valorRecebido) || 0);
    return Math.max(total - pago, 0);
  })();
  
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { valor: "0", formaPagamento: undefined, observacoes: '', numeroParcela, comprovante: '' }
  });

  // Atualiza o valor default quando a conta muda
  useEffect(() => {
    if (conta && open) {
      form.reset({
        valor: saldoRestante.toFixed(2),
        formaPagamento: undefined,
        observacoes: '',
        numeroParcela,
        comprovante: ''
      });
      setImagePreview(null);
    }
  }, [conta, open, saldoRestante, numeroParcela]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Comprimir imagem antes de salvar
      const compressedBase64 = await compressImage(file, {
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.8,
        maxSizeMB: 2
      });
      
      setImagePreview(compressedBase64);
      form.setValue('comprovante', compressedBase64);
      toast.success('Comprovante anexado e comprimido');
    } catch (error: any) {
      console.error('Erro ao processar imagem:', error);
      toast.error(error.message || 'Erro ao processar imagem');
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    form.setValue('comprovante', '');
  };

  const onSubmit = async (values: FormData) => {
    try {
      setLoading(true);
      if (!conta) return;
      
      console.log('📝 [FRONTEND] Iniciando registro de', tipo === 'pagar' ? 'pagamento' : 'recebimento');
      console.log('📝 [FRONTEND] Conta:', conta.numeroDocumento);
      console.log('📝 [FRONTEND] Parcela:', numeroParcela);
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
          observacoes: values.observacoes,
          numeroParcela,
          comprovante: values.comprovante
        };
        console.log('📤 [FRONTEND] Payload de pagamento:', payload);
        await contasPagarAPI.pagar(conta.numeroDocumento, payload);
      } else {
        const payload = { 
          valorRecebido: valorNumerico,
          formaPagamento: values.formaPagamento,
          observacoes: values.observacoes,
          numeroParcela,
          comprovante: values.comprovante
        };
        console.log('📤 [FRONTEND] Payload de recebimento:', payload);
        await contasReceberAPI.receber(conta.numeroDocumento, payload);
      }
      
      const mensagem = numeroParcela !== undefined
        ? `Parcela ${numeroParcela} ${tipo === 'pagar' ? 'paga' : 'recebida'} e lançada no caixa`
        : tipo === 'pagar' 
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
          <DialogTitle>
            {numeroParcela !== undefined 
              ? `${tipo === 'pagar' ? 'Registrar Pagamento' : 'Registrar Recebimento'} - Parcela ${numeroParcela}`
              : tipo === 'pagar' ? 'Registrar Pagamento' : 'Registrar Recebimento'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {numeroParcela !== undefined && (
              <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
                <p className="text-sm font-medium text-primary">
                  Parcela {numeroParcela} de {conta?.parcelas?.length}
                </p>
              </div>
            )}
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
            
            <FormField name="comprovante" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Comprovante (Imagem)</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    {!imagePreview ? (
                      <label className={`flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-smooth ${compressing ? 'opacity-50 pointer-events-none' : ''}`}>
                        {compressing ? (
                          <>
                            <Loader2 className="h-5 w-5 text-primary animate-spin" />
                            <span className="text-sm text-primary">Comprimindo...</span>
                          </>
                        ) : (
                          <>
                            <ImagePlus className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Anexar comprovante (máx 2MB)</span>
                          </>
                        )}
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleImageUpload}
                          disabled={compressing}
                        />
                      </label>
                    ) : (
                      <div className="relative">
                        <img 
                          src={imagePreview} 
                          alt="Comprovante" 
                          className="w-full h-48 object-contain rounded-lg border border-border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={removeImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
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