import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, Loader2, Settings, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { contasPagarAPI, fornecedoresAPI, categoriasFinanceirasAPI } from "@/lib/api";
import { toast } from "sonner";
import { CategoriasFinanceirasManager } from "@/components/CategoriasFinanceirasManager";
import { CurrencyInput } from "@/components/ui/currency-input";

const contaPagarSchema = z.object({
  numeroDocumento: z.string().optional(),
  descricao: z.string().min(3, "Descrição deve ter no mínimo 3 caracteres"),
  valor: z.string().min(1, "Valor é obrigatório"),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  dataVencimento: z.date({ required_error: "Data de vencimento é obrigatória" }),
  fornecedorCodigo: z.string().optional(),
  formaPagamento: z.string().optional(),
  observacoes: z.string().optional(),
});

type ContaPagarFormData = z.infer<typeof contaPagarSchema>;

interface ContaPagarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conta?: any;
  onSuccess: () => void;
}

const formasPagamento = [
  "Dinheiro",
  "PIX",
  "Débito",
  "Crédito",
  "Boleto",
  "Transferência",
  "Outro"
];

export function ContaPagarDialog({ open, onOpenChange, conta, onSuccess }: ContaPagarDialogProps) {
  const [loading, setLoading] = useState(false);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [showCategoriesManager, setShowCategoriesManager] = useState(false);
  const [manualDocNumber, setManualDocNumber] = useState(false);

  const form = useForm<ContaPagarFormData>({
    resolver: zodResolver(contaPagarSchema),
    defaultValues: {
      numeroDocumento: "",
      descricao: "",
      valor: "",
      categoria: "",
      fornecedorCodigo: "",
      formaPagamento: "",
      observacoes: "",
    }
  });

  useEffect(() => {
    loadFornecedores();
    loadCategorias();
  }, []);

  useEffect(() => {
    if (conta) {
      form.reset({
        numeroDocumento: conta.numeroDocumento || "",
        descricao: conta.descricao || "",
        valor: conta.valor?.toString() || "",
        categoria: conta.categoria || "",
        dataVencimento: conta.dataVencimento ? new Date(conta.dataVencimento) : undefined,
        fornecedorCodigo: conta.fornecedorCodigo || "",
        formaPagamento: conta.formaPagamento || "",
        observacoes: conta.observacoes || "",
      });
    } else {
      form.reset({
        numeroDocumento: "",
        descricao: "",
        valor: "",
        categoria: "",
        fornecedorCodigo: "",
        formaPagamento: "",
        observacoes: "",
      });
    }
  }, [conta, open]);

  const loadFornecedores = async () => {
    try {
      const data = await fornecedoresAPI.getAll();
      setFornecedores(data);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
    }
  };

  const loadCategorias = async () => {
    try {
      const data = await categoriasFinanceirasAPI.getAll('pagar');
      setCategorias(data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const onSubmit = async (data: ContaPagarFormData) => {
    try {
      setLoading(true);
      const payload = {
        ...data,
        valor: parseFloat(data.valor),
        dataVencimento: data.dataVencimento.toISOString(),
      };

      if (conta) {
        await contasPagarAPI.update(conta.numeroDocumento, payload);
        toast.success("Conta a pagar atualizada com sucesso!");
      } else {
        await contasPagarAPI.create(payload);
        toast.success("Conta a pagar criada com sucesso!");
      }

      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      console.error('Erro ao salvar conta:', error);
      toast.error(error.message || "Erro ao salvar conta a pagar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{conta ? "Editar" : "Nova"} Conta a Pagar</DialogTitle>
          <DialogDescription>
            Preencha os dados da conta a pagar
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="numeroDocumento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número do Documento*</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Gerado automaticamente (CP###)" 
                          disabled={conta || !manualDocNumber}
                        />
                      </FormControl>
                      {!conta && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setManualDocNumber(!manualDocNumber)}
                          className="shrink-0"
                        >
                          {manualDocNumber ? <X className="h-4 w-4" /> : "✎"}
                        </Button>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
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
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição*</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Descrição da conta" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
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

              <FormField
                control={form.control}
                name="dataVencimento"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Vencimento*</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                              <span>Selecione a data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-background z-50" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          className="pointer-events-auto"
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fornecedorCodigo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fornecedor</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione (opcional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background z-50">
                        {fornecedores.map((forn) => (
                          <SelectItem key={forn.codigo} value={forn.codigo}>
                            {forn.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="formaPagamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de Pagamento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione (opcional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background z-50">
                        {formasPagamento.map((forma) => (
                          <SelectItem key={forma} value={forma}>{forma}</SelectItem>
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
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Observações adicionais (opcional)" rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {conta ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>

        <CategoriasFinanceirasManager
          open={showCategoriesManager}
          onOpenChange={(open) => {
            setShowCategoriesManager(open);
            if (!open) {
              loadCategorias(); // Recarrega categorias quando fecha o dialog
            }
          }}
          tipo="pagar"
        />
      </DialogContent>
    </Dialog>
  );
}
