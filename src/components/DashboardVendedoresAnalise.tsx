import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from "recharts";
import { Users, TrendingUp, Award, Target, DollarSign, Crown, Trophy, Medal } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DashboardVendedoresAnaliseProps {
  vendas: any[];
  vendedores: any[];
}

export const DashboardVendedoresAnalise = ({ vendas, vendedores }: DashboardVendedoresAnaliseProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Metas por vendedor (pode ser configurável no futuro)
  const METAS = {
    vendas: 50,      // meta de vendas por mês
    faturamento: 50000, // meta de faturamento por mês
  };

  // Calcular performance dos vendedores
  const performanceVendedores = useMemo(() => {
    const stats = vendedores.map((vendedor: any) => {
      const vendasVendedor = vendas.filter((v: any) => 
        v.vendedor?._id === vendedor._id || 
        v.vendedor?.codigo === vendedor.codigoVendedor ||
        v.nomeVendedor === vendedor.nome
      );

      const totalVendas = vendasVendedor.length;
      const faturamentoTotal = vendasVendedor.reduce((sum: number, v: any) => sum + (v.valorTotal || v.total || 0), 0);
      const ticketMedio = totalVendas > 0 ? faturamentoTotal / totalVendas : 0;

      // Calcular progresso das metas
      const progressoVendas = (totalVendas / METAS.vendas) * 100;
      const progressoFaturamento = (faturamentoTotal / METAS.faturamento) * 100;
      const progressoGeral = (progressoVendas + progressoFaturamento) / 2;

      // Calcular bônus (exemplo: 5% do faturamento se atingir as metas)
      const atingiuMetaVendas = totalVendas >= METAS.vendas;
      const atingiuMetaFaturamento = faturamentoTotal >= METAS.faturamento;
      const bonusPercentual = (atingiuMetaVendas && atingiuMetaFaturamento) ? 5 : 
                              (atingiuMetaVendas || atingiuMetaFaturamento) ? 2.5 : 0;
      const bonusValor = (faturamentoTotal * bonusPercentual) / 100;

      // Calcular vendas por mês para evolução
      const vendasPorMes = vendasVendedor.reduce((acc: any, venda: any) => {
        const data = new Date(venda.data || venda.dataVenda);
        const mesAno = `${data.toLocaleString('pt-BR', { month: 'short' })} ${data.getFullYear()}`;
        if (!acc[mesAno]) {
          acc[mesAno] = { mes: mesAno, vendas: 0, faturamento: 0 };
        }
        acc[mesAno].vendas += 1;
        acc[mesAno].faturamento += venda.valorTotal || venda.total || 0;
        return acc;
      }, {});

      return {
        vendedor,
        totalVendas,
        faturamentoTotal,
        ticketMedio,
        progressoVendas: Math.min(progressoVendas, 100),
        progressoFaturamento: Math.min(progressoFaturamento, 100),
        progressoGeral: Math.min(progressoGeral, 100),
        bonusPercentual,
        bonusValor,
        atingiuMetaVendas,
        atingiuMetaFaturamento,
        vendasPorMes: Object.values(vendasPorMes).slice(-6) as Array<{ mes: string; vendas: number; faturamento: number }>,
      };
    });

    return stats.sort((a, b) => b.faturamentoTotal - a.faturamentoTotal);
  }, [vendas, vendedores]);

  // Ranking de performance
  const ranking = performanceVendedores.slice(0, 10);

  // Dados para gráfico de evolução
  const dadosEvolucao = useMemo(() => {
    const meses = new Set<string>();
    performanceVendedores.forEach(p => {
      p.vendasPorMes.forEach((m: any) => meses.add(m.mes));
    });

    return Array.from(meses).map(mes => {
      const dataPoint: any = { mes };
      performanceVendedores.forEach(p => {
        const mesData = p.vendasPorMes.find((m: any) => m.mes === mes);
        dataPoint[p.vendedor.nome] = mesData?.faturamento || 0;
      });
      return dataPoint;
    });
  }, [performanceVendedores]);

  const getRankIcon = (position: number) => {
    switch (position) {
      case 0: return <Crown className="h-5 w-5 text-yellow-500" />;
      case 1: return <Trophy className="h-5 w-5 text-gray-400" />;
      case 2: return <Medal className="h-5 w-5 text-orange-600" />;
      default: return <Award className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="ranking" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ranking">
            <Trophy className="h-4 w-4 mr-2" />
            Ranking
          </TabsTrigger>
          <TabsTrigger value="metas">
            <Target className="h-4 w-4 mr-2" />
            Metas & Bônus
          </TabsTrigger>
          <TabsTrigger value="evolucao">
            <TrendingUp className="h-4 w-4 mr-2" />
            Evolução
          </TabsTrigger>
        </TabsList>

        {/* Ranking */}
        <TabsContent value="ranking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Ranking de Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ranking.map((item, index) => (
                  <div
                    key={item.vendedor._id}
                    className={`p-4 rounded-lg border transition-all ${
                      index === 0 ? 'bg-gradient-to-r from-yellow-500/10 to-yellow-600/5 border-yellow-500/30' :
                      index === 1 ? 'bg-gradient-to-r from-gray-400/10 to-gray-500/5 border-gray-400/30' :
                      index === 2 ? 'bg-gradient-to-r from-orange-600/10 to-orange-700/5 border-orange-600/30' :
                      'bg-card'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex items-center justify-center w-10 h-10">
                          {getRankIcon(index)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{item.vendedor.nome}</p>
                            {item.atingiuMetaVendas && item.atingiuMetaFaturamento && (
                              <Badge className="bg-green-500">🎯 Metas Atingidas</Badge>
                            )}
                          </div>
                          <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                            <span>{item.totalVendas} vendas</span>
                            <span>•</span>
                            <span>Ticket: {formatCurrency(item.ticketMedio)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-primary">{formatCurrency(item.faturamentoTotal)}</p>
                        {item.bonusValor > 0 && (
                          <p className="text-sm text-green-600">
                            + {formatCurrency(item.bonusValor)} bônus
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metas & Bônus */}
        <TabsContent value="metas" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {performanceVendedores.map((item) => (
              <Card key={item.vendedor._id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>{item.vendedor.nome}</span>
                    <Badge variant={item.progressoGeral >= 100 ? "default" : "secondary"}>
                      {item.progressoGeral.toFixed(0)}%
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Meta de Vendas */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Meta de Vendas</span>
                      <span className="font-medium">
                        {item.totalVendas} / {METAS.vendas}
                      </span>
                    </div>
                    <Progress value={item.progressoVendas} className="h-2" />
                  </div>

                  {/* Meta de Faturamento */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Meta de Faturamento</span>
                      <span className="font-medium">
                        {formatCurrency(item.faturamentoTotal)}
                      </span>
                    </div>
                    <Progress value={item.progressoFaturamento} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Meta: {formatCurrency(METAS.faturamento)}
                    </p>
                  </div>

                  {/* Bônus */}
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Bônus Estimado</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{formatCurrency(item.bonusValor)}</p>
                        <p className="text-xs text-muted-foreground">{item.bonusPercentual}% do faturamento</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Evolução */}
        <TabsContent value="evolucao" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Evolução de Faturamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  faturamento: {
                    label: "Faturamento",
                    color: "hsl(var(--primary))",
                  },
                }}
                className="h-[400px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dadosEvolucao}>
                    <XAxis 
                      dataKey="mes" 
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis 
                      tick={{ fontSize: 11 }}
                      tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                    />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-lg">
                            <p className="font-medium mb-2">{payload[0]?.payload.mes}</p>
                            <div className="space-y-1">
                              {payload.map((entry: any, index: number) => (
                                <p key={index} className="text-sm">
                                  <span className="font-medium">{entry.name}:</span>{' '}
                                  <span className="text-primary">{formatCurrency(entry.value)}</span>
                                </p>
                              ))}
                            </div>
                          </div>
                        );
                      }}
                    />
                    {performanceVendedores.map((p, index) => (
                      <Line
                        key={p.vendedor._id}
                        type="monotone"
                        dataKey={p.vendedor.nome}
                        stroke={`hsl(var(--chart-${(index % 5) + 1}))`}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
