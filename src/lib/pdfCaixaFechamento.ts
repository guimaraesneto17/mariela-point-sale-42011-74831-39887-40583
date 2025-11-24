import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Movimento {
  tipo: 'entrada' | 'saida';
  valor: number;
  data: string;
  codigoVenda?: string | null;
  formaPagamento?: string | null;
  observacao?: string | null;
}

interface Caixa {
  codigoCaixa: string;
  dataAbertura: string;
  dataFechamento?: string | null;
  status: 'aberto' | 'fechado';
  valorInicial: number;
  entrada: number;
  saida: number;
  performance: number;
  movimentos: Movimento[];
}

export const gerarPDFCaixaFechamento = (caixa: Caixa) => {
  const doc = new jsPDF();
  
  // Configurações
  const margemEsquerda = 15;
  const margemDireita = 195;
  let yPos = 20;
  const lineHeight = 7;
  
  // Função auxiliar para formatar moeda
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };
  
  // Função auxiliar para formatar data
  const formatarData = (data: string) => {
    return format(new Date(data), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };
  
  // Cabeçalho
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("RELATÓRIO DE FECHAMENTO DE CAIXA", margemEsquerda, yPos);
  
  yPos += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, margemEsquerda, yPos);
  
  yPos += 15;
  
  // Informações do Caixa
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Informações do Caixa", margemEsquerda, yPos);
  
  yPos += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  // Box com informações principais
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(margemEsquerda, yPos - 5, 180, 35, 3, 3, 'FD');
  
  doc.setFont("helvetica", "bold");
  doc.text(`Código: ${caixa.codigoCaixa}`, margemEsquerda + 5, yPos);
  yPos += lineHeight;
  
  doc.setFont("helvetica", "normal");
  doc.text(`Abertura: ${formatarData(caixa.dataAbertura)}`, margemEsquerda + 5, yPos);
  yPos += lineHeight;
  
  if (caixa.dataFechamento) {
    doc.text(`Fechamento: ${formatarData(caixa.dataFechamento)}`, margemEsquerda + 5, yPos);
  } else {
    doc.text(`Fechamento: Em aberto`, margemEsquerda + 5, yPos);
  }
  yPos += lineHeight;
  
  doc.text(`Status: ${caixa.status === 'aberto' ? 'Aberto' : 'Fechado'}`, margemEsquerda + 5, yPos);
  yPos += lineHeight;
  
  doc.text(`Valor Inicial: ${formatarMoeda(caixa.valorInicial)}`, margemEsquerda + 5, yPos);
  
  yPos += 15;
  
  // Resumo Financeiro
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Resumo Financeiro", margemEsquerda, yPos);
  
  yPos += 10;
  
  // Box com resumo
  doc.setFillColor(240, 255, 240);
  doc.roundedRect(margemEsquerda, yPos - 5, 85, 25, 3, 3, 'FD');
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(34, 139, 34);
  doc.text("ENTRADAS", margemEsquerda + 5, yPos);
  doc.setFontSize(16);
  doc.text(formatarMoeda(caixa.entrada), margemEsquerda + 5, yPos + 10);
  
  doc.setFillColor(255, 240, 240);
  doc.roundedRect(margemEsquerda + 95, yPos - 5, 85, 25, 3, 3, 'FD');
  doc.setFontSize(10);
  doc.setTextColor(220, 38, 38);
  doc.text("SAÍDAS", margemEsquerda + 100, yPos);
  doc.setFontSize(16);
  doc.text(formatarMoeda(caixa.saida), margemEsquerda + 100, yPos + 10);
  
  yPos += 30;
  
  // Performance
  const corPerformance = caixa.performance >= 0 ? [34, 139, 34] : [220, 38, 38];
  doc.setFillColor(corPerformance[0], corPerformance[1], corPerformance[2], 0.1);
  doc.roundedRect(margemEsquerda, yPos - 5, 180, 15, 3, 3, 'FD');
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(corPerformance[0], corPerformance[1], corPerformance[2]);
  doc.text("SALDO FINAL:", margemEsquerda + 5, yPos + 5);
  doc.setFontSize(16);
  doc.text(formatarMoeda(caixa.performance), margemDireita - 5, yPos + 5, { align: 'right' });
  
  yPos += 25;
  doc.setTextColor(0, 0, 0);
  
  // Movimentações
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Movimentações", margemEsquerda, yPos);
  
  yPos += 10;
  
  // Separar vendas de outras movimentações
  const vendas = caixa.movimentos.filter(m => m.codigoVenda);
  const outrasMovimentacoes = caixa.movimentos.filter(m => !m.codigoVenda);
  
  // Resumo de vendas
  if (vendas.length > 0) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Vendas: ${vendas.length}`, margemEsquerda, yPos);
    yPos += 7;
    
    const totalVendas = vendas.reduce((acc, v) => acc + v.valor, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total em vendas: ${formatarMoeda(totalVendas)}`, margemEsquerda, yPos);
    
    yPos += 10;
  }
  
  // Outras movimentações
  if (outrasMovimentacoes.length > 0) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Outras Movimentações:", margemEsquerda, yPos);
    yPos += 7;
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    
    // Cabeçalho da tabela
    doc.setFont("helvetica", "bold");
    doc.text("Tipo", margemEsquerda, yPos);
    doc.text("Data/Hora", margemEsquerda + 25, yPos);
    doc.text("Valor", margemEsquerda + 80, yPos);
    doc.text("Observação", margemEsquerda + 110, yPos);
    yPos += 5;
    
    doc.setDrawColor(200, 200, 200);
    doc.line(margemEsquerda, yPos, margemDireita, yPos);
    yPos += 5;
    
    doc.setFont("helvetica", "normal");
    
    outrasMovimentacoes
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      .forEach((mov, index) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        
        const tipo = mov.tipo === 'entrada' ? 'Entrada' : 'Saída';
        const cor = mov.tipo === 'entrada' ? [34, 139, 34] : [220, 38, 38];
        
        doc.setTextColor(cor[0], cor[1], cor[2]);
        doc.text(tipo, margemEsquerda, yPos);
        doc.setTextColor(0, 0, 0);
        doc.text(formatarData(mov.data), margemEsquerda + 25, yPos);
        doc.setTextColor(cor[0], cor[1], cor[2]);
        doc.text(formatarMoeda(mov.valor), margemEsquerda + 80, yPos);
        doc.setTextColor(0, 0, 0);
        
        const obs = mov.observacao || '-';
        if (obs.length > 30) {
          doc.text(obs.substring(0, 30) + '...', margemEsquerda + 110, yPos);
        } else {
          doc.text(obs, margemEsquerda + 110, yPos);
        }
        
        yPos += 6;
      });
  }
  
  // Rodapé
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Mariela PDV - Moda Feminina | Página ${i} de ${totalPages}`,
      margemDireita,
      290,
      { align: 'right' }
    );
  }
  
  // Salvar PDF
  doc.save(`Caixa_${caixa.codigoCaixa}_Fechamento.pdf`);
};
