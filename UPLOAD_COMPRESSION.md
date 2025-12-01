# 📸 Sistema de Upload e Compressão de Imagens

## 🎯 Funcionalidades Implementadas

### 1. Compressão Automática de Imagens

O sistema agora comprime automaticamente todas as imagens antes do upload usando a biblioteca **Sharp**, garantindo otimização de storage e melhor performance.

#### Características:
- ✅ **Redimensionamento inteligente**: Máximo de 1920x1920px mantendo aspect ratio
- ✅ **Compressão adaptativa**:
  - PNG com transparência → WebP (85% qualidade)
  - Outros formatos → JPEG progressivo (85% qualidade)
- ✅ **Logging detalhado**: Exibe tamanho original, comprimido e taxa de compressão
- ✅ **Storage otimizado**: Supabase Storage com cache de 1 ano

#### Exemplo de Uso:

```typescript
import { uploadImageToBlob } from './services/imageUploadService';

// Upload com compressão automática
const result = await uploadImageToBlob(base64Image);
console.log('URL:', result.url);
console.log('Tamanho:', result.size);
console.log('Tipo:', result.contentType);
```

#### Configurações de Compressão:

```typescript
// Valores padrão
const compressionOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 85,
};
```

---

### 2. Cleanup Automático de Imagens Órfãs

Sistema inteligente para identificar e remover imagens no Supabase Storage que não estão mais referenciadas no banco de dados MongoDB.

#### Endpoints Disponíveis:

##### 📊 Estatísticas de Storage
```http
GET /api/cleanup/storage-stats
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "success": true,
  "stats": {
    "totalImages": 150,
    "referencedImages": 142,
    "orphanImages": 8,
    "totalSizeBytes": 45678912,
    "totalSizeMB": "43.55"
  }
}
```

##### 🧹 Cleanup de Imagens Órfãs

**Modo Dry-Run** (apenas lista, não deleta):
```http
POST /api/cleanup/orphan-images?dryRun=true
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "success": true,
  "dryRun": true,
  "totalStorageImages": 150,
  "totalReferencedImages": 142,
  "orphanImagesCount": 8,
  "orphanImages": [
    {
      "path": "products/produto-1234567890-abc123.jpeg",
      "url": "https://your-project.supabase.co/storage/v1/object/public/product-images/products/produto-1234567890-abc123.jpeg"
    }
  ]
}
```

**Modo Execução** (deleta imagens órfãs):
```http
POST /api/cleanup/orphan-images
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "success": true,
  "totalStorageImages": 150,
  "totalReferencedImages": 142,
  "orphanImagesCount": 8,
  "deletedImagesCount": 7,
  "failedDeletionsCount": 1,
  "deletedImages": [
    "products/produto-1234567890-abc123.jpeg",
    "products/produto-9876543210-xyz789.jpeg"
  ],
  "failedDeletions": [
    {
      "path": "products/produto-error-file.jpeg",
      "error": "File not found"
    }
  ]
}
```

---

## 🔧 Configuração

### Variáveis de Ambiente (Backend)

No arquivo `server/.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Deploy no Render.com

No arquivo `render.yaml`:
```yaml
envVars:
  - key: SUPABASE_URL
    sync: false
  - key: SUPABASE_SERVICE_ROLE_KEY
    sync: false
```

⚠️ **IMPORTANTE**: Configure estas variáveis no dashboard do Render antes do deploy!

---

## 🗄️ Storage Bucket (Supabase)

### Configuração Automática:
O bucket `product-images` foi criado automaticamente com:

- ✅ **Acesso público** para leitura de imagens
- ✅ **Limite de tamanho**: 5MB por arquivo
- ✅ **Tipos permitidos**: JPEG, JPG, PNG, WebP, GIF
- ✅ **RLS habilitado**: Apenas usuários autenticados podem fazer upload/update/delete

### Estrutura de Pastas:
```
product-images/
└── products/
    ├── produto-1234567890-abc123.jpeg
    ├── produto-1234567891-def456.webp
    └── produto-1234567892-ghi789.jpeg
```

---

## 📋 Permissões Necessárias

Para acessar os endpoints de cleanup, o usuário precisa ter permissões de:

- **Estatísticas**: Permissão de `view` no módulo `produtos`
- **Cleanup**: Permissão de `delete` no módulo `produtos`

---

## 🚀 Como Usar

### 1. Verificar Estatísticas:
```bash
curl -X GET https://seu-backend.onrender.com/api/cleanup/storage-stats \
  -H "Authorization: Bearer SEU_TOKEN"
```

### 2. Simular Cleanup (Dry-Run):
```bash
curl -X POST "https://seu-backend.onrender.com/api/cleanup/orphan-images?dryRun=true" \
  -H "Authorization: Bearer SEU_TOKEN"
```

### 3. Executar Cleanup:
```bash
curl -X POST https://seu-backend.onrender.com/api/cleanup/orphan-images \
  -H "Authorization: Bearer SEU_TOKEN"
```

---

## 🎨 Benefícios

### Compressão Automática:
- 📦 **Economia de storage**: Redução média de 50-70% no tamanho das imagens
- ⚡ **Performance melhorada**: Carregamento mais rápido das imagens
- 💰 **Redução de custos**: Menos uso de storage e banda

### Cleanup de Imagens Órfãs:
- 🧹 **Storage limpo**: Remove imagens não utilizadas
- 📊 **Visibilidade**: Estatísticas claras de uso
- 🔒 **Segurança**: Controle via permissões granulares
- 🎯 **Flexibilidade**: Dry-run antes de executar

---

## 📝 Logs e Monitoramento

O sistema registra automaticamente:

```
✅ Imagem original: { width: 3000, height: 2000, format: png, size: 2456789 }
✅ Imagem comprimida: { originalSize: 2456789, compressedSize: 456789, compressionRatio: 81.41%, format: webp }
✅ Imagem órfã deletada: products/produto-1234567890-abc123.jpeg
```

---

## 🔐 Segurança

- ✅ Todos os endpoints protegidos por autenticação JWT
- ✅ Permissões granulares baseadas em roles
- ✅ RLS habilitado no Supabase Storage
- ✅ Rate limiting para prevenir abuso

---

## 📚 Referências

- [Sharp Documentation](https://sharp.pixelplumbing.com/)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [Supabase RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
