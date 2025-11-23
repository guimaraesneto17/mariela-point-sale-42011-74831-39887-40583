import { useState, useEffect } from "react";
import { Package, Search, Plus, Minus, Tag, Sparkles, Filter, List, History, Image as ImageIcon, ChevronDown, Star } from "lucide-react";
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

import { estoqueAPI } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import { getDefaultImageByCategory } from "@/lib/defaultImages";
import { GlobalLoading } from "@/components/GlobalLoading";

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
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  
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
    
    // Filtro de quantidade
    const quantidadeTotal = item.variantes?.reduce((total: number, v: any) => total + (v.quantidade || 0), 0) || 0;
    const matchesQuantidade = filterQuantidade === "todas" ||
      (filterQuantidade === "baixo" && quantidadeTotal > 0 && quantidadeTotal <= 10) ||
      (filterQuantidade === "zerado" && quantidadeTotal === 0) ||
      (filterQuantidade === "disponivel" && quantidadeTotal > 10);
    
    return matchesSearch && matchesPromocao && matchesNovidade && matchesCategoria && matchesCor && matchesTamanho && matchesQuantidade;
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

  // Obter todas as cores únicas disponíveis no estoque
  const getAllCores = () => {
    const cores = new Set<string>();
    inventory.forEach((item) => {
      item.variantes?.forEach((v: any) => {
        if (v.quantidade > 0) {
          cores.add(v.cor);
        }
      });
    });
    return Array.from(cores).sort();
  };

  // Obter todos os tamanhos únicos disponíveis no estoque
  const getAllTamanhos = () => {
    const tamanhos = new Set<string>();
    inventory.forEach((item) => {
      item.variantes?.forEach((v: any) => {
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
        <Button
          size="lg"
          onClick={() => setShowMultipleVariantsDialog(true)}
          className="gap-2"
        >
          <Plus className="h-5 w-5" />
          Adicionar Variantes em Massa
        </Button>
      </div>

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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Filtrar por Categoria</Label>
              <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as categorias</SelectItem>
                  {getAllCategorias().map((categoria) => (
                    <SelectItem key={categoria} value={categoria}>{categoria}</SelectItem>
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
                  <SelectItem value="todas" className="font-semibold">🎨 Todas as cores</SelectItem>
                  {getAllCores().map((cor) => (
                    <SelectItem key={cor} value={cor} className="hover:bg-primary/10">
                      <span className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-gradient-to-r from-primary to-accent"></span>
                        {cor}
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
                  <SelectItem value="todos" className="font-semibold">📏 Todos os tamanhos</SelectItem>
                  {getAllTamanhos().map((tamanho) => (
                    <SelectItem key={tamanho} value={tamanho} className="hover:bg-accent/10">
                      <span className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-gradient-to-r from-accent to-primary"></span>
                        {tamanho}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Filtrar por Quantidade</Label>
              <Select value={filterQuantidade} onValueChange={setFilterQuantidade}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="disponivel">Disponível (&gt; 10)</SelectItem>
                  <SelectItem value="baixo">Estoque Baixo (1-10)</SelectItem>
                  <SelectItem value="zerado">Zerado (0)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Modo de Visualização</Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={viewMode === "list" ? "default" : "outline"}
                  onClick={() => setViewMode("list")}
                  className="flex-1"
                >
                  <List className="h-4 w-4 mr-2" />
                  Lista
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === "grid" ? "default" : "outline"}
                  onClick={() => setViewMode("grid")}
                  className="flex-1"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Grade
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant={filterPromocao === null ? "outline" : "default"}
              onClick={() => setFilterPromocao(filterPromocao === null ? true : null)}
              className={filterPromocao === true ? "bg-accent text-accent-foreground" : ""}
            >
              <Tag className="h-4 w-4 mr-2" />
              Em Promoção
            </Button>
            
            <Button
              size="sm"
              variant={filterNovidade === null ? "outline" : "default"}
              onClick={() => setFilterNovidade(filterNovidade === null ? true : null)}
              className={filterNovidade === true ? "bg-green-600 text-white hover:bg-green-700" : ""}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Novidades
            </Button>
            
            {(filterPromocao !== null || filterNovidade !== null || filterCategoria !== "todas" || filterCor !== "todas" || filterTamanho !== "todos" || filterQuantidade !== "todas") && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setFilterPromocao(null);
                  setFilterNovidade(null);
                  setFilterCategoria("todas");
                  setFilterCor("todas");
                  setFilterTamanho("todos");
                  setFilterQuantidade("todas");
                }}
              >
                Limpar Filtros
              </Button>
            )}
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Carregando estoque...</p>
        </div>
      ) : filteredInventory.length === 0 ? (
        <Card className="p-12 text-center shadow-card">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Nenhum produto no estoque</h3>
          <p className="text-muted-foreground">
            Adicione produtos ao estoque através da página de Produtos
          </p>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredInventory.map((item) => {
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

                  {/* Seleção de cores com gradiente moderno */}
                  <div>
                    <Label className="text-[10px] font-bold text-primary mb-2 block uppercase tracking-wider">Cores Disponíveis</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {coresDisponiveis.slice(0, 4).map((cor: string) => (
                        <button
                          key={cor}
                          onClick={() => handleColorChange(item.codigoProduto, cor, item)}
                          className={`relative px-3 py-1.5 text-[10px] font-bold rounded-full transition-all duration-300 ${
                            selectedCor === cor 
                              ? 'bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-pulse-glow text-primary-foreground shadow-lg scale-105' 
                              : 'bg-gradient-to-br from-muted to-muted/50 text-muted-foreground hover:from-primary/10 hover:to-accent/10 hover:text-primary hover:scale-105 border border-border'
                          }`}
                        >
                          {cor}
                          {selectedCor === cor && (
                            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-green-500 rounded-full animate-bounce-soft shadow-md"></span>
                          )}
                        </button>
                      ))}
                      {coresDisponiveis.length > 4 && (
                        <button className="px-3 py-1.5 text-[10px] font-bold rounded-full bg-gradient-to-br from-secondary to-secondary/70 text-secondary-foreground border border-border">
                          +{coresDisponiveis.length - 4}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Seleção de tamanhos com gradiente moderno */}
                  {tamanhosDisponiveis.length > 0 && (
                    <div>
                      <Label className="text-[10px] font-bold text-accent mb-2 block uppercase tracking-wider">Tamanhos Disponíveis</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {tamanhosDisponiveis.map((tamanho: any) => {
                          const tamanhoStr = typeof tamanho === 'string' ? tamanho : tamanho.tamanho;
                          const qtd = typeof tamanho === 'object' ? tamanho.quantidade : 0;
                          return (
                            <button
                              key={tamanhoStr}
                              onClick={() => handleSizeChange(item.codigoProduto, tamanhoStr)}
                              className={`relative px-3 py-1.5 text-[10px] font-bold rounded-full transition-all duration-300 ${
                                selectedTamanho === tamanhoStr 
                                  ? 'bg-gradient-to-r from-accent via-primary to-accent bg-[length:200%_auto] animate-pulse-glow text-accent-foreground shadow-lg scale-105' 
                                  : 'bg-gradient-to-br from-muted to-muted/50 text-muted-foreground hover:from-accent/10 hover:to-primary/10 hover:text-accent hover:scale-105 border border-border'
                              }`}
                            >
                              <span className="flex items-center gap-1">
                                {tamanhoStr}
                                {qtd > 0 && <span className="text-[8px] opacity-80">({qtd})</span>}
                              </span>
                              {selectedTamanho === tamanhoStr && (
                                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-blue-500 rounded-full animate-bounce-soft shadow-md"></span>
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
                          onClick={() => openMovimentacaoDialog(item)}
                          className="h-7 text-xs gap-1"
                        >
                          <History className="h-3 w-3" />
                          Histórico
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
          {filteredInventory.map((item) => {
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
                      <label className="text-sm font-semibold text-muted-foreground mb-2 block">Cores</label>
                      <div className="flex flex-wrap gap-2">
                        {coresDisponiveis.map((cor: string) => (
                          <Badge
                            key={cor}
                            variant={selectedCor === cor ? "default" : "outline"}
                            className="cursor-pointer hover:bg-primary/90"
                            onClick={() => handleColorChange(item.codigoProduto, cor, item)}
                          >
                            {cor}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-muted-foreground mb-2 block">Tamanhos</label>
                      <div className="flex flex-wrap gap-2">
                        {tamanhosDisponiveis.map((tamanho: string) => {
                          const qtd = getQuantidadeByTamanho(item, selectedCor, tamanho);
                          const isSelected = selectedTamanho === tamanho;
                          return (
                            <Badge
                              key={tamanho}
                              variant={isSelected ? "default" : "outline"}
                              className={`cursor-pointer hover:bg-primary/90 transition-all ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                              onClick={() => handleSizeChange(item.codigoProduto, tamanho)}
                            >
                              <span className="font-semibold">{tamanho}</span>
                              <span className={`ml-1.5 text-xs ${isSelected ? 'opacity-100' : 'opacity-70'}`}>
                                ({qtd})
                              </span>
                            </Badge>
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
        onSuccess={loadEstoque}
      />
    </div>
  );
};

export default Estoque;
