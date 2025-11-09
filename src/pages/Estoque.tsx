import { useState, useEffect } from "react";
import { Package, Search, Plus, Minus, Tag, Sparkles, Filter, List, History, Image as ImageIcon, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { StockEntryDialog } from "@/components/StockEntryDialog";
import { StockExitDialog } from "@/components/StockExitDialog";
import { PromotionDialog } from "@/components/PromotionDialog";
import { NovidadeDialog } from "@/components/NovidadeDialog";
import { MovimentacaoDialog } from "@/components/MovimentacaoDialog";
import { PromocaoHistoricoDialog } from "@/components/PromocaoHistoricoDialog";
import { EditVariantImagesDialog } from "@/components/EditVariantImagesDialog";
import { ImageGalleryDialog } from "@/components/ImageGalleryDialog";
import { estoqueAPI } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import { getDefaultImageByCategory } from "@/lib/defaultImages";

const Estoque = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showEntryDialog, setShowEntryDialog] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [showNovidadeDialog, setShowNovidadeDialog] = useState(false);
  const [showMovimentacaoDialog, setShowMovimentacaoDialog] = useState(false);
  const [showPromocaoHistoricoDialog, setShowPromocaoHistoricoDialog] = useState(false);
  const [showEditImagesDialog, setShowEditImagesDialog] = useState(false);
  const [showGalleryDialog, setShowGalleryDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPromocao, setFilterPromocao] = useState<boolean | null>(null);
  const [filterNovidade, setFilterNovidade] = useState<boolean | null>(null);
  const [filterCor, setFilterCor] = useState<string>("todas");
  const [filterTamanho, setFilterTamanho] = useState<string>("todos");
  const [filterCategoria, setFilterCategoria] = useState<string>("todas");
  
  // State para selecionar cor/tamanho por item
  const [selectedColorByItem, setSelectedColorByItem] = useState<{[key: string]: string}>({});
  const [selectedSizeByItem, setSelectedSizeByItem] = useState<{[key: string]: string}>({});

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
          initialSizes[item.codigoProduto] = item.variantes[0].tamanho;
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
    
    // Filtro de tamanho
    const matchesTamanho = filterTamanho === "todos" || 
      (item.variantes && item.variantes.some((v: any) => v.tamanho === filterTamanho && v.quantidade > 0));
    
    return matchesSearch && matchesPromocao && matchesNovidade && matchesCategoria && matchesCor && matchesTamanho;
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
  const getTamanhosDisponiveis = (item: any, cor: string) => {
    if (!item.variantes) return [];
    return item.variantes
      .filter((v: any) => v.cor === cor && v.quantidade > 0)
      .map((v: any) => v.tamanho);
  };

  // Obter variante atual selecionada
  const getSelectedVariant = (item: any) => {
    const cor = selectedColorByItem[item.codigoProduto];
    const tamanho = selectedSizeByItem[item.codigoProduto];
    
    if (!item.variantes || !cor || !tamanho) return null;
    
    return item.variantes.find((v: any) => v.cor === cor && v.tamanho === tamanho);
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
          tamanhos.add(v.tamanho);
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

  const openGalleryDialog = (item: any, variante: any) => {
    setSelectedItem(item);
    setSelectedVariant(variante);
    setShowGalleryDialog(true);
  };

  const handleImagesSuccess = () => {
    loadEstoque();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-2">Estoque</h1>
        <p className="text-muted-foreground">
          Controle de inventário e movimentações
        </p>
      </div>

      <Card className="p-6 shadow-card">
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Filtrar por Cor</Label>
              <Select value={filterCor} onValueChange={setFilterCor}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as cores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as cores</SelectItem>
                  {getAllCores().map((cor) => (
                    <SelectItem key={cor} value={cor}>{cor}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Filtrar por Tamanho</Label>
              <Select value={filterTamanho} onValueChange={setFilterTamanho}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tamanhos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tamanhos</SelectItem>
                  {getAllTamanhos().map((tamanho) => (
                    <SelectItem key={tamanho} value={tamanho}>{tamanho}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            
            {(filterPromocao !== null || filterNovidade !== null || filterCategoria !== "todas" || filterCor !== "todas" || filterTamanho !== "todos") && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setFilterPromocao(null);
                  setFilterNovidade(null);
                  setFilterCategoria("todas");
                  setFilterCor("todas");
                  setFilterTamanho("todos");
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
      ) : (
        <div className="space-y-6">
          {filteredInventory.map((item) => {
            const coresDisponiveis = getCoresDisponiveis(item);
            const selectedCor = selectedColorByItem[item.codigoProduto] || '';
            const selectedTamanho = selectedSizeByItem[item.codigoProduto] || '';
            const tamanhosDisponiveis = getTamanhosDisponiveis(item, selectedCor);
            const varianteSelecionada = getSelectedVariant(item);

            return (
              <Card key={item.codigoProduto} className="p-6 shadow-card hover:shadow-lg transition-all">
                <div className="flex flex-col gap-6">
                  {/* Header com imagem, nome e badges */}
                  <div className="flex items-start gap-4">
                    {varianteSelecionada && varianteSelecionada.imagens && varianteSelecionada.imagens.length > 0 ? (
                      <img
                        src={varianteSelecionada.imagens[0]}
                        alt={`${item.nomeProduto} - ${selectedCor} ${selectedTamanho}`}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg flex items-center justify-center">
                        <img 
                          src={getDefaultImageByCategory(item.categoria)} 
                          alt={`${item.categoria || 'Produto'} - Logo Mariela`}
                          className="w-12 h-12 object-contain opacity-50"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.innerHTML = '<svg class="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>';
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
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-muted-foreground mb-2 block">
                        Quantidade Disponível
                      </label>
                      <div className="text-3xl font-bold text-primary">
                        {varianteSelecionada ? varianteSelecionada.quantidade : 0} un.
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {selectedCor} - {selectedTamanho}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-muted-foreground mb-2 block">
                        Quantidade Total
                      </label>
                      <div className="text-3xl font-bold text-secondary">
                        {item.variantes?.reduce((total: number, v: any) => total + (v.quantidade || 0), 0) || 0} un.
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
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
                        {tamanhosDisponiveis.map((tamanho: string) => (
                          <Badge
                            key={tamanho}
                            variant={selectedTamanho === tamanho ? "default" : "outline"}
                            className="cursor-pointer hover:bg-primary/90"
                            onClick={() => handleSizeChange(item.codigoProduto, tamanho)}
                          >
                            {tamanho}
                          </Badge>
                        ))}
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
                      onClick={() => openEntryDialog(item, varianteSelecionada)}
                      className="gap-2"
                      disabled={!varianteSelecionada}
                    >
                      <Plus className="h-4 w-4" />
                      Entrada
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openExitDialog(item, varianteSelecionada)}
                      className="gap-2"
                      disabled={!varianteSelecionada || varianteSelecionada.quantidade === 0}
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
                    {varianteSelecionada && varianteSelecionada.imagens && varianteSelecionada.imagens.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openGalleryDialog(item, varianteSelecionada)}
                        className="gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Ver Galeria ({varianteSelecionada.imagens.length})
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openMovimentacaoDialog(item)}
                      className="gap-2"
                    >
                      <List className="h-4 w-4" />
                      Ver Movimentações
                    </Button>
                    {item.logPromocao && item.logPromocao.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openPromocaoHistoricoDialog(item)}
                        className="gap-2 border-purple-500/50 text-purple-600 hover:bg-purple-500/10"
                      >
                        <History className="h-4 w-4" />
                        Histórico de Promoções
                      </Button>
                    )}
                  </div>

                  {/* Últimas Movimentações */}
                  {item.logMovimentacao && item.logMovimentacao.length > 0 && (
                    <div className="pt-4 border-t border-border/50">
                      <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                        Últimas Movimentações
                      </h4>
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
                      </div>
                    </div>
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
            quantidadeDisponivel={selectedVariant.quantidade}
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

          <ImageGalleryDialog
            open={showGalleryDialog}
            onOpenChange={setShowGalleryDialog}
            images={selectedVariant.imagens || []}
            title={`${selectedItem.nomeProduto} - ${selectedVariant.cor} / ${selectedVariant.tamanho}`}
          />
        </>
      )}
    </div>
  );
};

export default Estoque;
