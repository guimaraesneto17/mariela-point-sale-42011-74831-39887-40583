import jsPDF from "jspdf";

/**
 * Adiciona watermark/logo em uma página do PDF
 * @param doc Instância do jsPDF
 * @param logoUrl URL ou data URI do logo (opcional)
 * @param opacity Opacidade do watermark (0-1)
 */
export const addWatermark = (doc: jsPDF, logoUrl?: string, opacity: number = 0.1) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Se tiver logo, adiciona como imagem
  if (logoUrl) {
    try {
      const logoWidth = 60;
      const logoHeight = 60;
      const x = (pageWidth - logoWidth) / 2;
      const y = (pageHeight - logoHeight) / 2;

      // Salvar estado atual
      doc.saveGraphicsState();
      doc.setGState(new (doc as any).GState({ opacity }));
      
      doc.addImage(logoUrl, 'PNG', x, y, logoWidth, logoHeight);
      
      // Restaurar estado
      doc.restoreGraphicsState();
    } catch (error) {
      console.error("Erro ao adicionar logo:", error);
    }
  }

  // Adiciona texto de watermark no rodapé
  doc.saveGraphicsState();
  doc.setGState(new (doc as any).GState({ opacity: opacity * 2 }));
  
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    'Relatório Gerado pelo Sistema Mariela',
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );
  
  doc.restoreGraphicsState();
};

/**
 * Adiciona watermark em todas as páginas do PDF
 * @param doc Instância do jsPDF
 * @param logoUrl URL ou data URI do logo (opcional)
 * @param opacity Opacidade do watermark (0-1)
 */
export const addWatermarkToAllPages = (doc: jsPDF, logoUrl?: string, opacity: number = 0.1) => {
  const pageCount = doc.getNumberOfPages();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addWatermark(doc, logoUrl, opacity);
  }
};

/**
 * Carrega o logo da aplicação
 * Tenta carregar o logo do diretório de assets
 */
export const loadAppLogo = async (): Promise<string | undefined> => {
  try {
    // Tenta carregar o logo do public/
    const response = await fetch('/logo.png');
    if (!response.ok) {
      return undefined;
    }
    
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Erro ao carregar logo:", error);
    return undefined;
  }
};

/**
 * Adiciona cabeçalho personalizado ao PDF
 */
export const addHeader = (doc: jsPDF, title: string, logoUrl?: string) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Adicionar logo no cabeçalho se disponível
  if (logoUrl) {
    try {
      doc.addImage(logoUrl, 'PNG', 15, 10, 25, 25);
    } catch (error) {
      console.error("Erro ao adicionar logo no cabeçalho:", error);
    }
  }

  // Título do relatório
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(44, 62, 80);
  doc.text(title, logoUrl ? 45 : 15, 20);

  // Data de geração
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(127, 140, 141);
  const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date());
  doc.text(`Gerado em: ${dataFormatada}`, logoUrl ? 45 : 15, 27);

  // Linha separadora
  doc.setDrawColor(189, 195, 199);
  doc.setLineWidth(0.5);
  doc.line(15, 35, pageWidth - 15, 35);

  return 40; // Retorna a posição Y onde o conteúdo deve começar
};

/**
 * Adiciona rodapé com numeração de páginas
 */
export const addFooter = (doc: jsPDF) => {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Linha separadora
    doc.setDrawColor(189, 195, 199);
    doc.setLineWidth(0.5);
    doc.line(15, pageHeight - 20, pageWidth - 15, pageHeight - 20);

    // Número da página
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(127, 140, 141);
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth - 15,
      pageHeight - 10,
      { align: 'right' }
    );
  }
};
