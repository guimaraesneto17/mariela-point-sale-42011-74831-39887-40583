# 🚀 Deploy Automático na Vercel (CI/CD)

## 📋 Pré-requisitos

1. Conta na [Vercel](https://vercel.com)
2. Repositório Git (GitHub, GitLab ou Bitbucket)
3. Projeto já configurado localmente

## 🔧 Configuração Inicial

### 1. Conectar Repositório à Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login
2. Clique em **"Add New Project"**
3. Selecione seu provedor Git (GitHub, GitLab ou Bitbucket)
4. Autorize a Vercel a acessar seus repositórios
5. Selecione o repositório do projeto **mariela-point-sale**

### 2. Configurar Build Settings

Na tela de configuração do projeto:

#### Framework Preset
- **Framework:** Vite
- **Build Command:** `npm run build` (ou deixe o padrão)
- **Output Directory:** `dist`
- **Install Command:** `npm install`

#### Root Directory
- Deixe como `.` (raiz do projeto)

### 3. Variáveis de Ambiente

Adicione as seguintes variáveis de ambiente na Vercel:

```bash
VITE_API_URL=https://mariela-pdv-backend.onrender.com
```

**Como adicionar:**
1. No painel do projeto na Vercel
2. Vá em **Settings** → **Environment Variables**
3. Adicione cada variável com seu valor
4. Selecione os ambientes: **Production**, **Preview**, **Development**

### 4. Deploy Automático (CI/CD)

Após a configuração inicial, o deploy automático funcionará assim:

#### 🌟 Deploy para Production
```bash
git push origin main
```
- Toda vez que você fizer push para a branch `main`, a Vercel fará deploy automático em produção
- URL de produção: `https://mariela-point-sale.vercel.app`

#### 🔍 Deploy de Preview
```bash
git push origin feature-branch
```
- Pushes para outras branches criam deploys de preview
- Útil para testar mudanças antes de ir para produção
- URL temporária única para cada branch

#### 📝 Deploy via Pull Request
- Quando você criar um Pull Request, a Vercel gera um preview automaticamente
- O link do preview aparece nos comentários do PR

## 🔄 Workflow Recomendado

### Para Desenvolvimento
```bash
# 1. Criar uma branch para a feature
git checkout -b feature/nova-funcionalidade

# 2. Fazer alterações e commits
git add .
git commit -m "feat: adiciona nova funcionalidade"

# 3. Push para criar preview
git push origin feature/nova-funcionalidade
```

### Para Production
```bash
# 1. Fazer merge da feature na main (via PR ou localmente)
git checkout main
git merge feature/nova-funcionalidade

# 2. Push para produção (deploy automático)
git push origin main
```

## ⚙️ Configurações Avançadas

### Ignorar Builds (quando necessário)

Se quiser que certas mudanças **NÃO** disparem deploy:

1. Vá em **Settings** → **Git**
2. Em **Ignored Build Step**, adicione:
```bash
git diff HEAD^ HEAD --quiet . ':(exclude)*.md' ':(exclude)docs/'
```

Isso ignora mudanças apenas em arquivos `.md` e pasta `docs/`.

### Configurar Domínio Customizado

1. Vá em **Settings** → **Domains**
2. Adicione seu domínio personalizado
3. Configure os registros DNS conforme instruções da Vercel

### Build Performance

Para builds mais rápidos, habilite:
- **Vercel Speed Insights**: Monitora performance
- **Vercel Analytics**: Rastreia uso

## 🐛 Troubleshooting

### Deploy não está rodando automaticamente?

1. Verifique **Settings** → **Git** → **Production Branch**
   - Deve estar como `main` ou sua branch principal

2. Verifique se o GitHub App está instalado:
   - Vá em GitHub → Settings → Applications
   - Confirme que **Vercel** tem acesso ao repositório

### Build falha na Vercel mas funciona localmente?

1. Compare as versões do Node.js:
   - Local: `node --version`
   - Vercel: Vá em Settings → General → Node.js Version

2. Limpe o cache do build:
   - No painel da Vercel → Deployments
   - Clique nos três pontos do último deploy
   - **Redeploy** → **Use existing Build Cache**: OFF

### Rotas retornam 404?

Certifique-se de que o arquivo `vercel.json` está na raiz:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

## 📊 Monitoramento

### Ver Logs do Build
1. Acesse o deploy na Vercel
2. Clique em **View Function Logs**
3. Veja os logs em tempo real

### Analytics
- Vá em **Analytics** no painel do projeto
- Visualize métricas de tráfego, performance e erros

## 🎯 Checklist Final

- [ ] Repositório conectado à Vercel
- [ ] Branch principal configurada (`main`)
- [ ] Variáveis de ambiente adicionadas
- [ ] `vercel.json` na raiz do projeto
- [ ] Build funcionando localmente
- [ ] Primeiro deploy manual bem-sucedido
- [ ] Deploy automático testado com um push

---

## 📚 Recursos Adicionais

- [Documentação Oficial Vercel](https://vercel.com/docs)
- [Vercel CLI](https://vercel.com/docs/cli)
- [Deploy Hooks](https://vercel.com/docs/concepts/git/deploy-hooks)

---

**✅ Configuração concluída!** Agora todo push para `main` fará deploy automático! 🎉
