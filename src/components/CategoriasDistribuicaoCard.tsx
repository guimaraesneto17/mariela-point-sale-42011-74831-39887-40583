import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from "recharts";
import { Package, DollarSign } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CategoriasDistribuicaoCardProps {
  produtos: any[];
  estoque: any[];
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export const CategoriasDistribuicaoCard = ({ produtos, estoque }: CategoriasDistribuicaoCardProps) => {
  // Distribuição de produtos por categoria
  const distribuicaoProdutos = produtos.reduce((acc: any, produto) => {
    const categoria = typeof produto.categoria === 'string' 
      ? produto.categoria 
      : produto.categoria?.nome || 'Sem Categoria';
    
    if (!acc[categoria]) {
      acc[categoria] = { categoria, quantidade: 0, valor: 0 };
    }
    acc[categoria].quantidade += 1;
    
    // Buscar valor do estoque para esse produto
    const itemEstoque = estoque.find((e: any) => e.codigoProduto === produto.codigoProduto);
    if (itemEstoque) {
      const qtdTotal = itemEstoque.quantidadeTotal || 0;
      const precoVenda = itemEstoque.precoVenda || itemEstoque.precoPromocional || 0;
      acc[categoria].valor += qtdTotal * precoVenda;
    }
    
    return acc;
  }, {});

  const dadosDistribuicao = Object.values(distribuicaoProdutos).sort((a: any, b: any) => b.quantidade - a.quantidade);
  
  // Dados para gráfico de pizza (quantidade de produtos)
  const dadosPizza = dadosDistribuicao.map((item: any) => ({
    name: item.categoria,
    value: item.quantidade,
  }));

  // Dados para gráfico de barras (valor em estoque)
  const dadosBarras = dadosDistribuicao.map((item: any) => ({
    categoria: item.categoria,
    valor: item.valor,
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const totalProdutos = dadosDistribuicao.reduce((sum: number, item: any) => sum + item.quantidade, 0);
  const totalValor = dadosDistribuicao.reduce((sum: number, item: any) => sum + item.valor, 0);

  const renderCustomLabel = (props: any) => {
    const { name, percent } = props;
    return `${name}: ${(percent * 100).toFixed(0)}%`;
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          Distribuição por Categoria
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="quantidade" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="quantidade">
              <Package className="h-4 w-4 mr-2" />
              Quantidade de Produtos
            </TabsTrigger>
            <TabsTrigger value="valor">
              <DollarSign className="h-4 w-4 mr-2" />
              Valor em Estoque
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quantidade" className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-2xl font-bold text-primary">{String(totalProdutos)}</p>
              <p className="text-sm text-muted-foreground">Total de Produtos</p>
            </div>
            
            <ChartContainer
              config={{
                quantidade: {
                  label: "Quantidade",
                  color: "hsl(var(--primary))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosPizza}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomLabel}
                    outerRadius={80}
                    fill="hsl(var(--primary))"
                    dataKey="value"
                  >
                    {dadosPizza.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.[0]) return null;
                      return (
                        <div className="bg-background border rounded-lg p-2 shadow-lg">
                          <p className="font-medium">{String(payload[0].name)}</p>
                          <p className="text-sm text-muted-foreground">
                            Produtos: {payload[0].value}
                          </p>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>

            <div className="space-y-2">
              {dadosDistribuicao.map((item: any, index: number) => (
                <div key={item.categoria} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm">{item.categoria}</span>
                  </div>
                  <span className="text-sm font-medium">{item.quantidade} produtos</span>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="valor" className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-2xl font-bold text-green-600">{formatCurrency(Number(totalValor) || 0)}</p>
              <p className="text-sm text-muted-foreground">Valor Total em Estoque</p>
            </div>

            <ChartContainer
              config={{
                valor: {
                  label: "Valor em Estoque",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosBarras}>
                  <XAxis 
                    dataKey="categoria" 
                    tick={{ fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                  />
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.[0]) return null;
                      const value = payload[0].value;
                      const numValue = typeof value === 'number' ? value : Number(value) || 0;
                      return (
                        <div className="bg-background border rounded-lg p-2 shadow-lg">
                          <p className="font-medium">{String(payload[0].payload.categoria)}</p>
                          <p className="text-sm text-muted-foreground">
                            Valor: {formatCurrency(numValue)}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="valor" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>

            <div className="space-y-2">
              {dadosDistribuicao.map((item: any, index: number) => (
                <div key={item.categoria} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm">{item.categoria}</span>
                  </div>
                  <span className="text-sm font-medium text-green-600">{formatCurrency(item.valor)}</span>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
