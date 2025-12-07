import { useState, useMemo } from "react";
import { Search, Package, Tag, ChevronLeft, ChevronRight, X, Image as ImageIcon, ZoomIn, ZoomOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EstoqueConsultaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estoque: any[];
}

interface ImageGalleryState {
  isOpen: boolean;
  images: Array<{
    url: string;
    cor: string;
    tamanhos: Array<{ tamanho: string; quantidade: number }>;
  }>;
  currentIndex: number;
  productName: string;
}

export function EstoqueConsultaDialog({ 
  open, 
  onOpenChange, 
  estoque 
}: EstoqueConsultaDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [gallery, setGallery] = useState<ImageGalleryState>({
    isOpen: false,
    images: [],
    currentIndex: 0,
    productName: ""
  });
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });

  const estoqueFiltrado = useMemo(() => {
    if (!searchTerm) return estoque;
    const search = searchTerm.toLowerCase();
    return estoque.filter((item: any) =>
      item.nomeProduto?.toLowerCase().includes(search) ||
      item.codigoProduto?.toLowerCase().includes(search) ||
      item.categoria?.toLowerCase().includes(search)
    );
  }, [estoque, searchTerm]);

  // Extrair todas as imagens de um produto com suas cores e tamanhos
  const getProductImages = (item: any) => {
    const images: Array<{
      url: string;
      cor: string;
      tamanhos: Array<{ tamanho: string; quantidade: number }>;
    }> = [];

    // Imagem principal do produto
    if (item.imagem) {
      images.push({
        url: item.imagem,
        cor: "Principal",
        tamanhos: []
      });
    }

    // Imagens das variantes
    if (item.variantes && Array.isArray(item.variantes)) {
      item.variantes.forEach((variante: any) => {
        if (variante.imagem) {
          images.push({
            url: variante.imagem,
            cor: variante.cor || "Sem cor",
            tamanhos: variante.tamanhos || []
          });
        }
        // Imagens múltiplas da variante
        if (variante.imagens && Array.isArray(variante.imagens)) {
          variante.imagens.forEach((img: string) => {
            images.push({
              url: img,
              cor: variante.cor || "Sem cor",
              tamanhos: variante.tamanhos || []
            });
          });
        }
      });
    }

    // Imagens adicionais do produto
    if (item.imagens && Array.isArray(item.imagens)) {
      item.imagens.forEach((img: string) => {
        if (!images.find(i => i.url === img)) {
          images.push({
            url: img,
            cor: "Adicional",
            tamanhos: []
          });
        }
      });
    }

    return images;
  };

  const openGallery = (item: any) => {
    const images = getProductImages(item);
    if (images.length > 0) {
      setGallery({
        isOpen: true,
        images,
        currentIndex: 0,
        productName: item.nomeProduto
      });
    }
  };

  const closeGallery = () => {
    setGallery(prev => ({ ...prev, isOpen: false }));
    setIsZoomed(false);
  };

  const nextImage = () => {
    setIsZoomed(false);
    setGallery(prev => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % prev.images.length
    }));
  };

  const prevImage = () => {
    setIsZoomed(false);
    setGallery(prev => ({
      ...prev,
      currentIndex: prev.currentIndex === 0 ? prev.images.length - 1 : prev.currentIndex - 1
    }));
  };


  const currentImage = gallery.images[gallery.currentIndex];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Consultar Estoque
            </DialogTitle>
            <DialogDescription>
              Visualize os produtos disponíveis em estoque
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, código ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <ScrollArea className="h-[60vh]">
            <div className="space-y-2 pr-4">
              {estoqueFiltrado.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum produto encontrado
                </p>
              ) : (
                estoqueFiltrado.map((item: any) => {
                  const images = getProductImages(item);
                  const hasImages = images.length > 0;
                  const firstImage = images[0]?.url;

                  return (
                    <div
                      key={item._id}
                      className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      {/* Thumbnail da imagem */}
                      <div 
                        className={`relative w-16 h-16 rounded-lg overflow-hidden bg-background flex-shrink-0 ${hasImages ? 'cursor-pointer hover:ring-2 hover:ring-primary transition-all' : ''}`}
                        onClick={() => hasImages && openGallery(item)}
                      >
                        {firstImage ? (
                          <>
                            <img 
                              src={firstImage} 
                              alt={item.nomeProduto}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                            <div className="hidden w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-6 w-6 text-muted-foreground" />
                            </div>
                            {images.length > 1 && (
                              <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                                +{images.length - 1}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.nomeProduto}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                          <span>{item.codigoProduto}</span>
                          {item.categoria && (
                            <Badge variant="outline" className="text-xs">
                              {item.categoria}
                            </Badge>
                          )}
                          {item.emPromocao && (
                            <Badge variant="destructive" className="text-xs">
                              <Tag className="h-3 w-3 mr-1" />
                              Promoção
                            </Badge>
                          )}
                          {item.isNovidade && (
                            <Badge className="text-xs bg-blue-500/20 text-blue-600">
                              Novidade
                            </Badge>
                          )}
                        </div>
                        {/* Mostrar variantes se existirem */}
                        {item.variantes && item.variantes.length > 0 && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            <span className="font-medium">Variantes: </span>
                            {item.variantes.map((v: any, idx: number) => (
                              <span key={idx}>
                                {v.cor} ({v.tamanhos?.map((t: any) => `${t.tamanho}: ${t.quantidade}`).join(', ') || v.quantidade})
                                {idx < item.variantes.length - 1 && ' | '}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-bold text-foreground">
                          {item.emPromocao && item.precoPromocional ? (
                            <>
                              <span className="line-through text-muted-foreground text-sm mr-2">
                                {formatCurrency(item.precoVenda)}
                              </span>
                              <span className="text-green-600">
                                {formatCurrency(item.precoPromocional)}
                              </span>
                            </>
                          ) : (
                            formatCurrency(item.precoVenda)
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantidadeTotal || item.quantidade || 0} un. total
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Gallery Modal */}
      <Dialog open={gallery.isOpen} onOpenChange={(open) => !open && closeGallery()}>
        <DialogContent className="max-w-4xl max-h-[95vh] p-0 overflow-hidden">
          <div className="relative">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-bold text-lg">{gallery.productName}</h3>
                  {currentImage && (
                    <p className="text-white/80 text-sm">
                      {gallery.currentIndex + 1} de {gallery.images.length}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={closeGallery}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Image */}
            <div 
              className={`flex items-center justify-center bg-black min-h-[60vh] overflow-hidden ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
              onClick={() => !isZoomed && setIsZoomed(true)}
            >
              {currentImage && (
                <div 
                  className="relative w-full h-full flex items-center justify-center"
                  onMouseMove={(e) => {
                    if (isZoomed) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = ((e.clientX - rect.left) / rect.width) * 100;
                      const y = ((e.clientY - rect.top) / rect.height) * 100;
                      setZoomPosition({ x, y });
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isZoomed) {
                      setIsZoomed(false);
                    } else {
                      setIsZoomed(true);
                    }
                  }}
                >
                  <img
                    src={currentImage.url}
                    alt={`${gallery.productName} - ${currentImage.cor}`}
                    className={`transition-transform duration-300 ${
                      isZoomed 
                        ? 'scale-[2.5] cursor-zoom-out' 
                        : 'max-w-full max-h-[70vh] object-contain cursor-zoom-in'
                    }`}
                    style={isZoomed ? {
                      transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`
                    } : undefined}
                  />
                </div>
              )}
            </div>

            {/* Zoom indicator */}
            {!isZoomed && (
              <div className="absolute bottom-24 right-4 bg-black/60 text-white px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5">
                <ZoomIn className="h-3.5 w-3.5" />
                Clique para zoom
              </div>
            )}
            {isZoomed && (
              <div className="absolute bottom-24 right-4 bg-black/60 text-white px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5">
                <ZoomOut className="h-3.5 w-3.5" />
                Clique para sair do zoom
              </div>
            )}

            {/* Navigation buttons */}
            {gallery.images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 h-12 w-12"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 h-12 w-12"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}

            {/* Footer with color and sizes info */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
              {currentImage && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary text-primary-foreground">
                      {currentImage.cor}
                    </Badge>
                  </div>
                  {currentImage.tamanhos && currentImage.tamanhos.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      <span className="text-white/80 text-sm">Tamanhos:</span>
                      {currentImage.tamanhos.map((t: any, idx: number) => (
                        <Badge 
                          key={idx} 
                          variant="outline" 
                          className={`text-white border-white/50 ${t.quantidade > 0 ? 'bg-green-600/30' : 'bg-red-600/30'}`}
                        >
                          {t.tamanho}: {t.quantidade} un.
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {gallery.images.length > 1 && (
              <div className="bg-black/90 p-3 overflow-x-auto">
                <div className="flex gap-2 justify-center">
                  {gallery.images.map((img, idx) => (
                    <button
                      key={idx}
                      className={`relative w-14 h-14 rounded overflow-hidden flex-shrink-0 transition-all ${
                        idx === gallery.currentIndex 
                          ? 'ring-2 ring-primary scale-105' 
                          : 'opacity-60 hover:opacity-100'
                      }`}
                      onClick={() => setGallery(prev => ({ ...prev, currentIndex: idx }))}
                    >
                      <img
                        src={img.url}
                        alt={`${gallery.productName} - ${img.cor}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[10px] px-1 truncate">
                        {img.cor}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
