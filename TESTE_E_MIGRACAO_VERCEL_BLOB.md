# 🧪 Teste e Migração - Vercel Blob Storage

## 📋 Teste de Upload de Imagem

### Passo 1: Testar Upload no Frontend

1. **Acesse a página de Produtos**
   - Navegue para `/produtos` no sistema

2. **Crie um novo produto ou edite existente**
   - Clique em "Novo Produto"
   - Preencha os dados básicos
   - Adicione uma cor na seção de variantes

3. **Faça upload de uma imagem**
   - Clique em "Adicionar Imagens" na variante
   - Selecione uma imagem do seu computador
   - Aguarde o processamento

4. **Verifique o resultado**
   - Abra o **Console do navegador** (F12 → Console)
   - Procure por mensagens de sucesso/erro
   - Verifique se a imagem aparece na pré-visualização

### Passo 2: Verificar no MongoDB

Após fazer o upload, verifique no MongoDB se a URL foi salva corretamente:

```javascript
// A imagem deve estar no formato:
{
  "imagens": [
    "https://[hash].public.blob.vercel-storage.com/products/produto-[timestamp]-[hash]-full.jpeg"
  ]
}
```

### Passo 3: Verificar Logs do Backend

Acesse os logs do Render.com:
1. Vá para [Render Dashboard](https://dashboard.render.com)
2. Clique no serviço `mariela-pdv-backend`
3. Vá em **Logs**
4. Procure por:
   - ✅ `Upload concluído: products/...`
   - ✅ `Imagens comprimidas:`
   - ❌ `Erro ao fazer upload`
   - ❌ `BLOB_READ_WRITE_TOKEN não configurado`

---

## 🔄 Migração de Imagens Existentes

### ⚠️ IMPORTANTE - Pré-requisitos

Antes de executar a migração:

1. **Verifique se BLOB_READ_WRITE_TOKEN está configurado**
   - Render Dashboard → mariela-pdv-backend → Environment
   - Confirme que `BLOB_READ_WRITE_TOKEN` está presente

2. **Faça backup do MongoDB**
   - Recomendado antes de qualquer migração em massa
   - MongoDB Atlas → Seu Cluster → Backup

3. **Verifique se há imagens base64 no banco**
   ```javascript
   // No MongoDB Compass ou Atlas:
   db.estoque.find({ "variantes.imagens": { $regex: "^data:image" } }).count()
   db.vitrineVirtual.find({ "variantes.imagens": { $regex: "^data:image" } }).count()
   ```

### Executar Migração no Render

**Opção 1: Via Shell do Render (Recomendado)**

1. Acesse o Render Dashboard
2. Vá no serviço `mariela-pdv-backend`
3. Clique em **Shell** (menu lateral)
4. Execute:
   ```bash
   cd server
   npm run migrate-images
   ```

**Opção 2: Localmente (Conectando ao MongoDB de Produção)**

1. Configure a MONGODB_URI de produção no seu `.env` local:
   ```env
   MONGODB_URI=mongodb+srv://...@cluster.mongodb.net/mariela
   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_cWSCTJJITcsR5aiV_t5PXTLCVKrZIoDUpTvg4AMJ2yr6xFH
   ```

2. Execute localmente:
   ```bash
   cd server
   npm run migrate-images
   ```

### O que esperar durante a migração

```
🚀 Iniciando migração de imagens para Vercel Blob Storage...

⚠️  IMPORTANTE: Certifique-se de que a variável BLOB_READ_WRITE_TOKEN está configurada!

🔌 Conectando ao MongoDB...
✓ Conectado!

📦 Migrando imagens do Estoque...
  ↑ Uploading image for P001 - Vermelho...
  ✓ Saved P001
  ↑ Uploading image for P002 - Azul...
  ✓ Saved P002
✅ Migração do Estoque concluída!

🛍️  Migrando imagens da Vitrine Virtual...
  ↑ Uploading image for P001 - Vermelho...
  ✓ Saved P001
✅ Migração da Vitrine Virtual concluída!

============================================================
📊 RESUMO DA MIGRAÇÃO
============================================================

📦 Estoque:
  • Documentos processados: 50
  • Total de imagens: 150
  • Imagens migradas: 150
  • Falhas: 0

🛍️  Vitrine Virtual:
  • Documentos processados: 50
  • Total de imagens: 150
  • Imagens migradas: 150
  • Falhas: 0

📈 Total Geral:
  • Documentos: 100
  • Imagens: 300
  • Migradas: 300
  • Falhas: 0

============================================================
✅ Migração concluída!
============================================================
```

### Tempo estimado

- **Pequeno (< 100 imagens)**: 2-5 minutos
- **Médio (100-500 imagens)**: 10-20 minutos
- **Grande (> 500 imagens)**: 30-60 minutos

⏱️ Cada imagem leva ~1-2 segundos (watermark + compressão + upload)

---

## ✅ Verificação Pós-Migração

### 1. Verificar no MongoDB

Verifique se as URLs foram atualizadas:

```javascript
// Deve retornar 0 se a migração foi completa
db.estoque.find({ "variantes.imagens": { $regex: "^data:image" } }).count()

// Deve retornar as imagens com URLs do Vercel Blob
db.estoque.findOne({ "variantes.imagens.0": { $exists: true } })
```

### 2. Testar no Sistema

1. Acesse a página de **Produtos**
2. Abra alguns produtos
3. Verifique se as imagens carregam corretamente
4. Teste a **Vitrine Virtual** (`/vitrine-virtual`)

### 3. Verificar Storage Usage

Acesse [Vercel Dashboard → Storage → Blob](https://vercel.com/dashboard) e verifique:
- Número de arquivos uploadados
- Espaço utilizado
- Limite disponível

---

## 🐛 Troubleshooting

### Erro: "BLOB_READ_WRITE_TOKEN não configurado"

**Solução:**
1. Acesse Render Dashboard → mariela-pdv-backend → Environment
2. Adicione:
   ```
   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_cWSCTJJITcsR5aiV_t5PXTLCVKrZIoDUpTvg4AMJ2yr6xFH
   ```
3. Reinicie o serviço

### Erro: "Failed to upload image"

**Possíveis causas:**
1. Token inválido ou expirado
2. Limite de storage atingido no Vercel
3. Imagem corrompida no banco

**Solução:**
- Verifique o token no Vercel Dashboard
- Verifique o uso de storage
- A migração mantém a imagem original em caso de erro

### Migração trava no meio

**Solução:**
- É seguro interromper e executar novamente
- O script pula URLs que já foram migradas
- Verifique conexão com internet e MongoDB

### Algumas imagens não migraram

**Solução:**
- Veja a seção "⚠️ Erros encontrados" no final do relatório
- Execute o script novamente (ele pula as já migradas)
- Verifique se as imagens base64 estão corrompidas

---

## 📊 Monitoramento Pós-Migração

### Verificar Storage

Execute via API:
```bash
GET /api/cleanup/storage-stats
```

Retorna:
```json
{
  "success": true,
  "stats": {
    "totalImages": 450,
    "referencedImages": 450,
    "orphanImages": 0,
    "totalSizeBytes": 45678900,
    "totalSizeMB": "43.56"
  }
}
```

### Limpar Imagens Órfãs (se houver)

Após verificar que tudo funciona:
```bash
# Preview (não deleta)
POST /api/cleanup/orphan-images?dryRun=true

# Deletar realmente
POST /api/cleanup/orphan-images
```

---

## 📝 Checklist Final

Após teste e migração:

- [ ] Novo upload de imagem funciona corretamente
- [ ] Imagens aparecem no frontend (Produtos, Estoque, Vitrine)
- [ ] MongoDB contém URLs do Vercel Blob (não mais base64)
- [ ] Logs do Render não mostram erros de upload
- [ ] Vercel Dashboard mostra as imagens no Blob Storage
- [ ] Storage stats mostram 0 imagens órfãs
- [ ] Vitrine Virtual carrega imagens rapidamente

---

## 🎉 Sucesso!

Se tudo funcionou:
1. ✅ Sistema migrado para Vercel Blob
2. ✅ Performance drasticamente melhorada
3. ✅ CDN global entregando imagens
4. ✅ Compressão automática ativa
5. ✅ Watermark protegendo propriedade intelectual

**Próximos passos:**
- Monitore o uso de storage no Vercel Dashboard
- Configure alertas se necessário
- Execute cleanup periódico de imagens órfãs
