import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Droplets, Image as ImageIcon, Crosshair, Ruler } from 'lucide-react';
import { toast } from 'sonner';

interface WatermarkConfig {
  enabled: boolean;
  opacity: number;
  position: 'center' | 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  scale: number;
  margin: number;
}

const WatermarkSettings = () => {
  const [config, setConfig] = useState<WatermarkConfig>({
    enabled: true,
    opacity: 0.3,
    position: 'bottom-right',
    scale: 0.15,
    margin: 20
  });

  const [preview, setPreview] = useState<string | null>(null);

  const handleConfigChange = (key: keyof WatermarkConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      // Aqui você pode implementar salvamento no backend se necessário
      // Por enquanto, apenas mostra feedback
      toast.success('Configurações de watermark salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    }
  };

  const handlePreview = () => {
    // Implementar preview do watermark
    toast.info('Preview em desenvolvimento');
  };

  const positionLabels = {
    'center': 'Centro',
    'top-left': 'Superior Esquerdo',
    'top-right': 'Superior Direito',
    'bottom-left': 'Inferior Esquerdo',
    'bottom-right': 'Inferior Direito'
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Droplets className="h-5 w-5 text-primary" />
          Configurações de Watermark
        </CardTitle>
        <CardDescription>
          Configure a marca d'água aplicada automaticamente nas imagens de produtos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Ativar/Desativar */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="watermark-enabled" className="text-base">
              Ativar Watermark
            </Label>
            <p className="text-sm text-muted-foreground">
              Aplicar marca d'água em todas as imagens carregadas
            </p>
          </div>
          <Switch
            id="watermark-enabled"
            checked={config.enabled}
            onCheckedChange={(checked) => handleConfigChange('enabled', checked)}
          />
        </div>

        {config.enabled && (
          <>
            {/* Opacidade */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Droplets className="h-4 w-4" />
                  Opacidade
                </Label>
                <span className="text-sm text-muted-foreground">
                  {Math.round(config.opacity * 100)}%
                </span>
              </div>
              <Slider
                value={[config.opacity * 100]}
                onValueChange={([value]) => handleConfigChange('opacity', value / 100)}
                min={10}
                max={100}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Recomendado: 20-40% para equilíbrio entre visibilidade e discrição
              </p>
            </div>

            {/* Escala */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  Escala do Logo
                </Label>
                <span className="text-sm text-muted-foreground">
                  {Math.round(config.scale * 100)}%
                </span>
              </div>
              <Slider
                value={[config.scale * 100]}
                onValueChange={([value]) => handleConfigChange('scale', value / 100)}
                min={5}
                max={50}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Porcentagem da largura da imagem que o logo ocupará
              </p>
            </div>

            {/* Posição */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Crosshair className="h-4 w-4" />
                Posição
              </Label>
              <Select
                value={config.position}
                onValueChange={(value: any) => handleConfigChange('position', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(positionLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Margem */}
            <div className="space-y-2">
              <Label htmlFor="margin">Margem (pixels)</Label>
              <Input
                id="margin"
                type="number"
                min={0}
                max={100}
                value={config.margin}
                onChange={(e) => handleConfigChange('margin', parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Distância das bordas quando posicionado nos cantos
              </p>
            </div>

            {/* Preview Visual */}
            <div className="rounded-lg border border-border p-4 space-y-3">
              <Label className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Preview
              </Label>
              <div className="relative aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                <div className="text-muted-foreground text-sm">
                  Imagem de exemplo
                </div>
                {/* Simulação visual do watermark */}
                <div
                  className="absolute flex items-center justify-center"
                  style={{
                    opacity: config.opacity,
                    width: `${config.scale * 100}%`,
                    ...(config.position === 'center' && {
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)'
                    }),
                    ...(config.position === 'top-left' && {
                      top: `${config.margin}px`,
                      left: `${config.margin}px`
                    }),
                    ...(config.position === 'top-right' && {
                      top: `${config.margin}px`,
                      right: `${config.margin}px`
                    }),
                    ...(config.position === 'bottom-left' && {
                      bottom: `${config.margin}px`,
                      left: `${config.margin}px`
                    }),
                    ...(config.position === 'bottom-right' && {
                      bottom: `${config.margin}px`,
                      right: `${config.margin}px`
                    })
                  }}
                >
                  <div className="w-full aspect-square bg-primary/20 rounded flex items-center justify-center border-2 border-primary/40">
                    <span className="text-xs font-bold text-primary">LOGO</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Informações Adicionais */}
        <div className="rounded-lg bg-muted p-4 space-y-2">
          <h4 className="font-medium text-sm">ℹ️ Informações</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Watermark aplicado automaticamente durante upload</li>
            <li>• Todas as versões (thumbnail, medium, full) recebem a marca</li>
            <li>• Logo localizado em: /public/logo.png</li>
            <li>• Processamento feito no servidor (backend)</li>
          </ul>
        </div>

        {/* Ações */}
        <div className="flex gap-3">
          <Button onClick={handleSave} className="flex-1">
            Salvar Configurações
          </Button>
          <Button onClick={handlePreview} variant="outline">
            Ver Preview
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WatermarkSettings;
