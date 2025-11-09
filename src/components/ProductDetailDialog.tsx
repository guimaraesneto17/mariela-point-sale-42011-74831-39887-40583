import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tag, Sparkles, Package, ShoppingBag } from "lucide-react";
import { useState } from "react";

interface ProductDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any;
}

const ProductDetailDialog = ({ open, onOpenChange, product }: ProductDetailDialogProps) => {
  const [selectedImage, setSelectedImage] = useState(0);

  if (!product) return null;

  const hasImages = product.image && product.image.length > 0 && product.image[0] !== 'default.jpg';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold text-foreground mb-2">
                {product.title || 'Produto sem nome'}
              </DialogTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline">{product.code}</Badge>
                <Badge variant="outline">{product.category}</Badge>
                {product.isOnSale && (
                  <Badge className="bg-accent text-accent-foreground">
                    <Tag className="h-3 w-3 mr-1" />
                    Promoção
                  </Badge>
                )}
                {product.isNew && (
                  <Badge className="bg-green-600 text-white">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Novo
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Galeria de Imagens */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
              {hasImages ? (
                <img
                  src={product.image[selectedImage]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package className="h-24 w-24 text-muted-foreground" />
              )}
            </div>
            
            {hasImages && product.image.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.image.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === idx ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.title} - ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Informações do Produto */}
          <div className="space-y-4">
            {/* Preço */}
            <div className="space-y-2">
              {product.isOnSale && product.originalPrice ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground line-through">
                      {product.originalPrice}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      Economize R$ {(product.originalPriceValue - product.priceValue).toFixed(2)}
                    </Badge>
                  </div>
                  <div className="text-3xl font-bold text-accent">
                    {product.price}
                  </div>
                </>
              ) : (
                <div className="text-3xl font-bold text-foreground">
                  {product.price}
                </div>
              )}
            </div>

            <Separator />

            {/* Descrição */}
            {product.description && (
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Descrição</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            <Separator />

            {/* Disponibilidade */}
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">Disponibilidade</h4>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total disponível:</span>
                <span className="font-bold text-primary">{product.totalAvailable || 0} un.</span>
              </div>
              <Badge variant={product.totalAvailable > 0 ? "default" : "secondary"}>
                {product.statusProduct}
              </Badge>
            </div>

            <Separator />

            {/* Variantes */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">Variantes Disponíveis</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {product.variants.map((variant: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{variant.color}</Badge>
                        <Badge variant="outline">{variant.size}</Badge>
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {variant.available} un.
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button 
              className="w-full gap-2 mt-4" 
              size="lg"
              disabled={!product.totalAvailable || product.totalAvailable <= 0}
            >
              <ShoppingBag className="h-4 w-4" />
              {product.totalAvailable > 0 ? 'Disponível para Venda' : 'Produto Esgotado'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailDialog;
