# 🚀 Deploy do Backend no Render.com

## 📋 Pré-requisitos

1. Conta no [Render.com](https://render.com) (grátis)
2. Repositório Git com o código (GitHub, GitLab ou Bitbucket)
3. MongoDB Atlas configurado e acessível

---

## 🔧 Passo a Passo

### 1️⃣ Preparar o Repositório

Certifique-se de que todos os arquivos estão commitados:

```bash
git add .
git commit -m "Preparar backend para deploy no Render"
git push origin main
```

### 2️⃣ Criar Serviço no Render

1. Acesse [dashboard.render.com](https://dashboard.render.com)
2. Clique em **"New +"** → **"Web Service"**
3. Conecte seu repositório Git
4. Selecione o repositório do projeto

### 3️⃣ Configurar o Serviço

**Configurações básicas:**
- **Name:** `mariela-pdv-backend`
- **Region:** Oregon (US West)
- **Branch:** `main`
- **Root Directory:** `server`
- **Runtime:** Node
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`

**Plano:**
- Selecione **Free** (grátis)

### 4️⃣ Configurar Variáveis de Ambiente

Na seção **Environment Variables**, adicione:

```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://marielamodaf:mariela214365@marieladb.lcikjrk.mongodb.net/marielaDB?retryWrites=true&w=majority
```

⚠️ **IMPORTANTE:** Use sua própria connection string do MongoDB Atlas!

### 5️⃣ Deploy

1. Clique em **"Create Web Service"**
2. Aguarde o deploy (pode levar 5-10 minutos)
3. Seu backend estará disponível em: `https://mariela-pdv-backend.onrender.com`

---

## 🔗 Atualizar Frontend

Após o deploy, atualize o arquivo `.env` do frontend:

```env
# Para desenvolvimento local
VITE_API_URL=http://localhost:3001/api

# Para produção (descomente e atualize)
# VITE_API_URL=https://mariela-pdv-backend.onrender.com/api
```

---

## 📡 Testar a API

### Health Check
```bash
curl https://mariela-pdv-backend.onrender.com/health
```

### Swagger Docs
Acesse: `https://mariela-pdv-backend.onrender.com/api-docs`

### Testar Endpoint
```bash
curl https://mariela-pdv-backend.onrender.com/api/produtos
```

---

## ⚙️ Configurações Importantes do MongoDB Atlas

Para que o Render possa acessar seu MongoDB:

1. Acesse [MongoDB Atlas](https://cloud.mongodb.com)
2. Vá em **Network Access**
3. Clique em **"Add IP Address"**
4. Selecione **"Allow Access from Anywhere"** (0.0.0.0/0)
5. Clique em **"Confirm"**

⚠️ **Segurança:** Em produção, considere adicionar apenas o IP do Render.

---

## 🔄 Atualizações Automáticas

O Render faz deploy automático sempre que você fizer push para a branch `main`:

```bash
git add .
git commit -m "Atualização do backend"
git push origin main
```

---

## 📊 Monitoramento

No dashboard do Render você pode:
- Ver logs em tempo real
- Monitorar uso de recursos
- Ver métricas de requisições
- Configurar alertas

---

## ⚡ Limitações do Plano Free

- ⏱️ **Sleep Mode:** Após 15 minutos de inatividade, o serviço entra em modo sleep
- 🐌 **Cold Start:** Primeira requisição após sleep pode levar 30-60 segundos
- 💾 **750 horas/mês:** Suficiente para desenvolvimento e testes

### Como evitar Sleep Mode:
Use um serviço de ping como:
- [Cron Job](https://cron-job.org)
- [UptimeRobot](https://uptimerobot.com)

Configure para fazer requisição a cada 14 minutos:
```
GET https://mariela-pdv-backend.onrender.com/health
```

---

## 🐛 Troubleshooting

### Erro: "Deploy failed"
- Verifique os logs no dashboard do Render
- Confirme que o `build` está funcionando localmente
- Verifique se todas as dependências estão no `package.json`

### Erro: "Cannot connect to MongoDB"
- Verifique a connection string do MongoDB
- Confirme que o IP 0.0.0.0/0 está liberado no MongoDB Atlas
- Teste a conexão localmente com a mesma string

### Erro: "Application failed to respond"
- Verifique se o PORT está configurado corretamente
- Confirme que o servidor está usando `process.env.PORT`
- Verifique os logs para erros de inicialização

---

## 🎯 Próximos Passos

1. ✅ Deploy do backend no Render
2. 🔄 Deploy do frontend no Vercel/Netlify
3. 🔗 Atualizar `VITE_API_URL` no frontend para apontar para o Render
4. 🧪 Testar integração completa
5. 📱 Configurar domínio customizado (opcional)

---

## 📚 Recursos

- [Documentação Render](https://render.com/docs)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com)
- [Render Free Tier](https://render.com/docs/free)

---

## 💡 Dicas

- **Logs:** Use `console.log` e veja em tempo real no dashboard
- **Restart:** Você pode reiniciar manualmente no dashboard se necessário
- **Scale:** Upgrade para plano pago remove sleep mode e aumenta recursos
- **Custom Domain:** Adicione domínio próprio nas configurações

---

## ✅ Checklist de Deploy

- [ ] Código commitado e pushed para o Git
- [ ] Conta criada no Render.com
- [ ] Repositório conectado no Render
- [ ] Variáveis de ambiente configuradas
- [ ] IP liberado no MongoDB Atlas
- [ ] Deploy realizado com sucesso
- [ ] Health check funcionando
- [ ] Swagger acessível
- [ ] Frontend atualizado com nova URL
- [ ] Testes de integração OK

---

**🎉 Pronto! Seu backend está online e pronto para uso!**
