import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Package } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface Movimentacao {
  _id?: string;
  tipo: "entrada" | "saida";
  data: string;
  quantidade: number;
  origem?: string;
  cor?: string;
  tamanho?: string;
  fornecedor?: string;
  motivo?: string;
  observacao?: string;
  codigoProduto?: string;
  nomeProduto?: string;
}

interface DashboardMovimentacoesProps {
  movimentacoes: Movimentacao[];
}

export const DashboardMovimentacoes = ({ movimentacoes }: DashboardMovimentacoesProps) => {
  // Pegar as últimas 10 movimentações
  const ultimasMovimentacoes = movimentacoes
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .slice(0, 10);

  const totalEntradas = movimentacoes
    .filter(m => m.tipo === "entrada")
    .reduce((acc, m) => acc + m.quantidade, 0);

  const totalSaidas = movimentacoes
    .filter(m => m.tipo === "saida")
    .reduce((acc, m) => acc + m.quantidade, 0);

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Total de Entradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{totalEntradas}</div>
            <p className="text-xs text-muted-foreground mt-1">unidades</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              Total de Saídas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{totalSaidas}</div>
            <p className="text-xs text-muted-foreground mt-1">unidades</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Movimentações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{movimentacoes.length}</div>
            <p className="text-xs text-muted-foreground mt-1">registros</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Últimas Movimentações */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Últimas Movimentações</CardTitle>
        </CardHeader>
        <CardContent>
          {ultimasMovimentacoes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma movimentação registrada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ultimasMovimentacoes.map((mov, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-4 p-4 rounded-lg border border-border bg-gradient-to-br from-card via-card to-primary/5 hover:shadow-md transition-all"
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    mov.tipo === "entrada" 
                      ? "bg-green-500/10 text-green-600" 
                      : "bg-red-500/10 text-red-600"
                  }`}>
                    {mov.tipo === "entrada" ? (
                      <TrendingUp className="h-6 w-6" />
                    ) : (
                      <TrendingDown className="h-6 w-6" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className={`text-base font-semibold ${
                        mov.tipo === "entrada" ? "text-green-600" : "text-red-600"
                      }`}>
                        {mov.tipo === "entrada" ? "Entrada" : "Saída"}
                      </h4>
                      <span className="text-sm text-muted-foreground">
                        {formatDateTime(mov.data)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Quantidade:</span>
                        <span className="font-semibold ml-2">{mov.quantidade} un.</span>
                      </div>
                      
                      {mov.codigoProduto && (
                        <div>
                          <span className="text-muted-foreground">Produto:</span>
                          <span className="font-medium ml-2">{mov.codigoProduto}</span>
                        </div>
                      )}
                      
                      {mov.cor && (
                        <div>
                          <span className="text-muted-foreground">Cor:</span>
                          <span className="font-medium ml-2">{mov.cor}</span>
                        </div>
                      )}
                      
                      {mov.tamanho && (
                        <div>
                          <span className="text-muted-foreground">Tamanho:</span>
                          <span className="font-medium ml-2">{mov.tamanho}</span>
                        </div>
                      )}
                      
                      {mov.origem && (
                        <div>
                          <span className="text-muted-foreground">Origem:</span>
                          <span className="font-medium ml-2">{mov.origem}</span>
                        </div>
                      )}
                      
                      {mov.fornecedor && (
                        <div>
                          <span className="text-muted-foreground">Fornecedor:</span>
                          <span className="font-medium ml-2">{mov.fornecedor}</span>
                        </div>
                      )}
                    </div>
                    
                    {mov.observacao && (
                      <div className="mt-2 pt-2 border-t border-border/50">
                        <span className="text-xs text-muted-foreground">Obs:</span>
                        <p className="text-sm text-foreground mt-1">{mov.observacao}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
