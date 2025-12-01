import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Image as ImageIcon, 
  Clock, 
  FileText,
  Gauge,
  TrendingUp,
  Download
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ImageAnalysis {
  url: string;
  alt: string;
  size: {
    width: number;
    height: number;
    fileSize: number;
  };
  loadTime: number;
  issues: {
    severity: 'error' | 'warning' | 'info';
    message: string;
  }[];
  score: number;
}

interface SEOReport {
  totalImages: number;
  averageScore: number;
  totalIssues: number;
  criticalIssues: number;
  warnings: number;
  passed: number;
  averageLoadTime: number;
  totalSize: number;
  recommendations: string[];
}

export const ImageSEOAnalyzer = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<ImageAnalysis[]>([]);
  const [report, setReport] = useState<SEOReport | null>(null);

  const analyzeImage = async (img: HTMLImageElement): Promise<ImageAnalysis> => {
    const startTime = performance.now();
    
    return new Promise((resolve) => {
      const issues: ImageAnalysis['issues'] = [];
      let score = 100;

      // Verificar alt text
      const alt = img.alt || '';
      if (!alt) {
        issues.push({
          severity: 'error',
          message: 'Imagem sem texto alternativo (alt)',
        });
        score -= 30;
      } else if (alt.length < 5) {
        issues.push({
          severity: 'warning',
          message: 'Texto alternativo muito curto (< 5 caracteres)',
        });
        score -= 10;
      } else if (alt.length > 125) {
        issues.push({
          severity: 'warning',
          message: 'Texto alternativo muito longo (> 125 caracteres)',
        });
        score -= 5;
      }

      // Verificar dimensões
      const width = img.naturalWidth;
      const height = img.naturalHeight;

      if (width > 2000 || height > 2000) {
        issues.push({
          severity: 'warning',
          message: `Dimensões muito grandes (${width}x${height}px). Considere redimensionar.`,
        });
        score -= 15;
      }

      // Estimar tamanho do arquivo
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL();
        const base64Length = dataUrl.length - (dataUrl.indexOf(',') + 1);
        const fileSize = (base64Length * 3) / 4; // Aproximação do tamanho em bytes

        if (fileSize > 500000) { // 500KB
          issues.push({
            severity: 'error',
            message: `Tamanho excessivo (~${(fileSize / 1024).toFixed(0)}KB). Otimize a imagem.`,
          });
          score -= 25;
        } else if (fileSize > 200000) { // 200KB
          issues.push({
            severity: 'warning',
            message: `Tamanho grande (~${(fileSize / 1024).toFixed(0)}KB). Considere compressão.`,
          });
          score -= 10;
        }

        // Verificar loading attribute
        if (!img.loading || img.loading !== 'lazy') {
          issues.push({
            severity: 'info',
            message: 'Considere adicionar loading="lazy" para lazy loading.',
          });
          score -= 5;
        }

        // Verificar formato (via URL)
        const url = img.src;
        if (!url.includes('.webp') && !url.includes('.avif')) {
          issues.push({
            severity: 'info',
            message: 'Considere usar formatos modernos (WebP, AVIF).',
          });
          score -= 5;
        }

        const endTime = performance.now();
        const loadTime = endTime - startTime;

        resolve({
          url: img.src,
          alt,
          size: {
            width,
            height,
            fileSize,
          },
          loadTime,
          issues,
          score: Math.max(0, score),
        });
      } else {
        resolve({
          url: img.src,
          alt,
          size: { width, height, fileSize: 0 },
          loadTime: 0,
          issues,
          score: Math.max(0, score),
        });
      }
    });
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    setResults([]);
    setReport(null);

    try {
      // Encontrar todas as imagens na página
      const images = Array.from(document.querySelectorAll('img')) as HTMLImageElement[];
      
      // Analisar cada imagem
      const analyses: ImageAnalysis[] = [];
      for (const img of images) {
        // Aguardar imagem carregar
        if (!img.complete) {
          await new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        }
        
        const analysis = await analyzeImage(img);
        analyses.push(analysis);
      }

      setResults(analyses);

      // Gerar relatório
      const totalImages = analyses.length;
      const averageScore = analyses.reduce((sum, a) => sum + a.score, 0) / totalImages;
      const totalIssues = analyses.reduce((sum, a) => sum + a.issues.length, 0);
      const criticalIssues = analyses.reduce(
        (sum, a) => sum + a.issues.filter(i => i.severity === 'error').length,
        0
      );
      const warnings = analyses.reduce(
        (sum, a) => sum + a.issues.filter(i => i.severity === 'warning').length,
        0
      );
      const passed = analyses.filter(a => a.score >= 80).length;
      const averageLoadTime = analyses.reduce((sum, a) => sum + a.loadTime, 0) / totalImages;
      const totalSize = analyses.reduce((sum, a) => sum + a.size.fileSize, 0);

      const recommendations: string[] = [];
      
      if (criticalIssues > 0) {
        recommendations.push(`Corrija ${criticalIssues} problema(s) crítico(s) de acessibilidade (alt texts).`);
      }
      
      if (totalSize > 5000000) { // 5MB
        recommendations.push('Tamanho total das imagens muito alto. Implemente compressão progressiva.');
      }
      
      if (averageLoadTime > 100) {
        recommendations.push('Tempo de carregamento alto. Use lazy loading e formatos modernos.');
      }
      
      if (passed < totalImages * 0.7) {
        recommendations.push('Menos de 70% das imagens têm boa pontuação. Revise e otimize.');
      }

      setReport({
        totalImages,
        averageScore,
        totalIssues,
        criticalIssues,
        warnings,
        passed,
        averageLoadTime,
        totalSize,
        recommendations,
      });
    } catch (error) {
      console.error('Erro ao analisar imagens:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const downloadReport = () => {
    if (!report || results.length === 0) return;

    const reportData = {
      timestamp: new Date().toISOString(),
      summary: report,
      details: results,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `image-seo-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSeverityIcon = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'info':
        return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-primary" />
                Análise de SEO de Imagens
              </CardTitle>
              <CardDescription>
                Verifique acessibilidade, performance e otimização de todas as imagens da página
              </CardDescription>
            </div>
            <Button onClick={runAnalysis} disabled={analyzing}>
              {analyzing ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Gauge className="h-4 w-4 mr-2" />
                  Analisar Imagens
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        {report && (
          <CardContent className="space-y-6">
            {/* Resumo Geral */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="shadow-sm">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{report.totalImages}</div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <ImageIcon className="h-3 w-3" />
                    Imagens Analisadas
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardContent className="pt-6">
                  <div className={`text-2xl font-bold ${getScoreColor(report.averageScore)}`}>
                    {report.averageScore.toFixed(0)}%
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Pontuação Média
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-red-600">{report.criticalIssues}</div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    Problemas Críticos
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {(report.totalSize / 1024 / 1024).toFixed(2)} MB
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Tamanho Total
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Progresso */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Imagens Aprovadas ({report.passed}/{report.totalImages})</span>
                <span className="font-medium">
                  {((report.passed / report.totalImages) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-gradient-primary transition-all"
                  style={{ width: `${(report.passed / report.totalImages) * 100}%` }}
                />
              </div>
            </div>

            {/* Recomendações */}
            {report.recommendations.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold mb-2">Recomendações:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {report.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm">{rec}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Detalhes por Imagem */}
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">
                  Todas ({results.length})
                </TabsTrigger>
                <TabsTrigger value="errors">
                  Erros ({report.criticalIssues})
                </TabsTrigger>
                <TabsTrigger value="warnings">
                  Avisos ({report.warnings})
                </TabsTrigger>
                <TabsTrigger value="passed">
                  Aprovadas ({report.passed})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-3">
                {results.map((result, idx) => (
                  <Card key={idx} className="shadow-sm">
                    <CardContent className="pt-6">
                      <div className="flex gap-4">
                        <img 
                          src={result.url} 
                          alt={result.alt || 'Preview'}
                          className="w-20 h-20 object-cover rounded"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium truncate max-w-md">
                              {result.url.split('/').pop()}
                            </span>
                            <Badge className={getScoreColor(result.score)}>
                              Score: {result.score}%
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {result.size.width}x{result.size.height}px • 
                            {(result.size.fileSize / 1024).toFixed(0)}KB • 
                            {result.loadTime.toFixed(0)}ms
                          </div>
                          {result.issues.length > 0 && (
                            <div className="space-y-1">
                              {result.issues.map((issue, issueIdx) => (
                                <div key={issueIdx} className="flex items-start gap-2 text-sm">
                                  {getSeverityIcon(issue.severity)}
                                  <span>{issue.message}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="errors">
                {results.filter(r => r.issues.some(i => i.severity === 'error')).map((result, idx) => (
                  <Card key={idx} className="shadow-sm border-red-200">
                    <CardContent className="pt-6">
                      <div className="flex gap-4">
                        <img 
                          src={result.url} 
                          alt={result.alt || 'Preview'}
                          className="w-20 h-20 object-cover rounded"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="font-medium">{result.url.split('/').pop()}</div>
                          <div className="space-y-1">
                            {result.issues.filter(i => i.severity === 'error').map((issue, issueIdx) => (
                              <div key={issueIdx} className="flex items-start gap-2 text-sm text-red-600">
                                <XCircle className="h-4 w-4 mt-0.5" />
                                <span>{issue.message}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="warnings">
                {results.filter(r => r.issues.some(i => i.severity === 'warning')).map((result, idx) => (
                  <Card key={idx} className="shadow-sm border-yellow-200">
                    <CardContent className="pt-6">
                      <div className="flex gap-4">
                        <img 
                          src={result.url} 
                          alt={result.alt || 'Preview'}
                          className="w-20 h-20 object-cover rounded"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="font-medium">{result.url.split('/').pop()}</div>
                          <div className="space-y-1">
                            {result.issues.filter(i => i.severity === 'warning').map((issue, issueIdx) => (
                              <div key={issueIdx} className="flex items-start gap-2 text-sm text-yellow-600">
                                <AlertTriangle className="h-4 w-4 mt-0.5" />
                                <span>{issue.message}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="passed">
                {results.filter(r => r.score >= 80).map((result, idx) => (
                  <Card key={idx} className="shadow-sm border-green-200">
                    <CardContent className="pt-6">
                      <div className="flex gap-4">
                        <img 
                          src={result.url} 
                          alt={result.alt || 'Preview'}
                          className="w-20 h-20 object-cover rounded"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{result.url.split('/').pop()}</span>
                            <Badge className="bg-green-600 text-white">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              {result.score}%
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {result.size.width}x{result.size.height}px • 
                            {(result.size.fileSize / 1024).toFixed(0)}KB
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>

            {/* Botão de Download */}
            <Button onClick={downloadReport} variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Baixar Relatório Completo (JSON)
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
};
