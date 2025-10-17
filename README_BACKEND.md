# Mariela Moda - Backend PDV

Sistema de backend para o PDV da Mariela Moda Feminina, desenvolvido com Node.js, Express e MongoDB.

## 🚀 Tecnologias

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **MongoDB** - Banco de dados NoSQL
- **Mongoose** - ODM para MongoDB
- **TypeScript** - Superset JavaScript com tipagem

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no MongoDB Atlas (ou MongoDB local)
- NPM ou Yarn

## 🔧 Instalação

### 1. Instalar dependências do backend

```bash
cd server
npm install
```

### 2. Configurar MongoDB Atlas

1. Acesse [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crie um cluster (ou use um existente)
3. Em "Database Access", crie um usuário com permissões de leitura/escrita
4. Em "Network Access", adicione seu IP (ou 0.0.0.0/0 para desenvolvimento)
5. Clique em "Connect" → "Connect your application"
6. Copie a string de conexão

### 3. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto (não dentro da pasta server):

```bash
cp .env.example .env
```

Edite o arquivo `.env` e adicione sua string de conexão do MongoDB:

```env
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/mariela-pdv?retryWrites=true&w=majority
PORT=3001
NODE_ENV=development
```

**IMPORTANTE:** Substitua:
- `usuario` pelo seu usuário do MongoDB
- `senha` pela senha do usuário
- `cluster` pelo nome do seu cluster
- `mariela-pdv` pelo nome do banco de dados

## 🎯 Executar o Servidor

### Desenvolvimento (com hot reload)

```bash
cd server
npm run dev
```

### Produção

```bash
cd server
npm run build
npm start
```

O servidor estará rodando em `http://localhost:3001`

## 📚 API Endpoints

### Produtos
- `GET /api/produtos` - Lista todos os produtos
- `GET /api/produtos/:id` - Busca produto por ID
- `POST /api/produtos` - Cria novo produto
- `PUT /api/produtos/:id` - Atualiza produto
- `DELETE /api/produtos/:id` - Remove produto

### Clientes
- `GET /api/clientes` - Lista todos os clientes
- `GET /api/clientes/:id` - Busca cliente por ID
- `POST /api/clientes` - Cria novo cliente
- `PUT /api/clientes/:id` - Atualiza cliente
- `DELETE /api/clientes/:id` - Remove cliente

### Vendas
- `GET /api/vendas` - Lista todas as vendas
- `GET /api/vendas/:id` - Busca venda por ID
- `POST /api/vendas` - Cria nova venda (atualiza estoque automaticamente)
- `DELETE /api/vendas/:id` - Cancela venda (devolve ao estoque)

### Estoque
- `GET /api/estoque` - Lista todo o estoque
- `GET /api/estoque/baixo` - Lista produtos com estoque baixo
- `GET /api/estoque/:codigoProduto` - Busca estoque de um produto
- `POST /api/estoque/entrada` - Registra entrada de produtos
- `PUT /api/estoque/:codigoProduto` - Atualiza configurações do estoque

### Fornecedores
- `GET /api/fornecedores` - Lista todos os fornecedores
- `GET /api/fornecedores/:id` - Busca fornecedor por ID
- `POST /api/fornecedores` - Cria novo fornecedor
- `PUT /api/fornecedores/:id` - Atualiza fornecedor
- `DELETE /api/fornecedores/:id` - Remove fornecedor

## 🗂️ Estrutura do Projeto

```
server/
├── config/
│   └── database.ts          # Configuração do MongoDB
├── models/
│   ├── Cliente.ts           # Schema de Clientes
│   ├── Estoque.ts           # Schema de Estoque
│   ├── Fornecedor.ts        # Schema de Fornecedores
│   ├── Produto.ts           # Schema de Produtos
│   └── Venda.ts             # Schema de Vendas
├── routes/
│   ├── clientes.ts          # Rotas de Clientes
│   ├── estoque.ts           # Rotas de Estoque
│   ├── fornecedores.ts      # Rotas de Fornecedores
│   ├── produtos.ts          # Rotas de Produtos
│   └── vendas.ts            # Rotas de Vendas
└── index.ts                 # Arquivo principal do servidor
```

## 💾 Schemas do MongoDB

### Produtos
```typescript
{
  codigo: String (único),
  nome: String,
  descricao: String,
  categoria: String,
  marca: String,
  cor: String,
  tamanho: String,
  preco: Number,
  imagens: [String],
  dataCadastro: Date
}
```

### Clientes
```typescript
{
  codigoCliente: String (único),
  nome: String,
  telefone: String,
  dataNascimento: String,
  observacao: String,
  dataCadastro: Date
}
```

### Vendas
```typescript
{
  codigoVenda: String (único),
  data: Date,
  cliente: {
    codigoCliente: String,
    nome: String
  },
  itens: [{
    codigoProduto: String,
    nomeProduto: String,
    quantidade: Number,
    precoUnitario: Number,
    subtotal: Number
  }],
  valorTotal: Number,
  totalDesconto: Number,
  formaPagamento: String
}
```

### Estoque
```typescript
{
  codigoProduto: String (único),
  quantidadeDisponivel: Number,
  quantidadeMinima: Number,
  emPromocao: Boolean,
  valorPromocional: Number,
  logMovimentacao: [{
    tipo: 'entrada' | 'saida',
    quantidade: Number,
    data: Date,
    fornecedor: String,
    codigoVenda: String,
    observacao: String
  }]
}
```

### Fornecedores
```typescript
{
  codigoFornecedor: String (único),
  nome: String,
  telefone: String,
  endereco: {
    rua: String,
    numero: String,
    bairro: String,
    cidade: String,
    estado: String,
    cep: String
  },
  produtos: [String],
  observacoes: String,
  dataCadastro: Date
}
```

## 🔒 Segurança

- Validação de dados em todos os endpoints
- Tratamento de erros adequado
- CORS configurado
- Variáveis de ambiente para dados sensíveis

## 🐛 Troubleshooting

### Erro de conexão com MongoDB
- Verifique se a string de conexão está correta no `.env`
- Confirme que seu IP está autorizado no MongoDB Atlas
- Certifique-se de que o usuário tem permissões adequadas

### Porta já em uso
- Altere a porta no arquivo `.env`
- Ou finalize o processo que está usando a porta 3001

### Módulos não encontrados
```bash
cd server
rm -rf node_modules package-lock.json
npm install
```

## 📝 Notas Importantes

1. **Nunca commite o arquivo `.env`** - ele contém informações sensíveis
2. **Use `.env.example`** como template
3. **Faça backup regular** do banco de dados
4. **Teste em ambiente de desenvolvimento** antes de produção

## 🤝 Suporte

Para problemas ou dúvidas, consulte a documentação do:
- [MongoDB Atlas](https://docs.atlas.mongodb.com/)
- [Mongoose](https://mongoosejs.com/docs/)
- [Express](https://expressjs.com/)
