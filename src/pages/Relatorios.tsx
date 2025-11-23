import { FileText, Download, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { GlobalLoading } from "@/components/GlobalLoading";
import { useReportsData } from "@/hooks/useReportsData";
import { SalesReport } from "@/components/reports/SalesReport";
import { ProductsReport } from "@/components/reports/ProductsReport";
import { toast } from "sonner";

const Relatorios = () => {
  const { data, loading } = useReportsData();

  const handleExport = () => {
    toast.info("Funcionalidade de exportação em desenvolvimento");
  };

  if (loading) {
    return <GlobalLoading message="Carregando relatórios..." />;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            Relatórios
          </h1>
          <p className="text-muted-foreground mt-1">
            Análises e insights completos do seu negócio
          </p>
        </div>
        <Button onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" />
          Exportar Relatório
        </Button>
      </div>

      <Card className="bg-gradient-to-br from-primary/10 via-background to-background border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Visão Geral
            <Badge variant="secondary" className="ml-2">Atualizado</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-background rounded-lg border">
              <p className="text-sm text-muted-foreground mb-1">Total de Vendas</p>
              <p className="text-2xl font-bold text-primary">{data.vendas.length}</p>
            </div>
            <div className="text-center p-4 bg-background rounded-lg border">
              <p className="text-sm text-muted-foreground mb-1">Produtos Cadastrados</p>
              <p className="text-2xl font-bold text-primary">{data.produtos.length}</p>
            </div>
            <div className="text-center p-4 bg-background rounded-lg border">
              <p className="text-sm text-muted-foreground mb-1">Clientes Ativos</p>
              <p className="text-2xl font-bold text-primary">{data.clientes.length}</p>
            </div>
            <div className="text-center p-4 bg-background rounded-lg border">
              <p className="text-sm text-muted-foreground mb-1">Itens em Estoque</p>
              <p className="text-2xl font-bold text-primary">{data.estoque.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="vendas" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto">
          <TabsTrigger value="vendas" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Vendas
          </TabsTrigger>
          <TabsTrigger value="produtos" className="gap-2">
            <FileText className="h-4 w-4" />
            Produtos
          </TabsTrigger>
          <TabsTrigger value="clientes" className="gap-2" disabled>
            Clientes
            <Badge variant="secondary" className="ml-1 text-xs">Em breve</Badge>
          </TabsTrigger>
          <TabsTrigger value="financeiro" className="gap-2" disabled>
            Financeiro
            <Badge variant="secondary" className="ml-1 text-xs">Em breve</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vendas" className="space-y-6">
          <SalesReport
            vendas={data.vendas}
            vendedores={data.vendedores}
            clientes={data.clientes}
            produtos={data.produtos}
          />
        </TabsContent>

        <TabsContent value="produtos" className="space-y-6">
          <ProductsReport
            produtos={data.produtos}
            estoque={data.estoque}
            vendas={data.vendas}
          />
        </TabsContent>

        <TabsContent value="clientes">
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Funcionalidade em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financeiro">
          <Card>
            <CardHeader>
              <CardTitle>Relatório Financeiro</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Funcionalidade em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Relatorios;
