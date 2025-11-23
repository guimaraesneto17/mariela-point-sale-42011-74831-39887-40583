import { useState, useEffect } from "react";
import { Package, Search, Plus, Minus, Tag, Sparkles, Filter, List, History, Image as ImageIcon, ChevronDown, Star, X, ArrowUpDown, Package2, Grid3X3, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { StockEntryDialog } from "@/components/StockEntryDialog";
import { StockExitDialog } from "@/components/StockExitDialog";
import { PromotionDialog } from "@/components/PromotionDialog";
import { NovidadeDialog } from "@/components/NovidadeDialog";
import { MovimentacaoDialog } from "@/components/MovimentacaoDialog";
import { PromocaoHistoricoDialog } from "@/components/PromocaoHistoricoDialog";
import { EditVariantImagesDialog } from "@/components/EditVariantImagesDialog";
import { ImageGalleryLightbox } from "@/components/ImageGalleryLightbox";
import { AddMultipleVariantsDialog } from "@/components/AddMultipleVariantsDialog";
import { HistoricoPrecosDialog } from "@/components/HistoricoPrecosDialog";

import { estoqueAPI } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import { getDefaultImageByCategory } from "@/lib/defaultImages";
import { GlobalLoading } from "@/components/GlobalLoading";
import { EstoqueAnalyticsCard } from "@/components/EstoqueAnalyticsCard";

const Estoque = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showEntryDialog, setShowEntryDialog] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [showNovidadeDialog, setShowNovidadeDialog] = useState(false);
  const [showMovimentacaoDialog, setShowMovimentacaoDialog] = useState(false);
  const [showPromocaoHistoricoDialog, setShowPromocaoHistoricoDialog] = useState(false);
  const [showEditImagesDialog, setShowEditImagesDialog] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showMultipleVariantsDialog, setShowMultipleVariantsDialog] = useState(false);
  const [showHistoricoPrecos, setShowHistoricoPrecos] = useState(false);
  const [produtoHistorico, setProdutoHistorico] = useState<any>(null);
  
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPromocao, setFilterPromocao] = useState<boolean | null>(null);
  const [filterNovidade, setFilterNovidade] = useState<boolean | null>(null);
  const [filterCor, setFilterCor] = useState<string>("todas");
  const [filterTamanho, setFilterTamanho] = useState<string>("todos");
  const [filterCategoria, setFilterCategoria] = useState<string>("todas");
  const [filterQuantidade, setFilterQuantidade] = useState<string>("todas");
  const [filterQuantidadeRange, setFilterQuantidadeRange] = useState<string>("todos");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sortBy, setSortBy] = useState<string>("nome"); // nome, preco-asc, preco-desc, quantidade-asc, quantidade-desc, data-entrada
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // Novos filtros avançados
  const [filterPrecoMin, setFilterPrecoMin] = useState<string>("");
  const [filterPrecoMax, setFilterPrecoMax] = useState<string>("");
  const [filterFornecedor, setFilterFornecedor] = useState<string>("todos");
  const [filterDataEntrada, setFilterDataEntrada] = useState<string>("todas");
  
  // State para selecionar cor/tamanho por item
  const [selectedColorByItem, setSelectedColorByItem] = useState<{[key: string]: string}>({});
  const [selectedSizeByItem, setSelectedSizeByItem] = useState<{[key: string]: string}>({});
  
  // State para controlar seções colapsáveis por item
  const [movimentacoesOpen, setMovimentacoesOpen] = useState<{[key: string]: boolean}>({});
  const [promocoesOpen, setPromocoesOpen] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    loadEstoque();
  }, []);

  const loadEstoque = async () => {
    try {
      setLoading(true);
      const data = await estoqueAPI.getAll();
      console.log('📦 Dados recebidos do estoque:', data);
      if (data.length > 0) {
        console.log('📝 Primeiro item:', data[0]);
        console.log('📝 logMovimentacao do primeiro item:', data[0].logMovimentacao);
      }
      setInventory(data);
      
      // Inicializar seleção de cor e tamanho para cada item
      const initialColors: {[key: string]: string} = {};
      const initialSizes: {[key: string]: string} = {};
      
      data.forEach((item: any) => {
        if (item.variantes && item.variantes.length > 0) {
          initialColors[item.codigoProduto] = item.variantes[0].cor;
          const tamanhosVariante0 = item.variantes[0].tamanhos;
          let primeiroTamanho = '';
          if (Array.isArray(tamanhosVariante0) && tamanhosVariante0.length > 0) {
            // Nova estrutura: array de objetos {tamanho, quantidade}
            if (typeof tamanhosVariante0[0] === 'object' && tamanhosVariante0[0].tamanho) {
              primeiroTamanho = tamanhosVariante0[0].tamanho;
            } else {
              // Estrutura antiga: array de strings
              primeiroTamanho = tamanhosVariante0[0];
            }
          } else if (item.variantes[0].tamanho) {
            primeiroTamanho = item.variantes[0].tamanho;
          }
          initialSizes[item.codigoProduto] = primeiroTamanho;
        }
      });
      
      setSelectedColorByItem(initialColors);
      setSelectedSizeByItem(initialSizes);
    } catch (error) {
      console.error('Erro ao carregar estoque:', error);
      toast.error('Erro ao carregar estoque');
    } finally {
      setLoading(false);
    }
  };

  // Função para contar itens por categoria (com filtros aplicados)
  const getCountByCategoria = (categoria: string) => {
    return inventory.filter(item => {
      const nomeProduto = item.nomeProduto || '';
      const codigoProduto = item.codigoProduto || '';
      
      const matchesSearch = nomeProduto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        codigoProduto.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPromocao = filterPromocao === null || item.emPromocao === filterPromocao;
      const matchesNovidade = filterNovidade === null || item.isNovidade === filterNovidade;
      const matchesCategoria = categoria === "todas" || item.categoria === categoria;
      
      return matchesSearch && matchesPromocao && matchesNovidade && matchesCategoria;
    }).length;
  };

  // Função para contar itens por cor (com filtros aplicados, exceto cor)
  const getCountByCor = (cor: string) => {
    return inventory.filter(item => {
      const nomeProduto = item.nomeProduto || '';
      const codigoProduto = item.codigoProduto || '';
      const categoria = item.categoria || '';
      
      const matchesSearch = nomeProduto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        codigoProduto.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPromocao = filterPromocao === null || item.emPromocao === filterPromocao;
      const matchesNovidade = filterNovidade === null || item.isNovidade === filterNovidade;
      const matchesCategoria = filterCategoria === "todas" || categoria === filterCategoria;
      const matchesCor = cor === "todas" || item.variantes?.some((v: any) => v.cor === cor && v.quantidade > 0);
      
      return matchesSearch && matchesPromocao && matchesNovidade && matchesCategoria && matchesCor;
    }).length;
  };

  // Função para contar itens por tamanho (com filtros aplicados, exceto tamanho)
  const getCountByTamanho = (tamanho: string) => {
    return inventory.filter(item => {
      const nomeProduto = item.nomeProduto || '';
      const codigoProduto = item.codigoProduto || '';
      const categoria = item.categoria || '';
      
      const matchesSearch = nomeProduto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        codigoProduto.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPromocao = filterPromocao === null || item.emPromocao === filterPromocao;
      const matchesNovidade = filterNovidade === null || item.isNovidade === filterNovidade;
      const matchesCategoria = filterCategoria === "todas" || categoria === filterCategoria;
      const matchesCor = filterCor === "todas" || 
        (item.variantes && item.variantes.some((v: any) => v.cor === filterCor && v.quantidade > 0));
      const matchesTamanho = tamanho === "todos" || 
        item.variantes?.some((v: any) => {
          if (!Array.isArray(v.tamanhos) || v.tamanhos.length === 0) {
            return v.tamanho === tamanho && v.quantidade > 0;
          }
          if (typeof v.tamanhos[0] === 'object' && v.tamanhos[0].tamanho) {
            return v.tamanhos.some((t: any) => t.tamanho === tamanho) && v.quantidade > 0;
          }
          return v.tamanhos.includes(tamanho) && v.quantidade > 0;
        });
      
      return matchesSearch && matchesPromocao && matchesNovidade && matchesCategoria && matchesCor && matchesTamanho;
    }).length;
  };

  const filteredInventory = inventory.filter(item => {
    const nomeProduto = item.nomeProduto || '';
    const codigoProduto = item.codigoProduto || '';
    const categoria = item.categoria || '';
    
    // Filtro de texto
    const matchesSearch = nomeProduto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      codigoProduto.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro de promoção
    const matchesPromocao = filterPromocao === null || item.emPromocao === filterPromocao;
    
    // Filtro de novidade
    const matchesNovidade = filterNovidade === null || item.isNovidade === filterNovidade;
    
    // Filtro de categoria
    const matchesCategoria = filterCategoria === "todas" || categoria === filterCategoria;
    
    // Filtro de cor
    const matchesCor = filterCor === "todas" || 
      (item.variantes && item.variantes.some((v: any) => v.cor === filterCor && v.quantidade > 0));
    
    // Filtro de tamanho - agora verifica o array de tamanhos
    const matchesTamanho = filterTamanho === "todos" || 
      (item.variantes && item.variantes.some((v: any) => {
        if (!Array.isArray(v.tamanhos) || v.tamanhos.length === 0) {
          return v.tamanho === filterTamanho && v.quantidade > 0;
        }
        // Nova estrutura: array de objetos {tamanho, quantidade}
        if (typeof v.tamanhos[0] === 'object' && v.tamanhos[0].tamanho) {
          return v.tamanhos.some((t: any) => t.tamanho === filterTamanho) && v.quantidade > 0;
        }
        // Estrutura antiga: array de strings
        return v.tamanhos.includes(filterTamanho) && v.quantidade > 0;
      }));
    
    // Filtro de quantidade (básico)
    const quantidadeTotal = item.variantes?.reduce((total: number, v: any) => total + (v.quantidade || 0), 0) || 0;
    const matchesQuantidade = filterQuantidade === "todas" ||
      (filterQuantidade === "baixo" && quantidadeTotal > 0 && quantidadeTotal <= 10) ||
      (filterQuantidade === "zerado" && quantidadeTotal === 0) ||
      (filterQuantidade === "disponivel" && quantidadeTotal > 10);
    
    // Filtro de quantidade por range personalizado
    const matchesQuantidadeRange = filterQuantidadeRange === "todos" ||
      (filterQuantidadeRange === "0-5" && quantidadeTotal >= 0 && quantidadeTotal <= 5) ||
      (filterQuantidadeRange === "6-10" && quantidadeTotal >= 6 && quantidadeTotal <= 10) ||
      (filterQuantidadeRange === "11-20" && quantidadeTotal >= 11 && quantidadeTotal <= 20) ||
      (filterQuantidadeRange === "21-50" && quantidadeTotal >= 21 && quantidadeTotal <= 50) ||
      (filterQuantidadeRange === "51+" && quantidadeTotal >= 51);

    // Filtro de faixa de preço
    const precoVenda = item.precoPromocional || item.precoVenda || 0;
    const matchesPrecoMin = !filterPrecoMin || precoVenda >= parseFloat(filterPrecoMin);
    const matchesPrecoMax = !filterPrecoMax || precoVenda <= parseFloat(filterPrecoMax);
    
    // Filtro de fornecedor
    const matchesFornecedor = filterFornecedor === "todos" || 
      item.fornecedor?.codigoFornecedor === filterFornecedor;
    
    // Filtro de data de entrada
    const matchesDataEntrada = filterDataEntrada === "todas" || (() => {
      if (!item.variantes || item.variantes.length === 0) return false;
      
      const hoje = new Date();
      const dataVariante = item.variantes.some((v: any) => {
        if (!v.dataEntrada) return false;
        const dataEntradaVariante = new Date(v.dataEntrada);
        const diffDias = Math.floor((hoje.getTime() - dataEntradaVariante.getTime()) / (1000 * 60 * 60 * 24));
        
        if (filterDataEntrada === "ultimos7dias") return diffDias <= 7;
        if (filterDataEntrada === "ultimos30dias") return diffDias <= 30;
        if (filterDataEntrada === "ultimos90dias") return diffDias <= 90;
        return false;
      });
      
      return dataVariante;
    })();
    
    return matchesSearch && matchesPromocao && matchesNovidade && matchesCategoria && 
           matchesCor && matchesTamanho && matchesQuantidade && matchesQuantidadeRange &&
           matchesPrecoMin && matchesPrecoMax && matchesFornecedor && matchesDataEntrada;
  });

  // Aplicar ordenação
  const sortedInventory = [...filteredInventory].sort((a, b) => {
    switch (sortBy) {
      case "nome":
        return (a.nomeProduto || "").localeCompare(b.nomeProduto || "");
      case "preco-asc":
        const precoA = a.precoPromocional || a.precoVenda || 0;
        const precoB = b.precoPromocional || b.precoVenda || 0;
        return precoA - precoB;
      case "preco-desc":
        const precoDescA = a.precoPromocional || a.precoVenda || 0;
        const precoDescB = b.precoPromocional || b.precoVenda || 0;
        return precoDescB - precoDescA;
      case "quantidade-asc":
        const qtdA = a.variantes?.reduce((total: number, v: any) => total + (v.quantidade || 0), 0) || 0;
        const qtdB = b.variantes?.reduce((total: number, v: any) => total + (v.quantidade || 0), 0) || 0;
        return qtdA - qtdB;
      case "quantidade-desc":
        const qtdDescA = a.variantes?.reduce((total: number, v: any) => total + (v.quantidade || 0), 0) || 0;
        const qtdDescB = b.variantes?.reduce((total: number, v: any) => total + (v.quantidade || 0), 0) || 0;
        return qtdDescB - qtdDescA;
      case "data-entrada":
        const dataA = a.dataCadastro ? new Date(a.dataCadastro).getTime() : 0;
        const dataB = b.dataCadastro ? new Date(b.dataCadastro).getTime() : 0;
        return dataB - dataA; // Mais recentes primeiro
      case "data-entrada-antiga":
        const dataAntigaA = a.dataCadastro ? new Date(a.dataCadastro).getTime() : 0;
        const dataAntigaB = b.dataCadastro ? new Date(b.dataCadastro).getTime() : 0;
        return dataAntigaA - dataAntigaB; // Mais antigas primeiro
      default:
        return 0;
    }
  });

  const openEntryDialog = (item: any, variante: any) => {
    setSelectedItem(item);
    setSelectedVariant(variante);
    setShowEntryDialog(true);
  };

  const openExitDialog = (item: any, variante: any) => {
    setSelectedItem(item);
    setSelectedVariant(variante);
    setShowExitDialog(true);
  };

  const openPromotionDialog = (item: any) => {
    setSelectedItem(item);
    setShowPromotionDialog(true);
  };

  const openNovidadeDialog = (item: any) => {
    setSelectedItem(item);
    setShowNovidadeDialog(true);
  };

  const openMovimentacaoDialog = (item: any) => {
    console.log('🔍 Abrindo dialog de movimentações para:', item.codigoProduto);
    console.log('📝 logMovimentacao:', item.logMovimentacao);
    setSelectedItem(item);
    setShowMovimentacaoDialog(true);
  };

  const openPromocaoHistoricoDialog = (item: any) => {
    setSelectedItem(item);
    setShowPromocaoHistoricoDialog(true);
  };

  const handleEntrySuccess = () => {
    loadEstoque();
  };

  const handleExitSuccess = () => {
    loadEstoque();
  };

  // Obter cores únicas para um item (apenas com quantidade > 0)
  const getCoresDisponiveis = (item: any) => {
    if (!item.variantes) return [];
    const coresComEstoque = item.variantes
      .filter((v: any) => v.quantidade > 0)
      .map((v: any) => v.cor);
    return [...new Set(coresComEstoque)];
  };

  // Obter tamanhos disponíveis para uma cor específica (apenas com quantidade > 0)
  const getTamanhosDisponiveis = (item: any, cor: string): string[] => {
    if (!item.variantes) return [];
    const variante = item.variantes.find((v: any) => v.cor === cor && v.quantidade > 0);
    if (!variante) return [];
    // Nova estrutura: tamanhos é array de objetos {tamanho, quantidade}
    if (Array.isArray(variante.tamanhos) && variante.tamanhos.length > 0 && typeof variante.tamanhos[0] === 'object') {
      return variante.tamanhos.map((t: any) => String(t.tamanho));
    }
    // Estrutura antiga: tamanhos é array de strings
    return Array.isArray(variante.tamanhos) ? variante.tamanhos.map(String) : (variante.tamanho ? [String(variante.tamanho)] : []);
  };

  // Obter variante atual selecionada
  const getSelectedVariant = (item: any) => {
    const cor = selectedColorByItem[item.codigoProduto];
    const tamanho = selectedSizeByItem[item.codigoProduto];
    
    if (!item.variantes || !cor) return null;
    
    // Encontrar variante pela cor (já que agora cada cor tem um array de tamanhos)
    return item.variantes.find((v: any) => v.cor === cor);
  };

  // Obter quantidade disponível para um tamanho específico
  const getQuantidadeByTamanho = (item: any, cor: string, tamanho: string): number => {
    if (!item.variantes) return 0;
    const variante = item.variantes.find((v: any) => v.cor === cor);
    if (!variante) return 0;
    
    // Nova estrutura: tamanhos é array de objetos {tamanho, quantidade}
    if (Array.isArray(variante.tamanhos) && variante.tamanhos.length > 0 && typeof variante.tamanhos[0] === 'object') {
      const tamanhoObj = variante.tamanhos.find((t: any) => t.tamanho === tamanho);
      return tamanhoObj ? tamanhoObj.quantidade : 0;
    }
    
    // Estrutura antiga: retorna quantidade total da variante se o tamanho bater
    if (Array.isArray(variante.tamanhos) && variante.tamanhos.includes(tamanho)) {
      return variante.quantidade || 0;
    }
    if (variante.tamanho === tamanho) {
      return variante.quantidade || 0;
    }
    
    return 0;
  };

  // Atualizar cor selecionada
  const handleColorChange = (codigoProduto: string, cor: string, item: any) => {
    setSelectedColorByItem(prev => ({ ...prev, [codigoProduto]: cor }));
    
    // Ajustar tamanho para o primeiro disponível nesta cor
    const tamanhosDisponiveis = getTamanhosDisponiveis(item, cor);
    if (tamanhosDisponiveis.length > 0) {
      setSelectedSizeByItem(prev => ({ ...prev, [codigoProduto]: tamanhosDisponiveis[0] }));
    }
  };

  // Atualizar tamanho selecionado
  const handleSizeChange = (codigoProduto: string, tamanho: string) => {
    setSelectedSizeByItem(prev => ({ ...prev, [codigoProduto]: tamanho }));
  };

  // Obter todas as cores únicas disponíveis no estoque filtrado
  const getAllCores = () => {
    const cores = new Set<string>();
    // Criar lista de produtos a considerar (filtrados por categoria, busca, etc, mas não por cor)
    const inventoryParaCores = inventory.filter(item => {
      const nomeProduto = item.nomeProduto || '';
      const codigoProduto = item.codigoProduto || '';
      const categoria = item.categoria || '';
      
      const matchesSearch = nomeProduto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        codigoProduto.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPromocao = filterPromocao === null || item.emPromocao === filterPromocao;
      const matchesNovidade = filterNovidade === null || item.isNovidade === filterNovidade;
      const matchesCategoria = filterCategoria === "todas" || categoria === filterCategoria;
      const matchesQuantidade = filterQuantidade === "todas" || (() => {
        const quantidadeTotal = item.variantes?.reduce((total: number, v: any) => total + (v.quantidade || 0), 0) || 0;
        return (filterQuantidade === "baixo" && quantidadeTotal > 0 && quantidadeTotal <= 10) ||
               (filterQuantidade === "zerado" && quantidadeTotal === 0) ||
               (filterQuantidade === "disponivel" && quantidadeTotal > 10);
      })();
      
      const precoVenda = item.precoPromocional || item.precoVenda || 0;
      const matchesPrecoMin = !filterPrecoMin || precoVenda >= parseFloat(filterPrecoMin);
      const matchesPrecoMax = !filterPrecoMax || precoVenda <= parseFloat(filterPrecoMax);
      const matchesFornecedor = filterFornecedor === "todos" || item.fornecedor?.codigoFornecedor === filterFornecedor;
      const matchesDataEntrada = filterDataEntrada === "todas" || (() => {
        if (!item.variantes || item.variantes.length === 0) return false;
        const hoje = new Date();
        return item.variantes.some((v: any) => {
          if (!v.dataEntrada) return false;
          const dataEntradaVariante = new Date(v.dataEntrada);
          const diffDias = Math.floor((hoje.getTime() - dataEntradaVariante.getTime()) / (1000 * 60 * 60 * 24));
          if (filterDataEntrada === "ultimos7dias") return diffDias <= 7;
          if (filterDataEntrada === "ultimos30dias") return diffDias <= 30;
          if (filterDataEntrada === "ultimos90dias") return diffDias <= 90;
          return false;
        });
      })();
      
      return matchesSearch && matchesPromocao && matchesNovidade && matchesCategoria && 
             matchesQuantidade && matchesPrecoMin && matchesPrecoMax && matchesFornecedor && matchesDataEntrada;
    });
    
    inventoryParaCores.forEach((item) => {
      item.variantes?.forEach((v: any) => {
        if (v.quantidade > 0) {
          cores.add(v.cor);
        }
      });
    });
    return Array.from(cores).sort();
  };

  // Obter todos os tamanhos únicos disponíveis no estoque filtrado
  const getAllTamanhos = () => {
    const tamanhos = new Set<string>();
    // Criar lista de produtos a considerar (filtrados por categoria, busca, cor, etc, mas não por tamanho)
    const inventoryParaTamanhos = inventory.filter(item => {
      const nomeProduto = item.nomeProduto || '';
      const codigoProduto = item.codigoProduto || '';
      const categoria = item.categoria || '';
      
      const matchesSearch = nomeProduto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        codigoProduto.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPromocao = filterPromocao === null || item.emPromocao === filterPromocao;
      const matchesNovidade = filterNovidade === null || item.isNovidade === filterNovidade;
      const matchesCategoria = filterCategoria === "todas" || categoria === filterCategoria;
      const matchesCor = filterCor === "todas" || 
        (item.variantes && item.variantes.some((v: any) => v.cor === filterCor && v.quantidade > 0));
      const matchesQuantidade = filterQuantidade === "todas" || (() => {
        const quantidadeTotal = item.variantes?.reduce((total: number, v: any) => total + (v.quantidade || 0), 0) || 0;
        return (filterQuantidade === "baixo" && quantidadeTotal > 0 && quantidadeTotal <= 10) ||
               (filterQuantidade === "zerado" && quantidadeTotal === 0) ||
               (filterQuantidade === "disponivel" && quantidadeTotal > 10);
      })();
      
      const precoVenda = item.precoPromocional || item.precoVenda || 0;
      const matchesPrecoMin = !filterPrecoMin || precoVenda >= parseFloat(filterPrecoMin);
      const matchesPrecoMax = !filterPrecoMax || precoVenda <= parseFloat(filterPrecoMax);
      const matchesFornecedor = filterFornecedor === "todos" || item.fornecedor?.codigoFornecedor === filterFornecedor;
      const matchesDataEntrada = filterDataEntrada === "todas" || (() => {
        if (!item.variantes || item.variantes.length === 0) return false;
        const hoje = new Date();
        return item.variantes.some((v: any) => {
          if (!v.dataEntrada) return false;
          const dataEntradaVariante = new Date(v.dataEntrada);
          const diffDias = Math.floor((hoje.getTime() - dataEntradaVariante.getTime()) / (1000 * 60 * 60 * 24));
          if (filterDataEntrada === "ultimos7dias") return diffDias <= 7;
          if (filterDataEntrada === "ultimos30dias") return diffDias <= 30;
          if (filterDataEntrada === "ultimos90dias") return diffDias <= 90;
          return false;
        });
      })();
      
      return matchesSearch && matchesPromocao && matchesNovidade && matchesCategoria && 
             matchesCor && matchesQuantidade && matchesPrecoMin && matchesPrecoMax && 
             matchesFornecedor && matchesDataEntrada;
    });
    
    inventoryParaTamanhos.forEach((item) => {
      item.variantes?.forEach((v: any) => {
        // Filtrar pela cor se houver filtro de cor ativo
        if (filterCor !== "todas" && v.cor !== filterCor) return;
        
        if (v.quantidade > 0) {
          // Nova estrutura: tamanhos é array de objetos {tamanho, quantidade}
          if (Array.isArray(v.tamanhos) && v.tamanhos.length > 0) {
            if (typeof v.tamanhos[0] === 'object' && v.tamanhos[0].tamanho) {
              // Nova estrutura
              v.tamanhos.forEach((t: any) => tamanhos.add(t.tamanho));
            } else {
              // Estrutura antiga (array de strings)
              v.tamanhos.forEach((t: string) => tamanhos.add(t));
            }
          } else if (v.tamanho) {
            // Fallback para estrutura muito antiga
            tamanhos.add(v.tamanho);
          }
        }
      });
    });
    return Array.from(tamanhos).sort();
  };

  // Obter todas as categorias únicas disponíveis no estoque
  const getAllCategorias = () => {
    const categorias = new Set<string>();
    inventory.forEach((item) => {
      if (item.categoria) {
        categorias.add(item.categoria);
      }
    });
    return Array.from(categorias).sort();
  };

  // Obter todos os fornecedores únicos
  const getAllFornecedores = () => {
    const fornecedores = new Map<string, string>();
    inventory.forEach((item) => {
      if (item.fornecedor?.codigoFornecedor && item.fornecedor?.nome) {
        fornecedores.set(item.fornecedor.codigoFornecedor, item.fornecedor.nome);
      }
    });
    return Array.from(fornecedores.entries()).map(([codigo, nome]) => ({ codigo, nome })).sort((a, b) => a.nome.localeCompare(b.nome));
  };

  const openEditImagesDialog = (item: any, variante: any) => {
    setSelectedItem(item);
    setSelectedVariant(variante);
    setShowEditImagesDialog(true);
  };

  const openLightbox = (images: string[], index: number = 0) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setShowLightbox(true);
  };

  const openHistoricoPrecos = (item: any) => {
    setProdutoHistorico(item);
    setShowHistoricoPrecos(true);
  };


  const handleImagesSuccess = () => {
    loadEstoque();
  };

  if (loading) {
    return <GlobalLoading message="Carregando estoque..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="text-center flex-1">
          <h1 className="text-4xl font-bold text-foreground mb-2">Estoque</h1>
          <p className="text-muted-foreground">
            Controle de inventário e movimentações
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="lg"
            variant={showAnalytics ? "default" : "outline"}
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="gap-2"
          >
            <BarChart3 className="h-5 w-5" />
            {showAnalytics ? "Ocultar Gráficos" : "Ver Gráficos"}
          </Button>
          <Button
            size="lg"
            onClick={() => {
              setSelectedItem(null);
              setShowMultipleVariantsDialog(true);
            }}
            className="gap-2"
          >
            <Package2 className="h-5 w-5" />
            Adicionar Várias Unidades ao Produto
          </Button>
        </div>
      </div>

      {/* Dashboard de Analytics */}
      {showAnalytics && (
        <EstoqueAnalyticsCard className="mb-6" />
      )}

      <Card className="p-4 md:p-6 shadow-card">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por código ou nome do produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="relative overflow-hidden">
              <Label className="text-sm font-bold text-secondary mb-2 block uppercase tracking-wide flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-gradient-to-r from-secondary to-primary animate-pulse-glow"></div>
                Filtrar por Categoria
              </Label>
              <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                <SelectTrigger className="bg-gradient-to-br from-background to-secondary/5 border-2 border-secondary/20 hover:border-secondary/40 transition-all shadow-sm hover:shadow-md">
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent className="bg-gradient-to-br from-background to-secondary/5">
                  <SelectItem value="todas" className="font-semibold">
                    📦 Todas as categorias ({getCountByCategoria("todas")})
                  </SelectItem>
                  {getAllCategorias().map((categoria) => (
                    <SelectItem key={categoria} value={categoria} className="hover:bg-secondary/10">
                      <span className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-gradient-to-r from-secondary to-primary"></span>
                        {categoria}
                        <span className="ml-auto text-muted-foreground text-xs">({getCountByCategoria(categoria)})</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="relative overflow-hidden">
              <Label className="text-sm font-bold text-primary mb-2 block uppercase tracking-wide flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-gradient-to-r from-primary to-accent animate-pulse-glow"></div>
                Filtrar por Cor
              </Label>
              <Select value={filterCor} onValueChange={setFilterCor}>
                <SelectTrigger className="bg-gradient-to-br from-background to-primary/5 border-2 border-primary/20 hover:border-primary/40 transition-all shadow-sm hover:shadow-md">
                  <SelectValue placeholder="Todas as cores" />
                </SelectTrigger>
                <SelectContent className="bg-gradient-to-br from-background to-primary/5">
                  <SelectItem value="todas" className="font-semibold">
                    🎨 Todas as cores ({getCountByCor("todas")})
                  </SelectItem>
                  {getAllCores().map((cor) => (
                    <SelectItem key={cor} value={cor} className="hover:bg-primary/10">
                      <span className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-gradient-to-r from-primary to-accent"></span>
                        {cor}
                        <span className="ml-auto text-muted-foreground text-xs">({getCountByCor(cor)})</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="relative overflow-hidden">
              <Label className="text-sm font-bold text-accent mb-2 block uppercase tracking-wide flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-gradient-to-r from-accent to-primary animate-pulse-glow"></div>
                Filtrar por Tamanho
              </Label>
              <Select value={filterTamanho} onValueChange={setFilterTamanho}>
                <SelectTrigger className="bg-gradient-to-br from-background to-accent/5 border-2 border-accent/20 hover:border-accent/40 transition-all shadow-sm hover:shadow-md">
                  <SelectValue placeholder="Todos os tamanhos" />
                </SelectTrigger>
                <SelectContent className="bg-gradient-to-br from-background to-accent/5">
                  <SelectItem value="todos" className="font-semibold">
                    📏 Todos os tamanhos ({getCountByTamanho("todos")})
                  </SelectItem>
                  {getAllTamanhos().map((tamanho) => (
                    <SelectItem key={tamanho} value={tamanho} className="hover:bg-accent/10">
                      <span className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-gradient-to-r from-accent to-primary"></span>
                        {tamanho}
                        <span className="ml-auto text-muted-foreground text-xs">({getCountByTamanho(tamanho)})</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Status do Estoque</Label>
              <Select value={filterQuantidade} onValueChange={setFilterQuantidade}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="disponivel">Disponível (&gt; 10)</SelectItem>
                  <SelectItem value="baixo">Baixo Estoque (≤ 10)</SelectItem>
                  <SelectItem value="zerado">Zerado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Faixa de Quantidade</Label>
              <Select value={filterQuantidadeRange} onValueChange={setFilterQuantidadeRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as faixas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as faixas</SelectItem>
                  <SelectItem value="0-5">0 - 5 unidades</SelectItem>
                  <SelectItem value="6-10">6 - 10 unidades</SelectItem>
                  <SelectItem value="11-20">11 - 20 unidades</SelectItem>
                  <SelectItem value="21-50">21 - 50 unidades</SelectItem>
                  <SelectItem value="51+">51+ unidades</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Ordenar por</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nome">
                    <span className="flex items-center gap-2">
                      <ArrowUpDown className="h-3 w-3" />
                      Nome (A-Z)
                    </span>
                  </SelectItem>
                  <SelectItem value="preco-asc">
                    <span className="flex items-center gap-2">
                      <ArrowUpDown className="h-3 w-3" />
                      Preço (Menor)
                    </span>
                  </SelectItem>
                  <SelectItem value="preco-desc">
                    <span className="flex items-center gap-2">
                      <ArrowUpDown className="h-3 w-3" />
                      Preço (Maior)
                    </span>
                  </SelectItem>
                  <SelectItem value="quantidade-asc">
                    <span className="flex items-center gap-2">
                      <ArrowUpDown className="h-3 w-3" />
                      Quantidade (Menor)
                    </span>
                  </SelectItem>
                  <SelectItem value="quantidade-desc">
                    <span className="flex items-center gap-2">
                      <ArrowUpDown className="h-3 w-3" />
                      Quantidade (Maior)
                    </span>
                  </SelectItem>
                  <SelectItem value="data-entrada">
                    <span className="flex items-center gap-2">
                      <ArrowUpDown className="h-3 w-3" />
                      Data (Mais Recentes)
                    </span>
                  </SelectItem>
                  <SelectItem value="data-entrada-antiga">
                    <span className="flex items-center gap-2">
                      <ArrowUpDown className="h-3 w-3" />
                      Data (Mais Antigas)
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <Label className="text-sm font-medium text-muted-foreground mb-2 block">Filtros</Label>
                <div className="flex gap-2">
                  <Button
                    variant={filterPromocao === true ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterPromocao(filterPromocao === true ? null : true)}
                    className="flex-1"
                  >
                    <Tag className="h-4 w-4 mr-1" />
                    Promo
                  </Button>
                  <Button
                    variant={filterNovidade === true ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterNovidade(filterNovidade === true ? null : true)}
                    className="flex-1"
                  >
                    <Sparkles className="h-4 w-4 mr-1" />
                    Novo
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Controles de Visualização */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium text-muted-foreground">Visualização:</Label>
              <div className="flex gap-1 border rounded-md p-1">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-8 px-3"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="h-8 px-3"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {sortedInventory.length} {sortedInventory.length === 1 ? 'produto' : 'produtos'} encontrado{sortedInventory.length === 1 ? '' : 's'}
            </div>
          </div>

          {/* Filtros Avançados - Nova Linha */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-sm font-medium text-muted-foreground mb-2 block">Preço Mín.</Label>
                <Input
                  type="number"
                  placeholder="R$ 0,00"
                  value={filterPrecoMin}
                  onChange={(e) => setFilterPrecoMin(e.target.value)}
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground mb-2 block">Preço Máx.</Label>
                <Input
                  type="number"
                  placeholder="R$ 0,00"
                  value={filterPrecoMax}
                  onChange={(e) => setFilterPrecoMax(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Filtrar por Fornecedor</Label>
              <Select value={filterFornecedor} onValueChange={setFilterFornecedor}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos os fornecedores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os fornecedores</SelectItem>
                  {getAllFornecedores().map((fornecedor) => (
                    <SelectItem key={fornecedor.codigo} value={fornecedor.codigo}>
                      {fornecedor.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Data de Entrada</Label>
              <Select value={filterDataEntrada} onValueChange={setFilterDataEntrada}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todas as datas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as datas</SelectItem>
                  <SelectItem value="ultimos7dias">Últimos 7 dias</SelectItem>
                  <SelectItem value="ultimos30dias">Últimos 30 dias</SelectItem>
                  <SelectItem value="ultimos90dias">Últimos 90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(filterPrecoMin || filterPrecoMax || filterFornecedor !== "todos" || 
              filterDataEntrada !== "todas" || filterCategoria !== "todas" || 
              filterCor !== "todas" || filterTamanho !== "todos" || 
              filterQuantidade !== "todas" || filterQuantidadeRange !== "todos" ||
              filterPromocao !== null || filterNovidade !== null) && (
              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilterPrecoMin("");
                    setFilterPrecoMax("");
                    setFilterFornecedor("todos");
                    setFilterDataEntrada("todas");
                    setFilterCategoria("todas");
                    setFilterCor("todas");
                    setFilterTamanho("todos");
                    setFilterQuantidade("todas");
                    setFilterQuantidadeRange("todos");
                    setFilterPromocao(null);
                    setFilterNovidade(null);
                    setSortBy("nome");
                  }}
                  className="w-full h-9"
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpar Filtros
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Carregando estoque...</p>
        </div>
      ) : sortedInventory.length === 0 ? (
        <Card className="p-12 text-center shadow-card">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Nenhum produto no estoque</h3>
          <p className="text-muted-foreground">
            Adicione produtos ao estoque através da página de Produtos
          </p>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedInventory.map((item) => {
            const quantidadeTotal = item.variantes?.reduce((total: number, v: any) => total + (v.quantidade || 0), 0) || 0;
            const coresDisponiveis = getCoresDisponiveis(item);
            const selectedCor = String(selectedColorByItem[item.codigoProduto] || coresDisponiveis[0] || '');
            const selectedTamanho = String(selectedSizeByItem[item.codigoProduto] || '');
            const varianteSelecionada = getSelectedVariant(item);
            const tamanhosDisponiveis = getTamanhosDisponiveis(item, selectedCor);
            
            // Calcular quantidade da cor-tamanho selecionada
            let quantidadeCorTamanho = 0;
            if (varianteSelecionada && selectedTamanho) {
              const tamanhoObj = varianteSelecionada.tamanhos?.find((t: any) => {
                const tamanhoStr = typeof t === 'string' ? t : t.tamanho;
                return tamanhoStr === selectedTamanho;
              });
              if (tamanhoObj) {
                quantidadeCorTamanho = typeof tamanhoObj === 'object' ? tamanhoObj.quantidade : 1;
              }
            }
            
            return (
              <Card key={item.codigoProduto} className="p-4 shadow-card hover:shadow-lg transition-all">
                <div className="space-y-3">
                  {/* Imagem principal com clique */}
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-muted group">
                    {varianteSelecionada?.imagens?.[0] ? (
                      <div 
                        className="relative w-full h-full cursor-pointer" 
                        onClick={() => openLightbox(varianteSelecionada.imagens)}
                      >
                        <img
                          src={varianteSelecionada.imagens[0]}
                          alt={item.nomeProduto}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        {/* Badge de imagens */}
                        <div className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground rounded-full p-1.5 shadow-lg border-2 border-background flex items-center gap-0.5 text-xs font-bold">
                          <ImageIcon className="h-3 w-3" />
                          {varianteSelecionada.imagens.length}
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <img 
                          src={getDefaultImageByCategory(item.categoria)} 
                          alt={item.categoria}
                          className="w-20 h-20 object-contain opacity-30"
                        />
                      </div>
                    )}
                    {item.emPromocao && (
                      <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground">
                        <Tag className="h-3 w-3 mr-1" />
                        Promo
                      </Badge>
                    )}
                    {item.isNovidade && (
                      <Badge className="absolute top-2 right-2 bg-green-600 text-white">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Novo
                      </Badge>
                    )}
                  </div>

                  {/* Informações do produto */}
                  <div>
                    <h3 className="font-bold text-base truncate">{item.nomeProduto}</h3>
                    <p className="text-xs text-muted-foreground">{item.codigoProduto} • {item.categoria}</p>
                    <div className="mt-1.5">
                      {item.emPromocao && item.precoPromocional ? (
                        <>
                          <span className="text-xs text-muted-foreground line-through mr-1">
                            R$ {item.precoVenda?.toFixed(2)}
                          </span>
                          <span className="text-base font-bold text-accent">
                            R$ {item.precoPromocional.toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span className="text-base font-bold">
                          R$ {item.precoVenda?.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantidades compactas com Cor-Tamanho */}
                  <div className="grid grid-cols-4 gap-1.5 text-center">
                    <div className="bg-primary/10 rounded p-1.5 border border-primary/20">
                      <div className="text-xs font-bold text-primary">{varianteSelecionada?.quantidade || 0}</div>
                      <div className="text-[9px] text-muted-foreground truncate">Cor</div>
                    </div>
                    <div className="bg-orange-500/10 rounded p-1.5 border border-orange-500/20">
                      <div className="text-xs font-bold text-orange-600">{quantidadeCorTamanho}</div>
                      <div className="text-[9px] text-muted-foreground truncate">C-T</div>
                    </div>
                    <div className="bg-blue-500/10 rounded p-1.5 border border-blue-500/20">
                      <div className="text-xs font-bold text-blue-600">{quantidadeTotal}</div>
                      <div className="text-[9px] text-muted-foreground truncate">Total</div>
                    </div>
                    <div className="bg-secondary/10 rounded p-1.5 border border-secondary/20">
                      <div className="text-xs font-bold text-secondary">{coresDisponiveis.length}</div>
                      <div className="text-[9px] text-muted-foreground truncate">Cores</div>
                    </div>
                  </div>

                  {/* Seleção de cores com gradiente moderno - UX Melhorada */}
                  <div>
                    <Label className="text-xs font-bold text-primary mb-3 block uppercase tracking-wider flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-primary animate-pulse"></div>
                      Cores Disponíveis
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {coresDisponiveis.slice(0, 4).map((cor: string) => (
                        <button
                          key={cor}
                          onClick={() => handleColorChange(item.codigoProduto, cor, item)}
                          className={`relative px-4 py-2.5 text-xs font-bold rounded-lg transition-all duration-300 min-w-[70px] ${
                            selectedCor === cor 
                              ? 'bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-pulse-glow text-primary-foreground shadow-xl scale-105 border-2 border-primary' 
                              : 'bg-gradient-to-br from-muted to-muted/50 text-foreground hover:from-primary/20 hover:to-accent/20 hover:text-primary hover:scale-105 border-2 border-border hover:border-primary/50 hover:shadow-lg'
                          }`}
                        >
                          {cor}
                          {selectedCor === cor && (
                            <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 bg-green-500 rounded-full animate-bounce shadow-lg flex items-center justify-center">
                              <span className="h-2 w-2 bg-white rounded-full"></span>
                            </span>
                          )}
                        </button>
                      ))}
                      {coresDisponiveis.length > 4 && (
                        <button className="px-4 py-2.5 text-xs font-bold rounded-lg bg-gradient-to-br from-secondary to-secondary/70 text-secondary-foreground border-2 border-border hover:border-secondary hover:scale-105 transition-all">
                          +{coresDisponiveis.length - 4}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Seleção de tamanhos com gradiente moderno - UX Melhorada */}
                  {tamanhosDisponiveis.length > 0 && (
                    <div>
                      <Label className="text-xs font-bold text-accent mb-3 block uppercase tracking-wider flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-accent animate-pulse"></div>
                        Tamanhos Disponíveis
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {tamanhosDisponiveis.map((tamanho: any) => {
                          const tamanhoStr = typeof tamanho === 'string' ? tamanho : tamanho.tamanho;
                          const qtd = typeof tamanho === 'object' ? tamanho.quantidade : 0;
                          return (
                            <button
                              key={tamanhoStr}
                              onClick={() => handleSizeChange(item.codigoProduto, tamanhoStr)}
                              className={`relative px-4 py-2.5 text-xs font-bold rounded-lg transition-all duration-300 min-w-[65px] ${
                                selectedTamanho === tamanhoStr 
                                  ? 'bg-gradient-to-r from-accent via-primary to-accent bg-[length:200%_auto] animate-pulse-glow text-accent-foreground shadow-xl scale-105 border-2 border-accent' 
                                  : 'bg-gradient-to-br from-muted to-muted/50 text-foreground hover:from-accent/20 hover:to-primary/20 hover:text-accent hover:scale-105 border-2 border-border hover:border-accent/50 hover:shadow-lg'
                              }`}
                            >
                              <span className="flex flex-col items-center gap-0.5">
                                <span className="font-bold">{tamanhoStr}</span>
                                {qtd > 0 && <span className="text-[9px] opacity-80 font-normal">({qtd} un)</span>}
                              </span>
                              {selectedTamanho === tamanhoStr && (
                                <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 bg-blue-500 rounded-full animate-bounce shadow-lg flex items-center justify-center">
                                  <span className="h-2 w-2 bg-white rounded-full"></span>
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Ações principais */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => {
                        setSelectedItem(item);
                        setSelectedVariant(varianteSelecionada);
                        setShowEntryDialog(true);
                      }}
                      className="h-8 text-xs gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      Entrada
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedItem(item);
                        setSelectedVariant(varianteSelecionada);
                        setShowExitDialog(true);
                      }}
                      className="h-8 text-xs gap-1"
                      disabled={quantidadeTotal === 0}
                    >
                      <Minus className="h-3 w-3" />
                      Saída
                    </Button>
                  </div>

                  {/* Botão Adicionar Várias Unidades */}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setSelectedItem(item);
                      setShowMultipleVariantsDialog(true);
                    }}
                    className="w-full h-8 text-xs gap-1"
                  >
                    <Package2 className="h-3 w-3" />
                    Adicionar Várias Unidades
                  </Button>

                  {/* Menu de ações adicionais */}
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full h-7 text-xs">
                        <ChevronDown className="h-3 w-3 mr-1" />
                        Mais ações
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-1.5 pt-2">
                      <div className="grid grid-cols-2 gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedItem(item);
                            setSelectedVariant(varianteSelecionada);
                            setShowEditImagesDialog(true);
                          }}
                          className="h-7 text-xs gap-1"
                        >
                          <ImageIcon className="h-3 w-3" />
                          Imagens
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openPromotionDialog(item)}
                          className="h-7 text-xs gap-1"
                        >
                          <Tag className="h-3 w-3" />
                          Promoção
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openNovidadeDialog(item)}
                          className="h-7 text-xs gap-1"
                        >
                          <Sparkles className="h-3 w-3" />
                          Novidade
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openHistoricoPrecos(item)}
                          className="h-7 text-xs gap-1"
                        >
                          <History className="h-3 w-3" />
                          Preços
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openMovimentacaoDialog(item)}
                          className="h-7 text-xs gap-1"
                        >
                          <History className="h-3 w-3" />
                          Movimentações
                        </Button>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="space-y-6">
          {sortedInventory.map((item) => {
            const coresDisponiveis = getCoresDisponiveis(item);
            const selectedCor = selectedColorByItem[item.codigoProduto] || '';
            const selectedTamanho = selectedSizeByItem[item.codigoProduto] || '';
            const tamanhosDisponiveis = getTamanhosDisponiveis(item, selectedCor);
            const varianteSelecionada = getSelectedVariant(item);

            return (
              <Card key={item.codigoProduto} className="p-4 md:p-6 shadow-card hover:shadow-lg transition-all">
                <div className="flex flex-col gap-6">
                  {/* Header com imagem, nome e badges */}
                  <div className="flex items-start gap-4">
                    {varianteSelecionada && varianteSelecionada.imagens && varianteSelecionada.imagens.length > 0 ? (
                      <div 
                        className="relative group cursor-pointer" 
                        onClick={() => openLightbox(varianteSelecionada.imagens)}
                        title="Clique para ver todas as imagens"
                      >
                        <img
                          src={varianteSelecionada.imagens[0]}
                          alt={`${item.nomeProduto} - ${selectedCor}`}
                          className="w-20 h-20 object-cover rounded-lg border-2 border-primary/20 shadow-md transition-all group-hover:border-primary group-hover:scale-105"
                        />
                        {/* Badge com ícone de imagem e quantidade */}
                        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1.5 shadow-lg border-2 border-background flex items-center justify-center gap-1 min-w-[28px]">
                          <ImageIcon className="h-3 w-3" />
                          <span className="text-xs font-bold">{varianteSelecionada.imagens.length}</span>
                        </div>
                        <div className="absolute top-1 left-1 bg-yellow-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-md">
                          <Star className="h-2.5 w-2.5 fill-current" />
                          <span>DEST</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-br from-muted/50 to-muted/20 rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                        <img 
                          src={getDefaultImageByCategory(item.categoria)} 
                          alt={`${item.categoria || 'Produto'} - Logo Mariela`}
                          className="w-14 h-14 object-contain opacity-30"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.innerHTML = '<svg class="h-10 w-10 text-muted-foreground opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>';
                          }}
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-foreground">{item.nomeProduto}</h3>
                          <p className="text-sm text-muted-foreground">{item.codigoProduto} • {item.categoria}</p>
                        </div>
                        <div className="flex gap-2">
                          {item.emPromocao && (
                            <Badge variant="secondary" className="bg-accent text-accent-foreground">
                              <Tag className="h-3 w-3 mr-1" />
                              Em Promoção
                            </Badge>
                          )}
                          {item.isNovidade && (
                            <Badge className="bg-green-600 text-white">
                              <Sparkles className="h-3 w-3 mr-1" />
                              Novidade
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Seletores de Cor e Tamanho */}
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                    <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-3 border-2 border-primary/20">
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block uppercase tracking-wide">
                        Disponível Cor/Tamanho
                      </label>
                      <div className="text-2xl font-bold text-primary">
                        {getQuantidadeByTamanho(item, selectedCor, selectedTamanho)}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                        {selectedCor} - {selectedTamanho}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-lg p-3 border-2 border-blue-500/20">
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block uppercase tracking-wide">
                        Disponível Cor
                      </label>
                      <div className="text-2xl font-bold text-blue-600">
                        {varianteSelecionada?.quantidade || 0}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                        Todas os tamanhos - {selectedCor}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-lg p-3 border-2 border-secondary/20">
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block uppercase tracking-wide">
                        Total Geral
                      </label>
                      <div className="text-2xl font-bold text-secondary">
                        {item.variantes?.reduce((total: number, v: any) => total + (v.quantidade || 0), 0) || 0}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                        Todas as variantes
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-bold text-primary mb-3 block uppercase tracking-wide flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-gradient-to-r from-primary to-accent animate-pulse-glow"></div>
                        Cores Disponíveis
                      </label>
                      <div className="flex flex-wrap gap-2.5">
                        {coresDisponiveis.map((cor: string) => (
                          <button
                            key={cor}
                            onClick={() => handleColorChange(item.codigoProduto, cor, item)}
                            className={`
                              relative px-5 py-2.5 rounded-lg font-semibold text-sm
                              transition-all duration-300 ease-out
                              border-2 shadow-sm
                              hover:scale-105 hover:shadow-lg
                              active:scale-95
                              ${selectedCor === cor 
                                ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-primary shadow-primary/30 ring-2 ring-primary ring-offset-2' 
                                : 'bg-background text-foreground border-primary/30 hover:border-primary/60 hover:bg-primary/5'
                              }
                            `}
                          >
                            <span className="relative z-10">{cor}</span>
                            {selectedCor === cor && (
                              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg animate-pulse-glow"></div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-bold text-accent mb-3 block uppercase tracking-wide flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-gradient-to-r from-accent to-primary animate-pulse-glow"></div>
                        Tamanhos Disponíveis
                      </label>
                      <div className="flex flex-wrap gap-2.5">
                        {tamanhosDisponiveis.map((tamanho: string) => {
                          const qtd = getQuantidadeByTamanho(item, selectedCor, tamanho);
                          const isSelected = selectedTamanho === tamanho;
                          return (
                            <button
                              key={tamanho}
                              onClick={() => handleSizeChange(item.codigoProduto, tamanho)}
                              className={`
                                relative px-5 py-2.5 rounded-lg font-semibold text-sm
                                transition-all duration-300 ease-out
                                border-2 shadow-sm
                                hover:scale-105 hover:shadow-lg
                                active:scale-95
                                ${isSelected 
                                  ? 'bg-gradient-to-br from-accent to-accent/80 text-accent-foreground border-accent shadow-accent/30 ring-2 ring-accent ring-offset-2' 
                                  : 'bg-background text-foreground border-accent/30 hover:border-accent/60 hover:bg-accent/5'
                                }
                              `}
                            >
                              <span className="relative z-10 flex items-center gap-1.5">
                                <span className="font-bold">{tamanho}</span>
                                <span className={`text-xs ${isSelected ? 'opacity-100 font-semibold' : 'opacity-70'}`}>
                                  ({qtd})
                                </span>
                              </span>
                              {isSelected && (
                                <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-primary/20 rounded-lg animate-pulse-glow"></div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-muted-foreground mb-2 block">Preço de Venda</label>
                      <div className="space-y-1">
                        {item.emPromocao && item.precoPromocional ? (
                          <>
                            <div className="text-lg font-semibold text-muted-foreground line-through">
                              R$ {item.precoVenda?.toFixed(2) || '0.00'}
                            </div>
                            <div className="text-2xl font-bold text-accent">
                              R$ {item.precoPromocional.toFixed(2)}
                            </div>
                          </>
                        ) : (
                          <div className="text-2xl font-bold text-foreground">
                            R$ {item.precoVenda?.toFixed(2) || '0.00'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => {
                        if (varianteSelecionada) {
                          openEntryDialog(item, { ...varianteSelecionada, tamanho: selectedTamanho });
                        }
                      }}
                      className="gap-2"
                      disabled={!varianteSelecionada}
                    >
                      <Plus className="h-4 w-4" />
                      Entrada
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (varianteSelecionada) {
                          const qtdDisponivel = getQuantidadeByTamanho(item, selectedCor, selectedTamanho);
                          openExitDialog(item, { ...varianteSelecionada, tamanho: selectedTamanho, quantidadeDisponivel: qtdDisponivel });
                        }
                      }}
                      className="gap-2"
                      disabled={!varianteSelecionada || getQuantidadeByTamanho(item, selectedCor, selectedTamanho) === 0}
                    >
                      <Minus className="h-4 w-4" />
                      Saída
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setSelectedItem(item);
                        setShowMultipleVariantsDialog(true);
                      }}
                      className="gap-2"
                    >
                      <Package2 className="h-4 w-4" />
                      Adicionar Várias Unidades
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openPromotionDialog(item)}
                      className={item.emPromocao ? "gap-2 bg-purple-600 text-white hover:bg-purple-700 hover:text-white border-purple-600" : "gap-2"}
                    >
                      <Tag className="h-4 w-4" />
                      {item.emPromocao ? 'Remover' : 'Colocar'} em Promoção
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openNovidadeDialog(item)}
                      className={item.isNovidade ? "gap-2 bg-green-600 text-white hover:bg-green-700 hover:text-white border-green-600" : "gap-2"}
                    >
                      <Sparkles className="h-4 w-4" />
                      {item.isNovidade ? 'Remover' : 'Marcar'} como Novidade
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditImagesDialog(item, varianteSelecionada)}
                      className="gap-2"
                      disabled={!varianteSelecionada}
                    >
                      <ImageIcon className="h-4 w-4" />
                      Gerenciar Imagens
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openHistoricoPrecos(item)}
                      className="gap-2"
                    >
                      <History className="h-4 w-4" />
                      Histórico de Preços
                    </Button>
                  </div>

                  {/* Histórico de Promoções - Colapsável */}
                  {item.logPromocao && item.logPromocao.length > 0 && (
                    <Collapsible 
                      open={promocoesOpen[item.codigoProduto] ?? false}
                      onOpenChange={(open) => setPromocoesOpen(prev => ({ ...prev, [item.codigoProduto]: open }))}
                      className="pt-4 border-t border-border/50"
                    >
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-full flex items-center justify-between p-2 h-auto hover:bg-muted/50">
                          <div className="flex items-center gap-2">
                            <History className="h-4 w-4 text-purple-600" />
                            <span className="text-sm font-semibold text-muted-foreground">
                              Histórico de Promoções ({item.logPromocao.length})
                            </span>
                          </div>
                          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${promocoesOpen[item.codigoProduto] ? 'rotate-180' : ''}`} />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-3">
                        <div className="space-y-2">
                          {item.logPromocao.slice(-3).reverse().map((promo: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-3 text-sm p-3 bg-purple-500/5 rounded border border-purple-500/20">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-500/10 text-purple-600">
                                <Tag className="h-4 w-4" />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium">
                                  R$ {promo.precoPromocional.toFixed(2)}
                                  {promo.ativo && <Badge className="ml-2 bg-purple-600 text-white text-xs">Ativa</Badge>}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(promo.dataInicio).toLocaleDateString('pt-BR')}
                                  {promo.dataFim && ` - ${new Date(promo.dataFim).toLocaleDateString('pt-BR')}`}
                                </div>
                              </div>
                            </div>
                          ))}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openPromocaoHistoricoDialog(item)}
                            className="w-full gap-2 border-purple-500/50 text-purple-600 hover:bg-purple-500/10"
                          >
                            <History className="h-4 w-4" />
                            Ver Histórico Completo
                          </Button>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Últimas Movimentações - Colapsável */}
                  {item.logMovimentacao && item.logMovimentacao.length > 0 && (
                    <Collapsible 
                      open={movimentacoesOpen[item.codigoProduto] ?? false}
                      onOpenChange={(open) => setMovimentacoesOpen(prev => ({ ...prev, [item.codigoProduto]: open }))}
                      className="pt-4 border-t border-border/50"
                    >
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-full flex items-center justify-between p-2 h-auto hover:bg-muted/50">
                          <div className="flex items-center gap-2">
                            <List className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-semibold text-muted-foreground">
                              Últimas Movimentações ({item.logMovimentacao.length})
                            </span>
                          </div>
                          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${movimentacoesOpen[item.codigoProduto] ? 'rotate-180' : ''}`} />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-3">
                        <div className="space-y-2">
                          {item.logMovimentacao.slice(-3).reverse().map((log: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-3 text-sm p-2 bg-muted/30 rounded">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                log.tipo === 'entrada' 
                                  ? 'bg-green-500/10 text-green-600' 
                                  : 'bg-red-500/10 text-red-600'
                              }`}>
                                {log.tipo === 'entrada' ? '↑' : '↓'}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium">
                                  {log.tipo === 'entrada' ? 'Entrada' : 'Saída'} de {log.quantidade} un.
                                </div>
                                {log.cor && log.tamanho && (
                                  <div className="text-xs text-muted-foreground">
                                    {log.cor} - {log.tamanho}
                                  </div>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(log.data).toLocaleDateString('pt-BR')}
                              </div>
                            </div>
                          ))}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openMovimentacaoDialog(item)}
                            className="w-full gap-2"
                          >
                            <List className="h-4 w-4" />
                            Ver Todas as Movimentações
                          </Button>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialogs */}
      {selectedItem && selectedVariant && (
        <>
          <StockEntryDialog
            open={showEntryDialog}
            onOpenChange={setShowEntryDialog}
            codigoProduto={selectedItem.codigoProduto}
            nomeProduto={selectedItem.nomeProduto}
            cor={selectedVariant.cor}
            tamanho={selectedVariant.tamanho}
            onSuccess={handleEntrySuccess}
          />
          
          <StockExitDialog
            open={showExitDialog}
            onOpenChange={setShowExitDialog}
            codigoProduto={selectedItem.codigoProduto}
            nomeProduto={selectedItem.nomeProduto}
            cor={selectedVariant.cor}
            tamanho={selectedVariant.tamanho}
            quantidadeDisponivel={selectedVariant.quantidadeDisponivel || selectedVariant.quantidade}
            onSuccess={handleExitSuccess}
          />
        </>
      )}

      {selectedItem && (
        <>
          <PromotionDialog
            open={showPromotionDialog}
            onOpenChange={setShowPromotionDialog}
            codigoProduto={selectedItem.codigoProduto}
            nomeProduto={selectedItem.nomeProduto}
            precoOriginal={selectedItem.precoVenda}
            emPromocao={selectedItem.emPromocao}
            precoPromocionalAtual={selectedItem.precoPromocional}
            onSuccess={loadEstoque}
          />

          <NovidadeDialog
            open={showNovidadeDialog}
            onOpenChange={setShowNovidadeDialog}
            codigoProduto={selectedItem.codigoProduto}
            nomeProduto={selectedItem.nomeProduto}
            isNovidade={selectedItem.isNovidade}
            onSuccess={loadEstoque}
          />

          <MovimentacaoDialog
            open={showMovimentacaoDialog}
            onOpenChange={setShowMovimentacaoDialog}
            codigoProduto={selectedItem.codigoProduto}
            nomeProduto={selectedItem.nomeProduto}
            logMovimentacao={selectedItem.logMovimentacao || []}
          />

          <PromocaoHistoricoDialog
            open={showPromocaoHistoricoDialog}
            onOpenChange={setShowPromocaoHistoricoDialog}
            codigoProduto={selectedItem.codigoProduto}
            nomeProduto={selectedItem.nomeProduto}
            logPromocao={selectedItem.logPromocao || []}
            precoOriginal={selectedItem.precoVenda}
          />
        </>
      )}

      {selectedItem && selectedVariant && (
        <>
          <EditVariantImagesDialog
            open={showEditImagesDialog}
            onOpenChange={setShowEditImagesDialog}
            produto={selectedItem}
            variante={selectedVariant}
            onSuccess={handleImagesSuccess}
          />
        </>
      )}

      <ImageGalleryLightbox
        open={showLightbox}
        onOpenChange={setShowLightbox}
        images={lightboxImages}
        initialIndex={lightboxIndex}
        title={selectedItem?.nomeProduto}
      />
      
      <AddMultipleVariantsDialog
        open={showMultipleVariantsDialog}
        onOpenChange={setShowMultipleVariantsDialog}
        produto={selectedItem}
        onSuccess={loadEstoque}
      />

      <HistoricoPrecosDialog
        open={showHistoricoPrecos}
        onOpenChange={setShowHistoricoPrecos}
        produto={produtoHistorico}
        historico={produtoHistorico?.historicoPrecosn || []}
      />
    </div>
  );
};

export default Estoque;
