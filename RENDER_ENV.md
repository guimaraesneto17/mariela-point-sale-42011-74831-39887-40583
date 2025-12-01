# 🔐 Configuração de Variáveis de Ambiente no Render.com

## ⚠️ IMPORTANTE - Segurança

**NUNCA** commite credenciais ou secrets no código! Este arquivo documenta quais variáveis devem ser configuradas no Render.com.

---

## 📋 Variáveis Obrigatórias

Configure todas estas variáveis no **Render Dashboard** → Seu Serviço → **Environment**:

### 1. MongoDB Database
```
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/database
```
- **Obtenha em:** [MongoDB Atlas](https://cloud.mongodb.com)
- **Como obter:**
  1. Acesse seu cluster no MongoDB Atlas
  2. Clique em "Connect" → "Connect your application"
  3. Copie a string de conexão
  4. Substitua `<password>` pela sua senha real
  
⚠️ **AÇÃO IMEDIATA**: Se você já commitou a MONGODB_URI com credenciais:
1. Acesse MongoDB Atlas
2. Mude a senha do usuário do banco
3. Atualize a MONGODB_URI no Render com a nova senha
4. **Nunca** commite a nova senha no código

---

### 2. JWT Authentication Secrets

#### JWT_SECRET
```
JWT_SECRET=gere-um-valor-aleatorio-forte-de-32-caracteres
```

#### REFRESH_TOKEN_SECRET
```
REFRESH_TOKEN_SECRET=gere-outro-valor-aleatorio-forte-de-32-caracteres
```

**Como gerar valores seguros:**

```bash
# No terminal Linux/Mac/WSL:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Ou use um gerador online confiável:
# https://www.grc.com/passwords.htm
```

⚠️ **CRÍTICO:**
- Use valores **diferentes** para JWT_SECRET e REFRESH_TOKEN_SECRET
- **NUNCA** use os valores de fallback que estavam no código
- Mínimo de 32 caracteres aleatórios
- Se não configurados, o servidor **NÃO INICIARÁ** (fail-fast implementado)

---

### 3. Vercel Blob Storage (Obrigatório)

```
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

- **Obtenha em:** [Vercel Dashboard](https://vercel.com/dashboard) → Storage → Blob
- **Como obter:**
  1. Acesse Vercel Dashboard
  2. Vá em Storage → Blob
  3. Crie um novo blob store ou use existente
  4. Copie o token `Read-Write` (não o Read-Only)
  
⚠️ Este token já foi configurado no Render com o valor: `vercel_blob_rw_cWSCTJJITcsR5aiV_t5PXTLCVKrZIoDUpTvg4AMJ2yr6xFH`

---

### 4. Configuração do Servidor

```
NODE_ENV=production
PORT=3001
```

Estas geralmente já estão configuradas automaticamente pelo Render.

---

## 🔍 Verificação das Variáveis

Após configurar no Render, verifique se todas estão presentes:

1. Acesse o Render Dashboard
2. Vá no seu serviço `mariela-pdv-backend`
3. Clique em **Environment**
4. Confirme que TODAS as variáveis listadas acima estão configuradas:
   - ✅ MONGODB_URI
   - ✅ JWT_SECRET
   - ✅ REFRESH_TOKEN_SECRET
   - ✅ BLOB_READ_WRITE_TOKEN
   - ✅ NODE_ENV
   - ✅ PORT (opcional, Render configura automaticamente)

---

## ✅ Checklist de Segurança

- [ ] MongoDB URI atualizada sem credenciais commitadas
- [ ] JWT_SECRET configurado (mínimo 32 caracteres aleatórios)
- [ ] REFRESH_TOKEN_SECRET configurado (diferente do JWT_SECRET)
- [ ] BLOB_READ_WRITE_TOKEN configurado
- [ ] Arquivo `.env` local **NÃO contém** credenciais reais
- [ ] `.env` está no `.gitignore`
- [ ] Todas as senhas foram rotacionadas se foram expostas

---

## 📝 Observações Importantes

1. **Frontend (Lovable)**: As variáveis `VITE_*` são configuradas automaticamente pelo Lovable Cloud
2. **Backend (Render)**: Configure apenas as variáveis listadas acima
3. **Logs**: Verifique os logs do Render após deploy para confirmar que não há erros de variáveis faltantes
4. **Fail-Fast**: O servidor agora falha imediatamente se JWT secrets ou BLOB_READ_WRITE_TOKEN não estiverem configurados

---

## 🆘 Troubleshooting

### Erro: "JWT_SECRET não configurado"
→ Configure JWT_SECRET no Render Environment

### Erro: "BLOB_READ_WRITE_TOKEN não configurado"
→ Configure BLOB_READ_WRITE_TOKEN no Render Environment com o token do Vercel Blob

### Erro: "Falha ao conectar ao MongoDB"
→ Verifique se MONGODB_URI está correta e se o IP do Render está na whitelist do MongoDB Atlas

### Servidor não inicia após deploy
→ Verifique os logs do Render para identificar qual variável está faltando

---

## 🔗 Links Úteis

- [Render Environment Variables](https://render.com/docs/environment-variables)
- [MongoDB Atlas IP Whitelist](https://www.mongodb.com/docs/atlas/security/ip-access-list/)
- [Vercel Blob Documentation](https://vercel.com/docs/storage/vercel-blob)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
