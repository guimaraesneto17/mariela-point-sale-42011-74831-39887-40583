import { TrendingUp, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface MargemLucroCardProps {
  valorEstoqueCusto: number;
  valorEstoqueVenda: number;
  vendasPorMes?: any[];
}

export function MargemLucroCard({ valorEstoqueCusto, valorEstoqueVenda, vendasPorMes = [] }: MargemLucroCardProps) {
  const margemLucroReal = valorEstoqueVenda - valorEstoqueCusto;
  const percentualMargem = valorEstoqueVenda > 0 
    ? ((margemLucroReal / valorEstoqueVenda) * 100) 
    : 0;

  // Processar dados de evolução mensal
  const dadosGrafico = vendasPorMes.map(mes => {
    // Estimar custos baseados em margem média
    const custoEstimado = mes.valor * (valorEstoqueCusto / (valorEstoqueVenda || 1));
    const lucroMes = mes.valor - custoEstimado;
    const margemMes = mes.valor > 0 ? ((lucroMes / mes.valor) * 100) : 0;
    
    return {
      mes: mes.mes || 'N/A',
      margem: parseFloat(margemMes.toFixed(1)),
      lucro: parseFloat(lucroMes.toFixed(2)),
    };
  });

  return (
    <Card className="col-span-full bg-gradient-to-br from-card via-card to-green-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-green-600" />
          </div>
          Margem de Lucro Real
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="p-4 rounded-lg bg-gradient-card border border-border">
            <p className="text-sm text-muted-foreground mb-2">Valor em Estoque (Custo)</p>
            <p className="text-2xl font-bold text-foreground">
              R$ {valorEstoqueCusto.toFixed(2)}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-gradient-card border border-border">
            <p className="text-sm text-muted-foreground mb-2">Valor em Estoque (Venda)</p>
            <p className="text-2xl font-bold text-foreground">
              R$ {valorEstoqueVenda.toFixed(2)}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
            <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
              Margem de Lucro Real
              <TrendingUp className="h-4 w-4 text-green-600" />
            </p>
            <p className="text-2xl font-bold text-green-600">
              R$ {margemLucroReal.toFixed(2)}
            </p>
            <p className="text-sm font-medium text-green-600 mt-1">
              {percentualMargem.toFixed(1)}% de margem
            </p>
          </div>
        </div>

        {dadosGrafico.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-muted-foreground mb-4">
              Evolução da Margem de Lucro (%)
            </h4>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dadosGrafico}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="mes" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: any, name: string) => {
                    if (name === 'margem') return [`${value}%`, 'Margem'];
                    if (name === 'lucro') return [`R$ ${value}`, 'Lucro'];
                    return value;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="margem"
                  stroke="hsl(142, 76%, 36%)"
                  strokeWidth={3}
                  dot={{ fill: 'hsl(142, 76%, 36%)', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
