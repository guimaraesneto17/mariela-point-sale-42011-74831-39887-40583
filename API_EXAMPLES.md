# 📡 Exemplos de Uso da API - Mariela PDV

Base URL: `http://localhost:3001/api`

## 📦 Produtos

### Listar todos os produtos
```bash
curl http://localhost:3001/api/produtos
```

### Buscar produto por ID
```bash
curl http://localhost:3001/api/produtos/68ec791e1797ac697cecddde
```

### Criar novo produto
```bash
curl -X POST http://localhost:3001/api/produtos \
  -H "Content-Type: application/json" \
  -d '{
    "codigo": "P105",
    "nome": "Vestido Longo Vermelho",
    "descricao": "Vestido longo elegante para festas",
    "categoria": "Vestido",
    "marca": "Elegance Fashion",
    "cor": "Vermelho",
    "tamanho": "M",
    "preco": 249.90,
    "imagens": ["https://exemplo.com/imagem1.jpg"]
  }'
```

### Atualizar produto
```bash
curl -X PUT http://localhost:3001/api/produtos/68ec791e1797ac697cecddde \
  -H "Content-Type: application/json" \
  -d '{
    "preco": 119.90
  }'
```

### Deletar produto
```bash
curl -X DELETE http://localhost:3001/api/produtos/68ec791e1797ac697cecddde
```

## 👥 Clientes

### Listar todos os clientes
```bash
curl http://localhost:3001/api/clientes
```

### Criar novo cliente
```bash
curl -X POST http://localhost:3001/api/clientes \
  -H "Content-Type: application/json" \
  -d '{
    "codigoCliente": "C004",
    "nome": "Mariana Silva",
    "telefone": "(11) 99999-8888",
    "dataNascimento": "1995-07-20",
    "observacao": "Cliente VIP - Desconto especial"
  }'
```

### Atualizar cliente
```bash
curl -X PUT http://localhost:3001/api/clientes/68ec7c431797ac697cecddf1 \
  -H "Content-Type: application/json" \
  -d '{
    "telefone": "(11) 98888-7777"
  }'
```

### Deletar cliente
```bash
curl -X DELETE http://localhost:3001/api/clientes/68ec7c431797ac697cecddf1
```

## 🛍️ Vendas

### Listar todas as vendas
```bash
curl http://localhost:3001/api/vendas
```

### Criar nova venda
```bash
curl -X POST http://localhost:3001/api/vendas \
  -H "Content-Type: application/json" \
  -d '{
    "codigoVenda": "VENDA20251013-001",
    "data": "2025-10-13T14:30:00Z",
    "cliente": {
      "codigoCliente": "C001",
      "nome": "Ana Souza"
    },
    "itens": [
      {
        "codigoProduto": "P101",
        "nomeProduto": "Vestido Floral Azul",
        "quantidade": 2,
        "precoUnitario": 129.90,
        "subtotal": 259.80
      }
    ],
    "valorTotal": 259.80,
    "totalDesconto": 0,
    "formaPagamento": "Cartão de Crédito"
  }'
```

**Nota:** Ao criar uma venda, o estoque é automaticamente atualizado com a saída dos produtos.

### Cancelar venda (devolve ao estoque)
```bash
curl -X DELETE http://localhost:3001/api/vendas/68ec7b191797ac697cecddea
```

## 📊 Estoque

### Listar todo o estoque
```bash
curl http://localhost:3001/api/estoque
```

### Listar produtos com estoque baixo
```bash
curl http://localhost:3001/api/estoque/baixo
```

### Buscar estoque de um produto
```bash
curl http://localhost:3001/api/estoque/P101
```

### Registrar entrada de produtos
```bash
curl -X POST http://localhost:3001/api/estoque/entrada \
  -H "Content-Type: application/json" \
  -d '{
    "codigoProduto": "P101",
    "quantidade": 50,
    "fornecedor": "Elegance Fashion",
    "observacao": "Reposição mensal"
  }'
```

### Atualizar configurações do estoque
```bash
curl -X PUT http://localhost:3001/api/estoque/P101 \
  -H "Content-Type: application/json" \
  -d '{
    "quantidadeMinima": 15,
    "emPromocao": true,
    "valorPromocional": 99.90
  }'
```

## 🚚 Fornecedores

### Listar todos os fornecedores
```bash
curl http://localhost:3001/api/fornecedores
```

### Criar novo fornecedor
```bash
curl -X POST http://localhost:3001/api/fornecedores \
  -H "Content-Type: application/json" \
  -d '{
    "codigoFornecedor": "F004",
    "nome": "Fashion House Ltda",
    "telefone": "(11) 3456-7890",
    "endereco": {
      "rua": "Av. Paulista",
      "numero": "1000",
      "bairro": "Bela Vista",
      "cidade": "São Paulo",
      "estado": "SP",
      "cep": "01310-100"
    },
    "produtos": ["Vestidos", "Saias", "Blusas"],
    "observacoes": "Fornecedor com entrega rápida"
  }'
```

### Atualizar fornecedor
```bash
curl -X PUT http://localhost:3001/api/fornecedores/68ec7cc71797ac697cecddf4 \
  -H "Content-Type: application/json" \
  -d '{
    "telefone": "(11) 3456-0000"
  }'
```

### Deletar fornecedor
```bash
curl -X DELETE http://localhost:3001/api/fornecedores/68ec7cc71797ac697cecddf4
```

## 🔍 Exemplos com JavaScript/Fetch

### Listar produtos
```javascript
fetch('http://localhost:3001/api/produtos')
  .then(response => response.json())
  .then(produtos => console.log(produtos))
  .catch(error => console.error('Erro:', error));
```

### Criar produto
```javascript
fetch('http://localhost:3001/api/produtos', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    codigo: 'P106',
    nome: 'Blusa Estampada',
    categoria: 'Blusa',
    marca: 'Moda Style',
    cor: 'Rosa',
    tamanho: 'P',
    preco: 79.90
  })
})
  .then(response => response.json())
  .then(produto => console.log('Produto criado:', produto))
  .catch(error => console.error('Erro:', error));
```

### Registrar venda
```javascript
fetch('http://localhost:3001/api/vendas', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    codigoVenda: `VENDA${Date.now()}`,
    cliente: {
      codigoCliente: 'C001',
      nome: 'Ana Souza'
    },
    itens: [
      {
        codigoProduto: 'P101',
        nomeProduto: 'Vestido Floral Azul',
        quantidade: 1,
        precoUnitario: 129.90,
        subtotal: 129.90
      }
    ],
    valorTotal: 129.90,
    totalDesconto: 0,
    formaPagamento: 'Pix'
  })
})
  .then(response => response.json())
  .then(venda => {
    console.log('Venda registrada:', venda);
    console.log('Estoque atualizado automaticamente!');
  })
  .catch(error => console.error('Erro:', error));
```

## 🔐 Respostas de Erro

### 400 - Bad Request
```json
{
  "error": "Erro ao criar produto"
}
```

### 404 - Not Found
```json
{
  "error": "Produto não encontrado"
}
```

### 500 - Internal Server Error
```json
{
  "error": "Erro interno do servidor"
}
```

## ✅ Health Check

```bash
curl http://localhost:3001/health
```

Resposta:
```json
{
  "status": "ok",
  "timestamp": "2025-10-13T12:00:00.000Z"
}
```

## 📝 Notas Importantes

1. **IDs do MongoDB:**
   - Os IDs são gerados automaticamente pelo MongoDB
   - Use o `_id` retornado para operações de atualização e deleção

2. **Códigos únicos:**
   - `codigo` (Produtos)
   - `codigoCliente` (Clientes)
   - `codigoVenda` (Vendas)
   - `codigoProduto` (Estoque)
   - `codigoFornecedor` (Fornecedores)
   
   Todos devem ser únicos no sistema.

3. **Sincronização automática:**
   - Ao criar um produto, um registro de estoque é criado automaticamente
   - Ao registrar uma venda, o estoque é atualizado automaticamente
   - Ao cancelar uma venda, os produtos retornam ao estoque

4. **Validações:**
   - Campos obrigatórios são validados pelo Mongoose
   - Quantidades não podem ser negativas
   - Formas de pagamento são limitadas aos valores permitidos

## 🚀 Integração com Frontend

Para usar no React com React Query:

```typescript
// Exemplo: Hook para listar produtos
import { useQuery } from '@tanstack/react-query';

export function useProdutos() {
  return useQuery({
    queryKey: ['produtos'],
    queryFn: async () => {
      const response = await fetch('http://localhost:3001/api/produtos');
      if (!response.ok) throw new Error('Erro ao buscar produtos');
      return response.json();
    }
  });
}

// Uso no componente
function Produtos() {
  const { data: produtos, isLoading, error } = useProdutos();
  
  if (isLoading) return <div>Carregando...</div>;
  if (error) return <div>Erro ao carregar produtos</div>;
  
  return (
    <div>
      {produtos.map(produto => (
        <div key={produto._id}>{produto.nome}</div>
      ))}
    </div>
  );
}
```
