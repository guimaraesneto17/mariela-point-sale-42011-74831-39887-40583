# 🚀 Guia Rápido de Uso da API - Mariela Moda

Este guia contém exemplos práticos para você começar a usar a API imediatamente.

## 📍 URL Base

```
http://localhost:3001
```

## 🔗 Documentação Interativa

Acesse a documentação Swagger completa em:
```
http://localhost:3001/api-docs
```

Lá você pode testar todos os endpoints diretamente pelo navegador!

## 📝 Exemplos de Uso

### 1. Criar um Cliente

```bash
curl -X POST http://localhost:3001/api/clientes \
  -H "Content-Type: application/json" \
  -d '{
    "codigoCliente": "C001",
    "nome": "Maria Silva",
    "telefone": "(11) 98765-4321",
    "dataNascimento": "1990-01-15",
    "observacao": "Cliente VIP"
  }'
```

### 2. Criar um Produto

```bash
curl -X POST http://localhost:3001/api/produtos \
  -H "Content-Type: application/json" \
  -d '{
    "codigo": "P101",
    "nome": "Vestido Floral",
    "descricao": "Lindo vestido com estampa floral",
    "categoria": "Vestido",
    "cor": "Azul",
    "precoCusto": 80.00,
    "precoVenda": 150.00,
    "precoPromocional": 120.00,
    "imagens": ["vestido1.jpg", "vestido2.jpg"]
  }'
```

### 3. Registrar Entrada no Estoque

```bash
curl -X POST http://localhost:3001/api/estoque/entrada \
  -H "Content-Type: application/json" \
  -d '{
    "codigoProduto": "P101",
    "quantidade": 20,
    "fornecedor": "F001",
    "observacao": "Chegada nova coleção"
  }'
```

### 4. Criar um Vendedor

```bash
curl -X POST http://localhost:3001/api/vendedores \
  -H "Content-Type: application/json" \
  -d '{
    "codigoVendedor": "V001",
    "nome": "João Silva",
    "telefone": "(11) 98765-4321",
    "dataNascimento": "1995-05-10",
    "ativo": true,
    "metaMensal": 15000.00
  }'
```

### 5. Criar uma Venda

```bash
curl -X POST http://localhost:3001/api/vendas \
  -H "Content-Type: application/json" \
  -d '{
    "codigoVenda": "VENDA20250117-001",
    "data": "2025-01-17T14:30:00Z",
    "cliente": {
      "codigoCliente": "C001",
      "nome": "Maria Silva"
    },
    "vendedor": {
      "id": "V001",
      "nome": "João Silva"
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
    "formaPagamento": "Pix"
  }'
```

### 6. Listar Todos os Produtos

```bash
curl http://localhost:3001/api/produtos
```

### 7. Buscar Cliente por ID

```bash
curl http://localhost:3001/api/clientes/[ID_DO_CLIENTE]
```

### 8. Atualizar Produto

```bash
curl -X PUT http://localhost:3001/api/produtos/[ID_DO_PRODUTO] \
  -H "Content-Type: application/json" \
  -d '{
    "precoVenda": 160.00,
    "precoPromocional": 130.00
  }'
```

### 9. Deletar Cliente

```bash
curl -X DELETE http://localhost:3001/api/clientes/[ID_DO_CLIENTE]
```

### 10. Listar Produtos em Promoção (Vitrine Virtual)

```bash
curl http://localhost:3001/api/vitrine/promocoes
```

### 11. Listar Novidades (Vitrine Virtual)

```bash
curl http://localhost:3001/api/vitrine/novidades
```

## 🔍 Testando com JavaScript/Fetch

### Criar Cliente

```javascript
fetch('http://localhost:3001/api/clientes', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    codigoCliente: 'C001',
    nome: 'Maria Silva',
    telefone: '(11) 98765-4321',
    dataNascimento: '1990-01-15',
    observacao: 'Cliente VIP'
  })
})
.then(response => response.json())
.then(data => console.log('Cliente criado:', data))
.catch(error => console.error('Erro:', error));
```

### Listar Produtos

```javascript
fetch('http://localhost:3001/api/produtos')
  .then(response => response.json())
  .then(produtos => console.log('Produtos:', produtos))
  .catch(error => console.error('Erro:', error));
```

### Criar Venda

```javascript
fetch('http://localhost:3001/api/vendas', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    codigoVenda: 'VENDA20250117-001',
    data: new Date().toISOString(),
    cliente: {
      codigoCliente: 'C001',
      nome: 'Maria Silva'
    },
    vendedor: {
      id: 'V001',
      nome: 'João Silva'
    },
    itens: [
      {
        codigoProduto: 'P101',
        nomeProduto: 'Vestido Floral',
        tamanho: 'M',
        quantidade: 1,
        precoUnitario: 150.00,
        precoFinalUnitario: 120.00,
        descontoAplicado: 30.00,
        subtotal: 120.00
      }
    ],
    total: 120.00,
    totalDesconto: 30.00,
    formaPagamento: 'Pix'
  })
})
.then(response => response.json())
.then(data => console.log('Venda criada:', data))
.catch(error => console.error('Erro:', error));
```

## 📊 Testando com Postman

1. Abra o Postman
2. Crie uma nova requisição
3. Selecione o método (GET, POST, PUT, DELETE)
4. Cole a URL do endpoint
5. Para POST/PUT, vá em "Body" > "raw" > "JSON" e cole o JSON
6. Clique em "Send"

## ⚠️ Códigos de Status HTTP

- **200 OK** - Requisição bem-sucedida
- **201 Created** - Recurso criado com sucesso
- **400 Bad Request** - Dados inválidos
- **404 Not Found** - Recurso não encontrado
- **500 Internal Server Error** - Erro no servidor

## 💡 Dicas

1. **Use o Swagger UI** para testar rapidamente os endpoints
2. **Códigos únicos** devem seguir os padrões:
   - Clientes: C### (ex: C001)
   - Produtos: P### (ex: P101)
   - Vendedores: V### (ex: V001)
   - Fornecedores: F### (ex: F001)
   - Vendas: VENDA########-### (ex: VENDA20250117-001)

3. **Tamanhos válidos**: PP, P, M, G, GG, U
4. **Categorias válidas**: Calça, Saia, Vestido, Blusa, Bolsa, Acessório, Outro
5. **Formas de pagamento**: Pix, Cartão de Crédito, Cartão de Débito, Dinheiro

## 🔐 Importante

- Esta API não possui autenticação ainda
- Use apenas em ambiente de desenvolvimento
- Para produção, adicione autenticação JWT ou similar

## 📞 Precisa de Ajuda?

Consulte a documentação completa do Swagger em:
```
http://localhost:3001/api-docs
```
