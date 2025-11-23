import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, TrendingUp, TrendingDown, ShoppingBag } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { vendasAPI, estoqueAPI } from "@/lib/api";
import { safeDate } from "@/lib/utils";

interface EstoqueAnalyticsCardProps {
  className?: string;
}

export const EstoqueAnalyticsCard = ({ className }: EstoqueAnalyticsCardProps) => {
  const [loading, setLoading] = useState(true);
  const [produtosMaisVendidos, setProdutosMaisVendidos] = useState<any[]>([]);
  const [evolucaoEstoque, setEvolucaoEstoque] = useState<any[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [vendas, estoque] = await Promise.all([
        vendasAPI.getAll(),
        estoqueAPI.getAll(),
      ]);

      // Calcular produtos mais vendidos
      const produtosVendidos = new Map<string, { nome: string; vendas: number; valor: number }>();
      vendas.forEach((venda: any) => {
        if (venda.itens && Array.isArray(venda.itens)) {
          venda.itens.forEach((item: any) => {
            const codigo = item.codigoProduto || item.codigo;
            const nome = item.nomeProduto || item.nome || codigo;
            const existing = produtosVendidos.get(codigo) || { nome, vendas: 0, valor: 0 };
            produtosVendidos.set(codigo, {
              nome: existing.nome,
              vendas: existing.vendas + (item.quantidade || 1),
              valor: existing.valor + (item.precoFinalUnitario || item.precoUnitario || 0) * (item.quantidade || 1),
            });
          });
        }
      });

      const topProdutos = Array.from(produtosVendidos.values())
        .sort((a, b) => b.vendas - a.vendas)
        .slice(0, 10)
        .map(p => ({
          nome: p.nome.length > 20 ? p.nome.substring(0, 20) + '...' : p.nome,
          vendas: p.vendas,
          valor: p.valor,
        }));
      setProdutosMaisVendidos(topProdutos);

      // Calcular evolução do estoque ao longo do tempo (últimos 30 dias)
      const hoje = new Date();
      const evolucaoMap = new Map<string, { data: string; quantidade: number; entradas: number; saidas: number }>();
      
      // Inicializar últimos 30 dias
      for (let i = 29; i >= 0; i--) {
        const data = new Date(hoje);
        data.setDate(data.getDate() - i);
        const dataStr = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        evolucaoMap.set(dataStr, { data: dataStr, quantidade: 0, entradas: 0, saidas: 0 });
      }

      // Processar movimentações do estoque
      estoque.forEach((item: any) => {
        if (item.logMovimentacao && Array.isArray(item.logMovimentacao)) {
          item.logMovimentacao.forEach((mov: any) => {
            const movData = safeDate(mov.data);
            if (movData) {
              const diffDias = Math.floor((hoje.getTime() - movData.getTime()) / (1000 * 60 * 60 * 24));
              if (diffDias >= 0 && diffDias < 30) {
                const dataStr = movData.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                const existing = evolucaoMap.get(dataStr);
                if (existing) {
                  const quantidade = Math.abs(mov.quantidade || 0);
                  if (mov.tipo === 'entrada') {
                    existing.entradas += quantidade;
                  } else if (mov.tipo === 'saida') {
                    existing.saidas += quantidade;
                  }
                }
              }
            }
          });
        }
      });

      // Calcular quantidade total acumulada
      let quantidadeAcumulada = 0;
      const evolucaoArray = Array.from(evolucaoMap.values()).map(dia => {
        quantidadeAcumulada += (dia.entradas - dia.saidas);
        return {
          ...dia,
          quantidade: quantidadeAcumulada,
        };
      });

      setEvolucaoEstoque(evolucaoArray);
    } catch (error) {
      console.error('Erro ao carregar analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center text-muted-foreground">Carregando análises...</div>
      </Card>
    );
  }

  return (
    <div className={`grid gap-6 ${className}`}>
      {/* Produtos Mais Vendidos */}
      <Card className="p-6 shadow-card">
        <div className="flex items-center gap-2 mb-6">
          <ShoppingBag className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Top 10 Produtos Mais Vendidos</h3>
          <Badge variant="secondary" className="ml-auto">Últimas Vendas</Badge>
        </div>
        {produtosMaisVendidos.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={produtosMaisVendidos}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="nome" 
                angle={-45}
                textAnchor="end"
                height={100}
                className="text-xs"
              />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                formatter={(value: any, name: string) => {
                  if (name === 'vendas') return [value, 'Unidades Vendidas'];
                  if (name === 'valor') return [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value), 'Valor Total'];
                  return [value, name];
                }}
              />
              <Legend />
              <Bar dataKey="vendas" fill="hsl(var(--primary))" name="Unidades Vendidas" radius={[8, 8, 0, 0]} />
              <Bar dataKey="valor" fill="hsl(var(--accent))" name="Valor Total (R$)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Nenhuma venda registrada
          </div>
        )}
      </Card>

      {/* Evolução do Estoque */}
      <Card className="p-6 shadow-card">
        <div className="flex items-center gap-2 mb-6">
          <Package className="h-5 w-5 text-secondary" />
          <h3 className="text-lg font-semibold">Evolução do Estoque (Últimos 30 Dias)</h3>
          <Badge variant="secondary" className="ml-auto">Movimentações</Badge>
        </div>
        {evolucaoEstoque.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={evolucaoEstoque}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="data" 
                className="text-xs"
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                formatter={(value: any, name: string) => {
                  if (name === 'entradas') return [value, 'Entradas'];
                  if (name === 'saidas') return [value, 'Saídas'];
                  if (name === 'quantidade') return [value, 'Saldo'];
                  return [value, name];
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="entradas" 
                stroke="hsl(var(--chart-2))" 
                strokeWidth={2}
                name="Entradas"
                dot={{ fill: 'hsl(var(--chart-2))' }}
              />
              <Line 
                type="monotone" 
                dataKey="saidas" 
                stroke="hsl(var(--chart-1))" 
                strokeWidth={2}
                name="Saídas"
                dot={{ fill: 'hsl(var(--chart-1))' }}
              />
              <Line 
                type="monotone" 
                dataKey="quantidade" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                name="Saldo Acumulado"
                dot={{ fill: 'hsl(var(--primary))', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Nenhuma movimentação registrada nos últimos 30 dias
          </div>
        )}
      </Card>

      {/* Resumo Estatístico */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Entradas</p>
              <p className="text-2xl font-bold">
                {evolucaoEstoque.reduce((acc, dia) => acc + dia.entradas, 0)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-destructive/10">
              <TrendingDown className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Saídas</p>
              <p className="text-2xl font-bold">
                {evolucaoEstoque.reduce((acc, dia) => acc + dia.saidas, 0)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-accent/10">
              <Package className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Produtos Vendidos</p>
              <p className="text-2xl font-bold">{produtosMaisVendidos.length}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
