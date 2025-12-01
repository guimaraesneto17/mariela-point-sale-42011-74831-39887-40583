# 🔄 Sistema de Imagens - Vercel Blob Storage

## 📋 Visão Geral

O sistema utiliza **Vercel Blob Storage** para armazenamento otimizado de imagens de produtos com compressão automática, watermarking e CDN global.

## ⚙️ Configuração

### 1. Token do Vercel Blob

Configure no Render.com:

```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

**Como obter:**
1. Acesse [Vercel Dashboard](https://vercel.com/dashboard)
2. Vá em **Storage** → **Blob**
3. Crie um novo blob store (ou use existente)
4. Copie o **Read-Write Token**
5. Cole no Render.com em **Environment Variables**

### 2. Verificação

O sistema verifica automaticamente se o token está configurado e falha com erro claro se não estiver.

---

## 🚀 Como Funciona

### Upload Automático com Múltiplas Versões

Quando você faz upload de uma imagem (via Produtos, Estoque, ou Vitrine):

1. **Watermark aplicado**: Logo da empresa é adicionado automaticamente
2. **Compressão inteligente**: Imagem otimizada com Sharp
3. **Três versões geradas**:
   - **Thumbnail**: 200x200px (listagens, cards)
   - **Medium**: 800x800px (visualização)
   - **Full**: 1920x1920px (zoom, detalhes)
4. **Upload para Vercel Blob**: Todas as versões enviadas
5. **URLs retornadas**: Sistema salva as 3 URLs no MongoDB

### Formatos Suportados

- **PNG com transparência** → Convertido para WebP
- **Outros formatos** → Convertido para JPEG progressivo
- **Qualidade otimizada**: 80-85% (balanço perfeito entre qualidade e tamanho)

---

## 📊 Benefícios

### Antes (Base64 no MongoDB)
- ❌ Documentos de 5-10 MB
- ❌ Timeouts frequentes
- ❌ Lentidão extrema
- ❌ Alto uso de memória

### Agora (Vercel Blob)
- ✅ Documentos leves (apenas URLs)
- ✅ Consultas ultra-rápidas (< 50ms)
- ✅ CDN global (entrega em < 100ms)
- ✅ Compressão automática (economia de 70-80%)
- ✅ Múltiplas versões (performance adaptativa)

---

## 🧹 Limpeza de Imagens Órfãs

### O que são imagens órfãs?

Imagens no storage que não estão mais referenciadas no banco de dados (produtos deletados, variantes removidas, etc).

### Como limpar?

**Via API:**
```bash
# Preview (não deleta, apenas lista)
POST /api/cleanup/orphan-images?dryRun=true

# Deletar realmente
POST /api/cleanup/orphan-images
```

**Via Interface:**
- Acesse a página de Storage no sistema
- Clique em "Executar Limpeza"
- Veja histórico de execuções

### Estatísticas

```bash
GET /api/cleanup/storage-stats
```

Retorna:
- Total de imagens no storage
- Imagens referenciadas
- Imagens órfãs
- Tamanho total (MB)

---

## 🔧 API de Upload

### Upload de uma imagem

```typescript
POST /api/upload/single
Content-Type: application/json

{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Resposta:**
```json
{
  "success": true,
  "urls": {
    "thumbnail": "https://xyz.public.blob.vercel-storage.com/...-thumbnail.jpeg",
    "medium": "https://xyz.public.blob.vercel-storage.com/...-medium.jpeg",
    "full": "https://xyz.public.blob.vercel-storage.com/...-full.jpeg"
  },
  "sizes": {
    "thumbnail": 12543,
    "medium": 89234,
    "full": 234567
  },
  "totalSize": 336344,
  "originalSize": 1456789,
  "compressionRatio": "92.31%"
}
```

### Upload de múltiplas imagens

```typescript
POST /api/upload/multiple
Content-Type: application/json

{
  "images": [
    "data:image/jpeg;base64,...",
    "data:image/png;base64,..."
  ]
}
```

---

## 🎯 Uso no Frontend

### Automático

O sistema processa imagens automaticamente ao criar/editar produtos:

```typescript
// No backend, ao salvar produto
const processedImages = await processImages(variante.imagens);
// Retorna URLs do Vercel Blob se for base64
// Mantém URLs existentes se já estiver no Blob
```

### Manual (raramente necessário)

```typescript
import { fetchAPI } from '@/lib/api';

const result = await fetchAPI('/upload/single', {
  method: 'POST',
  body: JSON.stringify({ image: base64String })
});

console.log(result.urls.full); // URL da imagem full
```

---

## 🔐 Segurança

1. **Token privado**: `BLOB_READ_WRITE_TOKEN` nunca exposto ao frontend
2. **Upload server-side**: Apenas backend tem permissão de upload
3. **Read público**: URLs das imagens são públicas (necessário para vitrine)
4. **Watermark automático**: Proteção de propriedade intelectual

---

## 📈 Monitoramento

### Verificar uso de storage

1. Acesse Storage Statistics no sistema
2. Veja:
   - Total de imagens
   - Espaço utilizado
   - Imagens órfãs
   - Histórico de limpezas

### Limites do Vercel Blob

- **Free Plan**: 500MB
- **Pro Plan**: 100GB
- **Enterprise**: Ilimitado

Para verificar uso atual: [Vercel Dashboard → Storage → Blob](https://vercel.com/dashboard)

---

## 🐛 Troubleshooting

### Erro: "BLOB_READ_WRITE_TOKEN não configurado"
→ Configure a variável no Render.com (veja seção Configuração)

### Erro: "Failed to upload image"
→ Verifique se o token tem permissões de escrita (Read-Write Token, não Read-Only)

### Imagens não aparecem
→ Verifique se as URLs estão sendo salvas corretamente no MongoDB

### Upload lento
→ Normal para imagens grandes (1-3s por imagem). O sistema comprime antes de enviar.

---

## 📝 Observações Técnicas

- **Watermark**: Aplicado antes da compressão
- **Sharp**: Biblioteca usada para processamento de imagens
- **Idempotente**: URLs existentes não são re-uploaded
- **Formato de URL**: `https://[hash].public.blob.vercel-storage.com/products/[nome]-[versao].[ext]`

---

## 🔗 Links Úteis

- [Vercel Blob Docs](https://vercel.com/docs/storage/vercel-blob)
- [Sharp Image Processing](https://sharp.pixelplumbing.com/)
- [Render Environment Variables](https://render.com/docs/environment-variables)
