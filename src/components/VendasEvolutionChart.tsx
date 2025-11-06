import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, DollarSign } from "lucide-react";

interface VendasEvolutionChartProps {
  vendas: any[];
  dataInicio?: Date;
  dataFim?: Date;
}

export const VendasEvolutionChart = ({ vendas, dataInicio, dataFim }: VendasEvolutionChartProps) => {
  // Processar vendas para criar dados do gráfico
  const processarDados = () => {
    const vendasMap = new Map<string, { data: string; quantidade: number; valor: number }>();
    
    vendas.forEach((venda) => {
      const vendaData = new Date(venda.data || venda.dataVenda);
      if (isNaN(vendaData.getTime())) return;
      
      // Filtrar por período se definido
      if (dataInicio && vendaData < dataInicio) return;
      if (dataFim && vendaData > dataFim) return;
      
      const dataKey = vendaData.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit',
        year: '2-digit'
      });
      
      const existing = vendasMap.get(dataKey) || { data: dataKey, quantidade: 0, valor: 0 };
      existing.quantidade += 1;
      existing.valor += venda.total || 0;
      
      vendasMap.set(dataKey, existing);
    });
    
    // Converter para array e ordenar por data
    return Array.from(vendasMap.values()).sort((a, b) => {
      const [diaA, mesA, anoA] = a.data.split('/').map(Number);
      const [diaB, mesB, anoB] = b.data.split('/').map(Number);
      const dateA = new Date(2000 + anoA, mesA - 1, diaA);
      const dateB = new Date(2000 + anoB, mesB - 1, diaB);
      return dateA.getTime() - dateB.getTime();
    });
  };

  const dados = processarDados();
  
  if (dados.length === 0) {
    return (
      <Card className="p-6 shadow-card">
        <div className="text-center py-8">
          <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">
            Sem dados para o período
          </h3>
          <p className="text-muted-foreground">
            Não há vendas registradas no período selecionado
          </p>
        </div>
      </Card>
    );
  }

  const totalVendas = dados.reduce((sum, d) => sum + d.quantidade, 0);
  const totalFaturamento = dados.reduce((sum, d) => sum + d.valor, 0);
  const mediaVendas = totalVendas / dados.length;
  const mediaFaturamento = totalFaturamento / dados.length;

  return (
    <Card className="p-6 shadow-card">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Evolução de Vendas
        </h3>
        <p className="text-sm text-muted-foreground">
          {dataInicio || dataFim 
            ? `Período: ${dataInicio?.toLocaleDateString('pt-BR') || 'Início'} até ${dataFim?.toLocaleDateString('pt-BR') || 'Agora'}`
            : 'Todas as vendas registradas'}
        </p>
      </div>

      {/* Estatísticas resumidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-muted-foreground mb-1">Total de Vendas</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalVendas}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-xs text-muted-foreground mb-1">Total Faturado</p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">
            R$ {totalFaturamento.toFixed(2)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
          <p className="text-xs text-muted-foreground mb-1">Média Vendas/Dia</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {mediaVendas.toFixed(1)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
          <p className="text-xs text-muted-foreground mb-1">Média Faturamento/Dia</p>
          <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
            R$ {mediaFaturamento.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Gráfico */}
      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dados} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="data" 
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              yAxisId="left"
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              label={{ value: 'Quantidade', angle: -90, position: 'insideLeft' }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              label={{ value: 'Valor (R$)', angle: 90, position: 'insideRight' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
              formatter={(value: any, name: string) => {
                if (name === 'Valor Total') {
                  return [`R$ ${Number(value).toFixed(2)}`, name];
                }
                return [value, name];
              }}
            />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="quantidade" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              name="Quantidade de Vendas"
              dot={{ fill: 'hsl(var(--primary))', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="valor" 
              stroke="hsl(var(--accent))" 
              strokeWidth={3}
              name="Valor Total"
              dot={{ fill: 'hsl(var(--accent))', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
