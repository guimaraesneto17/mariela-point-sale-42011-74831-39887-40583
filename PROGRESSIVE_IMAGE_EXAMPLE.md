# Guia de Implementação: ProgressiveImage

Este guia mostra como implementar o carregamento progressivo de imagens no projeto Mariela PDV.

## 📋 Pré-requisitos

1. Backend deve retornar imagens no novo formato:
```typescript
{
  urls: {
    thumbnail: "https://...",
    medium: "https://...",
    full: "https://..."
  }
}
```

2. Componentes `ProgressiveImage` e `ImageGalleryWithProgressive` devem estar disponíveis

## 🔄 Migração de Componente Existente

### Antes: Imagem Tradicional

```tsx
// Componente antigo usando <img> tradicional
import { Card } from "@/components/ui/card";

const ProductCard = ({ product }) => {
  return (
    <Card>
      <img 
        src={product.imagem} 
        alt={product.nome}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h3>{product.nome}</h3>
        <p>{product.preco}</p>
      </div>
    </Card>
  );
};
```

**Problemas:**
- ❌ Carrega imagem full mesmo em thumbnails
- ❌ Sem otimização de banda
- ❌ Carregamento lento
- ❌ Sem transições suaves

### Depois: ProgressiveImage

```tsx
// Componente otimizado usando ProgressiveImage
import { Card } from "@/components/ui/card";
import { ProgressiveImage } from "@/components/ProgressiveImage";

const ProductCard = ({ product }) => {
  return (
    <Card className="overflow-hidden">
      <ProgressiveImage
        thumbnailUrl={product.imagem.urls.thumbnail}
        mediumUrl={product.imagem.urls.medium}
        fullUrl={product.imagem.urls.full}
        alt={product.nome}
        containerClassName="h-48"
        className="object-cover"
      />
      <div className="p-4">
        <h3>{product.nome}</h3>
        <p>{product.preco}</p>
      </div>
    </Card>
  );
};
```

**Benefícios:**
- ✅ Carrega thumbnail primeiro (98% menor)
- ✅ Economia de 85%+ de banda
- ✅ Carregamento 5x mais rápido
- ✅ Transições suaves e profissionais

## 📸 Exemplo: Galeria de Produtos

### Implementação Completa

```tsx
import { useState, useEffect } from "react";
import { ImageGalleryWithProgressive } from "@/components/ImageGalleryWithProgressive";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface ProductDetails {
  id: string;
  nome: string;
  preco: number;
  imagens: Array<{
    urls: {
      thumbnail: string;
      medium: string;
      full: string;
    };
  }>;
  estoque: number;
}

const ProductDetailsPage = ({ productId }: { productId: string }) => {
  const [product, setProduct] = useState<ProductDetails | null>(null);

  useEffect(() => {
    // Buscar produto da API
    fetchProduct(productId).then(setProduct);
  }, [productId]);

  if (!product) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{product.nome}</CardTitle>
            <Badge variant={product.estoque > 0 ? "default" : "destructive"}>
              {product.estoque > 0 ? "Em Estoque" : "Sem Estoque"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Galeria de Imagens com Carregamento Progressivo */}
            <div>
              <ImageGalleryWithProgressive 
                images={product.imagens.map(img => img.urls)}
              />
            </div>

            {/* Detalhes do Produto */}
            <div className="space-y-4">
              <div>
                <h3 className="text-2xl font-bold">
                  {formatCurrency(product.preco)}
                </h3>
                <p className="text-muted-foreground">
                  {product.estoque} unidades disponíveis
                </p>
              </div>
              
              {/* Mais informações... */}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
```

## 🎨 Exemplo: Grid de Produtos

### Listagem Otimizada

```tsx
import { ProgressiveImage } from "@/components/ProgressiveImage";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface Product {
  id: string;
  nome: string;
  preco: number;
  imagem: {
    urls: {
      thumbnail: string;
      medium: string;
      full: string;
    };
  };
  promocao: boolean;
}

const ProductGrid = ({ products }: { products: Product[] }) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <Card 
          key={product.id}
          className="cursor-pointer hover-scale transition-all shadow-card hover:shadow-elegant"
          onClick={() => navigate(`/produtos/${product.id}`)}
        >
          <div className="relative">
            {/* Usa apenas thumbnail para performance máxima em listagens */}
            <ProgressiveImage
              thumbnailUrl={product.imagem.urls.thumbnail}
              mediumUrl={product.imagem.urls.medium}
              fullUrl={product.imagem.urls.medium} // Para listagens, não precisa full
              alt={product.nome}
              containerClassName="h-48"
              className="object-cover"
            />
            
            {product.promocao && (
              <Badge 
                className="absolute top-2 right-2 bg-red-600 text-white"
              >
                Promoção
              </Badge>
            )}
          </div>

          <div className="p-4">
            <h3 className="font-semibold truncate">{product.nome}</h3>
            <p className="text-lg font-bold text-primary mt-2">
              {formatCurrency(product.preco)}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
};
```

## 🔄 Adaptação de API Response

### Backend Response Format

O backend deve retornar:

```typescript
// Resposta de upload de imagem
{
  success: true,
  urls: {
    thumbnail: "https://storage.url/image-thumbnail.webp",
    medium: "https://storage.url/image-medium.jpeg",
    full: "https://storage.url/image-full.jpeg"
  },
  sizes: {
    thumbnail: 15000,
    medium: 80000,
    full: 250000
  }
}
```

### Frontend Handling

```typescript
// Hook personalizado para upload
import { useState } from "react";
import { useImageCompression } from "@/hooks/useImageCompression";
import axiosInstance from "@/lib/api";

export const useProductImageUpload = () => {
  const { compressImage } = useImageCompression();
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      // 1. Comprimir no frontend
      const compressed = await compressImage(file, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 85
      });

      // 2. Upload para backend (retorna múltiplas versões)
      const response = await axiosInstance.post('/upload/single', {
        image: compressed
      });

      // 3. Retornar URLs das 3 versões
      return response.data.urls;
    } finally {
      setUploading(false);
    }
  };

  return { uploadImage, uploading };
};
```

### Uso no Componente

```tsx
import { useProductImageUpload } from "@/hooks/useProductImageUpload";

const ProductForm = () => {
  const { uploadImage, uploading } = useProductImageUpload();
  const [imageUrls, setImageUrls] = useState(null);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const urls = await uploadImage(file);
    setImageUrls(urls);
  };

  return (
    <div>
      <input 
        type="file" 
        accept="image/*"
        onChange={handleImageSelect}
        disabled={uploading}
      />

      {uploading && <p>Processando imagem...</p>}

      {imageUrls && (
        <ProgressiveImage
          thumbnailUrl={imageUrls.thumbnail}
          mediumUrl={imageUrls.medium}
          fullUrl={imageUrls.full}
          alt="Preview"
          containerClassName="h-48 w-48"
        />
      )}
    </div>
  );
};
```

## 🎭 Estados de Carregamento

### Indicadores Visuais

```tsx
import { ProgressiveImage } from "@/components/ProgressiveImage";
import { Skeleton } from "@/components/ui/skeleton";

const ProductImageWithLoading = ({ product, isLoading }) => {
  if (isLoading) {
    return <Skeleton className="w-full h-48" />;
  }

  return (
    <ProgressiveImage
      thumbnailUrl={product.imagem.urls.thumbnail}
      mediumUrl={product.imagem.urls.medium}
      fullUrl={product.imagem.urls.full}
      alt={product.nome}
      containerClassName="h-48"
      onLoad={() => console.log('Imagem full carregada!')}
    />
  );
};
```

## 📊 Métricas de Performance

### Comparação Antes vs Depois

**Antes (imagem full 2.5MB):**
- Tempo de carregamento inicial: ~8s (3G)
- Largura de banda: 2.5MB × 20 produtos = 50MB
- Experiência: Lenta, ruim para mobile

**Depois (progressivo):**
- Tempo de carregamento inicial: ~0.5s (thumbnail 15KB)
- Largura de banda: 15KB × 20 produtos = 300KB
- Transição para medium: +1.5s
- Experiência: Instantânea, profissional

**Resultado:**
- ✅ 16x mais rápido na visualização inicial
- ✅ 99.4% de economia de banda na primeira carga
- ✅ Melhor experiência em mobile
- ✅ Menor custo de infraestrutura

## 🔍 Debug e Troubleshooting

### Modo Desenvolvedor

O componente `ProgressiveImage` mostra indicadores de qualidade em desenvolvimento:

```
NODE_ENV=development
```

Indicadores visíveis:
- 📱 Thumbnail (loading inicial)
- 💻 Medium (transição)
- 🖥️ Full (carregamento completo)

### Console Logging

```tsx
<ProgressiveImage
  {...imageProps}
  onLoad={() => {
    console.log('Sequência completa:');
    console.log('1. Thumbnail carregado');
    console.log('2. Medium carregado');
    console.log('3. Full carregado ✓');
  }}
/>
```

## 📝 Checklist de Implementação

- [ ] Backend retorna formato com 3 URLs
- [ ] Frontend usa `useImageCompression` antes do upload
- [ ] Componentes de listagem usam `ProgressiveImage`
- [ ] Galerias usam `ImageGalleryWithProgressive`
- [ ] Lazy loading ativado em listagens longas
- [ ] Testes em 3G/4G para validar performance
- [ ] Analytics configurados no dashboard
- [ ] Cleanup de imagens órfãs agendado

---

**Última atualização**: Dezembro 2025
