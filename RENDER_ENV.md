# 🔐 Variáveis de Ambiente para Render.com

Este documento lista **todas as variáveis de ambiente** que devem ser configuradas no painel do Render.com para deploy seguro do backend.

## 📋 Como Configurar no Render.com

1. Acesse seu serviço no dashboard do Render.com
2. Vá em **Environment** → **Environment Variables**
3. Adicione cada variável abaixo clicando em **Add Environment Variable**

---

## 🚨 Variáveis Críticas (OBRIGATÓRIAS)

### MongoDB Database
```
MONGODB_URI
```
**Valor:** Sua connection string do MongoDB Atlas
**Formato:** `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`
**Onde obter:** MongoDB Atlas → Database → Connect → Connect your application

⚠️ **IMPORTANTE:** 
- Gere uma nova senha no MongoDB Atlas (não use a antiga que vazou)
- Configure IP Allowlist para "0.0.0.0/0" (Allow from anywhere) no MongoDB Atlas

---

### JWT Secrets (Autenticação)
```
JWT_SECRET
```
**Valor:** String aleatória criptograficamente forte (mínimo 32 caracteres)
**Como gerar:** 
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
**Exemplo:** `a7f8d9e2b4c6a1f3e5d8c2b9a4f7e1d3c8b5a2f9e6d3c1b8a5f2e9d6c3b1a8`

```
REFRESH_TOKEN_SECRET
```
**Valor:** String aleatória criptograficamente forte (mínimo 32 caracteres) **DIFERENTE** da JWT_SECRET
**Como gerar:** (mesmo comando acima)

⚠️ **IMPORTANTE:** Nunca use os valores de fallback que estavam no código!

---

### Supabase (Storage de Imagens)
```
SUPABASE_URL
```
**Valor:** `https://wlibyugthnikmrurmwub.supabase.co`
**Onde obter:** Já está configurado no Lovable Cloud

```
SUPABASE_PUBLISHABLE_KEY
```
**Valor:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsaWJ5dWd0aG5pa21ydXJtd3ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5ODA4NDMsImV4cCI6MjA3NzU1Njg0M30.Sm7K1tx73GkxokERY6bdvx5R6aNB2UEwfZbgh38NX5Q`
**Onde obter:** Já está configurado no Lovable Cloud

```
SUPABASE_SERVICE_ROLE_KEY
```
**Valor:** Obtém da interface do Lovable Cloud
**Onde obter:** 
1. Abra seu projeto no Lovable
2. Clique no botão **Cloud** (canto superior direito)
3. Vá em **Settings** → **API**
4. Copie o valor de **Service Role Key** (eyJ...)

⚠️ **CRÍTICO:** Esta chave dá acesso administrativo completo ao storage. NUNCA exponha no frontend!

---

## 📦 Variáveis de Configuração

```
NODE_ENV
```
**Valor:** `production`
**Descrição:** Define o ambiente de execução

```
PORT
```
**Valor:** `3001`
**Descrição:** Porta do servidor (Render usa a variável PORT automaticamente)

```
NPM_CONFIG_PRODUCTION
```
**Valor:** `false`
**Descrição:** Permite instalação de devDependencies necessárias para build

---

## ✅ Checklist de Configuração

Antes de fazer deploy, verifique:

- [ ] MongoDB password foi **rotacionado** no Atlas
- [ ] `MONGODB_URI` configurado no Render com nova senha
- [ ] `JWT_SECRET` gerado com valor aleatório forte
- [ ] `REFRESH_TOKEN_SECRET` gerado com valor aleatório forte (diferente do JWT_SECRET)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` obtido do Lovable Cloud e configurado
- [ ] `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` configurados
- [ ] `NODE_ENV` = `production`
- [ ] MongoDB Atlas configurado para aceitar conexões de qualquer IP (0.0.0.0/0)
- [ ] Arquivo `.env` **NÃO** contém credenciais sensíveis

---

## 🔍 Como Verificar se Está Tudo Configurado

Após configurar, acesse:
```
https://seu-app.onrender.com/api/health
```

Deve retornar:
```json
{
  "status": "ok",
  "mongodb": "connected",
  "supabase": "connected"
}
```

Se aparecer erro:
- **MongoDB error:** Verifique MONGODB_URI e IP allowlist no Atlas
- **Supabase error:** Verifique SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
- **Authentication error:** Verifique JWT_SECRET e REFRESH_TOKEN_SECRET

---

## 📚 Documentação Adicional

- [MongoDB Atlas - IP Allowlist](https://docs.atlas.mongodb.com/security/ip-access-list/)
- [Render - Environment Variables](https://render.com/docs/environment-variables)
- [Lovable Cloud - API Keys](https://docs.lovable.dev/features/cloud)
