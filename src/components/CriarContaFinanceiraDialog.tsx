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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarIcon, Loader2, Settings } from "lucide-react";
import { format, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { contasPagarAPI, contasReceberAPI, fornecedoresAPI, clientesAPI, categoriasFinanceirasAPI } from "@/lib/api";
import { toast } from "sonner";
import { CategoriasFinanceirasManager } from "@/components/CategoriasFinanceirasManager";
import { CurrencyInput } from "@/components/ui/currency-input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const contaSchema = z.object({
  tipo: z.enum(["pagar", "receber"]),
  tipoCriacao: z.enum(["Unica", "Parcelamento", "Replica"]),
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
  clienteCodigo: z.string().optional(),
  observacoes: z.string().optional(),
  quantidadeParcelas: z.string().optional(),
  quantidadeReplicas: z.string().optional(),
});

type ContaFormData = z.infer<typeof contaSchema>;

interface CriarContaFinanceiraDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipo: "pagar" | "receber";
  onSuccess: () => void;
}

export function CriarContaFinanceiraDialog({ open, onOpenChange, tipo, onSuccess }: CriarContaFinanceiraDialogProps) {
  const [loading, setLoading] = useState(false);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [showCategoriesManager, setShowCategoriesManager] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [dataVencimentoInput, setDataVencimentoInput] = useState("");
  const [previewParcelas, setPreviewParcelas] = useState<any[]>([]);

  const form = useForm<ContaFormData>({
    resolver: zodResolver(contaSchema),
    defaultValues: {
      tipo,
      tipoCriacao: "Unica",
      descricao: "",
      valor: "",
      categoria: "",
      fornecedorCodigo: "",
      clienteCodigo: "",
      observacoes: "",
      quantidadeParcelas: "",
      quantidadeReplicas: "",
    }
  });

  const watchTipoCriacao = form.watch("tipoCriacao");
  const watchValor = form.watch("valor");
  const watchQuantidadeParcelas = form.watch("quantidadeParcelas");
  const watchQuantidadeReplicas = form.watch("quantidadeReplicas");
  const watchDataVencimento = form.watch("dataVencimento");

  useEffect(() => {
    if (open) {
      loadFornecedores();
      loadClientes();
      loadCategorias();
    }
  }, [open]);

  useEffect(() => {
    if (watchTipoCriacao === "Parcelamento" && watchValor && watchQuantidadeParcelas && watchDataVencimento) {
      calcularParcelas();
    } else if (watchTipoCriacao === "Replica" && watchValor && watchQuantidadeReplicas && watchDataVencimento) {
      calcularReplicas();
    } else {
      setPreviewParcelas([]);
    }
  }, [watchTipoCriacao, watchValor, watchQuantidadeParcelas, watchQuantidadeReplicas, watchDataVencimento]);

  const loadFornecedores = async () => {
    try {
      const data = await fornecedoresAPI.getAll();
      setFornecedores(data);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
    }
  };

  const loadClientes = async () => {
    try {
      const data = await clientesAPI.getAll();
      setClientes(data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const loadCategorias = async () => {
    try {
      const data = await categoriasFinanceirasAPI.getAll(tipo);
      setCategorias(data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const calcularParcelas = () => {
    const valor = parseFloat(watchValor);
    const numParcelas = parseInt(watchQuantidadeParcelas);
    const dataInicio = watchDataVencimento;

    if (!valor || !numParcelas || numParcelas < 1 || !dataInicio) {
      setPreviewParcelas([]);
      return;
    }

    const valorParcela = valor / numParcelas;
    const novasParcelas = [];

    for (let i = 0; i < numParcelas; i++) {
      const dataVenc = addMonths(dataInicio, i);
      novasParcelas.push({
        numero: i + 1,
        valor: valorParcela,
        dataVencimento: dataVenc,
      });
    }

    setPreviewParcelas(novasParcelas);
  };

  const calcularReplicas = () => {
    const valor = parseFloat(watchValor);
    const numReplicas = parseInt(watchQuantidadeReplicas);
    const dataInicio = watchDataVencimento;

    if (!valor || !numReplicas || numReplicas < 1 || !dataInicio) {
      setPreviewParcelas([]);
      return;
    }

    const novasReplicas = [];

    for (let i = 0; i < numReplicas; i++) {
      const dataVenc = addMonths(dataInicio, i);
      novasReplicas.push({
        numero: i + 1,
        valor,
        dataVencimento: dataVenc,
      });
    }

    setPreviewParcelas(novasReplicas);
  };

  const onSubmit = async (data: ContaFormData) => {
    try {
      setLoading(true);
      const api = data.tipo === "pagar" ? contasPagarAPI : contasReceberAPI;
      
      const payload: any = {
        tipoCriacao: data.tipoCriacao,
        descricao: data.descricao.trim(),
        categoria: data.categoria,
        dataVencimento: new Date(data.dataVencimento),
      };

      if (data.fornecedorCodigo && data.fornecedorCodigo.trim()) {
        payload.fornecedorCodigo = data.fornecedorCodigo.trim();
      }

      if (data.clienteCodigo && data.clienteCodigo.trim()) {
        payload.clienteCodigo = data.clienteCodigo.trim();
      }
      
      if (data.observacoes && data.observacoes.trim()) {
        payload.observacoes = data.observacoes.trim();
      }

      if (data.tipoCriacao === "Unica") {
        payload.valor = parseFloat(data.valor);
      } else if (data.tipoCriacao === "Parcelamento") {
        payload.valorTotal = parseFloat(data.valor);
        payload.quantidadeParcelas = parseInt(data.quantidadeParcelas!);
        payload.dataInicio = new Date(data.dataVencimento);
      } else if (data.tipoCriacao === "Replica") {
        payload.valor = parseFloat(data.valor);
        payload.quantidadeReplicas = parseInt(data.quantidadeReplicas!);
        payload.dataInicio = new Date(data.dataVencimento);
      }

      await api.create(payload);
      
      const tipoNome = data.tipo === "pagar" ? "pagar" : "receber";
      const criacaoNome = data.tipoCriacao === "Unica" ? "Conta" : 
                          data.tipoCriacao === "Parcelamento" ? "Parcelamento" : "Replicação";
      
      toast.success(`${criacaoNome} a ${tipoNome} criada com sucesso!`);
      onSuccess();
      onOpenChange(false);
      form.reset();
      setPreviewParcelas([]);
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
          <DialogTitle>Nova Conta a {tipo === "pagar" ? "Pagar" : "Receber"}</DialogTitle>
          <DialogDescription>
            Crie uma conta única, parcelamento ou replicação mensal
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tipoCriacao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Conta*</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Unica" id="unica" />
                        <label htmlFor="unica" className="cursor-pointer">Única</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Parcelamento" id="parcelamento" />
                        <label htmlFor="parcelamento" className="cursor-pointer">Parcelamento</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Replica" id="replica" />
                        <label htmlFor="replica" className="cursor-pointer">Replicação Mensal</label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {watchTipoCriacao === "Parcelamento" ? "Valor Total*" : 
                       watchTipoCriacao === "Replica" ? "Valor Mensal*" : "Valor*"}
                    </FormLabel>
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dataVencimento"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>
                      {watchTipoCriacao === "Unica" ? "Data de Vencimento*" : "Data de Início*"}
                    </FormLabel>
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <div className="relative w-full">
                            <Input
                              placeholder="dd/mm/aaaa"
                              value={
                                dataVencimentoInput ||
                                (field.value
                                  ? format(field.value, "dd/MM/yyyy", { locale: ptBR })
                                  : "")
                              }
                              onChange={(e) => {
                                const value = e.target.value;
                                setDataVencimentoInput(value);

                                const parts = value.split("/");
                                if (parts.length === 3) {
                                  const [dia, mes, ano] = parts;
                                  const diaNum = Number(dia);
                                  const mesNum = Number(mes);
                                  const anoNum = Number(ano);

                                  if (diaNum && mesNum && anoNum && ano.length === 4) {
                                    const parsed = new Date(anoNum, mesNum - 1, diaNum);
                                    if (!isNaN(parsed.getTime())) {
                                      field.onChange(parsed);
                                    }
                                  }
                                }
                              }}
                              className="pr-10"
                            />
                            <CalendarIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
                          </div>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-background z-50" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            if (!date) return;
                            field.onChange(date);
                            setDataVencimentoInput(
                              format(date, "dd/MM/yyyy", { locale: ptBR })
                            );
                            setCalendarOpen(false);
                          }}
                          locale={ptBR}
                          className="p-3 pointer-events-auto"
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchTipoCriacao === "Parcelamento" && (
                <FormField
                  control={form.control}
                  name="quantidadeParcelas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade de Parcelas*</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="1" placeholder="Ex: 12" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {watchTipoCriacao === "Replica" && (
                <FormField
                  control={form.control}
                  name="quantidadeReplicas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade de Meses*</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="1" placeholder="Ex: 12" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {tipo === "pagar" && (
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
                          <SelectItem key={forn.codigoFornecedor} value={forn.codigoFornecedor}>
                            {forn.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {tipo === "receber" && (
              <FormField
                control={form.control}
                name="clienteCodigo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione (opcional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background z-50">
                        {clientes.map((cli) => (
                          <SelectItem key={cli.codigoCliente} value={cli.codigoCliente}>
                            {cli.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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

            {(watchTipoCriacao === "Parcelamento" || watchTipoCriacao === "Replica") && previewParcelas.length > 0 && (
              <div className="border rounded-lg p-4 bg-muted/50">
                <h3 className="text-sm font-medium mb-3">
                  {watchTipoCriacao === "Parcelamento" ? "Parcelas a Criar" : "Réplicas a Criar"}
                </h3>
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
                      {previewParcelas.map((item) => (
                        <TableRow key={item.numero}>
                          <TableCell className="font-medium">
                            {item.numero}/{previewParcelas.length}
                          </TableCell>
                          <TableCell>
                            {format(item.dataVencimento, 'dd/MM/yyyy', { locale: ptBR })}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.valor)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-3 pt-3 border-t flex justify-between items-center">
                  <span className="text-sm font-medium">Total:</span>
                  <span className="text-lg font-bold text-primary">
                    {formatCurrency(previewParcelas.reduce((sum, p) => sum + p.valor, 0))}
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
                Criar
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
          tipo={tipo}
        />
      </DialogContent>
    </Dialog>
  );
}
