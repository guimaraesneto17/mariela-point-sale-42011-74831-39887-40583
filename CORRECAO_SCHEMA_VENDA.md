# Correção do Schema de Validação da Collection Venda

## Problema Identificado

O schema de validação da collection `venda` no MongoDB contém uma inconsistência:
- O campo `required` especifica `codigoVendedor`
- Mas as `properties` definem o campo como `id`

Isso causa o erro: `"Document failed validation"`

## Solução

Execute o script de correção do schema no MongoDB.

### Opção 1: MongoDB Compass

1. Abra o MongoDB Compass
2. Conecte-se ao seu banco de dados
3. Clique na aba "Validation" da collection `venda`
4. Substitua o schema atual pelo schema corrigido do arquivo `server/scripts/fix-venda-schema.js`
5. Clique em "Update"

### Opção 2: MongoDB Shell

1. Conecte-se ao MongoDB via shell:
   ```bash
   mongosh "sua-connection-string"
   ```

2. Selecione o banco de dados:
   ```javascript
   use mariela
   ```

3. Execute o comando do arquivo `server/scripts/fix-venda-schema.js`

### Opção 3: Via Código Node.js

Você pode executar o script diretamente:

```bash
cd server/scripts
node fix-venda-schema.js
```

## Verificação

Após aplicar a correção, tente criar uma venda novamente. O payload esperado é:

```json
{
  "codigoVenda": "VENDA20251102-001",
  "data": "2025-11-02T06:04:23Z",
  "cliente": {
    "codigoCliente": "C009",
    "nome": "teste3"
  },
  "vendedor": {
    "codigoVendedor": "V004",
    "nome": "Teste"
  },
  "formaPagamento": "Pix",
  "itens": [{
    "codigoProduto": "P104",
    "nomeProduto": "Bolsa de Couro Marrom",
    "cor": "Vermelho",
    "tamanho": "G",
    "quantidade": 1,
    "precoUnitario": 230,
    "precoFinalUnitario": 230,
    "descontoAplicado": 0,
    "subtotal": 230
  }],
  "total": 230,
  "totalDesconto": 0,
  "taxaMaquininha": 0,
  "valorTaxa": 0,
  "valorRecebido": 230,
  "parcelas": 1
}
```

## O que foi corrigido

No schema do vendedor:
```javascript
// ANTES (ERRADO)
vendedor: {
  required: ['codigoVendedor', 'nome'],
  properties: {
    id: { ... }  // ❌ Campo errado
  }
}

// DEPOIS (CORRETO)
vendedor: {
  required: ['codigoVendedor', 'nome'],
  properties: {
    codigoVendedor: { ... }  // ✅ Campo correto
  }
}
```

No schema dos itens:
```javascript
// ANTES (FALTANDO)
itens: [{
  required: ['codigoProduto', 'nomeProduto', 'tamanho', ...],
  properties: {
    // cor não estava incluída
  }
}]

// DEPOIS (CORRETO)
itens: [{
  required: ['codigoProduto', 'nomeProduto', 'cor', 'tamanho', ...],
  properties: {
    cor: { bsonType: 'string', description: 'Cor do produto vendido' }  // ✅ Campo adicionado
  }
}]
```
