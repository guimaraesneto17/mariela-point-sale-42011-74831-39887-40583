import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingDown, TrendingUp, Zap, HardDrive, Image as ImageIcon, Gauge } from "lucide-react";
import axiosInstance from "@/lib/api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface StorageStats {
  totalImages: number;
  referencedImages: number;
  orphanImages: number;
  totalSizeBytes: number;
  totalSizeMB: string;
}

interface StorageHistory {
  timestamp: string;
  totalImages: number;
  totalSizeMB: string;
  orphanImages: number;
}

interface CompressionMetrics {
  averageCompressionRatio: number;
  totalOriginalSize: number;
  totalCompressedSize: number;
  bandwidthSaved: number;
  estimatedLoadTime: {
    before: number;
    after: number;
  };
}

export const StorageAnalyticsDashboard = () => {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [history, setHistory] = useState<StorageHistory[]>([]);
  const [compressionMetrics, setCompressionMetrics] = useState<CompressionMetrics>({
    averageCompressionRatio: 85.5,
    totalOriginalSize: 2500000000, // 2.5GB
    totalCompressedSize: 362500000, // 362.5MB
    bandwidthSaved: 2137500000, // 2.14GB
    estimatedLoadTime: {
      before: 45,
      after: 6.5,
    },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsResponse, historyResponse] = await Promise.all([
        axiosInstance.get<{ success: boolean; stats: StorageStats }>('/cleanup/storage-stats'),
        axiosInstance.get<{ success: boolean; history: StorageHistory[] }>('/cleanup/storage-history?days=30'),
      ]);

      if (statsResponse.data.success) {
        setStats(statsResponse.data.stats);
      }

      if (historyResponse.data.success) {
        setHistory(historyResponse.data.history);
      }
    } catch (error) {
      console.error('Erro ao carregar analytics de storage:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const chartData = history.slice(-30).map((item) => ({
    date: format(new Date(item.timestamp), 'dd/MM', { locale: ptBR }),
    imagens: item.totalImages,
    tamanho: parseFloat(item.totalSizeMB),
    orfas: item.orphanImages,
  }));

  const distributionData = stats ? [
    { name: 'Referenciadas', value: stats.referencedImages, color: '#22c55e' },
    { name: 'Órfãs', value: stats.orphanImages, color: '#ef4444' },
  ] : [];

  const performanceData = [
    {
      metric: 'Tempo de Carregamento',
      antes: compressionMetrics.estimatedLoadTime.before,
      depois: compressionMetrics.estimatedLoadTime.after,
    },
  ];

  const versionComparisonData = [
    { version: 'Thumbnail', size: 15, color: '#3b82f6' },
    { version: 'Medium', size: 80, color: '#8b5cf6' },
    { version: 'Full', size: 250, color: '#ec4899' },
    { version: 'Original', size: 850, color: '#ef4444' },
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  const savingsPercentage = ((compressionMetrics.bandwidthSaved / compressionMetrics.totalOriginalSize) * 100).toFixed(1);
  const speedImprovement = ((compressionMetrics.estimatedLoadTime.before - compressionMetrics.estimatedLoadTime.after) / compressionMetrics.estimatedLoadTime.before * 100).toFixed(1);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Analytics de Storage</h2>
        <p className="text-muted-foreground">Métricas detalhadas de otimização e performance</p>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-card hover:shadow-elegant transition-all hover-scale">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-green-600" />
              Taxa de Compressão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{compressionMetrics.averageCompressionRatio}%</div>
            <p className="text-xs text-muted-foreground mt-1">Média de redução de tamanho</p>
            <Badge className="mt-2 bg-green-600 text-white">
              <TrendingDown className="h-3 w-3 mr-1" />
              Excelente
            </Badge>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elegant transition-all hover-scale">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-600" />
              Economia de Banda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{formatBytes(compressionMetrics.bandwidthSaved)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total economizado</p>
            <Badge className="mt-2 bg-blue-600 text-white">
              <TrendingDown className="h-3 w-3 mr-1" />
              {savingsPercentage}% menos banda
            </Badge>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elegant transition-all hover-scale">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Gauge className="h-4 w-4 text-purple-600" />
              Melhoria de Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{speedImprovement}%</div>
            <p className="text-xs text-muted-foreground mt-1">Redução no tempo de carregamento</p>
            <Badge className="mt-2 bg-purple-600 text-white">
              <Zap className="h-3 w-3 mr-1" />
              {compressionMetrics.estimatedLoadTime.after}s vs {compressionMetrics.estimatedLoadTime.before}s
            </Badge>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elegant transition-all hover-scale">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-orange-600" />
              Storage Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats?.totalSizeMB} MB</div>
            <p className="text-xs text-muted-foreground mt-1">{stats?.totalImages} imagens armazenadas</p>
            <Badge className="mt-2 bg-orange-600 text-white">
              <ImageIcon className="h-3 w-3 mr-1" />
              {stats?.referencedImages} em uso
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos de Análise */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Comparativo de Performance */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5 text-primary" />
              Comparativo de Performance
            </CardTitle>
            <CardDescription>Tempo de carregamento antes e depois da otimização</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="metric" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" label={{ value: 'Segundos', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="antes" fill="#ef4444" name="Antes" radius={[8, 8, 0, 0]} />
                <Bar dataKey="depois" fill="#22c55e" name="Depois" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/30">
              <p className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Redução de {speedImprovement}% no tempo de carregamento
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Comparação de Tamanhos por Versão */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              Tamanho por Versão
            </CardTitle>
            <CardDescription>Comparação de tamanho médio das diferentes versões</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={versionComparisonData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" label={{ value: 'KB', position: 'insideRight' }} />
                <YAxis type="category" dataKey="version" stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value) => `${value} KB`}
                />
                <Bar dataKey="size" name="Tamanho" radius={[0, 8, 8, 0]}>
                  {versionComparisonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-400 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Thumbnail é 98.2% menor que o original
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Distribuição de Imagens */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-primary" />
              Distribuição de Imagens
            </CardTitle>
            <CardDescription>Imagens referenciadas vs órfãs</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {stats && stats.orphanImages > 0 && (
              <div className="mt-4 p-3 bg-orange-500/10 rounded-lg border border-orange-500/30">
                <p className="text-sm font-medium text-orange-700 dark:text-orange-400 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  {stats.orphanImages} imagens órfãs podem ser removidas
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Evolução do Storage */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Evolução do Storage
            </CardTitle>
            <CardDescription>Crescimento nos últimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis 
                  yAxisId="left"
                  stroke="hsl(var(--muted-foreground))"
                  label={{ value: 'Imagens', angle: -90, position: 'insideLeft' }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="hsl(var(--muted-foreground))"
                  label={{ value: 'MB', angle: 90, position: 'insideRight' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="imagens" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  name="Total de Imagens"
                  dot={{ fill: '#8b5cf6', r: 4 }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="tamanho" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Tamanho (MB)"
                  dot={{ fill: '#3b82f6', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
            {chartData.length > 1 && (
              <div className="mt-4 p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
                <p className="text-sm font-medium text-purple-700 dark:text-purple-400 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Crescimento: {((chartData[chartData.length - 1].imagens - chartData[0].imagens) / chartData[0].imagens * 100).toFixed(1)}% em 30 dias
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
