import { useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageNavigatorProps {
  images: string[];
  alt: string;
  className?: string;
  onImageClick?: () => void;
  showControls?: boolean;
  showStarOnFirst?: boolean;
}

export const ImageNavigator = ({ 
  images, 
  alt, 
  className = "", 
  onImageClick,
  showControls = true,
  showStarOnFirst = false
}: ImageNavigatorProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full h-full group">
      <img
        src={images[currentIndex]}
        alt={alt}
        className={`w-full h-full object-cover ${onImageClick ? 'cursor-pointer' : ''} ${className}`}
        onClick={onImageClick}
      />
      
      {/* Estrela de destaque - apenas na primeira imagem */}
      {showStarOnFirst && currentIndex === 0 && (
        <div className="absolute top-2 left-2 bg-yellow-500 text-white rounded-full p-1.5 shadow-lg border-2 border-background z-10">
          <Star className="h-3 w-3 fill-current" />
        </div>
      )}
      
      {showControls && images.length > 1 && (
        <>
          {/* Navegação */}
          <Button
            variant="secondary"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 hover:bg-background shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-20"
            onClick={handlePrevious}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="secondary"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 hover:bg-background shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-20"
            onClick={handleNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Indicadores de página */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
            {images.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentIndex
                    ? "w-6 bg-primary"
                    : "w-1.5 bg-background/60"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
