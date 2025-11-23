import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingDown, Clock, Package2, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GiroEstoqueDashboardProps {
  estoque: any[];
  produtos: any[];
  vendas: any[];
}

export const GiroEstoqueDashboard = ({ estoque, produtos, vendas }: GiroEstoqueDashboardProps) => {
  // Calcular produtos parados (sem vendas há mais de 30 dias)
  const calcularProdutosParados = () => {
    const hoje = new Date();
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(hoje.getDate() - 30);

    const produtosParados: any[] = [];

    estoque.forEach((item: any) => {
      const produto = produtos.find((p: any) => p.codigoProduto === item.codigoProduto);
      
      // Verificar última venda do produto
      const vendasProduto = vendas.filter((v: any) => 
        v.itens?.some((i: any) => i.codigoProduto === item.codigoProduto)
      );

      let ultimaVenda: Date | null = null;
      vendasProduto.forEach((venda: any) => {
        const dataVenda = new Date(venda.data || venda.dataVenda);
        if (!ultimaVenda || dataVenda > ultimaVenda) {
          ultimaVenda = dataVenda;
        }
      });

      // Produto parado se: tem estoque E (sem vendas OU última venda há mais de 30 dias)
      const estoqueProduto = item.quantidadeTotal || 0;
      const estaParado = estoqueProduto > 0 && (!ultimaVenda || ultimaVenda < trintaDiasAtras);

      if (estaParado) {
        const diasSemVenda = ultimaVenda 
          ? Math.floor((hoje.getTime() - ultimaVenda.getTime()) / (1000 * 60 * 60 * 24))
          : 999; // Nunca teve venda

        const valorImobilizado = estoqueProduto * (item.precoVenda || item.precoPromocional || 0);

        produtosParados.push({
          codigoProduto: item.codigoProduto,
          nomeProduto: item.nomeProduto || produto?.nome,
          categoria: produto?.categoria || 'Sem Categoria',
          estoque: estoqueProduto,
          valorImobilizado,
          diasSemVenda,
          ultimaVenda: ultimaVenda ? ultimaVenda.toLocaleDateString('pt-BR') : 'Nunca',
          precoCusto: item.precoCusto || 0,
          precoVenda: item.precoVenda || item.precoPromocional || 0
        });
      }
    });

    return produtosParados.sort((a, b) => b.valorImobilizado - a.valorImobilizado);
  };

  // Calcular giro de estoque por categoria
  const calcularGiroPorCategoria = () => {
    const giroPorCategoria: any = {};

    estoque.forEach((item: any) => {
      const produto = produtos.find((p: any) => p.codigoProduto === item.codigoProduto);
      const categoria = produto?.categoria || 'Sem Categoria';

      if (!giroPorCategoria[categoria]) {
        giroPorCategoria[categoria] = {
          categoria,
          estoqueTotal: 0,
          vendasTotal: 0,
          valorEstoque: 0,
          produtos: 0
        };
      }

      const estoqueItem = item.quantidadeTotal || 0;
      giroPorCategoria[categoria].estoqueTotal += estoqueItem;
      giroPorCategoria[categoria].valorEstoque += estoqueItem * (item.precoVenda || item.precoPromocional || 0);
      giroPorCategoria[categoria].produtos += 1;

      // Calcular vendas dos últimos 30 dias
      const trintaDiasAtras = new Date();
      trintaDiasAtras.setDate(new Date().getDate() - 30);

      const vendasProduto = vendas.filter((v: any) => {
        const dataVenda = new Date(v.data || v.dataVenda);
        return dataVenda >= trintaDiasAtras && v.itens?.some((i: any) => i.codigoProduto === item.codigoProduto);
      });

      const quantidadeVendida = vendasProduto.reduce((total: number, venda: any) => {
        const itemVenda = venda.itens?.find((i: any) => i.codigoProduto === item.codigoProduto);
        return total + (itemVenda?.quantidade || 0);
      }, 0);

      giroPorCategoria[categoria].vendasTotal += quantidadeVendida;
    });

    return Object.values(giroPorCategoria).map((cat: any) => ({
      ...cat,
      taxaGiro: cat.estoqueTotal > 0 ? ((cat.vendasTotal / cat.estoqueTotal) * 100).toFixed(1) : 0,
      diasEstoque: cat.vendasTotal > 0 ? Math.round((cat.estoqueTotal / cat.vendasTotal) * 30) : 999
    })).sort((a: any, b: any) => parseFloat(a.taxaGiro) - parseFloat(b.taxaGiro));
  };

  const produtosParados = calcularProdutosParados();
  const giroPorCategoria = calcularGiroPorCategoria();
  const valorTotalImobilizado = produtosParados.reduce((sum, p) => sum + p.valorImobilizado, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Alertas de Produtos Parados */}
      {produtosParados.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-900 bg-gradient-to-br from-amber-50/50 to-background dark:from-amber-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Bell className="h-5 w-5 animate-pulse" />
              Alertas de Produtos Parados
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {produtosParados.length} produto{produtosParados.length > 1 ? 's' : ''} sem movimentação há mais de 30 dias
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-amber-100 dark:bg-amber-950/40 p-4 rounded-lg border border-amber-300 dark:border-amber-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Valor Total Imobilizado</p>
                  <p className="text-3xl font-bold text-amber-700 dark:text-amber-400 mt-1">
                    {formatCurrency(valorTotalImobilizado)}
                  </p>
                </div>
                <AlertTriangle className="h-12 w-12 text-amber-500" />
              </div>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {produtosParados.slice(0, 10).map((produto: any, index: number) => (
                <div 
                  key={produto.codigoProduto}
                  className="flex items-center justify-between p-4 bg-background rounded-lg border border-border hover:border-amber-400 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-foreground">{produto.nomeProduto}</h4>
                      <Badge variant="outline" className="text-xs">
                        {produto.categoria}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Package2 className="h-4 w-4" />
                        <span>{produto.estoque} unidades</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          {produto.diasSemVenda >= 999 
                            ? 'Nunca vendido' 
                            : `${produto.diasSemVenda} dias sem venda`}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Última venda: {produto.ultimaVenda}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold text-lg text-amber-700 dark:text-amber-400">
                      {formatCurrency(produto.valorImobilizado)}
                    </p>
                    <p className="text-xs text-muted-foreground">imobilizado</p>
                  </div>
                </div>
              ))}
            </div>

            {produtosParados.length > 10 && (
              <p className="text-sm text-center text-muted-foreground">
                E mais {produtosParados.length - 10} produto{produtosParados.length - 10 > 1 ? 's' : ''} parado{produtosParados.length - 10 > 1 ? 's' : ''}...
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Análise de Giro por Categoria */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-primary" />
            Análise de Giro de Estoque por Categoria
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Taxa de giro baseada nas vendas dos últimos 30 dias
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {giroPorCategoria.map((cat: any, index: number) => {
              const taxaGiroNum = parseFloat(cat.taxaGiro);
              const isLento = taxaGiroNum < 50;
              
              return (
                <div 
                  key={cat.categoria}
                  className={`p-4 rounded-lg border ${
                    isLento 
                      ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900' 
                      : 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-foreground">{cat.categoria}</h4>
                      {isLento && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Giro Lento
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${isLento ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {cat.taxaGiro}%
                      </p>
                      <p className="text-xs text-muted-foreground">taxa de giro</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Estoque</p>
                      <p className="font-semibold text-foreground">{cat.estoqueTotal} un</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Vendas (30d)</p>
                      <p className="font-semibold text-foreground">{cat.vendasTotal} un</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Dias de Estoque</p>
                      <p className="font-semibold text-foreground">
                        {cat.diasEstoque >= 999 ? '∞' : `${cat.diasEstoque} dias`}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Valor</p>
                      <p className="font-semibold text-foreground">{formatCurrency(cat.valorEstoque)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
