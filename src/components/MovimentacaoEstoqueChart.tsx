import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Package, Filter as FilterIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MovimentacaoEstoqueChartProps {
  estoque: any[];
  produtos: any[];
  dataInicio?: string;
  dataFim?: string;
  categoriaSelecionada?: string;
  fornecedorSelecionado?: string;
  tipoMovimentacao?: string;
}

export const MovimentacaoEstoqueChart = ({ 
  estoque, 
  produtos, 
  dataInicio, 
  dataFim,
  categoriaSelecionada = 'todos',
  fornecedorSelecionado = 'todos',
  tipoMovimentacao = 'todos'
}: MovimentacaoEstoqueChartProps) => {
  // Processar movimentações de estoque
  const processarMovimentacoes = () => {
    const movimentacoesMap = new Map<string, { data: string; entradas: number; saidas: number; saldo: number }>();
    
    estoque.forEach((item: any) => {
      // Encontrar o produto correspondente
      const produto = produtos.find((p: any) => p.codigoProduto === item.codigoProduto);
      
      // Aplicar filtros (considerar se categoria/fornecedor são strings ou objetos)
      const categoriaTexto = typeof produto?.categoria === 'string' ? produto?.categoria : produto?.categoria?.nome;
      const fornecedorTexto = typeof produto?.fornecedor === 'string' ? produto?.fornecedor : produto?.fornecedor?.nome;
      
      if (categoriaSelecionada !== 'todos' && categoriaTexto !== categoriaSelecionada) return;
      if (fornecedorSelecionado !== 'todos' && fornecedorTexto !== fornecedorSelecionado) return;
      
      // Processar movimentações de entrada
      if (tipoMovimentacao === 'todos' || tipoMovimentacao === 'entrada') {
        item.movimentacoes?.forEach((mov: any) => {
          if (mov.tipo === 'entrada') {
            const movData = new Date(mov.data);
            
            // Filtrar por período se definido
            if (dataInicio && movData < new Date(dataInicio)) return;
            if (dataFim && movData > new Date(dataFim)) return;
            
            const dataKey = movData.toLocaleDateString('pt-BR', { 
              day: '2-digit', 
              month: '2-digit',
              year: '2-digit'
            });
            
            const existing = movimentacoesMap.get(dataKey) || { data: dataKey, entradas: 0, saidas: 0, saldo: 0 };
            existing.entradas += mov.quantidade || 0;
            existing.saldo += mov.quantidade || 0;
            
            movimentacoesMap.set(dataKey, existing);
          }
        });
      }

      // Processar histórico de vendas como saídas
      if (tipoMovimentacao === 'todos' || tipoMovimentacao === 'saida') {
        item.historicoVendas?.forEach((venda: any) => {
          const vendaData = new Date(venda.data);
          
          // Filtrar por período se definido
          if (dataInicio && vendaData < new Date(dataInicio)) return;
          if (dataFim && vendaData > new Date(dataFim)) return;
          
          const dataKey = vendaData.toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: '2-digit',
            year: '2-digit'
          });
          
          const existing = movimentacoesMap.get(dataKey) || { data: dataKey, entradas: 0, saidas: 0, saldo: 0 };
          existing.saidas += venda.quantidade || 0;
          existing.saldo -= venda.quantidade || 0;
          
          movimentacoesMap.set(dataKey, existing);
        });
      }
    });
    
    // Converter para array e ordenar por data
    return Array.from(movimentacoesMap.values()).sort((a, b) => {
      const [diaA, mesA, anoA] = a.data.split('/').map(Number);
      const [diaB, mesB, anoB] = b.data.split('/').map(Number);
      const dateA = new Date(2000 + anoA, mesA - 1, diaA);
      const dateB = new Date(2000 + anoB, mesB - 1, diaB);
      return dateA.getTime() - dateB.getTime();
    });
  };

  const dados = processarMovimentacoes();
  
  if (dados.length === 0) {
    return (
      <Card className="p-6 shadow-card">
        <div className="text-center py-8">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">
            Sem movimentações para o período
          </h3>
          <p className="text-muted-foreground">
            Não há movimentações de estoque registradas no período selecionado
          </p>
        </div>
      </Card>
    );
  }

  const totalEntradas = dados.reduce((sum, d) => sum + d.entradas, 0);
  const totalSaidas = dados.reduce((sum, d) => sum + d.saidas, 0);
  const saldoTotal = totalEntradas - totalSaidas;

  // Verificar se há filtros ativos
  const filtrosAtivos = categoriaSelecionada !== 'todos' || fornecedorSelecionado !== 'todos' || tipoMovimentacao !== 'todos';

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Movimentação de Estoque
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {dataInicio || dataFim 
                ? `Período: ${dataInicio ? new Date(dataInicio).toLocaleDateString('pt-BR') : 'Início'} até ${dataFim ? new Date(dataFim).toLocaleDateString('pt-BR') : 'Agora'}`
                : 'Todas as movimentações registradas'}
            </p>
          </div>
          {filtrosAtivos && (
            <div className="flex flex-wrap gap-2">
              {categoriaSelecionada !== 'todos' && (
                <Badge variant="secondary" className="gap-1">
                  <FilterIcon className="h-3 w-3" />
                  {categoriaSelecionada}
                </Badge>
              )}
              {fornecedorSelecionado !== 'todos' && (
                <Badge variant="secondary" className="gap-1">
                  <FilterIcon className="h-3 w-3" />
                  {fornecedorSelecionado}
                </Badge>
              )}
              {tipoMovimentacao !== 'todos' && (
                <Badge variant="secondary" className="gap-1">
                  <FilterIcon className="h-3 w-3" />
                  {tipoMovimentacao === 'entrada' ? 'Entradas' : 'Saídas'}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estatísticas resumidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              <p className="text-sm font-medium text-muted-foreground">Total de Entradas</p>
            </div>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{totalEntradas}</p>
          </div>
          
          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
              <p className="text-sm font-medium text-muted-foreground">Total de Saídas</p>
            </div>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">{totalSaidas}</p>
          </div>
          
          <div className={`bg-gradient-to-br p-4 rounded-lg border ${
            saldoTotal >= 0 
              ? 'from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800' 
              : 'from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Package className={`h-5 w-5 ${saldoTotal >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`} />
              <p className="text-sm font-medium text-muted-foreground">Saldo do Período</p>
            </div>
            <p className={`text-3xl font-bold ${saldoTotal >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
              {saldoTotal > 0 ? '+' : ''}{saldoTotal}
            </p>
          </div>
        </div>

        {/* Gráfico de Barras - Entradas vs Saídas */}
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dados}>
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
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="entradas" fill="hsl(142, 76%, 36%)" name="Entradas" />
              <Bar dataKey="saidas" fill="hsl(0, 84%, 60%)" name="Saídas" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Linha - Evolução do Saldo */}
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dados}>
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
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="saldo" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                name="Saldo"
                dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
