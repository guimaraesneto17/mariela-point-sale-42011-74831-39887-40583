import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";
import { ChartErrorBoundary } from "@/components/ChartErrorBoundary";

interface VendasPorCategoriaCardProps {
  vendas: any[];
  produtos: any[];
}

export const VendasPorCategoriaCard = ({ vendas, produtos }: VendasPorCategoriaCardProps) => {
  // Agrupar vendas por categoria
  const vendasPorCategoria = vendas.reduce((acc: any, venda) => {
    venda.itens?.forEach((item: any) => {
      const produto = produtos.find(p => p.codigoProduto === item.codigoProduto);
      const categoria = produto?.categoria || 'Sem Categoria';
      
      if (!acc[categoria]) {
        acc[categoria] = { categoria, total: 0, quantidade: 0 };
      }
      acc[categoria].total += item.subtotal || 0;
      acc[categoria].quantidade += item.quantidade || 0;
    });
    return acc;
  }, {});

  const dados = Object.values(vendasPorCategoria)
    .sort((a: any, b: any) => b.total - a.total)
    .slice(0, 5);

  const totalVendas = dados.reduce((sum: number, item: any) => sum + (Number(item.total) || 0), 0);

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Vendas por Categoria
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-2xl font-bold text-primary">
          R$ {Number(totalVendas || 0).toFixed(2)}
        </div>
        <ChartErrorBoundary>
          <ChartContainer
            config={{
              total: {
                label: "Total de Vendas",
                color: "hsl(var(--primary))",
              },
            }}
            className="h-[200px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dados}>
                <XAxis 
                  dataKey="categoria" 
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <ChartTooltip 
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    return (
                      <div className="bg-background border rounded-lg p-2 shadow-lg">
                        <p className="font-medium">{payload[0].payload.categoria}</p>
                        <p className="text-sm text-muted-foreground">
                          Total: R$ {Number(payload[0].value || 0).toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Quantidade: {payload[0].payload.quantidade}
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </ChartErrorBoundary>
      </CardContent>
    </Card>
  );
};
