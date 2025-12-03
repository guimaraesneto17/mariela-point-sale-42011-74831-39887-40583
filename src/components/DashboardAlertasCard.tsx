import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingDown, Package } from "lucide-react";
import { EstoqueAlertasDialog } from "./EstoqueAlertasDialog";
import { useEstoque, useVendas } from "@/hooks/useQueryCache";

export function DashboardAlertasCard() {
  const [alertas, setAlertas] = useState({
    total: 0,
    criticos: 0,
    alto: 0,
    medio: 0,
    valorTotal: 0
  });
  const [showDialog, setShowDialog] = useState(false);

  const { data: estoqueData = [], isLoading: loadingEstoque } = useEstoque();
  const { data: vendasData = [], isLoading: loadingVendas } = useVendas();

  const loading = loadingEstoque || loadingVendas;

  useEffect(() => {
    // Só calcular alertas se os dados estiverem carregados
    if (loadingEstoque || loadingVendas) return;

    const estoque = Array.isArray(estoqueData) ? estoqueData : [];
    const vendas = Array.isArray(vendasData) ? vendasData : [];

    const hoje = new Date();
    const limite30Dias = new Date();
    const limite60Dias = new Date();
    const limite90Dias = new Date();

    limite30Dias.setDate(hoje.getDate() - 30);
    limite60Dias.setDate(hoje.getDate() - 60);
    limite90Dias.setDate(hoje.getDate() - 90);

    let total = 0;
    let criticos = 0;
    let alto = 0;
    let medio = 0;
    let valorTotal = 0;

    estoque.forEach((item: any) => {
      if (!item.quantidadeTotal || item.quantidadeTotal === 0) return;

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

      const dataReferencia = ultimaVenda || (item.dataCadastro ? new Date(item.dataCadastro) : null);

      if (!dataReferencia) {
        total++;
        criticos++;
        valorTotal += item.quantidadeTotal * (item.precoVenda || item.precoPromocional || 0);
        return;
      }

      const diasParado = Math.floor((hoje.getTime() - dataReferencia.getTime()) / (1000 * 60 * 60 * 24));

      if (diasParado >= 30) {
        total++;
        valorTotal += item.quantidadeTotal * (item.precoVenda || item.precoPromocional || 0);

        if (diasParado >= 90) {
          criticos++;
        } else if (diasParado >= 60) {
          alto++;
        } else {
          medio++;
        }
      }
    });

    setAlertas({
      total,
      criticos,
      alto,
      medio,
      valorTotal
    });
  }, [estoqueData, vendasData, loadingEstoque, loadingVendas]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <Card className="border-amber-200 dark:border-amber-900">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            Alertas de Estoque
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-sm">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  if (alertas.total === 0) {
    return (
      <Card className="border-green-200 dark:border-green-900">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-green-600">
            <Package className="h-5 w-5" />
            Alertas de Estoque
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              ✅ Nenhum produto parado há mais de 90 dias
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-amber-200 dark:border-amber-900 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowDialog(true)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5 animate-pulse" />
              Alertas de Estoque Parado
            </span>
            <Badge variant="destructive" className="text-lg px-3 py-1">
              {alertas.total}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{alertas.medio}</div>
              <div className="text-xs text-muted-foreground mt-1">Atenção</div>
              <div className="text-xs text-yellow-600 font-medium">30-59 dias</div>
            </div>
            
            <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{alertas.alto}</div>
              <div className="text-xs text-muted-foreground mt-1">Alerta</div>
              <div className="text-xs text-orange-600 font-medium">60-89 dias</div>
            </div>
            
            <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{alertas.criticos}</div>
              <div className="text-xs text-muted-foreground mt-1">Crítico</div>
              <div className="text-xs text-red-600 font-medium">90+ dias</div>
            </div>
          </div>

          <div className="pt-3 border-t">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Valor Total Parado:</span>
              <span className="text-lg font-bold text-amber-600">
                {formatCurrency(alertas.valorTotal)}
              </span>
            </div>
            
            <Button 
              className="w-full gap-2" 
              onClick={(e) => {
                e.stopPropagation();
                setShowDialog(true);
              }}
            >
              <TrendingDown className="h-4 w-4" />
              Ver Detalhes e Ações
            </Button>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200 dark:border-amber-900">
            <p className="text-xs text-amber-800 dark:text-amber-200">
              💡 <strong>Dica:</strong> Produtos parados há muito tempo podem virar promoções para liberar capital!
            </p>
          </div>
        </CardContent>
      </Card>

      <EstoqueAlertasDialog
        open={showDialog}
        onOpenChange={setShowDialog}
      />
    </>
  );
}