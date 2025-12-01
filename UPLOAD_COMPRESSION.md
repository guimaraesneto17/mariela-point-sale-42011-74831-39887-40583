# 🖼️ Sistema de Compressão e Armazenamento de Imagens

## 📋 Visão Geral

Sistema completo de otimização de imagens com compressão automática no frontend e backend, armazenamento em Supabase Storage, e ferramentas de gerenciamento e limpeza.

## 🎯 Arquitetura

### Frontend - Compressão Antes do Upload

**Hook: `useImageCompression`**

Localização: `src/hooks/useImageCompression.ts`

```typescript
const { compressing, compressImage, compressImages } = useImageCompression();

// Comprimir uma única imagem
const compressed = await compressImage(file, {
  maxWidth: 1200,      // Largura máxima
  maxHeight: 1200,     // Altura máxima
  quality: 0.85,       // Qualidade JPEG (0-1)
  maxSizeMB: 5         // Tamanho máximo do arquivo
});

// Comprimir múltiplas imagens
const compressedArray = await compressImages(files);
```

**Componentes que usam compressão:**
- `AddMultipleVariantsDialog` - Upload de imagens de variantes de produtos
- `AddToStockDialog` - Upload ao adicionar produtos ao estoque
- `EditVariantImagesDialog` - Edição de imagens de variantes
- `ComprovanteDialog` - Upload de comprovantes financeiros
- `RegistrarPagamentoDialog` - Upload de comprovantes de pagamento

### Backend - Compressão e Upload para Supabase

**Serviço: `imageUploadService.ts`**

Localização: `server/services/imageUploadService.ts`

#### Funcionalidades

1. **Compressão Automática com Sharp**
   - Redimensiona para máximo 1920x1920px
   - Converte PNG transparente → WebP
   - Converte outros formatos → JPEG com 85% de qualidade
   - Mantém aspect ratio original

2. **Upload para Supabase Storage**
   ```typescript
   import { uploadImageToBlob, processImages } from '../services/imageUploadService';

   // Upload de imagem base64
   const result = await uploadImageToBlob(base64Image);
   console.log(result.url); // URL pública da imagem

   // Processar array de imagens (base64 ou URLs)
   const urls = await processImages(imagensArray);
   ```

3. **Gerenciamento**
   - `deleteImageFromBlob(url)` - Deletar imagem individual
   - `deleteMultipleImages(urls)` - Deletar múltiplas imagens
   - `listAllImages()` - Listar todas as imagens no storage
   - `isBase64Image(str)` - Verificar se string é base64

## 🧹 Sistema de Cleanup

### Interface Visual

**Componente:** `StorageCleanup`

Localização: `src/components/StorageCleanup.tsx`

Acesse via: `/backend-status`

#### Recursos

1. **Estatísticas em Tempo Real**
   - Total de imagens no storage
   - Imagens referenciadas no banco
   - Imagens órfãs (não referenciadas)
   - Tamanho total em MB
   - Tendência de crescimento/redução

2. **Gráfico de Evolução**
   - Histórico de 30 dias
   - Evolução do tamanho total
   - Evolução do número de imagens
   - Identificação de tendências

3. **Cleanup de Imagens Órfãs**
   - **Dry Run**: Analisa sem deletar
   - **Executar**: Remove imagens órfãs permanentemente
   - Lista detalhada de imagens a serem removidas
   - Relatório de falhas

### Endpoints da API

#### 1. Estatísticas de Storage
```
GET /api/cleanup/storage-stats
```

**Resposta:**
```json
{
  "success": true,
  "stats": {
    "totalImages": 150,
    "referencedImages": 140,
    "orphanImages": 10,
    "totalSizeBytes": 52428800,
    "totalSizeMB": "50.00"
  }
}
```

#### 2. Histórico de Estatísticas
```
GET /api/cleanup/storage-history?days=30
```

**Resposta:**
```json
{
  "success": true,
  "history": [
    {
      "timestamp": "2025-12-01T10:00:00Z",
      "totalImages": 145,
      "totalSizeMB": 48.5,
      "referencedImages": 138,
      "orphanImages": 7
    }
  ]
}
```

#### 3. Cleanup de Imagens Órfãs
```
POST /api/cleanup/orphan-images?dryRun=true
```

**Parâmetros:**
- `dryRun` (query, opcional): `true` para apenas analisar

**Resposta (Dry Run):**
```json
{
  "success": true,
  "dryRun": true,
  "totalStorageImages": 150,
  "totalReferencedImages": 140,
  "orphanImagesCount": 10,
  "orphanImages": [
    {
      "path": "products/produto-123-xyz.jpg",
      "url": "https://..."
    }
  ]
}
```

**Resposta (Execução):**
```json
{
  "success": true,
  "deletedImagesCount": 10,
  "failedDeletionsCount": 0,
  "deletedImages": ["products/..."],
  "failedDeletions": []
}
```

## 📊 Rastreamento Histórico

**Model:** `StorageStats`

Localização: `server/models/StorageStats.ts`

Armazena snapshots periódicos das estatísticas de storage para análise de tendências:

```typescript
{
  timestamp: Date,
  totalImages: Number,
  totalSizeBytes: Number,
  totalSizeMB: Number,
  referencedImages: Number,
  orphanImages: Number
}
```

## 🔄 Migração de Imagens Base64

**Script:** `migrateImagesToBlob.ts`

Localização: `server/scripts/migrateImagesToBlob.ts`

### Como Executar

```bash
cd server
npm run migrate-images
```

### O que faz

1. Conecta ao MongoDB
2. Busca todas as imagens base64 nas collections:
   - `estoque` (variantes de produtos)
   - `vitrineVirtual` (produtos da vitrine)
3. Faz upload para Supabase Storage com compressão
4. Substitui base64 pelas URLs públicas
5. Salva alterações no MongoDB
6. Exibe relatório detalhado

### Exemplo de Output

```
🚀 Iniciando migração de imagens para Supabase Storage...

📦 Estoque:
  • Documentos processados: 50
  • Total de imagens: 150
  • Imagens migradas: 150
  • Falhas: 0

🛍️ Vitrine Virtual:
  • Documentos processados: 50
  • Total de imagens: 150
  • Imagens migradas: 150
  • Falhas: 0

✅ Migração concluída!
```

## ⚙️ Configuração

### Variáveis de Ambiente

**Backend (`server/.env`):**
```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

### Supabase Storage

**Bucket:** `product-images`

**Estrutura:**
```
product-images/
└── products/
    ├── produto-1234-abc.jpg
    ├── produto-5678-def.webp
    └── ...
```

**RLS Policies:**
- Read (SELECT): Público
- Upload (INSERT): Usuários autenticados
- Update (UPDATE): Usuários autenticados
- Delete (DELETE): Usuários autenticados

## 📈 Benefícios

### Performance

**Antes:**
- ❌ Documentos MongoDB: 5-10 MB cada
- ❌ Queries lentas: 2-5 segundos
- ❌ Timeouts frequentes
- ❌ Alto uso de memória

**Depois:**
- ✅ Documentos MongoDB: < 50 KB
- ✅ Queries rápidas: < 100ms
- ✅ Sem timeouts
- ✅ Imagens servidas via CDN global

### Armazenamento

**Compressão no Frontend:**
- Reduz tamanho antes do upload
- Economiza largura de banda
- Upload mais rápido

**Compressão no Backend:**
- Otimização adicional com Sharp
- Formatos modernos (WebP)
- Reduz custos de storage

### Gerenciamento

**Dashboard Visual:**
- Monitora crescimento de storage
- Identifica imagens órfãs
- Remove arquivos não utilizados
- Análise de tendências

## 🔒 Segurança

1. **Autenticação obrigatória** para upload/deleção
2. **Validação de tipo** de arquivo (apenas imagens)
3. **Limite de tamanho** (5MB por arquivo)
4. **Service Role Key** protegida em variáveis de ambiente
5. **Permissões granulares** baseadas em roles

## 🐛 Troubleshooting

### Erro: "SUPABASE_URL not configured"
→ Configure `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` no `.env`

### Imagem não carrega após upload
→ Verifique se o bucket `product-images` tem policy de leitura pública

### Cleanup não remove imagens
→ Verifique se o usuário tem permissão de deleção no Supabase

### Migração falha em algumas imagens
→ Execute o script novamente (ele pula URLs já migradas)

## 📝 Manutenção

### Limpeza Regular

Execute cleanup mensalmente para remover imagens órfãs:
1. Acesse `/backend-status`
2. Role até a seção "Gerenciamento de Imagens"
3. Clique em "Analisar (Dry Run)"
4. Revise a lista de imagens
5. Clique em "Executar Limpeza"

### Monitoramento

Acompanhe o gráfico de evolução para:
- Identificar crescimento anormal
- Detectar problemas de cleanup
- Planejar upgrades de armazenamento

## 🔗 Links Úteis

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Sharp Image Processing](https://sharp.pixelplumbing.com/)
- [MongoDB GridFS Alternative](https://www.mongodb.com/docs/manual/core/gridfs/)
