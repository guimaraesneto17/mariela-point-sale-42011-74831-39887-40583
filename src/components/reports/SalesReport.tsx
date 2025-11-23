import { useMemo, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, ShoppingBag, Users, Package } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { VendasEvolutionChart } from "@/components/VendasEvolutionChart";
import { VendasPorCategoriaCard } from "@/components/VendasPorCategoriaCard";
import { ReportFilters } from "./ReportFilters";
import { ExportDialog } from "./ExportDialog";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { loadAppLogo, addHeader, addFooter, addWatermarkToAllPages } from "@/lib/pdfWatermark";

interface SalesReportProps {
  vendas: any[];
  vendedores: any[];
  clientes: any[];
  produtos: any[];
}

export const SalesReport = ({ vendas, vendedores, clientes, produtos }: SalesReportProps) => {
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [vendedorSelecionado, setVendedorSelecionado] = useState("todos");
  const [clienteSelecionado, setClienteSelecionado] = useState("todos");
  const [formaPagamento, setFormaPagamento] = useState("todos");
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    }).format(new Date(date));
  };

  const handleExport = async (format: "pdf" | "excel", selectedData: string[]) => {
    const filename = `relatorio_vendas_${formatDate(new Date()).replace(/\//g, '-')}`;

    if (format === "excel") {
      const wb = XLSX.utils.book_new();

      if (selectedData.includes("metricas")) {
        const metricasData = [
          { Métrica: "Total de Vendas", Valor: metricas.totalVendas },
          { Métrica: "Faturamento Total", Valor: formatCurrency(metricas.faturamentoTotal) },
          { Métrica: "Ticket Médio", Valor: formatCurrency(metricas.ticketMedio) },
          { Métrica: "Clientes Atendidos", Valor: metricas.clientesUnicos },
          { Métrica: "Produtos Vendidos", Valor: metricas.produtosVendidos }
        ];
        const ws = XLSX.utils.json_to_sheet(metricasData);
        XLSX.utils.book_append_sheet(wb, ws, "Métricas");
      }

      if (selectedData.includes("vendas")) {
        const vendasData = vendasFiltradas.map(v => ({
          Data: formatDate(v.data || v.dataVenda),
          Cliente: v.cliente?.nome || v.nomeCliente || "Cliente não identificado",
          "Valor Total": formatCurrency(v.valorTotal),
          "Forma Pagamento": v.formaPagamento || "-",
          Vendedor: v.vendedor?.nome || v.nomeVendedor || "-",
          Itens: v.itens?.length || 0
        }));
        const ws = XLSX.utils.json_to_sheet(vendasData);
        XLSX.utils.book_append_sheet(wb, ws, "Vendas");
      }

      XLSX.writeFile(wb, `${filename}.xlsx`);
    } else {
      // PDF
      const logo = await loadAppLogo();
      const doc = new jsPDF();
      
      let yPosition = addHeader(doc, "Relatório de Vendas", logo);
      yPosition += 10;

      if (selectedData.includes("metricas")) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(44, 62, 80);
        doc.text("Métricas Gerais", 15, yPosition);
        yPosition += 8;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(52, 73, 94);
        doc.text(`Total de Vendas: ${metricas.totalVendas}`, 15, yPosition);
        yPosition += 6;
        doc.text(`Faturamento Total: ${formatCurrency(metricas.faturamentoTotal)}`, 15, yPosition);
        yPosition += 6;
        doc.text(`Ticket Médio: ${formatCurrency(metricas.ticketMedio)}`, 15, yPosition);
        yPosition += 6;
        doc.text(`Clientes Atendidos: ${metricas.clientesUnicos}`, 15, yPosition);
        yPosition += 6;
        doc.text(`Produtos Vendidos: ${metricas.produtosVendidos}`, 15, yPosition);
        yPosition += 15;
      }

      if (selectedData.includes("vendas")) {
        if (yPosition > 220) {
          doc.addPage();
          yPosition = addHeader(doc, "Relatório de Vendas", logo);
          yPosition += 10;
        }

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(44, 62, 80);
        doc.text("Detalhamento de Vendas", 15, yPosition);
        yPosition += 10;

        (doc as any).autoTable({
          startY: yPosition,
          head: [["Data", "Cliente", "Valor", "Forma Pgto", "Vendedor"]],
          body: vendasFiltradas.slice(0, 50).map(v => [
            formatDate(v.data || v.dataVenda),
            (v.cliente?.nome || v.nomeCliente || "N/A").substring(0, 20),
            formatCurrency(v.valorTotal),
            (v.formaPagamento || "-").substring(0, 15),
            (v.vendedor?.nome || v.nomeVendedor || "-").substring(0, 15)
          ]),
          theme: 'striped',
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [59, 130, 246], fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [245, 247, 250] },
          margin: { left: 15, right: 15 }
        });
      }

      // Adicionar watermark e rodapé
      addWatermarkToAllPages(doc, logo, 0.1);
      addFooter(doc);

      doc.save(`${filename}.pdf`);
    }
  };

  const exportOptions = [
    { id: "metricas", label: "Métricas Gerais", checked: true },
    { id: "vendas", label: "Detalhamento de Vendas", checked: true },
  ];

  const vendasFiltradas = useMemo(() => {
    return vendas.filter((venda: any) => {
      const dataVenda = new Date(venda.data || venda.dataVenda);
      
      if (dataInicio && dataVenda < new Date(dataInicio)) return false;
      if (dataFim && dataVenda > new Date(dataFim)) return false;
      if (vendedorSelecionado !== "todos" && venda.nomeVendedor !== vendedorSelecionado) return false;
      if (clienteSelecionado !== "todos" && venda.nomeCliente !== clienteSelecionado) return false;
      if (formaPagamento !== "todos" && venda.formaPagamento !== formaPagamento) return false;
      
      return true;
    });
  }, [vendas, dataInicio, dataFim, vendedorSelecionado, clienteSelecionado, formaPagamento]);

  const metricas = useMemo(() => {
    const totalVendas = vendasFiltradas.length;
    const faturamentoTotal = vendasFiltradas.reduce((sum: number, v: any) => sum + (v.valorTotal || 0), 0);
    const ticketMedio = totalVendas > 0 ? faturamentoTotal / totalVendas : 0;
    
    const clientesUnicos = new Set(vendasFiltradas.map((v: any) => v.clienteId || v.nomeCliente)).size;
    const produtosVendidos = vendasFiltradas.reduce((sum: number, v: any) => {
      return sum + (v.itens?.reduce((s: number, i: any) => s + (i.quantidade || 0), 0) || 0);
    }, 0);

    return {
      totalVendas,
      faturamentoTotal,
      ticketMedio,
      clientesUnicos,
      produtosVendidos
    };
  }, [vendasFiltradas]);

  const formasPagamento = useMemo(() => {
    return Array.from(new Set(vendas.map((v: any) => v.formaPagamento).filter(Boolean)));
  }, [vendas]);

  const handlePeriodoChange = (periodo: string) => {
    const hoje = new Date();
    let inicio = new Date();
    
    switch (periodo) {
      case "hoje":
        setDataInicio(hoje.toISOString().split('T')[0]);
        setDataFim(hoje.toISOString().split('T')[0]);
        break;
      case "ontem":
        inicio.setDate(hoje.getDate() - 1);
        setDataInicio(inicio.toISOString().split('T')[0]);
        setDataFim(inicio.toISOString().split('T')[0]);
        break;
      case "semana":
        inicio.setDate(hoje.getDate() - hoje.getDay());
        setDataInicio(inicio.toISOString().split('T')[0]);
        setDataFim(hoje.toISOString().split('T')[0]);
        break;
      case "mes":
        inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        setDataInicio(inicio.toISOString().split('T')[0]);
        setDataFim(hoje.toISOString().split('T')[0]);
        break;
      case "ano":
        inicio = new Date(hoje.getFullYear(), 0, 1);
        setDataInicio(inicio.toISOString().split('T')[0]);
        setDataFim(hoje.toISOString().split('T')[0]);
        break;
      case "todos":
        setDataInicio("");
        setDataFim("");
        break;
    }
  };

  const activeFiltersCount = (vendedorSelecionado !== "todos" ? 1 : 0) + 
                            (clienteSelecionado !== "todos" ? 1 : 0) + 
                            (formaPagamento !== "todos" ? 1 : 0);

  return (
    <div className="space-y-6">
      <ReportFilters
        dataInicio={dataInicio}
        dataFim={dataFim}
        onDataInicioChange={setDataInicio}
        onDataFimChange={setDataFim}
        onPeriodoChange={handlePeriodoChange}
        activeFiltersCount={activeFiltersCount}
        onClearFilters={() => {
          setVendedorSelecionado("todos");
          setClienteSelecionado("todos");
          setFormaPagamento("todos");
          setDataInicio("");
          setDataFim("");
        }}
        onExport={() => setExportDialogOpen(true)}
        additionalFilters={
          <>
            <div>
              <Label className="text-sm font-medium mb-2 block">Vendedor</Label>
              <Select value={vendedorSelecionado} onValueChange={setVendedorSelecionado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {vendedores.map((v: any) => (
                    <SelectItem key={v._id} value={v.nome}>{v.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Cliente</Label>
              <Select value={clienteSelecionado} onValueChange={setClienteSelecionado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {clientes.map((c: any) => (
                    <SelectItem key={c._id} value={c.nome}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Forma de Pagamento</Label>
              <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  {formasPagamento.map((fp: string) => (
                    <SelectItem key={fp} value={fp}>{fp}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-background dark:from-green-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              Faturamento Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metricas.faturamentoTotal)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-background dark:from-blue-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-blue-600" />
              Total de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{metricas.totalVendas}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-background dark:from-purple-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              Ticket Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metricas.ticketMedio)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-background dark:from-orange-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-orange-600" />
              Clientes Atendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">{metricas.clientesUnicos}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-50 to-background dark:from-pink-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="h-4 w-4 text-pink-600" />
              Produtos Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-pink-600">{metricas.produtosVendidos}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <VendasPorCategoriaCard vendas={vendasFiltradas} produtos={produtos} />
      </div>

      <VendasEvolutionChart vendas={vendasFiltradas} />

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        reportType="sales"
        onExport={handleExport}
        availableData={exportOptions}
      />
    </div>
  );
};
