import { useState, useEffect, useMemo } from "react";
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
import { CurrencyInput } from "@/components/ui/currency-input";
import { ImagePlus, X, Loader2, Check, AlertCircle, ZoomIn, ZoomOut, CalendarIcon, TrendingUp } from "lucide-react";
import { useImageCompression } from "@/hooks/useImageCompression";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency, cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

const formas = ["Pix","Cartão de Crédito","Cartão de Débito","Dinheiro","Boleto","Transferência","Outro"] as const;

const schema = z.object({
  valor: z.string()
    .min(1, "Informe o valor")
    .refine((val) => {
      const cleaned = val.replace(/[^\d,.-]/g, '').replace(',', '.');
      const num = parseFloat(cleaned);
      return !isNaN(num) && num > 0.01;
    }, "Valor deve ser maior que R$ 0,01"),
  dataPagamento: z.date({ required_error: "Selecione a data do pagamento" }),
  formaPagamento: z.enum(["Pix","Cartão de Crédito","Cartão de Débito","Dinheiro","Boleto","Transferência","Outro"], { required_error: "Selecione a forma de pagamento" }),
  observacoes: z.string().max(500).optional(),
  numeroParcela: z.number().optional(),
  comprovante: z.string().optional(),
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
  const [imageZoomed, setImageZoomed] = useState(false);
  const { compressing, compressImage } = useImageCompression();
  
  // Verifica se é parcelamento/replica e se tem parcela específica
  const isParcelamentoOuReplica = conta?.tipoCriacao === 'Parcelamento' || conta?.tipoCriacao === 'Replica';
  const parcelaEspecifica = isParcelamentoOuReplica && numeroParcela !== undefined
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
    defaultValues: { 
      valor: saldoRestante > 0 ? saldoRestante.toFixed(2) : "0.01", 
      dataPagamento: new Date(),
      formaPagamento: undefined, 
      observacoes: '', 
      numeroParcela, 
      comprovante: '',
    }
  });

  // Observa o valor para calcular acréscimo
  const valorAtual = form.watch('valor');
  
  // Calcula o valor do acréscimo (diferença entre valor pago e saldo restante)
  const infoAcrescimo = useMemo(() => {
    if (!valorAtual || saldoRestante <= 0) return null;
    
    const valorLimpo = valorAtual.replace(/[^\d,.-]/g, '').replace(',', '.');
    const valorNumerico = parseFloat(valorLimpo);
    
    if (isNaN(valorNumerico) || valorNumerico <= saldoRestante) return null;
    
    const valorAcrescimo = valorNumerico - saldoRestante;
    const percentualAcrescimo = (valorAcrescimo / saldoRestante) * 100;
    
    return {
      valorAcrescimo,
      percentualAcrescimo
    };
  }, [valorAtual, saldoRestante]);

  // Atualiza o valor default quando a conta muda
  useEffect(() => {
    if (conta && open) {
      // Garantir que sempre temos um valor válido maior que zero
      const valorFinal = saldoRestante > 0 ? saldoRestante.toFixed(2) : "0.01";
      
      form.reset({
        valor: valorFinal,
        dataPagamento: new Date(),
        formaPagamento: undefined,
        observacoes: '',
        numeroParcela,
        comprovante: '',
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
    setImageZoomed(false);
    form.setValue('comprovante', '');
  };

  const toggleZoom = () => {
    setImageZoomed(!imageZoomed);
  };

  const onSubmit = async (values: FormData) => {
    try {
      setLoading(true);
      if (!conta) return;
      
      console.log('📝 [FRONTEND] Iniciando registro de', tipo === 'pagar' ? 'pagamento' : 'recebimento');
      console.log('📝 [FRONTEND] Conta:', conta.numeroDocumento);
      console.log('📝 [FRONTEND] Parcela:', numeroParcela);
      console.log('📝 [FRONTEND] Valores do formulário:', values);
      
      // Limpar valor removendo caracteres não numéricos (exceto , e .)
      const valorLimpo = values.valor.replace(/[^\d,.-]/g, '').replace(',', '.');
      const valorNumerico = parseFloat(valorLimpo);
      
      if (isNaN(valorNumerico) || valorNumerico <= 0.01) {
        console.error('❌ [FRONTEND] Valor inválido:', values.valor, 'Limpo:', valorLimpo, 'Numérico:', valorNumerico);
        toast.error('Valor deve ser maior que R$ 0,01');
        return;
      }
      
      if (valorNumerico > saldoRestante * 2) {
        toast.error(`Valor muito alto. Saldo restante é ${saldoRestante.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
        return;
      }
      
      console.log('✅ [FRONTEND] Validações passaram. Enviando para API...');
      
      // Calcular juros/multa como a diferença entre valor pago e saldo restante
      const jurosMultaCalculado = valorNumerico > saldoRestante ? valorNumerico - saldoRestante : undefined;
      
      if (tipo === 'pagar') {
        const payload = { 
          valorPago: valorNumerico,
          dataPagamento: values.dataPagamento?.toISOString(),
          formaPagamento: values.formaPagamento,
          observacoes: values.observacoes,
          numeroParcela,
          comprovante: values.comprovante,
          jurosMulta: jurosMultaCalculado
        };
        console.log('📤 [FRONTEND] Payload de pagamento:', payload);
        await contasPagarAPI.pagar(conta.numeroDocumento, payload);
      } else {
        const payload = { 
          valorRecebido: valorNumerico,
          dataRecebimento: values.dataPagamento?.toISOString(),
          formaPagamento: values.formaPagamento,
          observacoes: values.observacoes,
          numeroParcela,
          comprovante: values.comprovante,
          jurosMulta: jurosMultaCalculado
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
            
            {infoAcrescimo && (
              <Alert className="border-primary/50 bg-primary/10">
                <TrendingUp className="h-4 w-4 text-primary" />
                <AlertDescription className="text-sm text-primary space-y-1">
                  <p className="font-semibold">💰 Valor Adicional Incluído</p>
                  <div className="text-xs space-y-0.5">
                    <p>• Valor original: {formatCurrency(saldoRestante)}</p>
                    <p>• Valor adicional: {formatCurrency(infoAcrescimo.valorAcrescimo)}</p>
                    <p className="font-semibold">• Percentual adicional: +{infoAcrescimo.percentualAcrescimo.toFixed(2)}%</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            <div className="text-sm text-muted-foreground">
              Saldo restante: <span className="font-semibold text-foreground">{saldoRestante.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
            
            <FormField name="dataPagamento" control={form.control} render={({ field }) => {
              const isValid = !!field.value;
              
              return (
                <FormItem className="flex flex-col">
                  <FormLabel className="flex items-center gap-1">
                    Data do {tipo === 'pagar' ? 'Pagamento' : 'Recebimento'}*
                    {isValid && <Check className="h-4 w-4 text-green-500" />}
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground",
                            isValid && "border-green-500"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                          ) : (
                            <span>Selecione a data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date()}
                        initialFocus
                        locale={ptBR}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              );
            }} />
            
            <FormField name="valor" control={form.control} render={({ field }) => {
              const hasValue = field.value && field.value.length > 0;
              const isValid = hasValue && (() => {
                const cleaned = field.value.replace(/[^\d,.-]/g, '').replace(',', '.');
                const num = parseFloat(cleaned);
                return !isNaN(num) && num > 0.01;
              })();
              const showError = hasValue && !isValid;
              
              return (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    Valor*
                    {hasValue && (
                      isValid 
                        ? <Check className="h-4 w-4 text-green-500" />
                        : <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                  </FormLabel>
                  <FormControl>
                    <CurrencyInput 
                      {...field} 
                      placeholder="R$ 0,00"
                      onValueChange={field.onChange}
                      className={hasValue ? (isValid ? "border-green-500 focus-visible:ring-green-500" : "border-destructive focus-visible:ring-destructive") : ""}
                    />
                  </FormControl>
                  {showError && <p className="text-sm font-medium text-destructive">Valor deve ser maior que R$ 0,01</p>}
                  <FormMessage />
                </FormItem>
              );
            }} />
            <FormField name="formaPagamento" control={form.control} render={({ field }) => {
              const isValid = !!field.value;
              
              return (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    Forma de Pagamento*
                    {isValid && <Check className="h-4 w-4 text-green-500" />}
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className={isValid ? "border-green-500 focus:ring-green-500" : ""}>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {formas.map(f => (<SelectItem key={f} value={f}>{f}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              );
            }} />
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
                      <div className="relative group">
                        <div 
                          className={`relative overflow-hidden rounded-lg border border-border cursor-pointer transition-all duration-300 ${
                            imageZoomed 
                              ? 'fixed inset-4 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center' 
                              : 'h-48'
                          }`}
                          onClick={toggleZoom}
                        >
                          <img 
                            src={imagePreview} 
                            alt="Comprovante" 
                            className={`transition-all duration-300 ${
                              imageZoomed 
                                ? 'max-w-full max-h-full object-contain' 
                                : 'w-full h-48 object-contain'
                            }`}
                          />
                          <div className={`absolute ${imageZoomed ? 'top-4 left-4' : 'bottom-2 left-2'} bg-background/80 rounded-full p-1.5 opacity-70 group-hover:opacity-100 transition-opacity`}>
                            {imageZoomed ? (
                              <ZoomOut className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ZoomIn className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          {imageZoomed && (
                            <p className="absolute bottom-4 left-4 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
                              Clique para fechar
                            </p>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className={`absolute ${imageZoomed ? 'top-4 right-4 z-50' : 'top-2 right-2'}`}
                          onClick={(e) => { e.stopPropagation(); removeImage(); }}
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