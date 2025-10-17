# 🚀 Guia de Instalação Rápida - Mariela PDV

## Pré-requisitos

✅ Node.js 18+ instalado
✅ NPM ou Yarn
✅ Conta MongoDB Atlas (gratuita)

## Passo 1: Clonar o Repositório

```bash
git clone https://github.com/marielamodaf-create/Mariela-PDV.git
cd Mariela-PDV
```

## Passo 2: Configurar MongoDB Atlas

### 2.1 Criar Cluster no MongoDB Atlas

1. Acesse [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Crie uma conta gratuita ou faça login
3. Clique em "Create" → "Shared" (gratuito)
4. Escolha uma região próxima
5. Clique em "Create Cluster"

### 2.2 Configurar Acesso

**Database Access:**
1. Vá em "Database Access" no menu lateral
2. Clique em "Add New Database User"
3. Escolha "Password" como método de autenticação
4. Defina um username e senha (anote esses dados!)
5. Em "Database User Privileges", selecione "Read and write to any database"
6. Clique em "Add User"

**Network Access:**
1. Vá em "Network Access" no menu lateral
2. Clique em "Add IP Address"
3. Clique em "Allow Access from Anywhere" (para desenvolvimento)
4. Ou adicione apenas seu IP específico (mais seguro)
5. Clique em "Confirm"

### 2.3 Obter String de Conexão

1. Volte para "Database" no menu lateral
2. Clique em "Connect" no seu cluster
3. Escolha "Connect your application"
4. Copie a string de conexão
5. Substitua `<password>` pela senha do usuário criado
6. Substitua `<database>` por `mariela-pdv`

**Exemplo:**
```
mongodb+srv://usuario:senhaSegura123@marieladb.lcikjrk.mongodb.net/marielaDB?retryWrites=true&w=majority
```

## Passo 3: Configurar Variáveis de Ambiente

### 3.1 Criar arquivo .env na raiz do projeto

```bash
# Na raiz do projeto (não dentro da pasta server)
cp .env.example .env
```

### 3.2 Editar o arquivo .env

Abra o arquivo `.env` e adicione sua string de conexão:

```env
MONGODB_URI=mongodb+srv://seu-usuario:sua-senha@marieladb.lcikjrk.mongodb.net/marielaDB?retryWrites=true&w=majority
PORT=3001
NODE_ENV=development
```

**⚠️ IMPORTANTE:** Substitua:
- `seu-usuario` → username criado no MongoDB Atlas
- `sua-senha` → senha criada no MongoDB Atlas
- `cluster` → nome do seu cluster

## Passo 4: Instalar Dependências

### 4.1 Frontend

```bash
# Na raiz do projeto
npm install
```

### 4.2 Backend

```bash
# Entrar na pasta do servidor
cd server

# Instalar dependências
npm install

# Voltar para a raiz
cd ..
```

## Passo 5: Iniciar a Aplicação

### 5.1 Opção 1: Rodar Frontend e Backend Separadamente

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

Aguarde a mensagem: `✅ Conectado ao MongoDB Atlas com sucesso!`

**Terminal 2 - Frontend:**
```bash
# Na raiz do projeto
npm run dev
```

### 5.2 Opção 2: Rodar Apenas o Frontend (para testar a interface)

```bash
# Na raiz do projeto
npm run dev
```

## ✅ Verificar Instalação

### Frontend
Acesse: `http://localhost:8080`

Você deve ver o Dashboard do sistema com:
- Menu lateral com navegação
- Cards de estatísticas
- Gráficos e relatórios

### Backend
Acesse: `http://localhost:3001/health`

Resposta esperada:
```json
{
  "status": "ok",
  "timestamp": "2025-10-13T..."
}
```

### Testar API
```bash
# Listar produtos
curl http://localhost:3001/api/produtos

# Listar clientes
curl http://localhost:3001/api/clientes
```

## 🎯 Próximos Passos

1. **Adicionar Dados de Exemplo:**
   - Use as rotas POST da API para adicionar produtos, clientes, etc.
   - Ou importe dados do MongoDB Compass

2. **Explorar o Sistema:**
   - Dashboard: Visão geral das vendas
   - Produtos: Gerenciar catálogo
   - Vendas: Registrar vendas
   - Clientes: Cadastro de clientes
   - Estoque: Controlar inventário
   - Fornecedores: Gerenciar parceiros

3. **Personalizar:**
   - Ajustar cores no `src/index.css`
   - Modificar componentes conforme necessário
   - Adicionar novas funcionalidades

## 🐛 Problemas Comuns

### Erro: "MONGODB_URI não configurada"
**Solução:** Certifique-se de que o arquivo `.env` está na raiz do projeto (não em /server) e contém a string MONGODB_URI

### Erro: "MongoServerError: bad auth"
**Solução:** Verifique se a senha na string de conexão está correta. Caracteres especiais precisam ser encodados (use %40 para @, %23 para #, etc)

### Erro: "Could not connect to any servers"
**Solução:** 
- Verifique o Network Access no MongoDB Atlas
- Confirme que seu IP está autorizado
- Tente usar "Allow Access from Anywhere" temporariamente

### Frontend não conecta ao Backend
**Solução:**
- Certifique-se de que o backend está rodando em `http://localhost:3001`
- Verifique se não há firewall bloqueando a porta 3001
- Confirme que o CORS está habilitado no backend

### Porta já em uso
**Solução:**
- Altere a porta no `.env`: `PORT=3002`
- Ou finalize o processo que está usando a porta

## 📚 Documentação Adicional

- [README_BACKEND.md](./README_BACKEND.md) - Documentação completa do backend
- [README.md](./README.md) - Informações gerais do projeto

## 💡 Dicas

1. **Desenvolvimento:**
   - Use `npm run dev` no backend para hot reload
   - Use `npm run dev` no frontend para hot reload
   - Mantenha os dois terminais abertos durante o desenvolvimento

2. **Produção:**
   - Configure variáveis de ambiente no servidor de produção
   - Use PM2 ou similar para gerenciar o processo Node.js
   - Configure HTTPS
   - Ajuste o CORS para aceitar apenas domínios específicos

3. **Backup:**
   - Faça backup regular do banco de dados MongoDB
   - Use o MongoDB Atlas Backup (disponível no plano gratuito)

## 🆘 Precisa de Ajuda?

1. Consulte a [documentação do MongoDB Atlas](https://docs.atlas.mongodb.com/)
2. Revise os logs do console para mensagens de erro
3. Verifique se todas as dependências foram instaladas corretamente

---

**Pronto! 🎉** Seu sistema PDV está configurado e pronto para uso!
