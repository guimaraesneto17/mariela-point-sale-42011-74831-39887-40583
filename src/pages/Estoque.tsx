import { useState, useEffect } from "react";
import { Package, TrendingUp, TrendingDown, Search, Plus, Minus, Tag, List, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPromocao, setFilterPromocao] = useState<boolean | null>(null);
  const [filterNovidade, setFilterNovidade] = useState<boolean | null>(null);

  useEffect(() => {
    loadEstoque();
  }, []);

  const loadEstoque = async () => {
    try {
      setLoading(true);
      const data = await estoqueAPI.getAll();
      setInventory(data);
    } catch (error) {
      console.error('Erro ao carregar estoque:', error);
      toast.error('Erro ao carregar estoque');
    } finally {
      setLoading(false);
    }
  };

  // Mock data - será substituído por dados reais da API
  const mockInventory = [
    {
      _id: "1",
      codigoProduto: "P101",
      nomeProduto: "Vestido Floral Curto",
      quantidadeDisponivel: 15,
      tamanho: "M",
      cor: "Azul Claro",
      emPromocao: true,
      valorPromocional: 119.90,
      precoVenda: 149.90,
      novidade: false,
      logMovimentacao: [
        {
          data: "2025-10-01T08:00:00Z",
          tipo: "entrada",
          quantidade: 20,
          fornecedor: "Elegance Fashion"
        },
        {
          data: "2025-10-12T14:30:00Z",
          tipo: "saida",
          quantidade: 5,
          codigoVenda: "VENDA20251012-001"
        }
      ]
    },
    {
      _id: "2",
      codigoProduto: "P102",
      nomeProduto: "Blusa Manga Longa",
      quantidadeDisponivel: 8,
      tamanho: "G",
      cor: "Preto",
      emPromocao: false,
      precoVenda: 89.90,
      novidade: true,
      logMovimentacao: [
        {
          data: "2025-10-03T11:00:00Z",
          tipo: "entrada",
          quantidade: 15,
          fornecedor: "Moda Style"
        }
      ]
    },
    {
      _id: "3",
      codigoProduto: "P103",
      nomeProduto: "Calça Jeans Skinny",
      quantidadeDisponivel: 12,
      tamanho: "38",
      cor: "Azul Escuro",
      emPromocao: false,
      precoVenda: 199.90,
      novidade: false,
      logMovimentacao: [
        {
          data: "2025-10-10T09:30:00Z",
          tipo: "entrada",
          quantidade: 25,
          fornecedor: "Denim Co."
        },
        {
          data: "2025-10-13T16:15:00Z",
          tipo: "saida",
          quantidade: 13,
          codigoVenda: "VENDA20251013-003"
        }
      ]
    },
  ];

  const displayInventory = inventory.length > 0 ? inventory : mockInventory;
  const filteredInventory = displayInventory.filter(item => {
    const nomeProduto = item.nomeProduto || '';
    const codigoProduto = item.codigoProduto || '';
    const cor = item.cor || '';
    
    // Filtro de texto
    const matchesSearch = nomeProduto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      codigoProduto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cor.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro de promoção
    const matchesPromocao = filterPromocao === null || item.emPromocao === filterPromocao;
    
    // Filtro de novidade
    const matchesNovidade = filterNovidade === null || item.isNovidade === filterNovidade;
    
    return matchesSearch && matchesPromocao && matchesNovidade;
  });

  const openEntryDialog = (item: any) => {
    setSelectedItem(item);
    setShowEntryDialog(true);
  };

  const openExitDialog = (item: any) => {
    setSelectedItem(item);
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

      <div className="space-y-6">
        {filteredInventory.map((item, index) => (
          <Card
            key={item._id}
            className="p-6 hover:shadow-elegant transition-all duration-300 animate-slide-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">{item.nomeProduto}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.codigoProduto} • {item.categoria || 'Sem categoria'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {item.emPromocao && (
                  <Badge className="bg-accent text-accent-foreground">
                    Promoção
                  </Badge>
                )}
                {item.isNovidade && (
                  <Badge className="bg-green-600 text-white">
                    Novidade
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="p-4 rounded-lg bg-background/50 border border-border">
                <p className="text-sm text-muted-foreground mb-1">Quantidade Disponível</p>
                <p className="text-2xl font-bold text-primary">
                  {item.quantidade || item.quantidadeDisponivel || 0} un.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-background/50 border border-border">
                <p className="text-sm text-muted-foreground mb-1">Tamanho</p>
                <p className="text-2xl font-bold text-foreground">
                  {item.tamanho}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-background/50 border border-border">
                <p className="text-sm text-muted-foreground mb-1">Cor</p>
                <p className="text-lg font-medium text-foreground">
                  {item.cor}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-background/50 border border-border">
                <p className="text-sm text-muted-foreground mb-1">Preço de Venda</p>
                <p className="text-2xl font-bold text-foreground">
                  R$ {(item.precoVenda || 0).toFixed(2)}
                </p>
              </div>
              {item.emPromocao && (
                <div className="p-4 rounded-lg bg-accent/10 border border-accent">
                  <p className="text-sm text-muted-foreground mb-1">Valor Promocional</p>
                  <p className="text-2xl font-bold text-accent">
                    R$ {(item.precoPromocional || 0).toFixed(2)}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <Button size="sm" className="gap-2" onClick={() => openEntryDialog(item)}>
                <Plus className="h-4 w-4" />
                Entrada
              </Button>
              <Button size="sm" variant="outline" className="gap-2" onClick={() => openExitDialog(item)}>
                <Minus className="h-4 w-4" />
                Saída
              </Button>
              <Button 
                size="sm" 
                variant={item.emPromocao ? "default" : "outline"}
                className={`gap-2 ${item.emPromocao ? 'bg-accent text-accent-foreground' : ''}`}
                onClick={() => openPromotionDialog(item)}
              >
                <Tag className="h-4 w-4" />
                {item.emPromocao ? "Em Promoção" : "Colocar em Promoção"}
              </Button>
              <Button 
                size="sm" 
                variant={item.isNovidade ? "default" : "outline"}
                className={`gap-2 ${item.isNovidade ? 'bg-green-600 text-white hover:bg-green-700' : ''}`}
                onClick={() => openNovidadeDialog(item)}
              >
                <Sparkles className="h-4 w-4" />
                {item.isNovidade ? "É Novidade" : "Colocar como Novidade"}
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="gap-2 ml-auto"
                onClick={() => openMovimentacaoDialog(item)}
              >
                <List className="h-4 w-4" />
                Ver Movimentações
              </Button>
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-sm font-medium text-muted-foreground mb-3">Últimas Movimentações:</p>
              <div className="space-y-2">
                {item.logMovimentacao.slice(-3).reverse().map((log, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded bg-background/50">
                    <div className="flex items-center gap-3">
                      {log.tipo === "entrada" ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {log.tipo === "entrada" ? "Entrada" : "Saída"}: {log.quantidade} un.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(log.data)}
                          {log.fornecedor && ` • ${log.fornecedor}`}
                          {log.codigoVenda && ` • ${log.codigoVenda}`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Dialogs */}
      {selectedItem && (
        <>
          <StockEntryDialog 
            open={showEntryDialog}
            onOpenChange={setShowEntryDialog}
            codigoProduto={selectedItem.codigoProduto}
            nomeProduto={selectedItem.nomeProduto}
            onSuccess={loadEstoque}
          />
          
          <StockExitDialog 
            open={showExitDialog}
            onOpenChange={setShowExitDialog}
            codigoProduto={selectedItem.codigoProduto}
            nomeProduto={selectedItem.nomeProduto}
            onSuccess={loadEstoque}
          />

          <PromotionDialog 
            open={showPromotionDialog}
            onOpenChange={setShowPromotionDialog}
            codigoProduto={selectedItem.codigoProduto}
            nomeProduto={selectedItem.nomeProduto}
            precoOriginal={selectedItem.precoVenda || 0}
            emPromocao={selectedItem.emPromocao || false}
            precoPromocionalAtual={selectedItem.precoPromocional}
            onSuccess={loadEstoque}
          />

          <NovidadeDialog 
            open={showNovidadeDialog}
            onOpenChange={setShowNovidadeDialog}
            codigoProduto={selectedItem.codigoProduto}
            nomeProduto={selectedItem.nomeProduto}
            isNovidade={selectedItem.isNovidade || false}
            onSuccess={loadEstoque}
          />

          <MovimentacaoDialog 
            open={showMovimentacaoDialog}
            onOpenChange={setShowMovimentacaoDialog}
            codigoProduto={selectedItem.codigoProduto}
            nomeProduto={selectedItem.nomeProduto}
            logMovimentacao={selectedItem.logMovimentacao}
          />
        </>
      )}
    </div>
  );
};

export default Estoque;
