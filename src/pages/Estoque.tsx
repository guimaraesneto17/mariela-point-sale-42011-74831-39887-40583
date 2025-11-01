import { useState, useEffect } from "react";
import { Package, Search, Plus, Minus, Tag, List, Sparkles, Filter } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { StockEntryDialog } from "@/components/StockEntryDialog";
import { StockExitDialog } from "@/components/StockExitDialog";
import { PromotionDialog } from "@/components/PromotionDialog";
import { NovidadeDialog } from "@/components/NovidadeDialog";
import { MovimentacaoDialog } from "@/components/MovimentacaoDialog";
import { estoqueAPI } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";

const Estoque = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showEntryDialog, setShowEntryDialog] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [showNovidadeDialog, setShowNovidadeDialog] = useState(false);
  const [showMovimentacaoDialog, setShowMovimentacaoDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPromocao, setFilterPromocao] = useState<boolean | null>(null);
  const [filterNovidade, setFilterNovidade] = useState<boolean | null>(null);
  
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
    
    // Filtro de texto
    const matchesSearch = nomeProduto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      codigoProduto.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro de promoção
    const matchesPromocao = filterPromocao === null || item.emPromocao === filterPromocao;
    
    // Filtro de novidade
    const matchesNovidade = filterNovidade === null || item.isNovidade === filterNovidade;
    
    return matchesSearch && matchesPromocao && matchesNovidade;
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
    setSelectedItem(item);
    setShowMovimentacaoDialog(true);
  };

  const handleEntrySuccess = () => {
    loadEstoque();
  };

  const handleExitSuccess = () => {
    loadEstoque();
  };

  // Obter cores únicas para um item
  const getCoresDisponiveis = (item: any) => {
    if (!item.variantes) return [];
    return [...new Set(item.variantes.map((v: any) => v.cor))];
  };

  // Obter tamanhos disponíveis para uma cor específica
  const getTamanhosDisponiveis = (item: any, cor: string) => {
    if (!item.variantes) return [];
    return item.variantes
      .filter((v: any) => v.cor === cor)
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

  // Filtrar movimentações da variante selecionada
  const getVariantMovimentos = (item: any, cor: string, tamanho: string) => {
    if (!item.logMovimentacao) return [];
    
    return item.logMovimentacao
      .filter((m: any) => m.cor === cor && m.tamanho === tamanho)
      .slice(-3)
      .reverse();
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
            
            {(filterPromocao !== null || filterNovidade !== null) && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setFilterPromocao(null);
                  setFilterNovidade(null);
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
            const movimentosVariante = selectedCor && selectedTamanho ? getVariantMovimentos(item, selectedCor, selectedTamanho) : [];

            return (
              <Card key={item.codigoProduto} className="p-6 shadow-card hover:shadow-lg transition-all">
                <div className="flex flex-col gap-6">
                  {/* Header com imagem, nome e badges */}
                  <div className="flex items-start gap-4">
                    {item.imagens && item.imagens.length > 0 && (
                      <img
                        src={item.imagens[0]}
                        alt={item.nomeProduto}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
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
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-muted-foreground mb-2 block">
                        Quantidade Disponível
                      </label>
                      <div className="text-3xl font-bold text-primary">
                        {varianteSelecionada ? varianteSelecionada.quantidade : 0} un.
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
                      onClick={() => openMovimentacaoDialog(item)}
                      className="gap-2"
                    >
                      <List className="h-4 w-4" />
                      Ver Movimentações
                    </Button>
                  </div>

                  {/* Últimas movimentações da variante selecionada */}
                  {movimentosVariante.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                        Últimas Movimentações ({selectedCor} - {selectedTamanho}):
                      </h4>
                      <div className="space-y-2">
                        {movimentosVariante.map((mov: any, index: number) => (
                          <div key={index} className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded">
                            <div className="flex items-center gap-2">
                              {mov.tipo === 'entrada' ? (
                                <Plus className="h-4 w-4 text-green-600" />
                              ) : (
                                <Minus className="h-4 w-4 text-red-600" />
                              )}
                              <span className="font-medium capitalize">{mov.tipo}: {mov.quantidade} un.</span>
                            </div>
                            <span className="text-muted-foreground">{formatDateTime(mov.data)}</span>
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
        </>
      )}
    </div>
  );
};

export default Estoque;
