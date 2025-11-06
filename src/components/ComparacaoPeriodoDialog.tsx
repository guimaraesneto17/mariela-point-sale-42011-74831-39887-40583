import { useState } from "react";
import { Calendar, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ComparacaoPeriodoDialogProps {
  vendas: any[];
}

export function ComparacaoPeriodoDialog({ vendas }: ComparacaoPeriodoDialogProps) {
  const [dataInicioPeriodo1, setDataInicioPeriodo1] = useState("");
  const [dataFimPeriodo1, setDataFimPeriodo1] = useState("");
  const [dataInicioPeriodo2, setDataInicioPeriodo2] = useState("");
  const [dataFimPeriodo2, setDataFimPeriodo2] = useState("");
  const [resultados, setResultados] = useState<any>(null);

  const calcularEstatisticas = (vendasFiltradas: any[]) => {
    const totalVendas = vendasFiltradas.length;
    const faturamentoTotal = vendasFiltradas.reduce((acc, v) => acc + (v.total || 0), 0);
    const ticketMedio = totalVendas > 0 ? faturamentoTotal / totalVendas : 0;
    
    const produtosVendidos = vendasFiltradas.reduce((acc, v) => {
      return acc + (v.itens?.reduce((sum: number, item: any) => sum + (item.quantidade || 0), 0) || 0);
    }, 0);

    return { totalVendas, faturamentoTotal, ticketMedio, produtosVendidos };
  };

  const compararPeriodos = () => {
    // Validar datas
    if (!dataInicioPeriodo1 || !dataFimPeriodo1 || !dataInicioPeriodo2 || !dataFimPeriodo2) {
      return;
    }

    const inicio1 = new Date(dataInicioPeriodo1);
    const fim1 = new Date(dataFimPeriodo1);
    const inicio2 = new Date(dataInicioPeriodo2);
    const fim2 = new Date(dataFimPeriodo2);

    // Filtrar vendas do período 1
    const vendasPeriodo1 = vendas.filter(v => {
      const dataVenda = new Date(v.data || v.dataVenda);
      return dataVenda >= inicio1 && dataVenda <= fim1;
    });

    // Filtrar vendas do período 2
    const vendasPeriodo2 = vendas.filter(v => {
      const dataVenda = new Date(v.data || v.dataVenda);
      return dataVenda >= inicio2 && dataVenda <= fim2;
    });

    const stats1 = calcularEstatisticas(vendasPeriodo1);
    const stats2 = calcularEstatisticas(vendasPeriodo2);

    // Calcular diferenças percentuais
    const diferencaVendas = stats1.totalVendas > 0 
      ? ((stats2.totalVendas - stats1.totalVendas) / stats1.totalVendas) * 100 
      : 0;
    
    const diferencaFaturamento = stats1.faturamentoTotal > 0 
      ? ((stats2.faturamentoTotal - stats1.faturamentoTotal) / stats1.faturamentoTotal) * 100 
      : 0;
    
    const diferencaTicket = stats1.ticketMedio > 0 
      ? ((stats2.ticketMedio - stats1.ticketMedio) / stats1.ticketMedio) * 100 
      : 0;

    setResultados({
      periodo1: {
        ...stats1,
        inicio: inicio1.toLocaleDateString('pt-BR'),
        fim: fim1.toLocaleDateString('pt-BR'),
      },
      periodo2: {
        ...stats2,
        inicio: inicio2.toLocaleDateString('pt-BR'),
        fim: fim2.toLocaleDateString('pt-BR'),
      },
      diferencas: {
        vendas: diferencaVendas,
        faturamento: diferencaFaturamento,
        ticket: diferencaTicket,
      }
    });
  };

  const renderComparacao = (label: string, valor1: any, valor2: any, diferenca: number, formato: 'currency' | 'number' = 'number') => {
    const isPositivo = diferenca > 0;
    const valorFormatado1 = formato === 'currency' ? `R$ ${valor1.toFixed(2)}` : valor1;
    const valorFormatado2 = formato === 'currency' ? `R$ ${valor2.toFixed(2)}` : valor2;

    return (
      <div className="p-4 rounded-lg bg-gradient-card border border-border">
        <p className="text-sm text-muted-foreground mb-3">{label}</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Período 1</p>
            <p className="text-lg font-bold text-foreground">{valorFormatado1}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Período 2</p>
            <p className="text-lg font-bold text-foreground">{valorFormatado2}</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Variação:</span>
          <Badge variant={isPositivo ? "default" : "destructive"} className="gap-1">
            {isPositivo ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(diferenca).toFixed(1)}%
          </Badge>
        </div>
      </div>
    );
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Calendar className="h-4 w-4" />
          Comparar Períodos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Comparação de Períodos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-sm mb-4 text-blue-700 dark:text-blue-400">
                Período 1
              </h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Data Início</Label>
                  <Input
                    type="date"
                    value={dataInicioPeriodo1}
                    onChange={(e) => setDataInicioPeriodo1(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Data Fim</Label>
                  <Input
                    type="date"
                    value={dataFimPeriodo1}
                    onChange={(e) => setDataFimPeriodo1(e.target.value)}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <h3 className="font-semibold text-sm mb-4 text-green-700 dark:text-green-400">
                Período 2
              </h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Data Início</Label>
                  <Input
                    type="date"
                    value={dataInicioPeriodo2}
                    onChange={(e) => setDataInicioPeriodo2(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Data Fim</Label>
                  <Input
                    type="date"
                    value={dataFimPeriodo2}
                    onChange={(e) => setDataFimPeriodo2(e.target.value)}
                  />
                </div>
              </div>
            </Card>
          </div>

          <Button onClick={compararPeriodos} className="w-full" size="lg">
            Comparar Períodos
          </Button>

          {resultados && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Período 1:</strong> {resultados.periodo1.inicio} a {resultados.periodo1.fim}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Período 2:</strong> {resultados.periodo2.inicio} a {resultados.periodo2.fim}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderComparacao(
                  'Total de Vendas',
                  resultados.periodo1.totalVendas,
                  resultados.periodo2.totalVendas,
                  resultados.diferencas.vendas
                )}
                {renderComparacao(
                  'Faturamento Total',
                  resultados.periodo1.faturamentoTotal,
                  resultados.periodo2.faturamentoTotal,
                  resultados.diferencas.faturamento,
                  'currency'
                )}
                {renderComparacao(
                  'Ticket Médio',
                  resultados.periodo1.ticketMedio,
                  resultados.periodo2.ticketMedio,
                  resultados.diferencas.ticket,
                  'currency'
                )}
                {renderComparacao(
                  'Produtos Vendidos',
                  resultados.periodo1.produtosVendidos,
                  resultados.periodo2.produtosVendidos,
                  resultados.periodo1.produtosVendidos > 0 
                    ? ((resultados.periodo2.produtosVendidos - resultados.periodo1.produtosVendidos) / resultados.periodo1.produtosVendidos) * 100 
                    : 0
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
