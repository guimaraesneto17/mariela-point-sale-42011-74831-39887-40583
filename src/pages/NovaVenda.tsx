import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Plus, Trash2, ShoppingCart, Edit2, User, UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { SelectProductDialog } from "@/components/SelectProductDialog";
import { SelectClientDialog } from "@/components/SelectClientDialog";
import { SelectVendedorDialog } from "@/components/SelectVendedorDialog";
import { AlertDeleteDialog } from "@/components/ui/alert-delete-dialog";
import { ConfirmacaoVendaDialog } from "@/components/ConfirmacaoVendaDialog";
import { clientesAPI, vendedoresAPI, estoqueAPI, vendasAPI } from "@/lib/api";
import { formatInTimeZone } from "date-fns-tz";
import { startOfDay, endOfDay } from "date-fns";
import { CurrencyInput } from "@/components/ui/currency-input";

interface ItemVenda {
  codigoProduto: string;
  nomeProduto: string;
  cor: string;
  tamanho: string;
  quantidade: number;
  precoUnitario: number;
  descontoAplicado: number;
  descontoValor?: number;
  tipoDesconto: "porcentagem" | "valor";
  subtotal: number;
  emPromocao?: boolean;
  novidade?: boolean;
}

const NovaVenda = () => {
  const navigate = useNavigate();
  
  // Dialogs
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [showVendedorDialog, setShowVendedorDialog] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showConfirmacaoDialog, setShowConfirmacaoDialog] = useState(false);
  
  // Estados
  const [clienteSelecionado, setClienteSelecionado] = useState<{ codigo: string; nome: string } | null>(null);
  const [vendedorSelecionado, setVendedorSelecionado] = useState<{ codigo: string; nome: string } | null>(null);
  const [formaPagamento, setFormaPagamento] = useState("");
  const [tipoDesconto, setTipoDesconto] = useState<"porcentagem" | "valor">("porcentagem");
  const [descontoTotal, setDescontoTotal] = useState(0);
  const [itensVenda, setItensVenda] = useState<ItemVenda[]>([]);
  const [taxaMaquininha, setTaxaMaquininha] = useState(0);
  const [parcelas, setParcelas] = useState(1);
  
  // Estados para adicionar/editar produto
  const [produtoSelecionado, setProdutoSelecionado] = useState<any>(null);
  const [quantidadeProduto, setQuantidadeProduto] = useState(1);
  const [descontoProduto, setDescontoProduto] = useState(0);
  const [descontoValorProduto, setDescontoValorProduto] = useState("0");
  const [tipoDescontoProduto, setTipoDescontoProduto] = useState<"porcentagem" | "valor">("porcentagem");
  const [itemEmEdicao, setItemEmEdicao] = useState<number | null>(null);
  const [clientes, setClientes] = useState<any[]>([]);
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [estoque, setEstoque] = useState<any[]>([]);
  
  // Estado para rastrear estoque retido (key: codigoProduto-cor-tamanho, value: quantidade retida)
  const [estoqueRetido, setEstoqueRetido] = useState<Record<string, number>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [clientesData, vendedoresData, estoqueData] = await Promise.all([
        clientesAPI.getAll(),
        vendedoresAPI.getAll(),
        estoqueAPI.getAll(),
      ]);
      
      // Mapear clientes para ter o campo 'codigo'
      const clientesMapeados = clientesData.map((c: any) => ({
        ...c,
        codigo: c.codigoCliente || c.codigo
      }));
      
      // Mapear vendedores para ter o campo 'codigo'
      const vendedoresMapeados = vendedoresData.map((v: any) => ({
        ...v,
        codigo: v.codigoVendedor || v.codigo
      }));
      
      setClientes(clientesMapeados);
      setVendedores(vendedoresMapeados);
      setEstoque(estoqueData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    }
  };

  const generateCodigoVenda = async (): Promise<string> => {
    const TIMEZONE_BRASIL = 'America/Sao_Paulo';
    
    // Obter data atual no fuso horário do Brasil
    const hoje = new Date();
    const dataFormatada = formatInTimeZone(hoje, TIMEZONE_BRASIL, 'yyyyMMdd');
    
    try {
      // Buscar todas as vendas para verificar quantas foram feitas hoje
      const vendas = await vendasAPI.getAll();
      
      // Filtrar vendas que começam com o código do dia atual
      const vendasHoje = vendas.filter((venda: any) => {
        const codigoVenda = venda.codigoVenda || '';
        return codigoVenda.startsWith(`VENDA${dataFormatada}`);
      });
      
      // Próximo número sequencial
      const proximoNumero = vendasHoje.length + 1;
      return `VENDA${dataFormatada}-${String(proximoNumero).padStart(3, '0')}`;
    } catch (error) {
      console.error('Erro ao gerar código de venda:', error);
      // Fallback: usar 001 se não conseguir buscar vendas
      return `VENDA${dataFormatada}-001`;
    }
  };

  // Mock data - substituir por dados da API
  const mockClientes = [
    { codigo: "C001", nome: "Ana Souza" },
    { codigo: "C002", nome: "Fernanda Ribeiro" },
    { codigo: "C003", nome: "Maria Silva" },
  ];

  const mockVendedores = [
    { codigo: "V001", nome: "Carla Santos" },
    { codigo: "V002", nome: "Juliana Lima" },
  ];

  const mockEstoque = [
    { 
      codigoProduto: "P101", 
      nomeProduto: "Vestido Floral Curto", 
      precoVenda: 149.90, 
      categoria: "Vestido",
      cor: "Azul",
      tamanho: "M",
      quantidade: 10
    },
    { 
      codigoProduto: "P102", 
      nomeProduto: "Blusa Manga Longa", 
      precoVenda: 89.90, 
      categoria: "Blusa",
      cor: "Preto",
      tamanho: "G",
      quantidade: 5
    },
    { 
      codigoProduto: "P103", 
      nomeProduto: "Calça Jeans Skinny", 
      precoVenda: 199.90, 
      categoria: "Calça",
      cor: "Azul Escuro",
      tamanho: "38",
      quantidade: 8
    },
  ];

  // Calcular subtotal dos itens
  const subtotalItens = itensVenda.reduce((acc, item) => acc + item.subtotal, 0);
  
  // Calcular desconto total em reais
  const valorDescontoTotal = tipoDesconto === "porcentagem" 
    ? (subtotalItens * descontoTotal) / 100 
    : descontoTotal;
  
  // Total final
  const totalFinal = Math.max(0, subtotalItens - valorDescontoTotal);
  
  // Calcular taxa da maquininha e valor recebido
  const valorTaxaMaquininha = (totalFinal * taxaMaquininha) / 100;
  const valorRecebidoLojista = totalFinal - valorTaxaMaquininha;

  // Helper para criar chave única da variante
  const getVarianteKey = (codigoProduto: string, cor: string, tamanho: string) => {
    return `${codigoProduto}-${cor}-${tamanho}`;
  };

  // Helper para calcular estoque disponível considerando itens retidos
  const getEstoqueDisponivel = (codigoProduto: string, cor: string, tamanho: string, quantidadeOriginal: number) => {
    const key = getVarianteKey(codigoProduto, cor, tamanho);
    const retido = estoqueRetido[key] || 0;
    return Math.max(0, quantidadeOriginal - retido);
  };

  const adicionarOuEditarProduto = () => {
    if (!produtoSelecionado || quantidadeProduto <= 0) {
      toast.error("Selecione um produto e quantidade válida!");
      return;
    }

    const varianteKey = getVarianteKey(
      produtoSelecionado.codigoProduto,
      produtoSelecionado.cor,
      produtoSelecionado.tamanho
    );

    // Verificar se o produto já está na lista de itens COM O MESMO DESCONTO
    const descontoAtual = tipoDescontoProduto === "porcentagem" ? descontoProduto : parseFloat(descontoValorProduto);
    const itemExistente = itensVenda.findIndex(
      item => item.codigoProduto === produtoSelecionado.codigoProduto &&
              item.cor === produtoSelecionado.cor &&
              item.tamanho === produtoSelecionado.tamanho &&
              item.tipoDesconto === tipoDescontoProduto &&
              (tipoDescontoProduto === "porcentagem" 
                ? item.descontoAplicado === descontoAtual 
                : item.descontoValor === descontoAtual)
    );

    // Se não estiver editando e o item já existe COM MESMO DESCONTO, incrementar quantidade
    if (itemEmEdicao === null && itemExistente !== -1) {
      const novaQuantidade = itensVenda[itemExistente].quantidade + quantidadeProduto;
      
      // Verificar quantidade disponível considerando estoque retido
      const estoqueDisponivel = getEstoqueDisponivel(
        produtoSelecionado.codigoProduto,
        produtoSelecionado.cor,
        produtoSelecionado.tamanho,
        produtoSelecionado.quantidade || 0
      );
      
      if (quantidadeProduto > estoqueDisponivel) {
        toast.error(`Quantidade indisponível! Estoque disponível: ${estoqueDisponivel} un.`);
        return;
      }

      const novosItens = [...itensVenda];
      const precoBase = produtoSelecionado.emPromocao && produtoSelecionado.precoPromocional 
        ? Number(produtoSelecionado.precoPromocional) 
        : Number(produtoSelecionado.precoVenda ?? 0);
      const precoComDesconto = precoBase * (1 - itensVenda[itemExistente].descontoAplicado / 100);
      
      novosItens[itemExistente].quantidade = novaQuantidade;
      novosItens[itemExistente].subtotal = precoComDesconto * novaQuantidade;
      
      setItensVenda(novosItens);
      
      // Atualizar estoque retido
      setEstoqueRetido(prev => ({
        ...prev,
        [varianteKey]: (prev[varianteKey] || 0) + quantidadeProduto
      }));
      
      setProdutoSelecionado(null);
      setQuantidadeProduto(1);
      setDescontoProduto(0);
      toast.success("Quantidade atualizada!");
      return;
    }

    // Verificar quantidade disponível considerando estoque retido
    const estoqueDisponivel = getEstoqueDisponivel(
      produtoSelecionado.codigoProduto,
      produtoSelecionado.cor,
      produtoSelecionado.tamanho,
      produtoSelecionado.quantidade || 0
    );
    
    if (quantidadeProduto > estoqueDisponivel) {
      toast.error(`Quantidade indisponível! Estoque disponível: ${estoqueDisponivel} un.`);
      return;
    }

    // Usar preço promocional se o produto estiver em promoção, senão usar preço normal
    const precoBase = produtoSelecionado.emPromocao && produtoSelecionado.precoPromocional 
      ? Number(produtoSelecionado.precoPromocional) 
      : Number(produtoSelecionado.precoVenda ?? 0);
    
    // Calcular desconto baseado no tipo (porcentagem ou valor)
    let precoComDesconto = precoBase;
    const descontoValorNumerico = parseFloat(descontoValorProduto) || 0;
    if (tipoDescontoProduto === "porcentagem") {
      precoComDesconto = precoBase * (1 - descontoProduto / 100);
    } else {
      precoComDesconto = Math.max(0, precoBase - descontoValorNumerico);
    }
    
    const subtotal = precoComDesconto * quantidadeProduto;

    const novoItem: ItemVenda = {
      codigoProduto: produtoSelecionado.codigoProduto,
      nomeProduto: produtoSelecionado.nomeProduto,
      cor: produtoSelecionado.cor,
      tamanho: produtoSelecionado.tamanho,
      quantidade: quantidadeProduto,
      precoUnitario: precoBase,
      descontoAplicado: tipoDescontoProduto === "porcentagem" ? descontoProduto : 0,
      descontoValor: tipoDescontoProduto === "valor" ? descontoValorNumerico : undefined,
      tipoDesconto: tipoDescontoProduto,
      subtotal: subtotal,
      emPromocao: produtoSelecionado.emPromocao || false,
      novidade: produtoSelecionado.novidade || false
    };

    if (itemEmEdicao !== null) {
      // Ao editar, devolver o estoque retido do item antigo
      const itemAntigo = itensVenda[itemEmEdicao];
      const keyAntiga = getVarianteKey(itemAntigo.codigoProduto, itemAntigo.cor, itemAntigo.tamanho);
      
      setEstoqueRetido(prev => {
        const novo = { ...prev };
        novo[keyAntiga] = Math.max(0, (novo[keyAntiga] || 0) - itemAntigo.quantidade);
        novo[varianteKey] = (novo[varianteKey] || 0) + quantidadeProduto;
        return novo;
      });
      
      const novosItens = [...itensVenda];
      novosItens[itemEmEdicao] = novoItem;
      setItensVenda(novosItens);
      setItemEmEdicao(null);
      toast.success("Produto atualizado!");
    } else {
      // Adicionar novo item e reter estoque
      setItensVenda([...itensVenda, novoItem]);
      setEstoqueRetido(prev => ({
        ...prev,
        [varianteKey]: (prev[varianteKey] || 0) + quantidadeProduto
      }));
      toast.success("Produto adicionado!");
    }

    // Reset form
    setProdutoSelecionado(null);
    setQuantidadeProduto(1);
    setDescontoProduto(0);
    setDescontoValorProduto("0");
    setTipoDescontoProduto("porcentagem");
  };

  const editarProduto = (index: number) => {
    const item = itensVenda[index];
    const allEstoque = estoque.length > 0 ? estoque : mockEstoque;
    
    // Buscar o produto completo no estoque com todas as informações
    const itemEstoque = allEstoque.find(e => 
      e.codigoProduto === item.codigoProduto && 
      e.cor === item.cor && 
      e.tamanho === item.tamanho
    );
    
    // Se encontrou no estoque, usar o objeto completo com todas as informações
    if (itemEstoque) {
      setProdutoSelecionado({
        ...itemEstoque,
        // Garantir que as informações de promoção estão incluídas
        emPromocao: itemEstoque.emPromocao || false,
        precoPromocional: itemEstoque.precoPromocional || null,
        novidade: itemEstoque.novidade || false
      });
    }
    
    setQuantidadeProduto(item.quantidade);
    setTipoDescontoProduto(item.tipoDesconto);
    if (item.tipoDesconto === "porcentagem") {
      setDescontoProduto(item.descontoAplicado);
      setDescontoValorProduto("0");
    } else {
      setDescontoValorProduto(String(item.descontoValor || 0));
      setDescontoProduto(0);
    }
    setItemEmEdicao(index);
  };

  const cancelarEdicao = () => {
    setProdutoSelecionado(null);
    setQuantidadeProduto(1);
    setDescontoProduto(0);
    setDescontoValorProduto("0");
    setTipoDescontoProduto("porcentagem");
    setItemEmEdicao(null);
  };

  const [deleteItemDialogOpen, setDeleteItemDialogOpen] = useState(false);
  const [itemToDeleteIndex, setItemToDeleteIndex] = useState<number | null>(null);

  const removerProduto = (index: number) => {
    setItemToDeleteIndex(index);
    setDeleteItemDialogOpen(true);
  };

  const confirmDeleteItem = () => {
    if (itemToDeleteIndex !== null) {
      // Devolver estoque retido ao remover item
      const itemRemovido = itensVenda[itemToDeleteIndex];
      const varianteKey = getVarianteKey(
        itemRemovido.codigoProduto,
        itemRemovido.cor,
        itemRemovido.tamanho
      );
      
      setEstoqueRetido(prev => ({
        ...prev,
        [varianteKey]: Math.max(0, (prev[varianteKey] || 0) - itemRemovido.quantidade)
      }));
      
      setItensVenda(itensVenda.filter((_, i) => i !== itemToDeleteIndex));
      if (itemEmEdicao === itemToDeleteIndex) {
        cancelarEdicao();
      }
      toast.info("Produto removido e estoque liberado");
      setDeleteItemDialogOpen(false);
      setItemToDeleteIndex(null);
    }
  };

  const handleIniciarFinalizacao = () => {
    if (!clienteSelecionado) {
      toast.error("Selecione um cliente!");
      return;
    }
    if (!vendedorSelecionado) {
      toast.error("Selecione um vendedor!");
      return;
    }
    if (itensVenda.length === 0) {
      toast.error("Adicione pelo menos um produto!");
      return;
    }
    if (!formaPagamento) {
      toast.error("Selecione a forma de pagamento!");
      return;
    }

    // Abrir dialog de confirmação
    setShowConfirmacaoDialog(true);
  };

  const handleFinalizarVenda = async () => {

    // Validação de estoque em tempo real antes de finalizar
    try {
      const estoqueAtualizado = await estoqueAPI.getAll();
      
      for (const item of itensVenda) {
        const produtoEstoque = estoqueAtualizado.find(
          (e: any) => e.codigoProduto === item.codigoProduto
        );
        
        if (!produtoEstoque) {
          toast.error(`Produto ${item.nomeProduto} não encontrado no estoque!`);
          return;
        }
        
        // Verificar variante específica
        const variante = produtoEstoque.variantes?.find(
          (v: any) => v.cor === item.cor
        );
        
        if (!variante) {
          toast.error(`Variante ${item.cor} do produto ${item.nomeProduto} não encontrada!`);
          return;
        }
        
        // Verificar tamanho específico
        let quantidadeDisponivel = 0;
        if (Array.isArray(variante.tamanhos)) {
          const tamanhoObj = variante.tamanhos.find((t: any) => String(t.tamanho) === item.tamanho);
          quantidadeDisponivel = tamanhoObj?.quantidade || 0;
        } else if (variante.tamanho === item.tamanho) {
          quantidadeDisponivel = variante.quantidade || 0;
        }
        
        if (quantidadeDisponivel < item.quantidade) {
          toast.error(
            `Estoque insuficiente para ${item.nomeProduto} (${item.cor} - ${item.tamanho}). ` +
            `Disponível: ${quantidadeDisponivel}, Necessário: ${item.quantidade}`
          );
          return;
        }
      }
    } catch (error) {
      console.error('Erro ao validar estoque:', error);
      toast.error('Erro ao validar estoque. Tente novamente.');
      return;
    }

    try {
      const codigoVenda = await generateCodigoVenda();
      
      // Formatar data no formato ISO sem milissegundos (YYYY-MM-DDTHH:MM:SSZ)
      const now = new Date();
      const dataISO = now.toISOString().split('.')[0] + 'Z';
      
      const vendaData = {
        codigoVenda,
        data: dataISO,
        vendedor: {
          codigoVendedor: vendedorSelecionado.codigo,
          nome: vendedorSelecionado.nome
        },
        cliente: {
          codigoCliente: clienteSelecionado.codigo,
          nome: clienteSelecionado.nome
        },
        itens: itensVenda.map(item => {
          let precoFinal = item.precoUnitario;
          if (item.tipoDesconto === "porcentagem") {
            precoFinal = item.precoUnitario * (1 - item.descontoAplicado / 100);
          } else {
            precoFinal = Math.max(0, item.precoUnitario - (item.descontoValor || 0));
          }
          
          return {
            codigoProduto: item.codigoProduto,
            nomeProduto: item.nomeProduto,
            cor: item.cor,
            tamanho: item.tamanho,
            quantidade: item.quantidade,
            precoUnitario: item.precoUnitario,
            precoFinalUnitario: precoFinal,
            descontoAplicado: item.descontoAplicado,
            descontoValor: item.descontoValor,
            tipoDesconto: item.tipoDesconto,
            subtotal: item.subtotal
          };
        }),
        total: totalFinal,
        totalDesconto: valorDescontoTotal,
        formaPagamento,
        taxaMaquininha,
        valorTaxa: valorTaxaMaquininha,
        valorRecebido: valorRecebidoLojista,
        parcelas
      };

      await vendasAPI.create(vendaData);
      toast.success("Venda registrada com sucesso!");
      navigate("/vendas");
    } catch (error) {
      console.error('Erro ao registrar venda:', error);
      toast.error('Erro ao registrar venda');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-2">Nova Venda</h1>
        <p className="text-muted-foreground">Registrar uma nova venda</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda - Cliente e Vendedor */}
        <div className="space-y-6">
          {/* Seleção de Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cliente *</CardTitle>
            </CardHeader>
            <CardContent>
              {clienteSelecionado ? (
                <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium">{clienteSelecionado.nome}</p>
                      <p className="text-sm text-muted-foreground">{clienteSelecionado.codigo}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setClienteSelecionado(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => setShowClientDialog(true)}
                >
                  <User className="h-4 w-4 mr-2" />
                  Selecionar Cliente
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Seleção de Vendedor */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Vendedor *</CardTitle>
            </CardHeader>
            <CardContent>
              {vendedorSelecionado ? (
                <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium">{vendedorSelecionado.nome}</p>
                      <p className="text-sm text-muted-foreground">{vendedorSelecionado.codigo}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setVendedorSelecionado(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => setShowVendedorDialog(true)}
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Selecionar Vendedor
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Forma de Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Forma de Pagamento *</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Método</Label>
                <Select 
                  value={formaPagamento} 
                  onValueChange={(value) => {
                    setFormaPagamento(value);
                    // Zerar taxa e parcelas se não for cartão
                    if (value !== "Cartão de Crédito" && value !== "Cartão de Débito") {
                      setTaxaMaquininha(0);
                    }
                    // Zerar parcelas se não for cartão de crédito
                    if (value !== "Cartão de Crédito") {
                      setParcelas(1);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                    <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                    <SelectItem value="Pix">Pix</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Parcelas - só para Cartão de Crédito */}
              {formaPagamento === "Cartão de Crédito" && (
                <div>
                  <Label>Parcelas</Label>
                  <Select 
                    value={parcelas.toString()} 
                    onValueChange={(value) => setParcelas(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}x de R$ {(totalFinal / num).toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Taxa da Maquininha - para Cartão de Crédito e Débito */}
              {(formaPagamento === "Cartão de Crédito" || formaPagamento === "Cartão de Débito") && (
                <div>
                  <Label>Taxa da Maquininha (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={taxaMaquininha}
                    onChange={(e) => setTaxaMaquininha(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                  {taxaMaquininha > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Valor da taxa:</span>
                        <span>- R$ {valorTaxaMaquininha.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-medium text-accent">
                        <span>Recebido pelo Lojista:</span>
                        <span>R$ {valorRecebidoLojista.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna Central e Direita - Produtos */}
        <div className="lg:col-span-2 space-y-6">
          {/* Adicionar/Editar Produto */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {itemEmEdicao !== null ? <Edit2 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                {itemEmEdicao !== null ? "Editar Produto" : "Adicionar Produtos"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Seleção de Produto */}
                <div>
                  <Label>Produto *</Label>
                  {produtoSelecionado ? (
                    <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg mt-2">
                      <div>
                        <p className="font-medium">{produtoSelecionado.nomeProduto}</p>
                        <p className="text-sm text-muted-foreground">
                          {produtoSelecionado.codigoProduto} • {produtoSelecionado.cor} • {produtoSelecionado.tamanho}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Disponível: {produtoSelecionado.quantidade} un.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setProdutoSelecionado(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="w-full mt-2" 
                      onClick={() => setShowProductDialog(true)}
                    >
                      Selecionar Produto
                    </Button>
                  )}
                </div>

                {produtoSelecionado && (
                  <>
                    <div>
                      <Label>Valor Atual do Produto</Label>
                      {produtoSelecionado.emPromocao && produtoSelecionado.precoPromocional ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Input
                              value={`R$ ${Number(produtoSelecionado.precoPromocional).toFixed(2)}`}
                              disabled
                              className="bg-muted font-bold text-accent"
                            />
                            <Badge className="bg-accent text-accent-foreground">Promoção</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-through">
                            Preço normal: R$ {Number(produtoSelecionado.precoVenda ?? 0).toFixed(2)}
                          </p>
                        </div>
                      ) : (
                        <Input
                          value={`R$ ${Number(produtoSelecionado.precoVenda ?? 0).toFixed(2)}`}
                          disabled
                          className="bg-muted"
                        />
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Quantidade</Label>
                        <Input
                          type="number"
                          min="1"
                          value={quantidadeProduto}
                          onChange={(e) => setQuantidadeProduto(parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div>
                        <Label>Tipo de Desconto</Label>
                        <RadioGroup 
                          value={tipoDescontoProduto} 
                          onValueChange={(value: "porcentagem" | "valor") => setTipoDescontoProduto(value)}
                          className="flex gap-4 mt-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="porcentagem" id="tipo-porcentagem" />
                            <Label htmlFor="tipo-porcentagem" className="cursor-pointer">Porcentagem</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="valor" id="tipo-valor" />
                            <Label htmlFor="tipo-valor" className="cursor-pointer">Valor (R$)</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>

                    <div>
                      {tipoDescontoProduto === "porcentagem" ? (
                        <div>
                          <Label>Desconto (%)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={descontoProduto}
                            onChange={(e) => setDescontoProduto(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      ) : (
                        <div>
                          <Label>Desconto (R$)</Label>
                          <CurrencyInput
                            value={descontoValorProduto}
                            onValueChange={(value: string) => setDescontoValorProduto(value)}
                            placeholder="0.00"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {itemEmEdicao !== null && (
                        <Button variant="outline" onClick={cancelarEdicao} className="flex-1">
                          Cancelar
                        </Button>
                      )}
                      <Button onClick={adicionarOuEditarProduto} className="flex-1 gap-2">
                        {itemEmEdicao !== null ? (
                          <>
                            <Edit2 className="h-4 w-4" />
                            Salvar Alterações
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4" />
                            Adicionar Produto
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lista de Produtos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Itens da Venda ({itensVenda.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {itensVenda.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhum produto adicionado</p>
              ) : (
                <div className="space-y-2">
                  {itensVenda.map((item, index) => {
                    const handleQuantidadeChange = (novaQuantidade: number) => {
                      if (novaQuantidade <= 0) return;
                      
                      const varianteKey = getVarianteKey(item.codigoProduto, item.cor, item.tamanho);
                      const produtoEstoque = estoque.find(e => e.codigoProduto === item.codigoProduto);
                      
                      if (!produtoEstoque) {
                        toast.error("Produto não encontrado no estoque!");
                        return;
                      }
                      
                      const variante = produtoEstoque.variantes?.find((v: any) => v.cor === item.cor);
                      if (!variante) {
                        toast.error("Variante não encontrada!");
                        return;
                      }
                      
                      let quantidadeDisponivel = 0;
                      if (Array.isArray(variante.tamanhos)) {
                        const tamanhoObj = variante.tamanhos.find((t: any) => String(t.tamanho) === item.tamanho);
                        quantidadeDisponivel = tamanhoObj?.quantidade || 0;
                      } else if (variante.tamanho === item.tamanho) {
                        quantidadeDisponivel = variante.quantidade || 0;
                      }
                      
                      const retidoOutrosItens = estoqueRetido[varianteKey] - item.quantidade;
                      const disponivelReal = quantidadeDisponivel - retidoOutrosItens;
                      
                      if (novaQuantidade > disponivelReal) {
                        toast.error(`Apenas ${disponivelReal} unidades disponíveis!`);
                        return;
                      }
                      
                      const novosItens = [...itensVenda];
                      let precoComDesconto = item.precoUnitario;
                      if (item.tipoDesconto === "porcentagem") {
                        precoComDesconto = item.precoUnitario * (1 - item.descontoAplicado / 100);
                      } else if (item.descontoValor) {
                        precoComDesconto = Math.max(0, item.precoUnitario - item.descontoValor);
                      }
                      
                      novosItens[index] = {
                        ...item,
                        quantidade: novaQuantidade,
                        subtotal: precoComDesconto * novaQuantidade
                      };
                      
                      setItensVenda(novosItens);
                      setEstoqueRetido(prev => ({
                        ...prev,
                        [varianteKey]: retidoOutrosItens + novaQuantidade
                      }));
                      
                      toast.success("Quantidade atualizada!");
                    };
                    
                    return (
                      <div 
                        key={index} 
                        className={`flex items-center justify-between p-4 rounded-lg border ${
                          itemEmEdicao === index ? 'bg-primary/10 border-primary' : 'bg-background/50'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{item.nomeProduto}</p>
                            {item.emPromocao && (
                              <Badge className="bg-accent text-accent-foreground">Promoção</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {item.codigoProduto} • {item.cor} • Tam: {item.tamanho} • R$ {item.precoUnitario.toFixed(2)}
                            {item.tipoDesconto === "porcentagem" && item.descontoAplicado > 0 && (
                              <Badge className="ml-2 bg-secondary">-{item.descontoAplicado}%</Badge>
                            )}
                            {item.tipoDesconto === "valor" && item.descontoValor && item.descontoValor > 0 && (
                              <Badge className="ml-2 bg-secondary">-R$ {item.descontoValor.toFixed(2)}</Badge>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground">Qtd:</Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantidade}
                              onChange={(e) => handleQuantidadeChange(parseInt(e.target.value) || 1)}
                              className="w-20 h-9 text-center"
                            />
                          </div>
                          <p className="font-bold text-lg min-w-[100px] text-right">R$ {item.subtotal.toFixed(2)}</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removerProduto(index)}
                            className="hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resumo da Venda */}
          <Card className="bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">Resumo da Venda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-lg">
                <span>Subtotal:</span>
                <span className="font-medium">R$ {subtotalItens.toFixed(2)}</span>
              </div>
              
              <div className="space-y-2">
                <Label>Tipo de Desconto</Label>
                <RadioGroup value={tipoDesconto} onValueChange={(value: "porcentagem" | "valor") => setTipoDesconto(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="porcentagem" id="porcentagem" />
                    <Label htmlFor="porcentagem" className="font-normal">Porcentagem (%)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="valor" id="valor" />
                    <Label htmlFor="valor" className="font-normal">Valor (R$)</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex items-center justify-between">
                <Label>Desconto Total</Label>
                {tipoDesconto === "valor" ? (
                  <CurrencyInput
                    value={descontoTotal}
                    onValueChange={(value) => setDescontoTotal(parseFloat(value) || 0)}
                    className="w-32"
                    placeholder="R$ 0,00"
                  />
                ) : (
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    max="100"
                    value={descontoTotal}
                    onChange={(e) => setDescontoTotal(parseFloat(e.target.value) || 0)}
                    className="w-32"
                    placeholder="0%"
                  />
                )}
              </div>

              {descontoTotal > 0 && (
                <div className="flex justify-between text-lg text-accent">
                  <span>Desconto {tipoDesconto === "porcentagem" ? `(${descontoTotal}%)` : ""}:</span>
                  <span className="font-medium">- R$ {valorDescontoTotal.toFixed(2)}</span>
                </div>
              )}

              <div className="border-t pt-4 flex justify-between text-2xl font-bold">
                <span>Total:</span>
                <span className="text-primary">R$ {totalFinal.toFixed(2)}</span>
              </div>

              <Button
                onClick={handleIniciarFinalizacao} 
                className="w-full h-12 text-lg gap-2"
                disabled={itensVenda.length === 0 || !clienteSelecionado || !vendedorSelecionado}
              >
                <ShoppingCart className="h-5 w-5" />
                Finalizar Venda
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <SelectClientDialog 
        open={showClientDialog}
        onOpenChange={setShowClientDialog}
        clientes={clientes}
        onSelect={setClienteSelecionado}
        onClienteAdded={loadData}
      />
      
      <SelectVendedorDialog 
        open={showVendedorDialog}
        onOpenChange={setShowVendedorDialog}
        vendedores={vendedores}
        onSelect={setVendedorSelecionado}
      />

      <SelectProductDialog 
        open={showProductDialog}
        onOpenChange={setShowProductDialog}
        estoque={estoque.length > 0 ? estoque : mockEstoque}
        onSelect={setProdutoSelecionado}
        estoqueRetido={estoqueRetido}
      />

      <AlertDeleteDialog
        open={deleteItemDialogOpen}
        onOpenChange={setDeleteItemDialogOpen}
        onConfirm={confirmDeleteItem}
        title="Remover item da venda?"
        description="Este item será removido da venda. Esta ação não pode ser desfeita."
        itemName={itemToDeleteIndex !== null ? `${itensVenda[itemToDeleteIndex]?.nomeProduto} (${itensVenda[itemToDeleteIndex]?.cor} - ${itensVenda[itemToDeleteIndex]?.tamanho})` : undefined}
      />

      <ConfirmacaoVendaDialog
        open={showConfirmacaoDialog}
        onOpenChange={setShowConfirmacaoDialog}
        onConfirm={handleFinalizarVenda}
        clienteSelecionado={clienteSelecionado}
        vendedorSelecionado={vendedorSelecionado}
        formaPagamento={formaPagamento}
        itensVenda={itensVenda}
        subtotalItens={subtotalItens}
        valorDescontoTotal={valorDescontoTotal}
        totalFinal={totalFinal}
        taxaMaquininha={taxaMaquininha}
        valorTaxaMaquininha={valorTaxaMaquininha}
        valorRecebidoLojista={valorRecebidoLojista}
        parcelas={parcelas}
      />
    </div>
  );
};

export default NovaVenda;
