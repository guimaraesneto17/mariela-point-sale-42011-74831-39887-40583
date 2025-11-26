import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Line, ComposedChart } from "recharts";
import { TrendingUp, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MargemLucroCategoriasCardProps {
  produtos: any[];
  estoque: any[];
  vendas: any[];
}

export const MargemLucroCategoriasCard = ({ produtos, estoque, vendas }: MargemLucroCategoriasCardProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Calcular margem de lucro por categoria
  const margensPorCategoria = produtos.reduce((acc: any, produto) => {
    const categoria = typeof produto.categoria === 'string' 
      ? produto.categoria 
      : produto.categoria?.nome || 'Sem Categoria';
    
    if (!acc[categoria]) {
      acc[categoria] = { 
        categoria, 
        totalCusto: 0, 
        totalVenda: 0, 
        quantidadeProdutos: 0,
        quantidadeVendida: 0,
        faturamento: 0
      };
    }
    
    acc[categoria].quantidadeProdutos += 1;
    
    // Buscar dados do estoque
    const itemEstoque = estoque.find((e: any) => e.codigoProduto === produto.codigoProduto);
    if (itemEstoque) {
      const qtdTotal = itemEstoque.quantidadeTotal || 0;
      const precoCusto = itemEstoque.precoCusto || 0;
      const precoVenda = itemEstoque.precoVenda || itemEstoque.precoPromocional || 0;
      
      acc[categoria].totalCusto += qtdTotal * precoCusto;
      acc[categoria].totalVenda += qtdTotal * precoVenda;
    }
    
    return acc;
  }, {});

  // Adicionar dados de vendas
  vendas.forEach((venda: any) => {
    venda.itens?.forEach((item: any) => {
      const produto = produtos.find(p => p.codigoProduto === item.codigoProduto);
      if (produto) {
        const categoria = typeof produto.categoria === 'string' 
          ? produto.categoria 
          : produto.categoria?.nome || 'Sem Categoria';
        
        if (margensPorCategoria[categoria]) {
          margensPorCategoria[categoria].quantidadeVendida += item.quantidade || 0;
          margensPorCategoria[categoria].faturamento += item.subtotal || 0;
        }
      }
    });
  });

  const dadosMargens = Object.values(margensPorCategoria).map((item: any) => {
    const margemPercentual = item.totalVenda > 0 
      ? ((item.totalVenda - item.totalCusto) / item.totalVenda) * 100 
      : 0;
    
    const lucroEstimado = item.totalVenda - item.totalCusto;
    
    return {
      categoria: item.categoria,
      margemPercentual: Number(margemPercentual.toFixed(2)),
      lucroEstimado: Number(lucroEstimado.toFixed(2)),
      faturamento: item.faturamento,
      quantidadeVendida: item.quantidadeVendida,
      totalVenda: item.totalVenda,
      totalCusto: item.totalCusto,
      quantidadeProdutos: item.quantidadeProdutos
    };
  }).sort((a, b) => b.margemPercentual - a.margemPercentual);

  // Encontrar a categoria mais rentável
  const maisRentavel = dadosMargens[0];

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Margem de Lucro por Categoria
          </CardTitle>
          {maisRentavel && (
            <Badge className="bg-gradient-to-r from-green-500 to-green-600">
              <Award className="h-3 w-3 mr-1" />
              Mais Rentável: {maisRentavel.categoria}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Gráfico de margem percentual */}
        <div>
          <h4 className="text-sm font-semibold mb-4 text-muted-foreground">Margem de Lucro (%)</h4>
          <ChartContainer
            config={{
              margem: {
                label: "Margem %",
                color: "hsl(var(--chart-3))",
              },
            }}
            className="h-[250px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosMargens}>
                <XAxis 
                  dataKey="categoria" 
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis 
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => `${value}%`}
                />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <p className="font-medium mb-2">{data.categoria}</p>
                        <div className="space-y-1 text-sm">
                          <p className="text-green-600 font-semibold">
                            Margem: {data.margemPercentual}%
                          </p>
                          <p className="text-muted-foreground">
                            Lucro: {formatCurrency(data.lucroEstimado)}
                          </p>
                          <p className="text-muted-foreground">
                            Valor Estoque: {formatCurrency(data.totalVenda)}
                          </p>
                          <p className="text-muted-foreground">
                            Faturamento: {formatCurrency(data.faturamento)}
                          </p>
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar 
                  dataKey="margemPercentual" 
                  fill="hsl(var(--chart-3))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Tabela detalhada */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground">Detalhamento por Categoria</h4>
          <div className="space-y-2">
            {dadosMargens.map((item, index) => (
              <div 
                key={item.categoria} 
                className="p-3 rounded-lg border bg-gradient-to-r from-background to-muted/20 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-green-500/20 text-green-600' :
                      index === 1 ? 'bg-blue-500/20 text-blue-600' :
                      'bg-gray-400/20 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="font-medium">{item.categoria}</span>
                    <Badge variant={item.margemPercentual > 50 ? "default" : "secondary"}>
                      {item.margemPercentual}% margem
                    </Badge>
                  </div>
                  <span className="font-bold text-green-600">
                    {formatCurrency(item.lucroEstimado)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground">
                  <div>
                    <p className="font-medium">Valor em Estoque</p>
                    <p className="text-foreground font-semibold">{formatCurrency(item.totalVenda)}</p>
                  </div>
                  <div>
                    <p className="font-medium">Faturamento</p>
                    <p className="text-foreground font-semibold">{formatCurrency(item.faturamento)}</p>
                  </div>
                  <div>
                    <p className="font-medium">Produtos</p>
                    <p className="text-foreground font-semibold">
                      {item.quantidadeProdutos} ({item.quantidadeVendida} vendidos)
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
