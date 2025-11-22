import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RotateCw, Crop, Sun, Contrast, Save, X, Undo } from "lucide-react";
import { toast } from "sonner";

interface ImageEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  onSave: (editedImageBlob: Blob) => void;
}

export function ImageEditorDialog({
  open,
  onOpenChange,
  imageUrl,
  onSave,
}: ImageEditorDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [cropping, setCropping] = useState(false);
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null);
  const [cropEnd, setCropEnd] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (open && imageUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        setOriginalImage(img);
        drawImage(img);
      };
      img.src = imageUrl;
    }
  }, [open, imageUrl]);

  useEffect(() => {
    if (originalImage) {
      drawImage(originalImage);
    }
  }, [brightness, contrast, rotation]);

  const drawImage = (img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Calcular dimensões com rotação
    const angle = (rotation * Math.PI) / 180;
    const cos = Math.abs(Math.cos(angle));
    const sin = Math.abs(Math.sin(angle));
    
    canvas.width = img.width * cos + img.height * sin;
    canvas.height = img.width * sin + img.height * cos;

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(angle);
    
    // Aplicar filtros
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleCropStart = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!cropping || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const canvas = canvasRef.current;
    
    // Calcular a escala real entre o canvas e o elemento renderizado
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    setCropStart({
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    });
  };

  const handleCropMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!cropping || !cropStart || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const canvas = canvasRef.current;
    
    // Calcular a escala real entre o canvas e o elemento renderizado
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    setCropEnd({
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    });
  };

  const handleCropEnd = () => {
    if (!cropping || !cropStart || !cropEnd || !canvasRef.current || !originalImage) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const x = Math.min(cropStart.x, cropEnd.x);
    const y = Math.min(cropStart.y, cropEnd.y);
    const width = Math.abs(cropEnd.x - cropStart.x);
    const height = Math.abs(cropEnd.y - cropStart.y);

    if (width < 10 || height < 10) {
      toast.error("Área de corte muito pequena");
      setCropStart(null);
      setCropEnd(null);
      return;
    }

    const imageData = ctx.getImageData(x, y, width, height);
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    tempCtx.putImageData(imageData, 0, 0);
    
    const croppedImg = new Image();
    croppedImg.onload = () => {
      setOriginalImage(croppedImg);
      drawImage(croppedImg);
      setCropping(false);
      setCropStart(null);
      setCropEnd(null);
      toast.success("Imagem cortada");
    };
    croppedImg.src = tempCanvas.toDataURL();
  };

  const handleReset = () => {
    setBrightness(100);
    setContrast(100);
    setRotation(0);
    if (originalImage) {
      drawImage(originalImage);
    }
    toast.success("Edições resetadas");
  };

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        onSave(blob);
        onOpenChange(false);
        toast.success("Imagem salva com sucesso!");
      }
    }, "image/jpeg", 0.9);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editor de Imagem</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Canvas */}
          <div className="relative border border-border rounded-lg overflow-hidden bg-muted/10 flex items-center justify-center">
            <div className="relative inline-block">
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-[50vh] cursor-crosshair"
                onMouseDown={handleCropStart}
                onMouseMove={handleCropMove}
                onMouseUp={handleCropEnd}
              />
              {cropping && cropStart && cropEnd && canvasRef.current && (() => {
                const canvas = canvasRef.current;
                const rect = canvas.getBoundingClientRect();
                const scaleX = rect.width / canvas.width;
                const scaleY = rect.height / canvas.height;
                
                return (
                  <div
                    className="absolute border-2 border-primary bg-primary/10 pointer-events-none"
                    style={{
                      left: Math.min(cropStart.x, cropEnd.x) * scaleX,
                      top: Math.min(cropStart.y, cropEnd.y) * scaleY,
                      width: Math.abs(cropEnd.x - cropStart.x) * scaleX,
                      height: Math.abs(cropEnd.y - cropStart.y) * scaleY,
                    }}
                  />
                );
              })()}
            </div>
          </div>

          {/* Controles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Brilho */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  Brilho
                </Label>
                <span className="text-sm text-muted-foreground">{brightness}%</span>
              </div>
              <Slider
                value={[brightness]}
                onValueChange={(value) => setBrightness(value[0])}
                min={0}
                max={200}
                step={1}
              />
            </div>

            {/* Contraste */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Contrast className="h-4 w-4" />
                  Contraste
                </Label>
                <span className="text-sm text-muted-foreground">{contrast}%</span>
              </div>
              <Slider
                value={[contrast]}
                onValueChange={(value) => setContrast(value[0])}
                min={0}
                max={200}
                step={1}
              />
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRotate}
              className="flex items-center gap-2"
            >
              <RotateCw className="h-4 w-4" />
              Girar 90°
            </Button>
            <Button
              variant={cropping ? "default" : "outline"}
              size="sm"
              onClick={() => setCropping(!cropping)}
              className="flex items-center gap-2"
            >
              <Crop className="h-4 w-4" />
              {cropping ? "Cortando..." : "Cortar"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="flex items-center gap-2"
            >
              <Undo className="h-4 w-4" />
              Resetar
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Salvar Imagem
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
