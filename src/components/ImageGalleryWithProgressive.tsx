import { useState } from "react";
import { ProgressiveImage } from "./ProgressiveImage";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageUrls {
  thumbnail: string;
  medium: string;
  full: string;
}

interface ImageGalleryWithProgressiveProps {
  images: ImageUrls[];
  className?: string;
}

export const ImageGalleryWithProgressive = ({ 
  images, 
  className 
}: ImageGalleryWithProgressiveProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handlePrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedIndex !== null && selectedIndex < images.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrevious();
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'Escape') setSelectedIndex(null);
  };

  return (
    <>
      {/* Galeria de Thumbnails */}
      <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${className}`}>
        {images.map((imageUrls, index) => (
          <div 
            key={index}
            className="relative aspect-square cursor-pointer group"
            onClick={() => setSelectedIndex(index)}
          >
            <ProgressiveImage
              thumbnailUrl={imageUrls.thumbnail}
              mediumUrl={imageUrls.medium}
              fullUrl={imageUrls.full}
              alt={`Imagem ${index + 1}`}
              containerClassName="rounded-lg overflow-hidden shadow-card hover:shadow-elegant transition-all hover-scale"
            />
            {/* Overlay de hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="text-white text-sm font-medium bg-black/60 px-3 py-1 rounded-full">
                Ampliar
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Visualização Full */}
      <Dialog open={selectedIndex !== null} onOpenChange={() => setSelectedIndex(null)}>
        <DialogContent 
          className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none"
          onKeyDown={handleKeyDown}
        >
          <div className="relative w-full h-[95vh] flex items-center justify-center">
            {/* Botão Fechar */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white"
              onClick={() => setSelectedIndex(null)}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Contador de Imagens */}
            <div className="absolute top-4 left-4 z-50 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium">
              {selectedIndex !== null && `${selectedIndex + 1} / ${images.length}`}
            </div>

            {/* Navegação - Anterior */}
            {selectedIndex !== null && selectedIndex > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 z-50 bg-black/50 hover:bg-black/70 text-white h-12 w-12"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
            )}

            {/* Imagem Principal */}
            {selectedIndex !== null && (
              <div className="w-full h-full flex items-center justify-center p-8">
                <ProgressiveImage
                  thumbnailUrl={images[selectedIndex].thumbnail}
                  mediumUrl={images[selectedIndex].medium}
                  fullUrl={images[selectedIndex].full}
                  alt={`Imagem ${selectedIndex + 1}`}
                  containerClassName="w-full h-full"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            )}

            {/* Navegação - Próxima */}
            {selectedIndex !== null && selectedIndex < images.length - 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 z-50 bg-black/50 hover:bg-black/70 text-white h-12 w-12"
                onClick={handleNext}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
