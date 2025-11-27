import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Tag, TrendingDown, Package, Calendar, DollarSign, X } from "lucide-react";
import { toast } from "sonner";
import { estoqueAPI, vendasAPI } from "@/lib/api";
import { PromotionDialog } from "./PromotionDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EstoqueAlertasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProdutoParado {
  codigoProduto: string;
  nomeProduto: string;
  categoria: string;
  quantidadeTotal: number;
  diasParado: number;
  ultimaVenda: string | null;
  valorEstoque: number;
  precoVenda: number;
  emPromocao: boolean;
}

export function EstoqueAlertasDialog({ open, onOpenChange }: EstoqueAlertasDialogProps) {
  const [loading, setLoading] = useState(true);
  const [produtosParados, setProdutosParados] = useState<ProdutoParado[]>([]);
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  useEffect(() => {
    if (open) {
      loadAlertasProdutos();
    }
  }, [open]);

  const loadAlertasProdutos = async () => {
    try {
      setLoading(true);
      const [estoque, vendas] = await Promise.all([
        estoqueAPI.getAll(),
        vendasAPI.getAll()
      ]);

      const hoje = new Date();
      const limite90Dias = new Date();
      limite90Dias.setDate(hoje.getDate() - 30);

      const produtosComAlerta: ProdutoParado[] = [];

      estoque.forEach((item: any) => {
        if (!item.quantidadeTotal || item.quantidadeTotal === 0) return;

        // Encontrar última venda do produto
        let ultimaVenda: Date | null = null;
        
        vendas.forEach((venda: any) => {
          venda.itens?.forEach((itemVenda: any) => {
            if (itemVenda.codigoProduto === item.codigoProduto) {
              const dataVenda = new Date(venda.data || venda.dataVenda);
              if (!ultimaVenda || dataVenda > ultimaVenda) {
                ultimaVenda = dataVenda;
              }
            }
          });
        });

        // Se não teve venda ou última venda foi há mais de 30 dias
        const dataReferencia = ultimaVenda || (item.dataCadastro ? new Date(item.dataCadastro) : null);
        
        if (!dataReferencia || dataReferencia < limite90Dias) {
          const diasParado = dataReferencia 
            ? Math.floor((hoje.getTime() - dataReferencia.getTime()) / (1000 * 60 * 60 * 24))
            : 999; // Produto sem histórico de venda

          produtosComAlerta.push({
            codigoProduto: item.codigoProduto,
            nomeProduto: item.nomeProduto || item.nome,
            categoria: item.categoria || 'Sem Categoria',
            quantidadeTotal: item.quantidadeTotal,
            diasParado,
            ultimaVenda: dataReferencia ? dataReferencia.toISOString() : null,
            valorEstoque: item.quantidadeTotal * (item.precoVenda || item.precoPromocional || 0),
            precoVenda: item.precoVenda || item.precoPromocional || 0,
            emPromocao: item.emPromocao || false
          });
        }
      });

      // Ordenar por dias parado (maior primeiro) e valor em estoque
      produtosComAlerta.sort((a, b) => {
        if (b.diasParado !== a.diasParado) {
          return b.diasParado - a.diasParado;
        }
        return b.valorEstoque - a.valorEstoque;
      });

      setProdutosParados(produtosComAlerta);
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
      toast.error('Erro ao carregar alertas de produtos');
    } finally {
      setLoading(false);
    }
  };

  const handleCriarPromocao = (produto: ProdutoParado) => {
    setSelectedProduct(produto);
    setShowPromotionDialog(true);
  };

  const handlePromocaoSuccess = () => {
    loadAlertasProdutos();
    toast.success('Promoção criada! O produto será atualizado.');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getSeveridade = (diasParado: number) => {
    if (diasParado >= 90) return { color: 'destructive', label: 'CRÍTICO', icon: AlertTriangle };
    if (diasParado >= 60) return { color: 'warning', label: 'ALTO', icon: TrendingDown };
    return { color: 'secondary', label: 'MÉDIO', icon: Package };
  };

  const produtosPorSeveridade = {
    critico: produtosParados.filter(p => p.diasParado >= 90),
    alto: produtosParados.filter(p => p.diasParado >= 60 && p.diasParado < 90),
    medio: produtosParados.filter(p => p.diasParado >= 30 && p.diasParado < 60)
  };

  const valorTotalParado = produtosParados.reduce((acc, p) => acc + p.valorEstoque, 0);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
              Alertas de Estoque Parado
            </DialogTitle>
            <DialogDescription>
              Produtos sem movimentação há mais de 30 dias que precisam de atenção
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Carregando alertas...</p>
            </div>
          ) : produtosParados.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Tudo em ordem! 🎉</h3>
              <p className="text-muted-foreground">
                Não há produtos parados há mais de 30 dias.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Resumo dos Alertas */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-amber-200 dark:border-amber-900">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total de Produtos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-amber-600">
                      {produtosParados.length}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-red-200 dark:border-red-900">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Críticos (90+ dias)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">
                      {produtosPorSeveridade.critico.length}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-orange-200 dark:border-orange-900">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Alto Risco (60-89 dias)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-600">
                      {produtosPorSeveridade.alto.length}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-primary-200 dark:border-primary-900">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Valor Total Parado
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">
                      {formatCurrency(valorTotalParado)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabs por Severidade */}
              <Tabs defaultValue="todos" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="todos">
                    Todos ({produtosParados.length})
                  </TabsTrigger>
                  <TabsTrigger value="critico">
                    Crítico ({produtosPorSeveridade.critico.length})
                  </TabsTrigger>
                  <TabsTrigger value="alto">
                    Alto ({produtosPorSeveridade.alto.length})
                  </TabsTrigger>
                  <TabsTrigger value="medio">
                    Médio ({produtosPorSeveridade.medio.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="todos" className="space-y-3 mt-4">
                  {produtosParados.map((produto) => {
                    const severidade = getSeveridade(produto.diasParado);
                    const Icon = severidade.icon;
                    
                    return (
                      <Card key={produto.codigoProduto} className="border-l-4 border-l-amber-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Icon className="h-5 w-5 text-amber-600" />
                                <h3 className="font-semibold text-lg">{produto.nomeProduto}</h3>
                                <Badge variant={severidade.color as any}>
                                  {severidade.label}
                                </Badge>
                                {produto.emPromocao && (
                                  <Badge variant="default" className="bg-red-600">
                                    Em Promoção
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-muted-foreground mt-3">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  <span>{produto.diasParado} dias parado</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Package className="h-4 w-4" />
                                  <span>{produto.quantidadeTotal} unidades</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-4 w-4" />
                                  <span>{formatCurrency(produto.valorEstoque)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Tag className="h-4 w-4" />
                                  <span>{produto.categoria}</span>
                                </div>
                              </div>

                              {produto.ultimaVenda && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  Última venda: {new Date(produto.ultimaVenda).toLocaleDateString('pt-BR')}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-col gap-2">
                              {!produto.emPromocao && (
                                <Button
                                  size="sm"
                                  onClick={() => handleCriarPromocao(produto)}
                                  className="gap-2"
                                >
                                  <Tag className="h-4 w-4" />
                                  Criar Promoção
                                </Button>
                              )}
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const desconto = produto.diasParado >= 180 ? 30 : 
                                                  produto.diasParado >= 120 ? 20 : 15;
                                  toast.info(`Sugestão: Desconto de ${desconto}% para giro rápido`);
                                }}
                              >
                                Ver Sugestões
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </TabsContent>

                <TabsContent value="critico" className="space-y-3 mt-4">
                  {produtosPorSeveridade.critico.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum produto crítico
                    </div>
                  ) : (
                    produtosPorSeveridade.critico.map((produto) => (
                      <Card key={produto.codigoProduto} className="border-l-4 border-l-red-500">
                        <CardContent className="p-4">
                          {/* Mesmo conteúdo do card acima */}
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                                <h3 className="font-semibold text-lg">{produto.nomeProduto}</h3>
                                <Badge variant="destructive">CRÍTICO</Badge>
                                {produto.emPromocao && (
                                  <Badge variant="default" className="bg-red-600">Em Promoção</Badge>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-muted-foreground mt-3">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  <span>{produto.diasParado} dias parado</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Package className="h-4 w-4" />
                                  <span>{produto.quantidadeTotal} unidades</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-4 w-4" />
                                  <span>{formatCurrency(produto.valorEstoque)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Tag className="h-4 w-4" />
                                  <span>{produto.categoria}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2">
                              {!produto.emPromocao && (
                                <Button size="sm" onClick={() => handleCriarPromocao(produto)} className="gap-2">
                                  <Tag className="h-4 w-4" />
                                  Criar Promoção
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="alto" className="space-y-3 mt-4">
                  {produtosPorSeveridade.alto.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum produto de alto risco
                    </div>
                  ) : (
                    produtosPorSeveridade.alto.map((produto) => (
                      <Card key={produto.codigoProduto} className="border-l-4 border-l-orange-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <TrendingDown className="h-5 w-5 text-orange-600" />
                                <h3 className="font-semibold text-lg">{produto.nomeProduto}</h3>
                                <Badge className="bg-orange-600">ALTO</Badge>
                                {produto.emPromocao && (
                                  <Badge variant="default" className="bg-red-600">Em Promoção</Badge>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-muted-foreground mt-3">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  <span>{produto.diasParado} dias parado</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Package className="h-4 w-4" />
                                  <span>{produto.quantidadeTotal} unidades</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-4 w-4" />
                                  <span>{formatCurrency(produto.valorEstoque)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Tag className="h-4 w-4" />
                                  <span>{produto.categoria}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2">
                              {!produto.emPromocao && (
                                <Button size="sm" onClick={() => handleCriarPromocao(produto)} className="gap-2">
                                  <Tag className="h-4 w-4" />
                                  Criar Promoção
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="medio" className="space-y-3 mt-4">
                  {produtosPorSeveridade.medio.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum produto de médio risco
                    </div>
                  ) : (
                    produtosPorSeveridade.medio.map((produto) => (
                      <Card key={produto.codigoProduto} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Package className="h-5 w-5 text-blue-600" />
                                <h3 className="font-semibold text-lg">{produto.nomeProduto}</h3>
                                <Badge variant="secondary">MÉDIO</Badge>
                                {produto.emPromocao && (
                                  <Badge variant="default" className="bg-red-600">Em Promoção</Badge>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-muted-foreground mt-3">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  <span>{produto.diasParado} dias parado</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Package className="h-4 w-4" />
                                  <span>{produto.quantidadeTotal} unidades</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-4 w-4" />
                                  <span>{formatCurrency(produto.valorEstoque)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Tag className="h-4 w-4" />
                                  <span>{produto.categoria}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2">
                              {!produto.emPromocao && (
                                <Button size="sm" onClick={() => handleCriarPromocao(produto)} className="gap-2">
                                  <Tag className="h-4 w-4" />
                                  Criar Promoção
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4 mr-2" />
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {selectedProduct && (
        <PromotionDialog
          open={showPromotionDialog}
          onOpenChange={setShowPromotionDialog}
          codigoProduto={selectedProduct.codigoProduto}
          nomeProduto={selectedProduct.nomeProduto}
          precoOriginal={selectedProduct.precoVenda}
          emPromocao={selectedProduct.emPromocao}
          onSuccess={handlePromocaoSuccess}
        />
      )}
    </>
  );
}