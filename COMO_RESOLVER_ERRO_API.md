# ⚠️ Como Resolver "Erro ao atualizar novidade"

## 🔍 Problema

Ao tentar marcar ou remover um produto como novidade, aparece o erro:
```
Erro ao atualizar novidade
Verifique se o servidor está rodando
```

## ✅ Solução Rápida

O erro acontece porque **o servidor backend não está rodando**. 

### Siga estes passos:

#### 1. Abra um novo terminal (não feche o terminal do frontend!)

#### 2. Entre na pasta do servidor:
```bash
cd server
```

#### 3. Inicie o servidor backend:
```bash
npm run dev
```

#### 4. Aguarde ver estas mensagens:
```
✅ Servidor rodando na porta 3001
✅ Documentação Swagger disponível em http://localhost:3001/api-docs
🗄️ Conectado ao MongoDB Atlas com sucesso!
```

#### 5. Volte para o navegador e teste novamente

Agora deve funcionar! ✅

---

## 📋 Resumo dos Terminais

Você precisa manter **2 terminais abertos** durante o desenvolvimento:

### Terminal 1 - Backend (API)
```bash
cd server
npm run dev
```
Porta: `3001`

### Terminal 2 - Frontend (Interface)
```bash
npm run dev
```
Porta: `5173`

---

## 🔧 Testando se o Backend está Rodando

Abra no navegador: http://localhost:3001/api-docs

Se você ver a documentação Swagger, o backend está funcionando! ✅

---

## ❌ Outros Erros Comuns

### "Port 3001 is already in use"

Já existe outro processo na porta 3001.

**Solução Windows:**
```bash
netstat -ano | findstr :3001
taskkill /PID <número> /F
```

**Solução Mac/Linux:**
```bash
lsof -ti:3001 | xargs kill -9
```

### "MongoServerError: bad auth"

Problema na conexão com MongoDB.

**Solução:**
1. Verifique o arquivo `server/.env`
2. Confirme se a senha está correta
3. Verifique no MongoDB Atlas se seu IP está na whitelist

---

## 📚 Mais Informações

Para guia completo de instalação, veja: [GUIA_INSTALACAO.md](./GUIA_INSTALACAO.md)
