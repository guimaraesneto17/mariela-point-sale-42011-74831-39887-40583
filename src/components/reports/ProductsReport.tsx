import { useMemo, useState } from "react";
import { ReportFilters } from "./ReportFilters";
import { MovimentacaoEstoqueChart } from "@/components/MovimentacaoEstoqueChart";
import { GiroEstoqueDashboard } from "@/components/GiroEstoqueDashboard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, TrendingUp, AlertTriangle, DollarSign } from "lucide-react";

interface ProductsReportProps {
  produtos: any[];
  estoque: any[];
  vendas: any[];
}

export const ProductsReport = ({ produtos, estoque, vendas }: ProductsReportProps) => {
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("todos");
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState("todos");
  const [tipoMovimentacao, setTipoMovimentacao] = useState("todos");

  // Verificar se os dados estão disponíveis
  if (!produtos || !estoque || !vendas) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">
            Carregando dados...
          </h3>
          <p className="text-muted-foreground">
            Aguarde enquanto os dados são carregados
          </p>
        </div>
      </Card>
    );
  }

  const categorias = useMemo(() => {
    return Array.from(new Set(produtos.map((p: any) => p.categoria).filter(Boolean)));
  }, [produtos]);

  const fornecedores = useMemo(() => {
    return Array.from(new Set(produtos.map((p: any) => p.fornecedor).filter(Boolean)));
  }, [produtos]);

  const metricas = useMemo(() => {
    const totalProdutos = produtos.length;
    const emEstoque = estoque.filter((e: any) => (e.quantidadeTotal || 0) > 0).length;
    const novidades = produtos.filter((p: any) => p.novidade).length;
    const emPromocao = produtos.filter((p: any) => p.promocao).length;
    
    const valorEstoqueCusto = estoque.reduce((sum: number, e: any) => {
      return sum + ((e.quantidadeTotal || 0) * (e.precoCusto || 0));
    }, 0);
    
    const valorEstoqueVenda = estoque.reduce((sum: number, e: any) => {
      return sum + ((e.quantidadeTotal || 0) * (e.precoVenda || e.precoPromocional || 0));
    }, 0);

    return {
      totalProdutos,
      emEstoque,
      novidades,
      emPromocao,
      valorEstoqueCusto,
      valorEstoqueVenda,
      margemPotencial: valorEstoqueVenda - valorEstoqueCusto
    };
  }, [produtos, estoque]);

  const activeFiltersCount = (categoriaSelecionada !== "todos" ? 1 : 0) + 
                            (fornecedorSelecionado !== "todos" ? 1 : 0) + 
                            (tipoMovimentacao !== "todos" ? 1 : 0);

  return (
    <div className="space-y-6">
      <ReportFilters
        dataInicio={dataInicio}
        dataFim={dataFim}
        onDataInicioChange={setDataInicio}
        onDataFimChange={setDataFim}
        activeFiltersCount={activeFiltersCount}
        onClearFilters={() => {
          setCategoriaSelecionada("todos");
          setFornecedorSelecionado("todos");
          setTipoMovimentacao("todos");
          setDataInicio("");
          setDataFim("");
        }}
        additionalFilters={
          <>
            <div>
              <Label className="text-sm font-medium mb-2 block">Categoria</Label>
              <Select value={categoriaSelecionada} onValueChange={setCategoriaSelecionada}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  {categorias.map((cat: string) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Fornecedor</Label>
              <Select value={fornecedorSelecionado} onValueChange={setFornecedorSelecionado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {fornecedores.map((forn: string) => (
                    <SelectItem key={forn} value={forn}>{forn}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Tipo de Movimentação</Label>
              <Select value={tipoMovimentacao} onValueChange={setTipoMovimentacao}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="entrada">Entradas</SelectItem>
                  <SelectItem value="saida">Saídas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-background dark:from-blue-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-600" />
              Total de Produtos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{metricas.totalProdutos}</p>
            <p className="text-xs text-muted-foreground mt-1">{metricas.emEstoque} em estoque</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-background dark:from-green-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              Valor em Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metricas.valorEstoqueVenda)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Custo: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metricas.valorEstoqueCusto)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-background dark:from-purple-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              Margem Potencial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metricas.margemPotencial)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {((metricas.margemPotencial / metricas.valorEstoqueCusto) * 100 || 0).toFixed(1)}% de lucro
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-background dark:from-orange-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              Destaques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">{metricas.emPromocao}</p>
            <p className="text-xs text-muted-foreground mt-1">{metricas.novidades} novidades</p>
          </CardContent>
        </Card>
      </div>

      <MovimentacaoEstoqueChart
        estoque={estoque}
        produtos={produtos}
        dataInicio={dataInicio}
        dataFim={dataFim}
        categoriaSelecionada={categoriaSelecionada}
        fornecedorSelecionado={fornecedorSelecionado}
        tipoMovimentacao={tipoMovimentacao}
      />

      <GiroEstoqueDashboard
        estoque={estoque}
        produtos={produtos}
        vendas={vendas}
      />
    </div>
  );
};
