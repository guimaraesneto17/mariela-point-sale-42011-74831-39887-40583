import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

interface ImageGalleryLightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: string[];
  initialIndex?: number;
  title?: string;
}

export function ImageGalleryLightbox({
  open,
  onOpenChange,
  images,
  initialIndex = 0,
  title,
}: ImageGalleryLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, open]);

  useEffect(() => {
    // Reset zoom e posição ao mudar de imagem
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [currentIndex]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.5, 5));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.5, 1));
  };

  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowLeft") handlePrevious();
    if (e.key === "ArrowRight") handleNext();
    if (e.key === "Escape") onOpenChange(false);
    if (e.key === "+") handleZoomIn();
    if (e.key === "-") handleZoomOut();
    if (e.key === "0") handleResetZoom();
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-[95vw] w-full max-h-[95vh] p-0 bg-gradient-to-br from-background via-background/95 to-muted/30 backdrop-blur-xl border-2 border-border/50 shadow-2xl overflow-hidden"
        hideDefaultClose={true}
      >
        <div className="relative w-full h-full flex flex-col max-h-[95vh]">
          {/* Header Modernizado */}
          <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-border/50 bg-gradient-to-r from-card/50 to-card/30 backdrop-blur-sm">
            <div className="flex-1 min-w-0 pr-2">
              {title && (
                <h3 className="text-lg md:text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent truncate">
                  {title}
                </h3>
              )}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-1">
                <span className="text-sm font-semibold text-primary whitespace-nowrap">
                  {currentIndex + 1} / {images.length}
                </span>
                <span className="text-xs text-muted-foreground hidden md:block">
                  Use ← → para navegar • +/- para zoom • ESC para fechar
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-9 w-9 md:h-10 md:w-10 rounded-full hover:bg-destructive/20 hover:text-destructive hover:scale-110 transition-all shadow-lg border border-border/30 flex-shrink-0"
              title="Fechar (ESC)"
            >
              <X className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </div>

          {/* Área da imagem com zoom e pan - Modernizada e Responsiva */}
          <div 
            className="flex-1 relative flex items-center justify-center p-4 md:p-8 min-h-[50vh] md:min-h-[60vh] bg-gradient-to-br from-muted/10 via-transparent to-muted/5 overflow-hidden"
            onWheel={handleWheel}
          >
            <div
              ref={imageRef}
              className={`max-w-full max-h-full ${scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transition: isDragging ? 'none' : 'transform 0.2s ease-out',
              }}
            >
              <img
                src={images[currentIndex]}
                alt={`Imagem ${currentIndex + 1}`}
                className="max-w-full max-h-[50vh] md:max-h-[65vh] w-auto h-auto object-contain rounded-lg shadow-2xl select-none"
                draggable={false}
                onError={(e) => {
                  e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23ddd' width='400' height='300'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='20'%3EImagem não disponível%3C/text%3E%3C/svg%3E";
                }}
              />
            </div>

            {/* Controles de zoom - Modernizados e Responsivos */}
            <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 md:gap-2 bg-gradient-to-r from-background/95 via-background/90 to-background/95 backdrop-blur-xl p-1.5 md:p-2.5 rounded-xl md:rounded-2xl border-2 border-border/50 shadow-2xl">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomOut}
                disabled={scale <= 1}
                className="h-7 w-7 md:h-8 md:w-8"
                title="Diminuir zoom (-)"
              >
                <ZoomOut className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
              <div className="flex items-center px-2 md:px-3 min-w-[50px] md:min-w-[60px] justify-center">
                <span className="text-xs md:text-sm font-semibold">{Math.round(scale * 100)}%</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomIn}
                disabled={scale >= 5}
                className="h-7 w-7 md:h-8 md:w-8"
                title="Aumentar zoom (+)"
              >
                <ZoomIn className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
              <div className="w-px bg-border mx-0.5 md:mx-1" />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleResetZoom}
                disabled={scale === 1}
                className="h-7 w-7 md:h-8 md:w-8"
                title="Resetar zoom (0)"
              >
                <Maximize2 className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </div>

            {/* Botões de navegação - Responsivos */}
            {images.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 h-10 w-10 md:h-12 md:w-12 rounded-full shadow-xl hover:scale-110 transition-transform z-10"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 h-10 w-10 md:h-12 md:w-12 rounded-full shadow-xl hover:scale-110 transition-transform z-10"
                  onClick={handleNext}
                >
                  <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
                </Button>
              </>
            )}
          </div>

          {/* Miniaturas - Modernizadas e Responsivas */}
          {images.length > 1 && (
            <div className="p-3 md:p-4 border-t border-border/50 bg-gradient-to-r from-card/50 to-card/30 backdrop-blur-sm">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                      index === currentIndex
                        ? "border-primary ring-2 ring-primary/30 scale-105"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Miniatura ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect fill='%23ddd' width='80' height='80'/%3E%3C/svg%3E";
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
