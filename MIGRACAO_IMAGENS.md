# 🔄 Migração de Imagens para Supabase Storage

## 📋 Visão Geral

Script automático para migrar todas as imagens base64 armazenadas no MongoDB para o Supabase Storage, melhorando drasticamente a performance do sistema.

## ⚙️ Pré-requisitos

### 1. Configurar Credenciais do Supabase

Antes de executar a migração, você precisa configurar as credenciais de acesso ao Supabase:

**Configure no Render:**
1. Acesse seu serviço no [Render Dashboard](https://dashboard.render.com)
2. Vá em **Environment**
3. Adicione as variáveis:
   - **Key:** `SUPABASE_URL`
   - **Value:** URL do seu projeto Supabase
   - **Key:** `SUPABASE_SERVICE_ROLE_KEY`
   - **Value:** Service Role Key do Supabase

**Para desenvolvimento local:**
```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

## 🚀 Como Executar

### Localmente (Desenvolvimento)

```bash
cd server
npm run migrate-images
```

### No Render (Produção)

Você pode executar via SSH ou criar um endpoint temporário:

**Opção 1: Via Shell do Render**
```bash
cd server
npm run migrate-images
```

**Opção 2: Executar localmente conectando ao banco de produção**
```bash
# Configure a MONGODB_URI do ambiente de produção no seu .env local
MONGODB_URI="sua-url-mongodb-producao" npm run migrate-images
```

## 📊 O que o Script Faz

1. **Conecta ao MongoDB** usando a `MONGODB_URI` configurada
2. **Busca todos os documentos** das collections:
   - `estoque`
   - `vitrineVirtual`
3. **Identifica imagens base64** em todas as variantes
4. **Faz upload** para o Vercel Blob Storage
5. **Substitui** o base64 pela URL da imagem
6. **Salva** as alterações no MongoDB
7. **Exibe estatísticas** detalhadas da migração

## 📈 Resultado Esperado

```
🚀 Iniciando migração de imagens para Vercel Blob Storage...

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

## 🎯 Benefícios

### Antes da Migração
- ❌ Documentos pesados (5-10 MB cada)
- ❌ Timeouts frequentes nas consultas
- ❌ Lentidão no carregamento de listas
- ❌ Alto uso de memória

### Depois da Migração
- ✅ Documentos leves (apenas URLs)
- ✅ Consultas rápidas (< 100ms)
- ✅ Carregamento instantâneo
- ✅ Imagens servidas via CDN global

## ⚠️ Importante

### Segurança
- O script **NÃO deleta** as imagens originais se houver falha
- Em caso de erro, a imagem base64 é mantida
- Todas as operações são registradas no console

### Performance
- O script processa uma imagem por vez
- Pode levar alguns minutos dependendo da quantidade
- É seguro interromper e executar novamente (pula URLs já migradas)

### Backup
**Recomendado**: Faça backup do MongoDB antes de executar:
```bash
# Via MongoDB Atlas: Dashboard → Backup
# Via mongodump:
mongodump --uri="sua-mongodb-uri" --out=backup-antes-migracao
```

## 🔍 Verificação

Após a migração, você pode verificar se funcionou:

1. **No MongoDB**: As URLs devem começar com `https://`
2. **No navegador**: Teste acessar uma URL diretamente
3. **No sistema**: Liste produtos e veja se as imagens carregam

## 🐛 Solução de Problemas

### Erro: "BLOB_READ_WRITE_TOKEN not configured"
→ Configure a variável de ambiente conforme descrito em **Pré-requisitos**

### Erro: "Failed to upload image"
→ Verifique se o token tem permissões de escrita
→ Verifique a conexão com a internet

### Script trava ou demora muito
→ É normal para muitas imagens (1-2 segundos por imagem)
→ Deixe executar até o final

### Algumas imagens não migraram
→ Verifique os erros no final do relatório
→ Execute o script novamente (ele pula as já migradas)

## 📝 Notas Técnicas

- **Collections afetadas**: `estoque`, `vitrineVirtual`
- **Campos processados**: `variantes[].imagens[]`
- **Detecção**: Identifica base64 por prefixo `data:image/` ou padrão regex
- **Idempotente**: Pode ser executado várias vezes com segurança
- **Rollback**: Não há rollback automático (faça backup antes)

## 🔗 Links Úteis

- [Vercel Blob Docs](https://vercel.com/docs/storage/vercel-blob)
- [Render Environment Variables](https://render.com/docs/environment-variables)
- [MongoDB Backup](https://www.mongodb.com/docs/manual/core/backups/)
