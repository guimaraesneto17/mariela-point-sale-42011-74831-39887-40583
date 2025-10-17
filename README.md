# 🌸 Mariela Moda - Sistema PDV

Sistema completo de Ponto de Venda para loja de moda feminina, desenvolvido com React, TypeScript, Node.js e MongoDB.

## 📋 Sobre o Projeto

Sistema PDV moderno e elegante para gerenciamento completo de:
- 📦 Produtos e Catálogo
- 🛍️ Vendas e Faturamento
- 👥 Clientes
- 📊 Controle de Estoque
- 🚚 Fornecedores

## Project info

**URL**: https://lovable.dev/projects/00c40b36-8498-4798-89b3-075bf139d4e3

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/00c40b36-8498-4798-89b3-075bf139d4e3) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## 🚀 Começando

### Frontend

```sh
# Instalar dependências
npm install

# Iniciar o servidor de desenvolvimento
npm run dev
```

O frontend estará disponível em `http://localhost:8080`

### Backend

Consulte o arquivo [README_BACKEND.md](./README_BACKEND.md) para instruções detalhadas de configuração do backend.

**Resumo rápido:**

```sh
# 1. Configure o MongoDB Atlas e copie a string de conexão
# 2. Crie o arquivo .env na raiz do projeto
cp .env.example .env

# 3. Adicione sua string de conexão no .env
# MONGODB_URI=mongodb+srv://usuario:senha@marieladb.lcikjrk.mongodb.net/marielaDB

# 4. Instale as dependências do backend
cd server
npm install

# 5. Inicie o servidor backend
npm run dev
```

O backend estará disponível em `http://localhost:3001`

## 🛠️ Tecnologias

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn-ui
- React Router
- React Query

### Backend
- Node.js
- Express
- MongoDB Atlas
- Mongoose
- TypeScript

## 📁 Estrutura do Projeto

```
mariela-pdv/
├── src/                      # Frontend React
│   ├── components/          # Componentes React
│   │   ├── ui/             # Componentes shadcn-ui
│   │   ├── Layout.tsx      # Layout principal
│   │   └── StatsCard.tsx   # Card de estatísticas
│   ├── pages/              # Páginas da aplicação
│   │   ├── Dashboard.tsx   # Dashboard principal
│   │   ├── Produtos.tsx    # Gestão de produtos
│   │   ├── Vendas.tsx      # Registro de vendas
│   │   ├── Clientes.tsx    # Gestão de clientes
│   │   ├── Estoque.tsx     # Controle de estoque
│   │   └── Fornecedores.tsx # Gestão de fornecedores
│   └── ...
├── server/                  # Backend Node.js
│   ├── config/             # Configurações
│   ├── models/             # Modelos MongoDB
│   ├── routes/             # Rotas da API
│   └── index.ts            # Servidor principal
├── .env.example            # Template de variáveis de ambiente
└── README_BACKEND.md       # Documentação do backend
```

## 🎨 Funcionalidades

### Dashboard
- Métricas de vendas em tempo real
- Produtos mais vendidos
- Alertas de estoque baixo
- Resumo financeiro

### Gestão de Produtos
- Cadastro completo de produtos
- Categorização e filtros
- Controle de preços
- Gestão de imagens

### Controle de Vendas
- Registro de vendas
- Múltiplas formas de pagamento
- Histórico completo
- Vínculo com clientes

### Gestão de Clientes
- Cadastro de clientes
- Histórico de compras
- Dados de contato
- Observações personalizadas

### Controle de Estoque
- Entrada e saída de produtos
- Alertas de estoque mínimo
- Histórico de movimentações
- Produtos em promoção

### Gestão de Fornecedores
- Cadastro de fornecedores
- Dados de contato completos
- Produtos fornecidos
- Controle de pedidos

## 🔐 Configuração do MongoDB

1. Crie uma conta no [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crie um novo cluster (gratuito disponível)
3. Configure o acesso à rede (Network Access)
4. Crie um usuário do banco de dados (Database Access)
5. Obtenha a string de conexão
6. Configure no arquivo `.env`

**Formato da string de conexão:**
```
MONGODB_URI=mongodb+srv://usuario:senha@marieladb.lcikjrk.mongodb.net/marielaDB?retryWrites=true&w=majority
```

## 📡 API Endpoints

Documentação completa em [README_BACKEND.md](./README_BACKEND.md)

Base URL: `http://localhost:3001/api`

- `/produtos` - CRUD de produtos
- `/clientes` - CRUD de clientes
- `/vendas` - CRUD de vendas
- `/estoque` - Gestão de estoque
- `/fornecedores` - CRUD de fornecedores

## What technologies are used for this project?

This project is built with:

### Frontend
- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- React Router
- React Query

### Backend
- Node.js
- Express
- MongoDB
- Mongoose
- TypeScript

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/00c40b36-8498-4798-89b3-075bf139d4e3) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
