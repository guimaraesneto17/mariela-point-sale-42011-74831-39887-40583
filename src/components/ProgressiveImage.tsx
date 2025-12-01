import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface ProgressiveImageProps {
  thumbnailUrl: string;
  mediumUrl: string;
  fullUrl: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  onLoad?: () => void;
}

export const ProgressiveImage = ({
  thumbnailUrl,
  mediumUrl,
  fullUrl,
  alt,
  className,
  containerClassName,
  onLoad,
}: ProgressiveImageProps) => {
  const [currentSrc, setCurrentSrc] = useState(thumbnailUrl);
  const [loadingState, setLoadingState] = useState<'thumbnail' | 'medium' | 'full'>('thumbnail');
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Intersection Observer para lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Começar a carregar 50px antes
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    // Carregar thumbnail imediatamente (já está setado no estado inicial)
    setCurrentSrc(thumbnailUrl);
    setLoadingState('thumbnail');

    // Preload medium
    const mediumImg = new Image();
    mediumImg.src = mediumUrl;
    mediumImg.onload = () => {
      setCurrentSrc(mediumUrl);
      setLoadingState('medium');

      // Preload full depois que medium carregar
      const fullImg = new Image();
      fullImg.src = fullUrl;
      fullImg.onload = () => {
        setCurrentSrc(fullUrl);
        setLoadingState('full');
        onLoad?.();
      };
    };
  }, [isVisible, thumbnailUrl, mediumUrl, fullUrl, onLoad]);

  return (
    <div
      ref={imgRef}
      className={cn(
        "relative overflow-hidden bg-muted",
        containerClassName
      )}
    >
      {/* Blur placeholder enquanto não está visível */}
      {!isVisible && (
        <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50 animate-pulse" />
      )}

      {/* Imagem atual com transição suave */}
      <img
        src={currentSrc}
        alt={alt}
        className={cn(
          "w-full h-full object-cover transition-all duration-700 ease-out",
          loadingState === 'thumbnail' && "scale-105 blur-sm",
          loadingState === 'medium' && "scale-[1.02] blur-[1px]",
          loadingState === 'full' && "scale-100 blur-0",
          className
        )}
        loading="lazy"
      />

      {/* Indicador de qualidade (opcional, para debug) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 text-white text-xs rounded">
          {loadingState === 'thumbnail' && '📱 Thumbnail'}
          {loadingState === 'medium' && '💻 Medium'}
          {loadingState === 'full' && '🖥️ Full'}
        </div>
      )}

      {/* Overlay de loading */}
      {loadingState !== 'full' && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      )}
    </div>
  );
};

// Hook utilitário para usar com imagens que já têm o formato de múltiplas versões
export const useProgressiveImage = (imageUrls: {
  thumbnail: string;
  medium: string;
  full: string;
}) => {
  return imageUrls;
};
