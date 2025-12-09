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
import { CalendarIcon, Loader2, Settings, Check, AlertCircle } from "lucide-react";
import { format, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { contasReceberAPI, clientesAPI, categoriasFinanceirasAPI } from "@/lib/api";
import { toast } from "sonner";
import { CategoriasFinanceirasManager } from "@/components/CategoriasFinanceirasManager";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const contaReceberSchema = z.object({
  descricao: z.string().min(3, "Descrição deve ter no mínimo 3 caracteres"),
  valor: z.string()
    .min(1, "Valor é obrigatório")
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, "Valor deve ser maior que zero"),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  dataVencimento: z.date({ required_error: "Data de vencimento é obrigatória" }),
  clienteCodigo: z.string().optional(),
  observacoes: z.string().optional(),
  tipoCriacao: z.enum(["Unica", "Parcelamento", "Replica"]),
  quantidadeParcelas: z.string().optional(),
  quantidadeReplicas: z.string().optional(),
});

type ContaReceberFormData = z.infer<typeof contaReceberSchema>;

interface ContaReceberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conta?: any;
  onSuccess: () => void;
}

export function ContaReceberDialog({ open, onOpenChange, conta, onSuccess }: ContaReceberDialogProps) {
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [showCategoriesManager, setShowCategoriesManager] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [dataVencimentoInput, setDataVencimentoInput] = useState("");
  const [parcelasPreview, setParcelasPreview] = useState<any[]>([]);
  const [replicasPreview, setReplicasPreview] = useState<any[]>([]);

  const form = useForm<ContaReceberFormData>({
    resolver: zodResolver(contaReceberSchema),
    defaultValues: {
      descricao: "",
      valor: "",
      categoria: "",
      clienteCodigo: "",
      observacoes: "",
      tipoCriacao: "Unica",
      quantidadeParcelas: "2",
      quantidadeReplicas: "2",
    }
  });

  const tipoCriacao = form.watch("tipoCriacao");
  const valor = form.watch("valor");
  const quantidadeParcelas = form.watch("quantidadeParcelas");
  const quantidadeReplicas = form.watch("quantidadeReplicas");
  const dataVencimento = form.watch("dataVencimento");

  useEffect(() => {
    loadClientes();
    loadCategorias();
  }, []);

  useEffect(() => {
    if (conta) {
      const vencimento = conta.dataVencimento ? new Date(conta.dataVencimento) : undefined;
      form.reset({
        descricao: conta.descricao || "",
        valor: conta.valor?.toString() || "",
        categoria: conta.categoria || "",
        dataVencimento: vencimento,
        clienteCodigo: conta.clienteCodigo || "",
        observacoes: conta.observacoes || "",
        tipoCriacao: "Unica",
        quantidadeParcelas: "2",
        quantidadeReplicas: "2",
      });
      setDataVencimentoInput(
        vencimento ? format(vencimento, "dd/MM/yyyy", { locale: ptBR }) : ""
      );
    } else {
      form.reset({
        descricao: "",
        valor: "",
        categoria: "",
        clienteCodigo: "",
        observacoes: "",
        tipoCriacao: "Unica",
        quantidadeParcelas: "2",
        quantidadeReplicas: "2",
      });
      setDataVencimentoInput("");
    }
  }, [conta, open]);

  useEffect(() => {
    if (tipoCriacao === "Parcelamento" && valor && quantidadeParcelas && dataVencimento) {
      calcularParcelas();
    } else if (tipoCriacao === "Replica" && valor && quantidadeReplicas && dataVencimento) {
      calcularReplicas();
    }
  }, [tipoCriacao, valor, quantidadeParcelas, quantidadeReplicas, dataVencimento]);

  const calcularParcelas = () => {
    const valorTotal = parseFloat(valor);
    const qtd = parseInt(quantidadeParcelas || "2");
    const valorParcela = valorTotal / qtd;

    const parcelas = [];
    for (let i = 0; i < qtd; i++) {
      parcelas.push({
        numero: i + 1,
        valor: valorParcela,
        dataVencimento: addMonths(dataVencimento, i),
      });
    }
    setParcelasPreview(parcelas);
  };

  const calcularReplicas = () => {
    const valorTotal = parseFloat(valor);
    const qtd = parseInt(quantidadeReplicas || "2");

    const replicas = [];
    for (let i = 0; i < qtd; i++) {
      replicas.push({
        numero: i + 1,
        valor: valorTotal,
        dataVencimento: addMonths(dataVencimento, i),
      });
    }
    setReplicasPreview(replicas);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
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
      const data = await categoriasFinanceirasAPI.getAll('receber');
      setCategorias(data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const onSubmit = async (data: ContaReceberFormData) => {
    try {
      setLoading(true);
      
      const payload: any = {
        descricao: data.descricao.trim(),
        categoria: data.categoria,
        dataEmissao: new Date(),
        dataVencimento: new Date(data.dataVencimento),
        tipoCriacao: data.tipoCriacao,
      };

      if (data.clienteCodigo && data.clienteCodigo.trim()) {
        payload.clienteCodigo = data.clienteCodigo.trim();
      }
      
      if (data.observacoes && data.observacoes.trim()) {
        payload.observacoes = data.observacoes.trim();
      }

      // Adicionar campos específicos por tipo
      if (data.tipoCriacao === "Parcelamento") {
        payload.valorTotal = parseFloat(data.valor);
        payload.quantidadeParcelas = parseInt(data.quantidadeParcelas || "2");
        payload.dataInicio = new Date(data.dataVencimento);
      } else if (data.tipoCriacao === "Replica") {
        payload.valor = parseFloat(data.valor);
        payload.quantidadeReplicas = parseInt(data.quantidadeReplicas || "2");
        payload.dataInicio = new Date(data.dataVencimento);
      } else {
        // Unica
        payload.valor = parseFloat(data.valor);
      }

      console.log('📤 Payload enviado:', payload);

      if (conta) {
        await contasReceberAPI.update(conta.numeroDocumento, payload);
        toast.success("Conta a receber atualizada com sucesso!");
      } else {
        await contasReceberAPI.create(payload);
        toast.success("Conta a receber criada com sucesso!");
      }

      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      console.error('Erro ao salvar conta:', error);
      toast.error(error.message || "Erro ao salvar conta a receber");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{conta ? "Editar" : "Nova"} Conta a Receber</DialogTitle>
          <DialogDescription>
            Preencha os dados da conta a receber
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <FormField
              control={form.control}
              name="tipoCriacao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Criação*</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Unica" id="unica-receber" />
                        <label htmlFor="unica-receber" className="cursor-pointer">Única</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Parcelamento" id="parcelamento-receber" />
                        <label htmlFor="parcelamento-receber" className="cursor-pointer">Parcelamento</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Replica" id="replica-receber" />
                        <label htmlFor="replica-receber" className="cursor-pointer">Réplica</label>
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
              render={({ field, fieldState }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormLabel>Descrição*</FormLabel>
                    {fieldState.isDirty && !fieldState.error && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                    {fieldState.error && (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Descrição da conta"
                      className={`${
                        fieldState.isDirty && !fieldState.error
                          ? 'border-green-500 focus-visible:ring-green-500'
                          : fieldState.error
                          ? 'border-destructive focus-visible:ring-destructive'
                          : ''
                      }`}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="valor"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>Valor Total*</FormLabel>
                      {fieldState.isDirty && !fieldState.error && parseFloat(field.value) > 0 && (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                      {fieldState.error && (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                    <FormControl>
                      <CurrencyInput 
                        {...field} 
                        placeholder="R$ 0,00"
                        onValueChange={field.onChange}
                        className={`${
                          fieldState.isDirty && !fieldState.error && parseFloat(field.value) > 0
                            ? 'border-green-500 focus-visible:ring-green-500'
                            : fieldState.error
                            ? 'border-destructive focus-visible:ring-destructive'
                            : ''
                        }`}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoria"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FormLabel>Categoria*</FormLabel>
                        {field.value && !fieldState.error && (
                          <Check className="h-4 w-4 text-green-600" />
                        )}
                        {fieldState.error && (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
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
                        <SelectTrigger className={`${
                          field.value && !fieldState.error
                            ? 'border-green-500 focus:ring-green-500'
                            : fieldState.error
                            ? 'border-destructive focus:ring-destructive'
                            : ''
                        }`}>
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dataVencimento"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>
                      {tipoCriacao === "Parcelamento" ? "Data do 1º Vencimento*" : 
                       tipoCriacao === "Replica" ? "Data do 1º Vencimento*" : 
                       "Data de Vencimento*"}
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

              {tipoCriacao === "Parcelamento" && (
                <FormField
                  control={form.control}
                  name="quantidadeParcelas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade de Parcelas*</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="2" placeholder="Ex: 3" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {tipoCriacao === "Replica" && (
                <FormField
                  control={form.control}
                  name="quantidadeReplicas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade de Réplicas*</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="2" placeholder="Ex: 12" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

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
                        <SelectItem key={cli.codigo} value={cli.codigo}>
                          {cli.nome}
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

            {tipoCriacao === "Parcelamento" && parcelasPreview.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Pré-visualização das Parcelas</h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Parcela</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Vencimento</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parcelasPreview.map((parcela) => (
                        <TableRow key={parcela.numero}>
                          <TableCell>{parcela.numero}/{parcelasPreview.length}</TableCell>
                          <TableCell>{formatCurrency(parcela.valor)}</TableCell>
                          <TableCell>{format(parcela.dataVencimento, "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {tipoCriacao === "Replica" && replicasPreview.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Pré-visualização das Réplicas</h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Réplica</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Vencimento</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {replicasPreview.map((replica) => (
                        <TableRow key={replica.numero}>
                          <TableCell>{replica.numero}/{replicasPreview.length}</TableCell>
                          <TableCell>{formatCurrency(replica.valor)}</TableCell>
                          <TableCell>{format(replica.dataVencimento, "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

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
              loadCategorias();
            }
          }}
          tipo="receber"
        />
      </DialogContent>
    </Dialog>
  );
}