import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";

interface HistoricoPreco {
  data: string;
  precoCusto: number;
  precoVenda: number;
  margemDeLucro: number;
}

interface HistoricoPrecosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produto: any;
  historico: HistoricoPreco[];
}

export function HistoricoPrecosDialog({
  open,
  onOpenChange,
  produto,
  historico
}: HistoricoPrecosDialogProps) {
  if (!produto) return null;

  // Formatar dados para o gráfico
  const dadosGrafico = historico.map(item => ({
    data: format(new Date(item.data), "dd/MM", { locale: ptBR }),
    dataCompleta: format(new Date(item.data), "dd/MM/yyyy", { locale: ptBR }),
    'Preço Custo': item.precoCusto,
    'Preço Venda': item.precoVenda,
    'Margem (%)': item.margemDeLucro,
  }));

  // Calcular variações
  const precoAtual = produto.precoVenda || 0;
  const precoAnterior = historico.length > 1 ? historico[historico.length - 2]?.precoVenda : precoAtual;
  const variacao = precoAnterior > 0 ? ((precoAtual - precoAnterior) / precoAnterior) * 100 : 0;

  const custoAtual = produto.precoCusto || 0;
  const custoAnterior = historico.length > 1 ? historico[historico.length - 2]?.precoCusto : custoAtual;
  const variacaoCusto = custoAnterior > 0 ? ((custoAtual - custoAnterior) / custoAnterior) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Histórico de Preços</DialogTitle>
          <DialogDescription>
            {produto.nome} ({produto.codigoProduto})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-2 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Preço Atual</span>
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
                <div className="text-2xl font-bold text-primary">
                  R$ {precoAtual.toFixed(2)}
                </div>
                {variacao !== 0 && (
                  <Badge 
                    variant={variacao > 0 ? "default" : "destructive"}
                    className="mt-2"
                  >
                    {variacao > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    {variacao > 0 ? '+' : ''}{variacao.toFixed(1)}%
                  </Badge>
                )}
              </CardContent>
            </Card>

            <Card className="border-2 border-amber-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Custo Atual</span>
                  <DollarSign className="h-4 w-4 text-amber-600" />
                </div>
                <div className="text-2xl font-bold text-amber-600">
                  R$ {custoAtual.toFixed(2)}
                </div>
                {variacaoCusto !== 0 && (
                  <Badge 
                    variant={variacaoCusto > 0 ? "destructive" : "default"}
                    className="mt-2"
                  >
                    {variacaoCusto > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    {variacaoCusto > 0 ? '+' : ''}{variacaoCusto.toFixed(1)}%
                  </Badge>
                )}
              </CardContent>
            </Card>

            <Card className="border-2 border-green-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Margem Atual</span>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {produto.margemDeLucro?.toFixed(1)}%
                </div>
                <Badge variant="secondary" className="mt-2">
                  {historico.length} alterações
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico */}
          {dadosGrafico.length > 0 && (
            <Card className="border-2 border-border/50">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Evolução de Preços
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dadosGrafico}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="data" 
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      style={{ fontSize: '12px' }}
                      tickFormatter={(value) => `R$ ${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: any) => {
                        if (typeof value === 'number') {
                          return value % 1 === 0 ? `${value}%` : `R$ ${value.toFixed(2)}`;
                        }
                        return value;
                      }}
                      labelFormatter={(label) => {
                        const item = dadosGrafico.find(d => d.data === label);
                        return item?.dataCompleta || label;
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="Preço Custo" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      dot={{ fill: '#f59e0b', r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Preço Venda" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Tabela de Histórico */}
          <Card className="border-2 border-border/50">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Histórico Detalhado</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {historico.slice().reverse().map((item, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">
                        {format(new Date(item.data), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </Badge>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Custo:</span>{" "}
                        <span className="font-semibold text-amber-600">R$ {item.precoCusto.toFixed(2)}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Venda:</span>{" "}
                        <span className="font-semibold text-primary">R$ {item.precoVenda.toFixed(2)}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Margem:</span>{" "}
                        <span className="font-semibold text-green-600">{item.margemDeLucro.toFixed(1)}%</span>
                      </div>
                    </div>
                    {index === 0 && (
                      <Badge>Atual</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
