import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Plus, Trash2, ShoppingCart, Edit2, User, UserCheck, Package, Users, LogOut, RefreshCw, TrendingUp, Target, ChevronDown, ChevronUp, DollarSign, Calendar } from "lucide-react";
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
import { AlertDeleteDialog } from "@/components/ui/alert-delete-dialog";
import { ConfirmacaoVendaDialog } from "@/components/ConfirmacaoVendaDialog";
import { EstoqueConsultaDialog } from "@/components/vendedor/EstoqueConsultaDialog";
import { MinhasVendasDialog } from "@/components/vendedor/MinhasVendasDialog";
import { ClientesDialog } from "@/components/vendedor/ClientesDialog";
import { clientesAPI, vendedoresAPI, estoqueAPI, vendasAPI } from "@/lib/api";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { startOfMonth, endOfMonth, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { CurrencyInput } from "@/components/ui/currency-input";
import { NovaVendaSkeleton } from "@/components/NovaVendaSkeleton";
import { ContentTransition } from "@/components/ContentTransition";
import { useAuth } from "@/contexts/AuthContext";
import { ColorBadge } from "@/components/ColorBadge";
import logo from "@/logo.png";

interface ItemVenda {
  codigoProduto: string;
  nomeProduto: string;
  cor: string;
  tamanho: string;
  quantidade: number;
  precoUnitario: number;
  precoOriginal?: number;
  descontoAplicado: number;
  descontoValor?: number;
  tipoDesconto: "porcentagem" | "valor";
  subtotal: number;
  emPromocao?: boolean;
  novidade?: boolean;
}

const VendedorNovaVenda = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // Dialogs principais
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showConfirmacaoDialog, setShowConfirmacaoDialog] = useState(false);
  
  // Dialogs extras do vendedor
  const [showEstoqueDialog, setShowEstoqueDialog] = useState(false);
  const [showVendasDialog, setShowVendasDialog] = useState(false);
  const [showClientesDialog, setShowClientesDialog] = useState(false);
  
  // Estatísticas expandidas
  const [showEstatisticas, setShowEstatisticas] = useState(false);
  
  // Estados
  const [clienteSelecionado, setClienteSelecionado] = useState<{ codigo: string; nome: string } | null>(null);
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
  const [vendas, setVendas] = useState<any[]>([]);
  const [estoque, setEstoque] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Estado para rastrear estoque retido
  const [estoqueRetido, setEstoqueRetido] = useState<Record<string, number>>({});

  // Vendedor atual baseado no user
  const vendedorAtual = vendedores.find((v: any) => v.codigoVendedor === user?.codigoVendedor);

  // Calcular estatísticas do vendedor
  const calcularEstatisticas = () => {
    const TIMEZONE_BRASIL = 'America/Sao_Paulo';
    const agora = new Date();
    const agoraBrasil = toZonedTime(agora, TIMEZONE_BRASIL);
    
    // Filtrar vendas do vendedor atual
    const minhasVendas = vendas.filter((v: any) => 
      v.vendedor?.codigoVendedor === user?.codigoVendedor
    );
    
    // Vendas de hoje
    const inicioHoje = startOfDay(agoraBrasil);
    const fimHoje = endOfDay(agoraBrasil);
    
    const vendasHoje = minhasVendas.filter((v: any) => {
      const dataVenda = toZonedTime(new Date(v.data), TIMEZONE_BRASIL);
      return isWithinInterval(dataVenda, { start: inicioHoje, end: fimHoje });
    });
    
    const totalHoje = vendasHoje.reduce((acc: number, v: any) => acc + (v.total || 0), 0);
    const qtdHoje = vendasHoje.length;
    
    // Vendas do mês
    const inicioMes = startOfMonth(agoraBrasil);
    const fimMes = endOfMonth(agoraBrasil);
    
    const vendasMes = minhasVendas.filter((v: any) => {
      const dataVenda = toZonedTime(new Date(v.data), TIMEZONE_BRASIL);
      return isWithinInterval(dataVenda, { start: inicioMes, end: fimMes });
    });
    
    const totalMes = vendasMes.reduce((acc: number, v: any) => acc + (v.total || 0), 0);
    
    // Meta mensal
    const metaMensal = vendedorAtual?.metaMensal || 0;
    const progressoMeta = metaMensal > 0 ? Math.min(100, (totalMes / metaMensal) * 100) : 0;
    
    return { totalHoje, qtdHoje, totalMes, metaMensal, progressoMeta };
  };

  const estatisticas = calcularEstatisticas();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoadingData(true);
      const [clientesData, vendedoresData, estoqueData, vendasData] = await Promise.all([
        clientesAPI.getAll(),
        vendedoresAPI.getAll(),
        estoqueAPI.getAll(),
        vendasAPI.getAll(),
      ]);
      
      const clientesMapeados = clientesData.map((c: any) => ({
        ...c,
        codigo: c.codigoCliente || c.codigo
      }));
      
      const vendedoresMapeados = vendedoresData.map((v: any) => ({
        ...v,
        codigo: v.codigoVendedor || v.codigo
      }));
      
      const estoqueArray = estoqueData.data || estoqueData;
      
      setClientes(clientesMapeados);
      setVendedores(vendedoresMapeados);
      setEstoque(Array.isArray(estoqueArray) ? estoqueArray : []);
      setVendas(vendasData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
      setEstoque([]);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
    toast.success("Dados atualizados!");
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      toast.error("Erro ao fazer logout");
    }
  };

  const generateCodigoVenda = async (): Promise<string> => {
    const TIMEZONE_BRASIL = 'America/Sao_Paulo';
    const hoje = new Date();
    const dataFormatada = formatInTimeZone(hoje, TIMEZONE_BRASIL, 'yyyyMMdd');
    
    try {
      const vendasHoje = vendas.filter((venda: any) => {
        const codigoVenda = venda.codigoVenda || '';
        return codigoVenda.startsWith(`VENDA${dataFormatada}`);
      });
      
      const proximoNumero = vendasHoje.length + 1;
      return `VENDA${dataFormatada}-${String(proximoNumero).padStart(3, '0')}`;
    } catch (error) {
      return `VENDA${dataFormatada}-001`;
    }
  };

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

    if (itemEmEdicao === null && itemExistente !== -1) {
      const novaQuantidade = itensVenda[itemExistente].quantidade + quantidadeProduto;
      
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

    // Preço original (antes de qualquer promoção)
    const precoOriginal = Number(produtoSelecionado.precoVenda ?? 0);
    
    const precoBase = produtoSelecionado.emPromocao && produtoSelecionado.precoPromocional 
      ? Number(produtoSelecionado.precoPromocional) 
      : precoOriginal;
    
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
      precoOriginal: produtoSelecionado.emPromocao ? precoOriginal : undefined,
      descontoAplicado: tipoDescontoProduto === "porcentagem" ? descontoProduto : 0,
      descontoValor: tipoDescontoProduto === "valor" ? descontoValorNumerico : undefined,
      tipoDesconto: tipoDescontoProduto,
      subtotal: subtotal,
      emPromocao: produtoSelecionado.emPromocao || false,
      novidade: produtoSelecionado.novidade || false
    };

    if (itemEmEdicao !== null) {
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
      setItensVenda([...itensVenda, novoItem]);
      setEstoqueRetido(prev => ({
        ...prev,
        [varianteKey]: (prev[varianteKey] || 0) + quantidadeProduto
      }));
      toast.success("Produto adicionado!");
    }

    setProdutoSelecionado(null);
    setQuantidadeProduto(1);
    setDescontoProduto(0);
    setDescontoValorProduto("0");
    setTipoDescontoProduto("porcentagem");
  };

  const editarProduto = (index: number) => {
    const item = itensVenda[index];
    
    const itemEstoque = estoque.find(e =>
      e.codigoProduto === item.codigoProduto && 
      e.cor === item.cor && 
      e.tamanho === item.tamanho
    );
    
    if (itemEstoque) {
      setProdutoSelecionado({
        ...itemEstoque,
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
    if (!user?.codigoVendedor) {
      toast.error("Vendedor não identificado!");
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

    setShowConfirmacaoDialog(true);
  };

  const handleFinalizarVenda = async () => {
    try {
      const estoqueResponse = await estoqueAPI.getAll();
      const estoqueAtualizado = Array.isArray(estoqueResponse) 
        ? estoqueResponse 
        : (estoqueResponse?.data || []);
      
      for (const item of itensVenda) {
        const produtoEstoque = estoqueAtualizado.find(
          (e: any) => e.codigoProduto === item.codigoProduto
        );
        
        if (!produtoEstoque) {
          toast.error(`Produto ${item.nomeProduto} não encontrado no estoque!`);
          return;
        }
        
        const variante = produtoEstoque.variantes?.find(
          (v: any) => v.cor === item.cor
        );
        
        if (!variante) {
          toast.error(`Variante ${item.cor} do produto ${item.nomeProduto} não encontrada!`);
          return;
        }
        
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
      
      const now = new Date();
      const dataISO = now.toISOString().split('.')[0] + 'Z';
      
      const vendaData = {
        codigoVenda,
        data: dataISO,
        vendedor: {
          codigoVendedor: user?.codigoVendedor,
          nome: user?.nome || vendedorAtual?.nome
        },
        cliente: {
          codigoCliente: clienteSelecionado!.codigo,
          nome: clienteSelecionado!.nome
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
            precoOriginal: item.precoOriginal,
            precoFinalUnitario: precoFinal,
            descontoAplicado: item.descontoAplicado,
            descontoValor: item.descontoValor,
            tipoDesconto: item.tipoDesconto,
            subtotal: item.subtotal,
            emPromocao: item.emPromocao || false,
            novidade: item.novidade || false
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
      
      // Limpar formulário e recarregar dados
      setClienteSelecionado(null);
      setItensVenda([]);
      setFormaPagamento("");
      setDescontoTotal(0);
      setTaxaMaquininha(0);
      setParcelas(1);
      setEstoqueRetido({});
      setShowConfirmacaoDialog(false);
      
      loadData();
    } catch (error) {
      console.error('Erro ao registrar venda:', error);
      toast.error('Erro ao registrar venda');
    }
  };

  const handleQuantidadeChange = (index: number, novaQuantidade: number) => {
    if (novaQuantidade <= 0) return;
    
    const item = itensVenda[index];
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
    <div className="min-h-screen bg-background pb-40 md:pb-32">
      {/* Header simples */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#7c3aed] via-[#6d28d9] to-[#5b21b6] shadow-lg">
        <div className="flex items-center justify-between p-3 md:p-4">
          <div className="flex items-center gap-2 md:gap-3">
            <img src={logo} alt="Mariela PDV" className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover" />
            <div>
              <h1 className="text-white text-sm md:text-lg font-bold">Mariela PDV</h1>
              <p className="text-white/90 text-[10px] md:text-xs truncate max-w-[120px] md:max-w-none">Olá, {user?.nome || 'Vendedor'}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-white hover:bg-white/10 h-8 w-8 md:h-10 md:w-10"
            >
              <RefreshCw className={`h-4 w-4 md:h-5 md:w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-white hover:bg-white/10 h-8 w-8 md:h-10 md:w-10"
            >
              <LogOut className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="pt-16 md:pt-20 pb-8 px-2 md:px-4">
        <ContentTransition isLoading={isLoadingData} skeleton={<NovaVendaSkeleton />}>
          <div className="space-y-4 md:space-y-6 animate-fade-in max-w-7xl mx-auto">
            {/* Botões de ação rápida incorporados na página */}
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              <Button
                variant="outline"
                onClick={() => setShowEstoqueDialog(true)}
                className="flex flex-col items-center gap-1 md:gap-2 h-auto py-2 md:py-4 text-xs md:text-sm"
              >
                <Package className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                <span>Estoque</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowVendasDialog(true)}
                className="flex flex-col items-center gap-1 md:gap-2 h-auto py-2 md:py-4 text-xs md:text-sm"
              >
                <ShoppingCart className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                <span>Vendas</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowClientesDialog(true)}
                className="flex flex-col items-center gap-1 md:gap-2 h-auto py-2 md:py-4 text-xs md:text-sm"
              >
                <Users className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                <span>Clientes</span>
              </Button>
            </div>

            <div className="text-center">
              <h1 className="text-xl md:text-3xl font-bold text-foreground mb-1 md:mb-2">Nova Venda</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              {/* Coluna Esquerda - Cliente e Pagamento */}
              <div className="space-y-4 md:space-y-6">
                {/* Seleção de Cliente */}
                <Card>
                  <CardHeader className="p-3 md:p-6">
                    <CardTitle className="text-base md:text-lg">Cliente *</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
                    {clienteSelecionado ? (
                      <div className="flex items-center justify-between p-2 md:p-3 bg-primary/10 rounded-lg">
                        <div className="flex items-center gap-2 min-w-0">
                          <User className="h-4 w-4 text-primary shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-sm md:text-base truncate">{clienteSelecionado.nome}</p>
                            <p className="text-xs md:text-sm text-muted-foreground">{clienteSelecionado.codigo}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setClienteSelecionado(null)}
                          className="h-8 w-8 p-0 shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        variant="outline" 
                        className="w-full h-10 md:h-12 text-sm" 
                        onClick={() => setShowClientDialog(true)}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Selecionar Cliente
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Vendedor (fixo) */}
                <Card>
                  <CardHeader className="p-3 md:p-6">
                    <CardTitle className="text-base md:text-lg">Vendedor</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
                    <div className="flex items-center justify-between p-2 md:p-3 bg-primary/10 rounded-lg">
                      <div className="flex items-center gap-2 min-w-0">
                        <UserCheck className="h-4 w-4 text-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-sm md:text-base truncate">{user?.nome || vendedorAtual?.nome}</p>
                          <p className="text-xs md:text-sm text-muted-foreground">{user?.codigoVendedor}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Forma de Pagamento */}
                <Card>
                  <CardHeader className="p-3 md:p-6">
                    <CardTitle className="text-base md:text-lg">Forma de Pagamento *</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 md:p-6 md:pt-0 space-y-3 md:space-y-4">
                    <div>
                      <Label className="text-xs md:text-sm">Método</Label>
                      <Select 
                        value={formaPagamento} 
                        onValueChange={(value) => {
                          setFormaPagamento(value);
                          if (value !== "Cartão de Crédito" && value !== "Cartão de Débito") {
                            setTaxaMaquininha(0);
                          }
                          if (value !== "Cartão de Crédito") {
                            setParcelas(1);
                          }
                        }}
                      >
                        <SelectTrigger className="h-10 md:h-12 text-sm">
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

                    {formaPagamento === "Cartão de Crédito" && (
                      <div>
                        <Label className="text-xs md:text-sm">Parcelas</Label>
                        <Select 
                          value={parcelas.toString()} 
                          onValueChange={(value) => setParcelas(parseInt(value))}
                        >
                          <SelectTrigger className="h-10 md:h-12 text-sm">
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

                    {(formaPagamento === "Cartão de Crédito" || formaPagamento === "Cartão de Débito") && (
                      <div>
                        <Label className="text-xs md:text-sm">Taxa da Maquininha (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={taxaMaquininha}
                          onChange={(e) => setTaxaMaquininha(parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="h-10 md:h-12 text-sm"
                        />
                        {taxaMaquininha > 0 && (
                          <div className="mt-2 space-y-1">
                            <div className="flex justify-between text-xs md:text-sm text-muted-foreground">
                              <span>Valor da taxa:</span>
                              <span>- R$ {valorTaxaMaquininha.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-xs md:text-sm font-medium text-accent">
                              <span>Recebido:</span>
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
              <div className="lg:col-span-2 space-y-4 md:space-y-6">
                {/* Adicionar/Editar Produto */}
                <Card>
                  <CardHeader className="p-3 md:p-6">
                    <CardTitle className="text-base md:text-lg flex items-center gap-2">
                      {itemEmEdicao !== null ? <Edit2 className="h-4 w-4 md:h-5 md:w-5" /> : <Plus className="h-4 w-4 md:h-5 md:w-5" />}
                      {itemEmEdicao !== null ? "Editar Produto" : "Adicionar Produtos"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 md:p-6 md:pt-0 space-y-4 md:space-y-5">
                    {/* Seleção de Produto */}
                    <div>
                      <Label className="text-xs md:text-sm font-medium">Produto *</Label>
                      {produtoSelecionado ? (
                        <div className="mt-2 p-3 md:p-4 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-xl">
                          <div className="flex items-start justify-between gap-2 md:gap-3">
                            <div className="flex-1 space-y-1.5 md:space-y-2 min-w-0">
                              <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                                <h4 className="font-semibold text-sm md:text-base truncate">{produtoSelecionado.nomeProduto}</h4>
                                {produtoSelecionado.emPromocao && (
                                  <Badge className="bg-red-500 text-white text-[10px] md:text-xs">Promoção</Badge>
                                )}
                                {produtoSelecionado.novidade && (
                                  <Badge variant="secondary" className="text-[10px] md:text-xs">Novidade</Badge>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm flex-wrap">
                                <span className="text-muted-foreground font-mono">{produtoSelecionado.codigoProduto}</span>
                                <span className="text-muted-foreground hidden sm:inline">•</span>
                                <ColorBadge color={produtoSelecionado.cor} showLabel size="md" />
                                <span className="text-muted-foreground hidden sm:inline">•</span>
                                <Badge variant="outline" className="text-[10px] md:text-xs">{produtoSelecionado.tamanho}</Badge>
                              </div>
                              
                              <p className="text-[10px] md:text-xs text-muted-foreground">
                                Disponível: <span className="font-medium text-foreground">{produtoSelecionado.quantidade}</span> un.
                              </p>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 md:h-8 md:w-8 shrink-0"
                              onClick={() => setProdutoSelecionado(null)}
                            >
                              <X className="h-3 w-3 md:h-4 md:w-4" />
                            </Button>
                          </div>
                          
                          {/* Valor do Produto - Melhorado */}
                          <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-primary/20">
                            <Label className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wide">Valor Unitário</Label>
                            {produtoSelecionado.emPromocao && produtoSelecionado.precoPromocional ? (
                              <div className="mt-1.5 md:mt-2 flex items-baseline gap-2 md:gap-3 flex-wrap">
                                <span className="text-xl md:text-2xl font-bold text-red-600 dark:text-red-400">
                                  R$ {Number(produtoSelecionado.precoPromocional).toFixed(2)}
                                </span>
                                <span className="text-xs md:text-sm text-muted-foreground line-through">
                                  R$ {Number(produtoSelecionado.precoVenda ?? 0).toFixed(2)}
                                </span>
                                <Badge variant="destructive" className="text-[10px] md:text-xs">
                                  -{Math.round(((Number(produtoSelecionado.precoVenda ?? 0) - Number(produtoSelecionado.precoPromocional)) / Number(produtoSelecionado.precoVenda ?? 1)) * 100)}%
                                </Badge>
                              </div>
                            ) : (
                              <div className="mt-1.5 md:mt-2">
                                <span className="text-xl md:text-2xl font-bold text-foreground">
                                  R$ {Number(produtoSelecionado.precoVenda ?? 0).toFixed(2)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <Button 
                          variant="outline" 
                          className="w-full mt-2 h-10 md:h-12 border-dashed text-sm" 
                          onClick={() => setShowProductDialog(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Selecionar Produto
                        </Button>
                      )}
                    </div>

                    {produtoSelecionado && (
                      <>
                        {/* Quantidade e Tipo de Desconto */}
                        <div className="grid grid-cols-1 gap-3 md:gap-4">
                          <div>
                            <Label className="text-xs md:text-sm font-medium">Quantidade</Label>
                            <Input
                              type="number"
                              min="1"
                              max={produtoSelecionado.quantidade}
                              value={quantidadeProduto}
                              onChange={(e) => setQuantidadeProduto(parseInt(e.target.value) || 1)}
                              className="mt-1.5 h-10 md:h-12"
                            />
                          </div>
                          <div>
                            <Label className="text-xs md:text-sm font-medium">Tipo de Desconto</Label>
                            <RadioGroup 
                              value={tipoDescontoProduto} 
                              onValueChange={(value: "porcentagem" | "valor") => setTipoDescontoProduto(value)}
                              className="flex gap-4 mt-2"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="porcentagem" id="tipo-porcentagem" />
                                <Label htmlFor="tipo-porcentagem" className="cursor-pointer text-xs md:text-sm">Porcentagem</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="valor" id="tipo-valor" />
                                <Label htmlFor="tipo-valor" className="cursor-pointer text-xs md:text-sm">Valor (R$)</Label>
                              </div>
                            </RadioGroup>
                          </div>
                        </div>

                        {/* Campo de Desconto */}
                        <div>
                          {tipoDescontoProduto === "porcentagem" ? (
                            <div>
                              <Label className="text-xs md:text-sm font-medium">Desconto (%)</Label>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={descontoProduto}
                                onChange={(e) => setDescontoProduto(parseFloat(e.target.value) || 0)}
                                className="mt-1.5 h-10 md:h-12"
                              />
                            </div>
                          ) : (
                            <div>
                              <Label className="text-xs md:text-sm font-medium">Desconto (R$)</Label>
                              <CurrencyInput
                                value={descontoValorProduto}
                                onValueChange={(value: string) => setDescontoValorProduto(value)}
                                placeholder="0.00"
                                className="mt-1.5 h-10 md:h-12"
                              />
                            </div>
                          )}
                        </div>

                        {/* Botões de Ação */}
                        <div className="flex gap-2 pt-2">
                          {itemEmEdicao !== null && (
                            <Button variant="outline" onClick={cancelarEdicao} className="flex-1 h-10 md:h-12 text-sm">
                              Cancelar
                            </Button>
                          )}
                          <Button onClick={adicionarOuEditarProduto} className="flex-1 gap-2 h-10 md:h-12 text-sm">
                            {itemEmEdicao !== null ? (
                              <>
                                <Edit2 className="h-4 w-4" />
                                <span className="hidden sm:inline">Salvar Alterações</span>
                                <span className="sm:hidden">Salvar</span>
                              </>
                            ) : (
                              <>
                                <Plus className="h-4 w-4" />
                                <span className="hidden sm:inline">Adicionar Produto</span>
                                <span className="sm:hidden">Adicionar</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Lista de Produtos */}
                <Card>
                  <CardHeader className="p-3 md:p-6">
                    <CardTitle className="text-base md:text-lg flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 md:h-5 md:w-5" />
                      Itens da Venda ({itensVenda.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
                    {itensVenda.length === 0 ? (
                      <p className="text-muted-foreground text-center py-6 md:py-8 text-sm">Nenhum produto adicionado</p>
                    ) : (
                      <div className="space-y-2">
                        {itensVenda.map((item, index) => (
                          <div 
                            key={index} 
                            className={`p-3 md:p-4 rounded-lg border ${
                              itemEmEdicao === index ? 'bg-primary/10 border-primary' : 'bg-background/50'
                            }`}
                          >
                            {/* Mobile layout */}
                            <div className="flex flex-col gap-2 md:hidden">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <p className="font-medium text-sm truncate">{item.nomeProduto}</p>
                                    {item.emPromocao && (
                                      <Badge className="bg-accent text-accent-foreground text-[10px]">Promo</Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                    <ColorBadge color={item.cor} size="sm" />
                                    <Badge variant="outline" className="text-[10px]">{item.tamanho}</Badge>
                                    <span className="text-[10px] text-muted-foreground">{item.codigoProduto}</span>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removerProduto(index)}
                                  className="h-7 w-7 p-0 hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">Qtd:</span>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={item.quantidade}
                                    onChange={(e) => handleQuantidadeChange(index, parseInt(e.target.value) || 1)}
                                    className="w-16 h-8 text-center text-sm"
                                  />
                                  {item.tipoDesconto === "porcentagem" && item.descontoAplicado > 0 && (
                                    <Badge className="bg-secondary text-[10px]">-{item.descontoAplicado}%</Badge>
                                  )}
                                  {item.tipoDesconto === "valor" && item.descontoValor && item.descontoValor > 0 && (
                                    <Badge className="bg-secondary text-[10px]">-R${item.descontoValor.toFixed(0)}</Badge>
                                  )}
                                </div>
                                <p className="font-bold text-base">R$ {item.subtotal.toFixed(2)}</p>
                              </div>
                            </div>

                            {/* Desktop layout */}
                            <div className="hidden md:flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-medium">{item.nomeProduto}</p>
                                  <ColorBadge color={item.cor} size="sm" />
                                  <Badge variant="outline" className="text-xs">{item.tamanho}</Badge>
                                  {item.emPromocao && (
                                    <Badge className="bg-accent text-accent-foreground">Promoção</Badge>
                                  )}
                                  {item.novidade && (
                                    <Badge className="bg-blue-500 text-white">Novidade</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {item.codigoProduto} • R$ {item.precoUnitario.toFixed(2)}
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
                                    onChange={(e) => handleQuantidadeChange(index, parseInt(e.target.value) || 1)}
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
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Resumo da Venda */}
                <Card className="bg-primary/5">
                  <CardHeader className="p-3 md:p-6">
                    <CardTitle className="text-base md:text-lg">Resumo da Venda</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 md:p-6 md:pt-0 space-y-3 md:space-y-4">
                    <div className="flex justify-between text-base md:text-lg">
                      <span>Subtotal:</span>
                      <span className="font-medium">R$ {subtotalItens.toFixed(2)}</span>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs md:text-sm">Tipo de Desconto</Label>
                      <RadioGroup value={tipoDesconto} onValueChange={(value: "porcentagem" | "valor") => setTipoDesconto(value)} className="flex gap-4">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="porcentagem" id="porcentagem" />
                          <Label htmlFor="porcentagem" className="font-normal text-xs md:text-sm">Porcentagem (%)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="valor" id="valor" />
                          <Label htmlFor="valor" className="font-normal text-xs md:text-sm">Valor (R$)</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-xs md:text-sm shrink-0">Desconto Total</Label>
                      {tipoDesconto === "valor" ? (
                        <CurrencyInput
                          value={descontoTotal}
                          onValueChange={(value) => setDescontoTotal(parseFloat(value) || 0)}
                          className="w-28 md:w-32 h-10"
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
                          className="w-28 md:w-32 h-10"
                          placeholder="0%"
                        />
                      )}
                    </div>

                    {descontoTotal > 0 && (
                      <div className="flex justify-between text-base md:text-lg text-accent">
                        <span>Desconto {tipoDesconto === "porcentagem" ? `(${descontoTotal}%)` : ""}:</span>
                        <span className="font-medium">- R$ {valorDescontoTotal.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="border-t pt-3 md:pt-4 flex justify-between text-xl md:text-2xl font-bold">
                      <span>Total:</span>
                      <span className="text-primary">R$ {totalFinal.toFixed(2)}</span>
                    </div>

                    <Button
                      onClick={handleIniciarFinalizacao} 
                      className="w-full h-11 md:h-12 text-base md:text-lg gap-2"
                      disabled={itensVenda.length === 0 || !clienteSelecionado}
                    >
                      <ShoppingCart className="h-4 w-4 md:h-5 md:w-5" />
                      Finalizar Venda
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </ContentTransition>
      </main>

      {/* Dialogs */}
      <SelectClientDialog 
        open={showClientDialog}
        onOpenChange={setShowClientDialog}
        clientes={clientes}
        onSelect={setClienteSelecionado}
        onClienteAdded={loadData}
      />

      <SelectProductDialog 
        open={showProductDialog}
        onOpenChange={setShowProductDialog}
        estoque={estoque}
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
        vendedorSelecionado={{ codigo: user?.codigoVendedor || '', nome: user?.nome || vendedorAtual?.nome || '' }}
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

      {/* Dialogs extras do vendedor */}
      <EstoqueConsultaDialog
        open={showEstoqueDialog}
        onOpenChange={setShowEstoqueDialog}
        estoque={estoque}
      />

      <MinhasVendasDialog
        open={showVendasDialog}
        onOpenChange={setShowVendasDialog}
        vendas={vendas}
        codigoVendedor={user?.codigoVendedor || ''}
      />

      <ClientesDialog
        open={showClientesDialog}
        onOpenChange={setShowClientesDialog}
        clientes={clientes}
        onClienteUpdated={loadData}
      />

      {/* Footer com estatísticas expansíveis */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t shadow-lg">
        <Button
          variant="ghost"
          className="w-full flex items-center justify-between p-3 md:p-4 h-auto"
          onClick={() => setShowEstatisticas(!showEstatisticas)}
        >
          <div className="flex items-center gap-2 md:gap-3">
            <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            <span className="font-medium text-sm md:text-base">Estatísticas</span>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <span className="text-xs md:text-sm text-muted-foreground">
              Hoje: R$ {estatisticas.totalHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            {showEstatisticas ? (
              <ChevronDown className="h-4 w-4 md:h-5 md:w-5" />
            ) : (
              <ChevronUp className="h-4 w-4 md:h-5 md:w-5" />
            )}
          </div>
        </Button>

        {showEstatisticas && (
          <div className="p-3 md:p-4 pt-0 space-y-3 md:space-y-4 animate-fade-in max-h-[50vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              {/* Vendas Hoje */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
                    <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg">
                      <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                    </div>
                    <span className="text-[10px] md:text-sm text-muted-foreground">Vendas Hoje</span>
                  </div>
                  <p className="text-lg md:text-2xl font-bold text-primary">
                    R$ {estatisticas.totalHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] md:text-sm text-muted-foreground mt-0.5 md:mt-1">
                    {estatisticas.qtdHoje} venda{estatisticas.qtdHoje !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>

              {/* Vendas do Mês */}
              <Card className="bg-green-500/5 border-green-500/20">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
                    <div className="p-1.5 md:p-2 bg-green-500/10 rounded-lg">
                      <Calendar className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
                    </div>
                    <span className="text-[10px] md:text-sm text-muted-foreground">Vendas do Mês</span>
                  </div>
                  <p className="text-lg md:text-2xl font-bold text-green-600">
                    R$ {estatisticas.totalMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Meta Mensal */}
            <Card className="bg-amber-500/5 border-amber-500/20">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center justify-between mb-2 md:mb-3">
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <div className="p-1.5 md:p-2 bg-amber-500/10 rounded-lg">
                      <Target className="h-3 w-3 md:h-4 md:w-4 text-amber-600" />
                    </div>
                    <span className="text-xs md:text-sm font-medium">Meta Mensal</span>
                  </div>
                  <span className="text-sm md:text-lg font-bold text-amber-600">
                    {estatisticas.metaMensal > 0 ? `${estatisticas.progressoMeta.toFixed(1)}%` : 'Sem meta'}
                  </span>
                </div>
                
                {estatisticas.metaMensal > 0 && (
                  <>
                    <div className="w-full bg-muted rounded-full h-2 md:h-3">
                      <div 
                        className={`h-2 md:h-3 rounded-full transition-all duration-500 ${
                          estatisticas.progressoMeta >= 100 
                            ? 'bg-green-500' 
                            : estatisticas.progressoMeta >= 70 
                              ? 'bg-amber-500' 
                              : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, estatisticas.progressoMeta)}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1.5 md:mt-2 text-[10px] md:text-sm">
                      <span className="text-muted-foreground">
                        R$ {estatisticas.totalMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-muted-foreground">
                        R$ {estatisticas.metaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    {estatisticas.progressoMeta >= 100 && (
                      <div className="mt-1.5 md:mt-2 p-1.5 md:p-2 bg-green-500/10 rounded-lg text-center">
                        <span className="text-green-600 font-medium text-xs md:text-sm">🎉 Meta atingida!</span>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </footer>
    </div>
  );
};

export default VendedorNovaVenda;
