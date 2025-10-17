# Mariela Moda - Backend API

API RESTful completa para o sistema de PDV da Mariela Moda Feminina, desenvolvida com Node.js, Express, MongoDB e TypeScript.

## 🚀 Tecnologias

- **Node.js** - Runtime JavaScript
- **Express** - Framework web minimalista
- **MongoDB Atlas** - Banco de dados NoSQL em nuvem
- **Mongoose** - ODM (Object Data Modeling) para MongoDB
- **TypeScript** - Superset do JavaScript com tipagem estática
- **Swagger** - Documentação interativa da API

## 📋 Pré-requisitos

- Node.js 18+ instalado
- MongoDB Atlas configurado
- NPM ou Yarn

## 🔧 Instalação

### 1. Instalar dependências

```bash
cd server
npm install
```

### 2. Configurar variáveis de ambiente

O arquivo `.env` já está configurado com a string de conexão do MongoDB Atlas:

```env
MONGODB_URI=mongodb+srv://marielamodaf:mariela214365@marieladb.lcikjrk.mongodb.net/marielaDB?retryWrites=true&w=majority
PORT=3001
NODE_ENV=development
```

## 🎯 Executar o Servidor

### Modo Desenvolvimento (com hot reload)

```bash
npm run dev
```

### Modo Produção

```bash
npm run build
npm start
```

O servidor estará rodando em `http://localhost:3001`

## 📚 Documentação da API (Swagger)

Acesse a documentação interativa completa em:

**http://localhost:3001/api-docs**

A documentação Swagger permite:
- Visualizar todos os endpoints disponíveis
- Ver os schemas de dados (models)
- Testar as requisições diretamente pelo navegador
- Entender os parâmetros necessários para cada rota
- Ver exemplos de requisições e respostas

### Exportar documentação JSON

Você também pode acessar a especificação OpenAPI em formato JSON:

**http://localhost:3001/api-docs.json**

## 📡 API Endpoints

### Clientes

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/clientes` | Lista todos os clientes |
| GET | `/api/clientes/:id` | Busca cliente por ID |
| POST | `/api/clientes` | Cria novo cliente |
| PUT | `/api/clientes/:id` | Atualiza cliente |
| DELETE | `/api/clientes/:id` | Remove cliente |

**Schema Cliente:**
```json
{
  "codigoCliente": "C001",
  "nome": "Maria Silva",
  "telefone": "(11) 98765-4321",
  "dataNascimento": "1990-01-15",
  "observacao": "Cliente VIP",
  "dataCadastro": "2025-01-17T10:00:00Z"
}
```

### Produtos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/produtos` | Lista todos os produtos |
| GET | `/api/produtos/:id` | Busca produto por ID |
| POST | `/api/produtos` | Cria novo produto |
| PUT | `/api/produtos/:id` | Atualiza produto |
| DELETE | `/api/produtos/:id` | Remove produto |

**Schema Produto:**
```json
{
  "codigo": "P101",
  "nome": "Vestido Floral",
  "descricao": "Vestido longo com estampa floral",
  "categoria": "Vestido",
  "cor": "Azul",
  "precoCusto": 80.00,
  "precoVenda": 150.00,
  "precoPromocional": 120.00,
  "imagens": ["url1.jpg", "url2.jpg"],
  "dataCadastro": "2025-01-17T10:00:00Z"
}
```

### Estoque

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/estoque` | Lista todo o estoque |
| GET | `/api/estoque/baixo` | Produtos com estoque baixo |
| GET | `/api/estoque/:codigoProduto` | Busca estoque de um produto |
| POST | `/api/estoque/entrada` | Registra entrada no estoque |
| PUT | `/api/estoque/:codigoProduto` | Atualiza configurações do estoque |

**Schema Estoque:**
```json
{
  "codigoProduto": "P101",
  "tamanho": "M",
  "quantidade": 15,
  "emPromocao": true,
  "valorPromocional": 120.00,
  "isNovidade": false,
  "logMovimentacao": [
    {
      "tipo": "entrada",
      "quantidade": 20,
      "data": "2025-01-17T10:00:00Z",
      "origem": "compra",
      "fornecedor": "F001",
      "observacao": "Chegada nova coleção"
    }
  ]
}
```

### Vendas

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/vendas` | Lista todas as vendas |
| GET | `/api/vendas/:id` | Busca venda por ID |
| POST | `/api/vendas` | Cria nova venda (atualiza estoque) |
| DELETE | `/api/vendas/:id` | Cancela venda (devolve ao estoque) |

**Schema Venda:**
```json
{
  "codigoVenda": "VENDA20250117-001",
  "data": "2025-01-17T14:30:00Z",
  "cliente": {
    "codigoCliente": "C001",
    "nome": "Maria Silva"
  },
  "vendedor": {
    "id": "V001",
    "nome": "João Vendedor"
  },
  "itens": [
    {
      "codigoProduto": "P101",
      "nomeProduto": "Vestido Floral",
      "tamanho": "M",
      "quantidade": 2,
      "precoUnitario": 150.00,
      "precoFinalUnitario": 120.00,
      "descontoAplicado": 30.00,
      "subtotal": 240.00
    }
  ],
  "total": 240.00,
  "totalDesconto": 60.00,
  "formaPagamento": "Pix",
  "observacoes": "Cliente solicitou embalagem especial"
}
```

### Vendedores

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/vendedores` | Lista todos os vendedores |
| GET | `/api/vendedores/:id` | Busca vendedor por ID |
| POST | `/api/vendedores` | Cria novo vendedor |
| PUT | `/api/vendedores/:id` | Atualiza vendedor |
| DELETE | `/api/vendedores/:id` | Remove vendedor |

**Schema Vendedor:**
```json
{
  "codigoVendedor": "V001",
  "nome": "João Silva",
  "telefone": "(11) 98765-4321",
  "dataNascimento": "1995-05-10",
  "ativo": true,
  "metaMensal": 15000.00,
  "observacao": "Vendedor destaque do mês",
  "dataCadastro": "2025-01-17T10:00:00Z"
}
```

### Fornecedores

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/fornecedores` | Lista todos os fornecedores |
| GET | `/api/fornecedores/:id` | Busca fornecedor por ID |
| POST | `/api/fornecedores` | Cria novo fornecedor |
| PUT | `/api/fornecedores/:id` | Atualiza fornecedor |
| DELETE | `/api/fornecedores/:id` | Remove fornecedor |

**Schema Fornecedor:**
```json
{
  "codigoFornecedor": "F001",
  "nome": "Moda Fashion LTDA",
  "cnpj": "12.345.678/0001-90",
  "telefone": "(11) 3456-7890",
  "instagram": "@modafashion",
  "endereco": {
    "rua": "Av. Paulista",
    "numero": "1000",
    "bairro": "Bela Vista",
    "cidade": "São Paulo",
    "estado": "SP",
    "cep": "01310-100"
  },
  "observacao": "Fornecedor principal",
  "dataCadastro": "2025-01-17T10:00:00Z"
}
```

### Vitrine Virtual

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/vitrine` | Lista todos os produtos da vitrine |
| GET | `/api/vitrine/novidades` | Lista produtos novos |
| GET | `/api/vitrine/promocoes` | Lista produtos em promoção |
| GET | `/api/vitrine/:code` | Busca produto por código |
| POST | `/api/vitrine` | Adiciona produto à vitrine |
| PUT | `/api/vitrine/:code` | Atualiza produto da vitrine |
| DELETE | `/api/vitrine/:code` | Remove produto da vitrine |

**Schema Vitrine Virtual:**
```json
{
  "code": "P101",
  "name": "Vestido Floral",
  "description": "Lindo vestido com estampa floral",
  "category": "vestidos",
  "color": "Azul",
  "images": ["url1.jpg", "url2.jpg"],
  "pricing": {
    "cost": 80.00,
    "sale": 150.00,
    "promotional": 120.00
  },
  "availability": {
    "sizes": [
      {
        "size": "P",
        "totalAvailable": 10
      },
      {
        "size": "M",
        "totalAvailable": 15
      },
      {
        "size": "G",
        "totalAvailable": 8
      }
    ]
  },
  "tags": {
    "isNew": true,
    "isOnSale": true
  }
}
```

## 🗂️ Estrutura do Projeto

```
server/
├── config/
│   ├── database.ts          # Configuração MongoDB Atlas
│   └── swagger.ts            # Configuração Swagger/OpenAPI
├── models/
│   ├── Cliente.ts           # Schema de Clientes
│   ├── Estoque.ts           # Schema de Estoque
│   ├── Fornecedor.ts        # Schema de Fornecedores
│   ├── Produto.ts           # Schema de Produtos
│   ├── Venda.ts             # Schema de Vendas
│   ├── Vendedor.ts          # Schema de Vendedores
│   └── VitrineVirtual.ts    # Schema da Vitrine Virtual
├── routes/
│   ├── clientes.ts          # Rotas de Clientes
│   ├── estoque.ts           # Rotas de Estoque
│   ├── fornecedores.ts      # Rotas de Fornecedores
│   ├── produtos.ts          # Rotas de Produtos
│   ├── vendas.ts            # Rotas de Vendas
│   ├── vendedores.ts        # Rotas de Vendedores
│   └── vitrineVirtual.ts    # Rotas da Vitrine Virtual
├── index.ts                 # Arquivo principal do servidor
├── package.json             # Dependências do projeto
└── tsconfig.json            # Configuração TypeScript
```

## 🔒 Segurança

- ✅ Validação de dados com Mongoose schemas
- ✅ Tratamento de erros em todos os endpoints
- ✅ CORS configurado
- ✅ Variáveis de ambiente para dados sensíveis
- ✅ Índices no banco para melhor performance
- ✅ Logs de requisições para auditoria

## 🔍 Health Check

Verifique se o servidor está rodando:

```bash
GET http://localhost:3001/health
```

Resposta:
```json
{
  "status": "ok",
  "timestamp": "2025-01-17T10:00:00.000Z"
}
```

## 🐛 Troubleshooting

### Erro de conexão com MongoDB
- Verifique se a string de conexão está correta no `.env`
- Confirme que seu IP está autorizado no MongoDB Atlas
- Certifique-se de que o usuário tem permissões adequadas

### Porta já em uso
- Altere a porta no arquivo `.env`
- Ou finalize o processo que está usando a porta 3001:
```bash
# Linux/Mac
lsof -ti:3001 | xargs kill -9

# Windows
netstat -ano | findstr :3001
taskkill /PID [PID] /F
```

### Módulos não encontrados
```bash
cd server
rm -rf node_modules package-lock.json
npm install
```

## 📝 Validações do MongoDB

Todos os models seguem validações rigorosas baseadas nos schemas fornecidos:

- **Clientes**: Código no formato C###, telefone formatado, datas válidas
- **Produtos**: Código no formato P###, categorias pré-definidas, preços positivos
- **Estoque**: Tamanhos válidos (PP, P, M, G, GG, U), quantidades não negativas
- **Vendas**: Código no formato VENDA########-###, validação de itens
- **Vendedores**: Código no formato V###, metas positivas
- **Fornecedores**: Código no formato F###, CNPJ formatado, endereço completo

## 🤝 Suporte

Para problemas ou dúvidas, consulte:
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [Express.js Guide](https://expressjs.com/)
- [Swagger/OpenAPI Specification](https://swagger.io/specification/)

## 📄 Licença

Este projeto foi desenvolvido para uso interno da Mariela Moda Feminina.
