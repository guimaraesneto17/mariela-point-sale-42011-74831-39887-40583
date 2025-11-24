import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  ShoppingCart,
  Crown,
  Award,
  Search,
  UserCheck,
  Calendar,
  Package
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface DashboardClientesAnaliseProps {
  vendas: any[];
  clientes: any[];
  produtos: any[];
}

export const DashboardClientesAnalise = ({ vendas, clientes, produtos }: DashboardClientesAnaliseProps) => {
  const [clienteSelecionado, setClienteSelecionado] = useState<string>("todos");
  const [segmentoFiltro, setSegmentoFiltro] = useState<string>("todos");
  const [busca, setBusca] = useState("");

  const analise = useMemo(() => {
    // Análise de clientes
    const clientesComAnalise = clientes.map((cliente: any) => {
      const vendasCliente = vendas.filter((v: any) => 
        v.codigoCliente === cliente.codigoCliente || 
        v.cliente?.codigoCliente === cliente.codigoCliente
      );

      const totalCompras = vendasCliente.length;
      const valorTotal = vendasCliente.reduce((sum: number, v: any) => sum + (v.total || 0), 0);
      const ticketMedio = totalCompras > 0 ? valorTotal / totalCompras : 0;

      // Última compra
      const ultimaCompra = vendasCliente.length > 0
        ? new Date(Math.max(...vendasCliente.map((v: any) => new Date(v.data || v.dataVenda).getTime())))
        : null;

      // Frequência (intervalo médio entre compras em dias)
      let frequenciaMedia = 0;
      if (vendasCliente.length > 1) {
        const datas = vendasCliente
          .map((v: any) => new Date(v.data || v.dataVenda).getTime())
          .sort((a, b) => a - b);
        
        const intervalos = [];
        for (let i = 1; i < datas.length; i++) {
          intervalos.push((datas[i] - datas[i - 1]) / (1000 * 60 * 60 * 24));
        }
        frequenciaMedia = intervalos.reduce((sum, val) => sum + val, 0) / intervalos.length;
      }

      // Dias sem compra
      let diasSemCompra = 0;
      if (ultimaCompra) {
        diasSemCompra = Math.floor((new Date().getTime() - ultimaCompra.getTime()) / (1000 * 60 * 60 * 24));
      }

      // Categorias preferidas (baseado em produtos comprados)
      const categoriasMap = new Map<string, { quantidade: number; valor: number }>();
      vendasCliente.forEach((venda: any) => {
        if (venda.itens && Array.isArray(venda.itens)) {
          venda.itens.forEach((item: any) => {
            const produto = produtos.find((p: any) => p.codigoProduto === item.codigoProduto);
            const categoria = produto?.categoria || "Sem Categoria";
            const existing = categoriasMap.get(categoria) || { quantidade: 0, valor: 0 };
            categoriasMap.set(categoria, {
              quantidade: existing.quantidade + (item.quantidade || 1),
              valor: existing.valor + (item.subtotal || 0)
            });
          });
        }
      });

      const categoriasPreferidas = Array.from(categoriasMap.entries())
        .sort((a, b) => b[1].valor - a[1].valor)
        .slice(0, 3)
        .map(([categoria, dados]) => ({ categoria, ...dados }));

      // Segmentação por ticket médio
      let segmento = "bronze";
      if (ticketMedio >= 1000) segmento = "diamante";
      else if (ticketMedio >= 500) segmento = "ouro";
      else if (ticketMedio >= 200) segmento = "prata";

      return {
        ...cliente,
        totalCompras,
        valorTotal,
        ticketMedio,
        ultimaCompra,
        diasSemCompra,
        frequenciaMedia: Math.round(frequenciaMedia),
        categoriasPreferidas,
        segmento
      };
    });

    // Filtrar por busca
    let clientesFiltrados = clientesComAnalise;
    if (busca) {
      clientesFiltrados = clientesFiltrados.filter((c: any) => 
        c.nome.toLowerCase().includes(busca.toLowerCase()) ||
        c.codigoCliente.toLowerCase().includes(busca.toLowerCase())
      );
    }

    // Filtrar por segmento
    if (segmentoFiltro !== "todos") {
      clientesFiltrados = clientesFiltrados.filter((c: any) => c.segmento === segmentoFiltro);
    }

    // Filtrar por cliente específico
    let clienteDetalhado = null;
    if (clienteSelecionado !== "todos") {
      clienteDetalhado = clientesFiltrados.find((c: any) => c.codigoCliente === clienteSelecionado);
    }

    // Métricas gerais
    const totalClientes = clientesFiltrados.length;
    const ticketMedioGeral = clientesFiltrados.reduce((sum: number, c: any) => sum + c.ticketMedio, 0) / (totalClientes || 1);
    const frequenciaMediaGeral = clientesFiltrados.reduce((sum: number, c: any) => sum + (c.frequenciaMedia || 0), 0) / (totalClientes || 1);

    // Distribuição por segmento
    const distribuicaoSegmento = [
      { 
        name: "Diamante (≥R$1000)", 
        value: clientesFiltrados.filter((c: any) => c.segmento === "diamante").length,
        color: "hsl(200, 100%, 50%)",
        icon: Crown
      },
      { 
        name: "Ouro (R$500-999)", 
        value: clientesFiltrados.filter((c: any) => c.segmento === "ouro").length,
        color: "hsl(45, 100%, 50%)",
        icon: Award
      },
      { 
        name: "Prata (R$200-499)", 
        value: clientesFiltrados.filter((c: any) => c.segmento === "prata").length,
        color: "hsl(0, 0%, 70%)",
        icon: Award
      },
      { 
        name: "Bronze (<R$200)", 
        value: clientesFiltrados.filter((c: any) => c.segmento === "bronze").length,
        color: "hsl(25, 70%, 45%)",
        icon: Award
      }
    ];

    // Top clientes por ticket médio
    const topClientesTicket = [...clientesFiltrados]
      .sort((a: any, b: any) => b.ticketMedio - a.ticketMedio)
      .slice(0, 5);

    // Distribuição de frequência
    const distribuicaoFrequencia = [
      { name: "Alta (<15 dias)", value: clientesFiltrados.filter((c: any) => c.frequenciaMedia > 0 && c.frequenciaMedia < 15).length },
      { name: "Média (15-30 dias)", value: clientesFiltrados.filter((c: any) => c.frequenciaMedia >= 15 && c.frequenciaMedia <= 30).length },
      { name: "Baixa (>30 dias)", value: clientesFiltrados.filter((c: any) => c.frequenciaMedia > 30).length },
      { name: "Única compra", value: clientesFiltrados.filter((c: any) => c.frequenciaMedia === 0).length }
    ];

    // Categorias mais populares entre todos os clientes filtrados
    const categoriasGlobais = new Map<string, number>();
    clientesFiltrados.forEach((cliente: any) => {
      cliente.categoriasPreferidas.forEach((cat: any) => {
        categoriasGlobais.set(cat.categoria, (categoriasGlobais.get(cat.categoria) || 0) + cat.valor);
      });
    });

    const topCategorias = Array.from(categoriasGlobais.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([categoria, valor]) => ({ categoria, valor }));

    return {
      clientesFiltrados,
      clienteDetalhado,
      totalClientes,
      ticketMedioGeral,
      frequenciaMediaGeral,
      distribuicaoSegmento,
      topClientesTicket,
      distribuicaoFrequencia,
      topCategorias
    };
  }, [vendas, clientes, produtos, clienteSelecionado, segmentoFiltro, busca]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Nunca";
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
  };

  const getSegmentoColor = (segmento: string) => {
    switch (segmento) {
      case "diamante": return "hsl(200, 100%, 50%)";
      case "ouro": return "hsl(45, 100%, 50%)";
      case "prata": return "hsl(0, 0%, 70%)";
      case "bronze": return "hsl(25, 70%, 45%)";
      default: return "hsl(0, 0%, 50%)";
    }
  };

  const getSegmentoIcon = (segmento: string) => {
    return segmento === "diamante" ? Crown : Award;
  };

  const COLORS = ["hsl(200, 100%, 50%)", "hsl(45, 100%, 50%)", "hsl(0, 0%, 70%)", "hsl(25, 70%, 45%)"];

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Filtros de Análise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar Cliente</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nome ou código..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Segmento</label>
              <Select value={segmentoFiltro} onValueChange={setSegmentoFiltro}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Segmentos</SelectItem>
                  <SelectItem value="diamante">💎 Diamante (≥R$1000)</SelectItem>
                  <SelectItem value="ouro">🏆 Ouro (R$500-999)</SelectItem>
                  <SelectItem value="prata">🥈 Prata (R$200-499)</SelectItem>
                  <SelectItem value="bronze">🥉 Bronze (&lt;R$200)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cliente Específico</label>
              <Select value={clienteSelecionado} onValueChange={setClienteSelecionado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Visão Geral</SelectItem>
                  {analise.clientesFiltrados.map((cliente: any) => (
                    <SelectItem key={cliente.codigoCliente} value={cliente.codigoCliente}>
                      {cliente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {(busca || segmentoFiltro !== "todos" || clienteSelecionado !== "todos") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setBusca("");
                setSegmentoFiltro("todos");
                setClienteSelecionado("todos");
              }}
              className="mt-4"
            >
              Limpar Filtros
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Detalhes do Cliente Específico */}
      {analise.clienteDetalhado && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              Análise Detalhada: {analise.clienteDetalhado.nome}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-background border">
                <p className="text-sm text-muted-foreground mb-1">Segmento</p>
                <div className="flex items-center gap-2">
                  {(() => {
                    const Icon = getSegmentoIcon(analise.clienteDetalhado.segmento);
                    return <Icon className="h-5 w-5" style={{ color: getSegmentoColor(analise.clienteDetalhado.segmento) }} />;
                  })()}
                  <p className="text-lg font-bold capitalize">{analise.clienteDetalhado.segmento}</p>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-background border">
                <p className="text-sm text-muted-foreground mb-1">Ticket Médio</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(analise.clienteDetalhado.ticketMedio)}</p>
              </div>
              <div className="p-4 rounded-lg bg-background border">
                <p className="text-sm text-muted-foreground mb-1">Total Compras</p>
                <p className="text-lg font-bold text-blue-600">{analise.clienteDetalhado.totalCompras}</p>
              </div>
              <div className="p-4 rounded-lg bg-background border">
                <p className="text-sm text-muted-foreground mb-1">Frequência</p>
                <p className="text-lg font-bold text-purple-600">
                  {analise.clienteDetalhado.frequenciaMedia > 0 
                    ? `${analise.clienteDetalhado.frequenciaMedia} dias` 
                    : "Única compra"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-background border">
                <p className="text-sm text-muted-foreground mb-1">Valor Total Gasto</p>
                <p className="text-xl font-bold text-primary">{formatCurrency(analise.clienteDetalhado.valorTotal)}</p>
              </div>
              <div className="p-4 rounded-lg bg-background border">
                <p className="text-sm text-muted-foreground mb-1">Última Compra</p>
                <p className="text-xl font-bold">
                  {formatDate(analise.clienteDetalhado.ultimaCompra)}
                  {analise.clienteDetalhado.diasSemCompra > 0 && (
                    <span className="text-sm text-muted-foreground ml-2">
                      (há {analise.clienteDetalhado.diasSemCompra} dias)
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-background border">
              <p className="text-sm font-medium mb-3 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Categorias Preferidas
              </p>
              {analise.clienteDetalhado.categoriasPreferidas.length > 0 ? (
                <div className="space-y-2">
                  {analise.clienteDetalhado.categoriasPreferidas.map((cat: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{index + 1}º</Badge>
                        <span className="font-medium">{cat.categoria}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{formatCurrency(cat.valor)}</p>
                        <p className="text-xs text-muted-foreground">{cat.quantidade} itens</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma categoria identificada</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métricas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-background dark:from-blue-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Total de Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{analise.totalClientes}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-background dark:from-green-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              Ticket Médio Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(analise.ticketMedioGeral)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-background dark:from-purple-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              Frequência Média
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-600">
              {Math.round(analise.frequenciaMediaGeral)} dias
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição por Segmento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Distribuição por Segmento de Ticket Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analise.distribuicaoSegmento}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                >
                  {analise.distribuicaoSegmento.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Clientes por Ticket Médio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Top 5 Clientes por Ticket Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analise.topClientesTicket.map((cliente: any, index: number) => {
                const Icon = getSegmentoIcon(cliente.segmento);
                return (
                  <div key={cliente.codigoCliente} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Badge variant={index === 0 ? "default" : "secondary"}>
                        {index + 1}º
                      </Badge>
                      <Icon className="h-5 w-5" style={{ color: getSegmentoColor(cliente.segmento) }} />
                      <div>
                        <p className="font-medium">{cliente.nome}</p>
                        <p className="text-xs text-muted-foreground">{cliente.totalCompras} compras</p>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-primary">{formatCurrency(cliente.ticketMedio)}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Distribuição de Frequência */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Distribuição de Frequência de Compras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analise.distribuicaoFrequencia}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="hsl(var(--primary))" name="Clientes" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Categorias Mais Populares */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Top 5 Categorias Mais Compradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analise.topCategorias} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                <YAxis type="category" dataKey="categoria" width={100} />
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="valor" fill="hsl(var(--primary))" name="Valor Total" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
