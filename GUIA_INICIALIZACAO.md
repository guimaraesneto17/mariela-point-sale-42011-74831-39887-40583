# 🚀 Guia de Inicialização - Mariela PDV

## Arquitetura do Projeto

- **Frontend**: Local (http://localhost:5173)
- **Backend**: Render.com (APIs online)
- **Banco de Dados**: MongoDB Atlas (Cloud)

---

## 📋 Pré-requisitos

Antes de iniciar o projeto, certifique-se de ter instalado:

- **Node.js** (versão 18 ou superior)
- **npm** (vem com Node.js)

### Verificar instalação:
```bash
node --version
npm --version
```

---

## ⚙️ Configuração Inicial (Apenas na Primeira Vez)

### 1. Configure a URL do Backend no Render

Após fazer o deploy do backend no Render.com, você receberá uma URL como:
```
https://mariela-backend.onrender.com
```

Edite o arquivo `.env` na raiz do projeto e configure:

```env
# API URL - Backend no Render
VITE_API_URL=https://mariela-backend.onrender.com/api
```

**⚠️ IMPORTANTE:** Substitua `mariela-backend` pela URL real do seu serviço no Render!

### 2. Verifique a conexão do MongoDB Atlas

O arquivo `.env` já está configurado com o MongoDB Atlas. Certifique-se de que:
- Seu IP está liberado no MongoDB Atlas (ou use 0.0.0.0/0 para todos)
- As credenciais estão corretas

---

## 🎯 Como Iniciar o Projeto

### Windows

1. Navegue até a pasta do projeto
2. **Clique duas vezes** no arquivo `start.bat`
3. Uma janela do terminal será aberta automaticamente
4. Aguarde o projeto iniciar
5. Acesse: http://localhost:5173

**Ou pelo terminal:**
```cmd
start.bat
```

### Linux / Mac

1. Abra o terminal na pasta do projeto
2. Dê permissão de execução (apenas na primeira vez):
```bash
chmod +x start.sh
```

3. Execute o script:
```bash
./start.sh
```

4. Acesse: http://localhost:5173

---

## 🔄 O que o Script Faz?

1. **Verifica dependências**: Se não existirem, instala automaticamente
2. **Inicia o frontend**: Sobe o servidor local na porta 5173
3. **Conecta ao backend**: Usa a URL configurada no `.env` (Render)
4. **Conecta ao banco**: MongoDB Atlas (já configurado)

---

## 🛑 Como Parar o Projeto

Pressione `CTRL + C` no terminal onde o projeto está rodando.

---

## ❓ Problemas Comuns

### 1. Erro "EADDRINUSE" (Porta em uso)

**Solução**: Outra aplicação está usando a porta 5173.
- Feche a aplicação ou terminal anterior
- Ou mude a porta no `vite.config.ts`

### 2. Erro "Failed to fetch" ao acessar API

**Possíveis causas:**
- Backend no Render não está online
- URL no `.env` está incorreta
- Backend está em sleep (Render free tier)

**Solução:**
1. Verifique se a URL do Render está correta no `.env`
2. Acesse a URL do backend no navegador para "acordar" o serviço
3. Aguarde 30-60 segundos e tente novamente

### 3. Erro ao instalar dependências

**Solução**:
```bash
# Limpe o cache e reinstale
npm cache clean --force
rm -rf node_modules
npm install
```

### 4. Backend no Render está em sleep

O plano gratuito do Render coloca o serviço em sleep após 15 minutos de inatividade.

**Solução**: 
- Acesse a URL do backend no navegador para ativá-lo
- Aguarde 30-60 segundos para o serviço iniciar
- A primeira requisição pode demorar um pouco

---

## 📚 Comandos Úteis

### Instalação manual de dependências
```bash
npm install
```

### Iniciar projeto manualmente
```bash
npm run dev
```

### Build para produção
```bash
npm run build
```

### Preview do build
```bash
npm run preview
```

---

## 🌐 URLs de Acesso

- **Frontend Local**: http://localhost:5173
- **Backend (Render)**: Configurado no `.env`
- **MongoDB Atlas**: Conexão automática via string de conexão
- **Swagger API Docs**: https://[seu-backend].onrender.com/api-docs

---

## 📞 Suporte

Se tiver problemas:

1. Verifique se todas as URLs no `.env` estão corretas
2. Verifique se o backend no Render está online
3. Consulte o arquivo `COMO_RESOLVER_ERRO_API.md`
4. Consulte o arquivo `DEPLOY_RENDER.md` para configurar o backend

---

## 🎉 Pronto!

Agora você pode usar o Mariela PDV localmente com backend na nuvem!

**Dica**: Mantenha o terminal aberto enquanto usa o sistema. Fechar o terminal para o servidor.
