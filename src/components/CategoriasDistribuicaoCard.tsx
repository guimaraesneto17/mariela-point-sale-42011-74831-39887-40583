import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from "recharts";
import { Package, DollarSign, Palette } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>("");
  
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

  // Análise de variantes por categoria
  const categorias = Array.from(new Set(produtos.map((p: any) => 
    typeof p.categoria === 'string' ? p.categoria : p.categoria?.nome || 'Sem Categoria'
  )));

  const getDadosVariantes = (categoria: string) => {
    const produtosDaCategoria = produtos.filter((p: any) => {
      const cat = typeof p.categoria === 'string' ? p.categoria : p.categoria?.nome || 'Sem Categoria';
      return cat === categoria;
    });

    // Estrutura hierárquica: Cor -> Tamanhos -> Quantidade
    const dadosHierarquicos: any = {};

    produtosDaCategoria.forEach((produto: any) => {
      const itemEstoque = estoque.find((e: any) => e.codigoProduto === produto.codigoProduto);
      if (itemEstoque?.variantes && Array.isArray(itemEstoque.variantes)) {
        itemEstoque.variantes.forEach((variante: any) => {
          const cor = variante.cor || 'Sem Cor';
          
          if (!dadosHierarquicos[cor]) {
            dadosHierarquicos[cor] = {
              cor,
              quantidadeTotal: 0,
              tamanhos: {}
            };
          }

          // Processar tamanhos
          if (Array.isArray(variante.tamanhos) && variante.tamanhos.length > 0) {
            // Nova estrutura: array de objetos {tamanho, quantidade}
            if (typeof variante.tamanhos[0] === 'object' && variante.tamanhos[0].tamanho) {
              variante.tamanhos.forEach((t: any) => {
                const tamanho = t.tamanho;
                const quantidade = t.quantidade || 0;
                
                if (!dadosHierarquicos[cor].tamanhos[tamanho]) {
                  dadosHierarquicos[cor].tamanhos[tamanho] = 0;
                }
                dadosHierarquicos[cor].tamanhos[tamanho] += quantidade;
                dadosHierarquicos[cor].quantidadeTotal += quantidade;
              });
            } else {
              // Estrutura antiga: array de strings (usar quantidade da variante)
              const quantidadePorTamanho = Math.floor((variante.quantidade || 0) / variante.tamanhos.length);
              variante.tamanhos.forEach((tamanho: string) => {
                if (!dadosHierarquicos[cor].tamanhos[tamanho]) {
                  dadosHierarquicos[cor].tamanhos[tamanho] = 0;
                }
                dadosHierarquicos[cor].tamanhos[tamanho] += quantidadePorTamanho;
                dadosHierarquicos[cor].quantidadeTotal += quantidadePorTamanho;
              });
            }
          } else {
            // Sem tamanhos específicos, usar quantidade total da variante
            const tamanho = variante.tamanho || 'Único';
            const quantidade = variante.quantidade || 0;
            
            if (!dadosHierarquicos[cor].tamanhos[tamanho]) {
              dadosHierarquicos[cor].tamanhos[tamanho] = 0;
            }
            dadosHierarquicos[cor].tamanhos[tamanho] += quantidade;
            dadosHierarquicos[cor].quantidadeTotal += quantidade;
          }
        });
      }
    });

    return Object.values(dadosHierarquicos).sort((a: any, b: any) => b.quantidadeTotal - a.quantidadeTotal);
  };

  const dadosVariantes = categoriaSelecionada ? getDadosVariantes(categoriaSelecionada) : [];

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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="quantidade">
              <Package className="h-4 w-4 mr-2" />
              Quantidade
            </TabsTrigger>
            <TabsTrigger value="valor">
              <DollarSign className="h-4 w-4 mr-2" />
              Valor
            </TabsTrigger>
            <TabsTrigger value="variantes">
              <Palette className="h-4 w-4 mr-2" />
              Variantes
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
                        <div className="bg-background border rounded-lg p-3 shadow-lg">
                          <p className="font-medium">{String(payload[0].payload.categoria)}</p>
                          <p className="text-sm text-green-600 font-semibold">
                            {formatCurrency(numValue)}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="valor" radius={[8, 8, 0, 0]}>
                    {dadosBarras.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
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

          <TabsContent value="variantes" className="space-y-4">
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">Selecionar Categoria</label>
              <Select value={categoriaSelecionada} onValueChange={setCategoriaSelecionada}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((cat: any) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {categoriaSelecionada ? (
              <div className="space-y-4">
                {dadosVariantes.length > 0 ? (
                  dadosVariantes.map((corData: any, corIndex: number) => {
                    const tamanhosList = Object.entries(corData.tamanhos).sort(
                      (a: any, b: any) => b[1] - a[1]
                    );

                    return (
                      <div 
                        key={corData.cor} 
                        className="p-4 rounded-lg border-2 bg-gradient-to-br from-background to-muted/20"
                        style={{ borderColor: COLORS[corIndex % COLORS.length] + '40' }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-6 h-6 rounded-lg border-2 border-background shadow-md"
                              style={{ backgroundColor: COLORS[corIndex % COLORS.length] }}
                            />
                            <div>
                              <h4 className="font-bold text-foreground">{corData.cor}</h4>
                              <p className="text-xs text-muted-foreground">
                                {tamanhosList.length} {tamanhosList.length === 1 ? 'tamanho' : 'tamanhos'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">
                              {corData.quantidadeTotal}
                            </p>
                            <p className="text-xs text-muted-foreground">unidades</p>
                          </div>
                        </div>

                        <div className="space-y-2 mt-3 pt-3 border-t border-border">
                          {tamanhosList.map(([tamanho, quantidade]: [string, any], index: number) => (
                            <div 
                              key={tamanho} 
                              className="flex items-center justify-between p-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <div className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${
                                  index === 0 ? 'bg-primary/20 text-primary' :
                                  index === 1 ? 'bg-blue-500/20 text-blue-600' :
                                  'bg-muted text-muted-foreground'
                                }`}>
                                  {index + 1}
                                </div>
                                <span className="font-medium text-sm">{tamanho}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-foreground">
                                  {quantidade} un
                                </span>
                                <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-primary to-accent"
                                    style={{
                                      width: `${(quantidade / corData.quantidadeTotal) * 100}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground w-12 text-right">
                                  {((quantidade / corData.quantidadeTotal) * 100).toFixed(0)}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma variante encontrada para esta categoria</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Palette className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Selecione uma categoria para ver as variantes</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
