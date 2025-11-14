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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CalendarIcon, Loader2, Settings, Split } from "lucide-react";
import { format, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { contasPagarAPI, fornecedoresAPI, categoriasFinanceirasAPI } from "@/lib/api";
import { toast } from "sonner";
import { CategoriasFinanceirasManager } from "@/components/CategoriasFinanceirasManager";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Card, CardContent } from "@/components/ui/card";

const contaPagarSchema = z.object({
  descricao: z.string().min(3, "Descrição deve ter no mínimo 3 caracteres"),
  valor: z.string()
    .min(1, "Valor é obrigatório")
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, "Valor deve ser maior que zero"),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  dataVencimento: z.date({ required_error: "Data de vencimento é obrigatória" }),
  fornecedorCodigo: z.string().optional(),
  formaPagamento: z.string().optional(),
  observacoes: z.string().optional(),
  tipoPagamento: z.enum(["unico", "parcelado"], { required_error: "Selecione o tipo de pagamento" }),
  numeroParcelas: z.number().optional(),
  tipoValorParcela: z.enum(["total", "dividido"]).optional(),
});

type ContaPagarFormData = z.infer<typeof contaPagarSchema>;

interface ContaPagarDialogV2Props {
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

export function ContaPagarDialogV2({ open, onOpenChange, conta, onSuccess }: ContaPagarDialogV2Props) {
  const [loading, setLoading] = useState(false);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [showCategoriesManager, setShowCategoriesManager] = useState(false);
  const [tipoPagamento, setTipoPagamento] = useState<"unico" | "parcelado">("unico");
  const [numeroParcelas, setNumeroParcelas] = useState<number>(2);
  const [tipoValorParcela, setTipoValorParcela] = useState<"total" | "dividido">("dividido");

  const form = useForm<ContaPagarFormData>({
    resolver: zodResolver(contaPagarSchema),
    defaultValues: {
      descricao: "",
      valor: "",
      categoria: "",
      fornecedorCodigo: "",
      formaPagamento: "",
      observacoes: "",
      tipoPagamento: "unico",
      numeroParcelas: 2,
      tipoValorParcela: "dividido",
    }
  });

  useEffect(() => {
    loadFornecedores();
    loadCategorias();
  }, []);

  useEffect(() => {
    if (conta) {
      form.reset({
        descricao: conta.descricao || "",
        valor: conta.valor?.toString() || "",
        categoria: conta.categoria || "",
        dataVencimento: conta.dataVencimento ? new Date(conta.dataVencimento) : undefined,
        fornecedorCodigo: conta.fornecedorCodigo || "",
        formaPagamento: conta.formaPagamento || "",
        observacoes: conta.observacoes || "",
        tipoPagamento: "unico",
      });
    } else {
      form.reset({
        descricao: "",
        valor: "",
        categoria: "",
        fornecedorCodigo: "",
        formaPagamento: "",
        observacoes: "",
        tipoPagamento: "unico",
        numeroParcelas: 2,
        tipoValorParcela: "dividido",
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

  const calcularParcelas = () => {
    const valorTotal = parseFloat(form.watch("valor") || "0");
    const dataInicial = form.watch("dataVencimento");
    
    if (!valorTotal || !dataInicial) return [];

    const parcelas = [];
    const valorParcela = tipoValorParcela === "dividido" 
      ? valorTotal / numeroParcelas 
      : valorTotal;

    for (let i = 0; i < numeroParcelas; i++) {
      parcelas.push({
        numero: i + 1,
        valor: valorParcela,
        vencimento: addMonths(dataInicial, i),
      });
    }

    return parcelas;
  };

  const onSubmit = async (data: ContaPagarFormData) => {
    try {
      setLoading(true);

      if (tipoPagamento === "unico") {
        // Criar conta única
        const payload: any = {
          descricao: data.descricao.trim(),
          categoria: data.categoria,
          valor: parseFloat(data.valor),
          dataEmissao: new Date(),
          dataVencimento: new Date(data.dataVencimento),
          status: 'Pendente'
        };

        if (data.fornecedorCodigo && data.fornecedorCodigo.trim()) {
          payload.fornecedorCodigo = data.fornecedorCodigo.trim();
        }
        
        if (data.formaPagamento && data.formaPagamento.trim()) {
          payload.formaPagamento = data.formaPagamento;
        }
        
        if (data.observacoes && data.observacoes.trim()) {
          payload.observacoes = data.observacoes.trim();
        }

        if (conta) {
          await contasPagarAPI.update(conta.numeroDocumento, payload);
          toast.success("Conta a pagar atualizada com sucesso!");
        } else {
          await contasPagarAPI.create(payload);
          toast.success("Conta a pagar criada com sucesso!");
        }
      } else {
        // Criar parcelas
        const parcelas = calcularParcelas();
        
        for (let i = 0; i < parcelas.length; i++) {
          const parcela = parcelas[i];
          const payload: any = {
            descricao: `${data.descricao.trim()} - Parcela ${parcela.numero}/${numeroParcelas}`,
            categoria: data.categoria,
            valor: parcela.valor,
            dataEmissao: new Date(),
            dataVencimento: parcela.vencimento,
            status: 'Pendente',
            numeroParcela: parcela.numero,
            totalParcelas: numeroParcelas,
          };

          if (data.fornecedorCodigo && data.fornecedorCodigo.trim()) {
            payload.fornecedorCodigo = data.fornecedorCodigo.trim();
          }
          
          if (data.formaPagamento && data.formaPagamento.trim()) {
            payload.formaPagamento = data.formaPagamento;
          }
          
          if (data.observacoes && data.observacoes.trim()) {
            payload.observacoes = data.observacoes.trim();
          }

          await contasPagarAPI.create(payload);
        }

        toast.success(`${numeroParcelas} parcelas criadas com sucesso!`);
      }

      onSuccess();
      onOpenChange(false);
      form.reset();
      setTipoPagamento("unico");
      setNumeroParcelas(2);
      setTipoValorParcela("dividido");
    } catch (error: any) {
      console.error('Erro ao salvar conta:', error);
      toast.error(error.message || "Erro ao salvar conta a pagar");
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
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{conta ? "Editar" : "Nova"} Conta a Pagar</DialogTitle>
            <DialogDescription>
              Preencha os dados da conta a pagar
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Tipo de Pagamento */}
              {!conta && (
                <FormField
                  control={form.control}
                  name="tipoPagamento"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Tipo de Pagamento*</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => {
                            field.onChange(value);
                            setTipoPagamento(value as "unico" | "parcelado");
                          }}
                          value={tipoPagamento}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="unico" id="unico" />
                            <label htmlFor="unico" className="cursor-pointer">Pagamento Único</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="parcelado" id="parcelado" />
                            <label htmlFor="parcelado" className="cursor-pointer">Parcelado</label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="valor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Total*</FormLabel>
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
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição*</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Aluguel, Fornecedor X..." />
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
                      <FormLabel>Categoria*</FormLabel>
                      <div className="flex gap-2">
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-background z-50">
                            {categorias.map((cat) => (
                              <SelectItem key={cat.nome} value={cat.nome}>{cat.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setShowCategoriesManager(true)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dataVencimento"
                  render={({ field }) => (
                    <FormItem>
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
                                <span>Selecione</span>
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
                            locale={ptBR}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                            {forn.nomeFantasia || forn.razaoSocial}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Configuração de Parcelas */}
              {tipoPagamento === "parcelado" && !conta && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center gap-2 text-primary">
                      <Split className="h-5 w-5" />
                      <h3 className="font-semibold">Configuração de Parcelas</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Número de Parcelas*</label>
                        <Input
                          type="number"
                          min="2"
                          max="120"
                          value={numeroParcelas}
                          onChange={(e) => {
                            const valor = parseInt(e.target.value) || 2;
                            setNumeroParcelas(Math.max(2, Math.min(120, valor)));
                          }}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Tipo de Valor*</label>
                        <Select value={tipoValorParcela} onValueChange={(v) => setTipoValorParcela(v as "total" | "dividido")}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-background z-50">
                            <SelectItem value="dividido">Dividir valor total</SelectItem>
                            <SelectItem value="total">Valor total por parcela</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Preview das Parcelas */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">Parcelas a Criar:</h4>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {calcularParcelas().map((parcela) => (
                          <div 
                            key={parcela.numero} 
                            className="flex justify-between items-center text-sm p-2 rounded bg-background/50"
                          >
                            <span>Parcela {parcela.numero}/{numeroParcelas}</span>
                            <span className="font-medium">{formatCurrency(parcela.valor)}</span>
                            <span className="text-muted-foreground text-xs">
                              {format(parcela.vencimento, "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center font-bold pt-2 border-t">
                        <span>Total:</span>
                        <span className="text-lg">
                          {formatCurrency(
                            calcularParcelas().reduce((sum, p) => sum + p.valor, 0)
                          )}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

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

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false);
                    form.reset();
                    setTipoPagamento("unico");
                  }}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {tipoPagamento === "parcelado" ? `Criar ${numeroParcelas} Parcelas` : "Criar Conta"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Gerenciador de Categorias */}
      <CategoriasFinanceirasManager
        open={showCategoriesManager}
        onOpenChange={(isOpen) => {
          setShowCategoriesManager(isOpen);
          if (!isOpen) loadCategorias();
        }}
        tipo="pagar"
      />
    </>
  );
}
