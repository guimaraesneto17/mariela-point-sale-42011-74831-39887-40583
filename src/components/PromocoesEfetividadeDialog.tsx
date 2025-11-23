import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Package, DollarSign, Percent, Calendar } from "lucide-react";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect, useState } from "react";
import { produtosAPI, vendasAPI } from "@/lib/api";

interface PromocoesEfetividadeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EfetividadePromocao {
  codigoProduto: string;
  nomeProduto: string;
  categoria: string;
  diasSemVenda: number;
  precoOriginal: number;
  precoPromocional: number;
  descontoPercentual: number;
  dataInicioPromocao: string;
  vendasAntesPromocao: number;
  vendasDepoisPromocao: number;
  receitaAntesPromocao: number;
  receitaDepoisPromocao: number;
  taxaConversao: number;
  aumentoVendas: number;
}

export function PromocoesEfetividadeDialog({ open, onOpenChange }: PromocoesEfetividadeDialogProps) {
  const [efetividade, setEfetividade] = useState<EfetividadePromocao[]>([]);
  const [loading, setLoading] = useState(false);
  const [resumo, setResumo] = useState({
    totalProdutosPromovidos: 0,
    mediaConversao: 0,
    receitaGerada: 0,
    produtosVendidos: 0
  });

  useEffect(() => {
    if (open) {
      loadEfetividade();
    }
  }, [open]);

  const loadEfetividade = async () => {
    try {
      setLoading(true);
      const [produtos, vendas] = await Promise.all([
        produtosAPI.getAll(),
        vendasAPI.getAll()
      ]);

      // Filtrar produtos em promoção
      const produtosPromovidos = produtos.filter((p: any) => p.emPromocao === true);

      const efetividadeData: EfetividadePromocao[] = [];

      for (const produto of produtosPromovidos) {
        // Calcular data de início da promoção (usar histórico de preços se disponível)
        const dataInicioPromocao = produto.historicoPrecos?.[produto.historicoPrecos.length - 1]?.data || new Date().toISOString();
        const dataPromocao = new Date(dataInicioPromocao);

        // Calcular vendas antes e depois da promoção
        const vendasProduto = vendas.filter((v: any) => 
          v.itens?.some((item: any) => item.codigoProduto === produto.codigoProduto)
        );

        const vendasAntes = vendasProduto.filter((v: any) => new Date(v.dataVenda) < dataPromocao);
        const vendasDepois = vendasProduto.filter((v: any) => new Date(v.dataVenda) >= dataPromocao);

        // Calcular quantidade e receita
        const quantidadeAntes = vendasAntes.reduce((sum: number, v: any) => {
          const item = v.itens.find((i: any) => i.codigoProduto === produto.codigoProduto);
          return sum + (item?.quantidade || 0);
        }, 0);

        const quantidadeDepois = vendasDepois.reduce((sum: number, v: any) => {
          const item = v.itens.find((i: any) => i.codigoProduto === produto.codigoProduto);
          return sum + (item?.quantidade || 0);
        }, 0);

        const receitaAntes = vendasAntes.reduce((sum: number, v: any) => {
          const item = v.itens.find((i: any) => i.codigoProduto === produto.codigoProduto);
          return sum + (item?.valorTotal || 0);
        }, 0);

        const receitaDepois = vendasDepois.reduce((sum: number, v: any) => {
          const item = v.itens.find((i: any) => i.codigoProduto === produto.codigoProduto);
          return sum + (item?.valorTotal || 0);
        }, 0);

        // Calcular taxa de conversão e aumento
        const diasPromocao = Math.ceil((new Date().getTime() - dataPromocao.getTime()) / (1000 * 60 * 60 * 24));
        const diasAntes = 30; // Considerar 30 dias antes da promoção
        
        const mediaVendasAntes = diasAntes > 0 ? quantidadeAntes / diasAntes : 0;
        const mediaVendasDepois = diasPromocao > 0 ? quantidadeDepois / diasPromocao : 0;
        
        const aumentoVendas = mediaVendasAntes > 0 
          ? ((mediaVendasDepois - mediaVendasAntes) / mediaVendasAntes) * 100 
          : (quantidadeDepois > 0 ? 100 : 0);

        const taxaConversao = quantidadeDepois > 0 ? (quantidadeDepois / (quantidadeDepois + quantidadeAntes)) * 100 : 0;

        // Calcular desconto
        const descontoPercentual = ((produto.precoVenda - produto.precoPromocional) / produto.precoVenda) * 100;

        // Calcular dias sem venda antes da promoção
        const ultimaVendaAntes = vendasAntes[vendasAntes.length - 1];
        const diasSemVenda = ultimaVendaAntes 
          ? Math.ceil((dataPromocao.getTime() - new Date(ultimaVendaAntes.dataVenda).getTime()) / (1000 * 60 * 60 * 24))
          : 90; // Default para produtos sem vendas

        efetividadeData.push({
          codigoProduto: produto.codigoProduto,
          nomeProduto: produto.nomeProduto,
          categoria: produto.categoria,
          diasSemVenda,
          precoOriginal: produto.precoVenda,
          precoPromocional: produto.precoPromocional,
          descontoPercentual,
          dataInicioPromocao,
          vendasAntesPromocao: quantidadeAntes,
          vendasDepoisPromocao: quantidadeDepois,
          receitaAntesPromocao: receitaAntes,
          receitaDepoisPromocao: receitaDepois,
          taxaConversao,
          aumentoVendas
        });
      }

      // Ordenar por taxa de conversão
      efetividadeData.sort((a, b) => b.taxaConversao - a.taxaConversao);

      // Calcular resumo
      const totalProdutosVendidos = efetividadeData.reduce((sum, e) => sum + e.vendasDepoisPromocao, 0);
      const receitaTotal = efetividadeData.reduce((sum, e) => sum + e.receitaDepoisPromocao, 0);
      const mediaConv = efetividadeData.length > 0
        ? efetividadeData.reduce((sum, e) => sum + e.taxaConversao, 0) / efetividadeData.length
        : 0;

      setResumo({
        totalProdutosPromovidos: efetividadeData.length,
        mediaConversao: mediaConv,
        receitaGerada: receitaTotal,
        produtosVendidos: totalProdutosVendidos
      });

      setEfetividade(efetividadeData);
    } catch (error) {
      console.error('Erro ao carregar efetividade de promoções:', error);
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

  const getSeveridadeBadge = (aumento: number) => {
    if (aumento >= 50) return <Badge className="bg-green-500">Excelente</Badge>;
    if (aumento >= 20) return <Badge className="bg-blue-500">Bom</Badge>;
    if (aumento >= 0) return <Badge className="bg-yellow-500">Regular</Badge>;
    return <Badge variant="destructive">Negativo</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Efetividade de Promoções</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">Carregando...</div>
        ) : (
          <div className="space-y-6">
            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Produtos Promovidos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    <span className="text-2xl font-bold">{resumo.totalProdutosPromovidos}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Taxa Conversão Média
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-blue-500" />
                    <span className="text-2xl font-bold">{resumo.mediaConversao.toFixed(1)}%</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Receita Gerada
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span className="text-2xl font-bold">{formatCurrency(resumo.receitaGerada)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Unidades Vendidas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-orange-500" />
                    <span className="text-2xl font-bold">{resumo.produtosVendidos}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detalhes por Produto */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Detalhes por Produto</h3>
              {efetividade.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Nenhuma promoção ativa encontrada
                  </CardContent>
                </Card>
              ) : (
                efetividade.map((item) => (
                  <Card key={item.codigoProduto} className="shadow-card">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h4 className="font-bold text-lg">{item.nomeProduto}</h4>
                            <p className="text-sm text-muted-foreground">
                              {item.categoria} • {item.codigoProduto}
                            </p>
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4" />
                              <span className="text-muted-foreground">
                                Promoção desde: {format(new Date(item.dataInicioPromocao), 'dd/MM/yyyy', { locale: ptBR })}
                              </span>
                            </div>
                          </div>
                          <div className="text-right space-y-2">
                            {getSeveridadeBadge(item.aumentoVendas)}
                            <div className="text-sm text-muted-foreground">
                              {item.diasSemVenda} dias sem venda antes
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Desconto</p>
                            <p className="font-semibold text-orange-600">
                              {item.descontoPercentual.toFixed(0)}%
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(item.precoOriginal)} → {formatCurrency(item.precoPromocional)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Vendas Antes</p>
                            <p className="font-semibold">{item.vendasAntesPromocao} un.</p>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(item.receitaAntesPromocao)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Vendas Depois</p>
                            <p className="font-semibold text-green-600">{item.vendasDepoisPromocao} un.</p>
                            <p className="text-xs text-green-600">
                              {formatCurrency(item.receitaDepoisPromocao)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Aumento</p>
                            <p className={`font-semibold ${item.aumentoVendas >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {item.aumentoVendas >= 0 ? '+' : ''}{item.aumentoVendas.toFixed(1)}%
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Taxa: {item.taxaConversao.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
