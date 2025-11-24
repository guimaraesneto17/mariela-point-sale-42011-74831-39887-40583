# Schemas de Validação - Módulo Financeiro

Este documento contém os **JSON Schemas de validação** para as collections `contasPagar` e `contasReceber` do MongoDB.

## ⚠️ IMPORTANTE

Estes schemas devem ser aplicados **diretamente no MongoDB** através do MongoDB Compass, MongoDB Shell ou outra ferramenta de administração.

**ATENÇÃO**: Os schemas abaixo são **FLEXÍVEIS** e permitem campos opcionais dependendo do `tipoCriacao`. Não force validação estrita em campos condicionais.

---

## 🔴 Collection: `contasPagar`

### Schema de Validação JSON (RECOMENDADO - SEM VALIDAÇÃO ESTRITA)

**IMPORTANTE**: Este schema NÃO valida a presença de campos condicionais. Use este para evitar erros de validação.

```json
{
  "$jsonSchema": {
    "bsonType": "object",
    "required": [
      "numeroDocumento",
      "descricao",
      "categoria",
      "valor",
      "dataVencimento",
      "status",
      "tipoCriacao"
    ],
    "description": "Schema de validação flexível da coleção Contas a Pagar.",
    "properties": {
      "numeroDocumento": {
        "bsonType": "string",
        "description": "Número único do documento (ex: CP001, CPP-001, CPPAI-001)."
      },
      "descricao": {
        "bsonType": "string",
        "minLength": 3,
        "description": "Descrição detalhada da conta a pagar."
      },
      "fornecedor": {
        "bsonType": "object",
        "description": "Objeto contendo os dados do fornecedor (opcional)."
      },
      "categoria": {
        "bsonType": "string",
        "description": "Categoria da despesa (ex: Fornecedores, Aluguel, Água/Luz, Salários, etc.)."
      },
      "valor": {
        "bsonType": "double",
        "minimum": 0,
        "description": "Valor total da conta a pagar."
      },
      "dataEmissao": {
        "bsonType": "date",
        "description": "Data em que o documento foi emitido."
      },
      "dataVencimento": {
        "bsonType": "date",
        "description": "Data prevista para pagamento da conta."
      },
      "status": {
        "enum": ["Pendente", "Pago", "Vencido", "Parcial"],
        "description": "Status atual da conta."
      },
      "observacoes": {
        "bsonType": "string",
        "description": "Observações adicionais sobre a conta (opcional)."
      },
      "tipoCriacao": {
        "enum": ["Unica", "Parcelamento", "Replica"],
        "description": "Identifica se a conta é única, um parcelamento ou uma réplica."
      },
      "pagamento": {
        "bsonType": "object",
        "description": "Dados do pagamento (somente para contas do tipo Única - opcional)."
      },
      "detalhesParcelamento": {
        "bsonType": "object",
        "description": "Informações gerais do parcelamento (somente quando tipoCriacao = Parcelamento - opcional)."
      },
      "parcelas": {
        "bsonType": "array",
        "description": "Lista de parcelas da conta (usada quando tipoCriacao = Parcelamento - opcional)."
      },
      "detalhesReplica": {
        "bsonType": "object",
        "description": "Informações de replicação (somente quando tipoCriacao = Replica - opcional)."
      },
      "replicaDe": {
        "bsonType": "string",
        "description": "ID da conta pai da qual esta réplica foi gerada (opcional)."
      },
      "dataCadastro": {
        "bsonType": "date",
        "description": "Data em que o registro foi criado no banco."
      },
      "dataAtualizacao": {
        "bsonType": "date",
        "description": "Data da última modificação do registro."
      }
    }
  }
}
```

### Índices Recomendados

```javascript
// No MongoDB Shell ou Compass
db.contasPagar.createIndex({ numeroDocumento: 1 }, { unique: true });
db.contasPagar.createIndex({ status: 1 });
db.contasPagar.createIndex({ dataVencimento: 1 });
db.contasPagar.createIndex({ categoria: 1 });
db.contasPagar.createIndex({ tipoCriacao: 1 });
db.contasPagar.createIndex({ replicaDe: 1 });
```

---

## 🟢 Collection: `contasReceber`

### Schema de Validação JSON (RECOMENDADO - SEM VALIDAÇÃO ESTRITA)

**IMPORTANTE**: Este schema NÃO valida a presença de campos condicionais. Use este para evitar erros de validação.

```json
{
  "$jsonSchema": {
    "bsonType": "object",
    "description": "Schema de validação flexível da coleção Contas a Receber.",
    "required": [
      "numeroDocumento",
      "descricao",
      "categoria",
      "valor",
      "dataVencimento",
      "status",
      "tipoCriacao"
    ],
    "properties": {
      "numeroDocumento": {
        "bsonType": "string",
        "description": "Número único da conta a receber (ex: CR001, CRP-001, CRPAI-001)."
      },
      "descricao": {
        "bsonType": "string",
        "minLength": 3,
        "description": "Descrição detalhada da conta a receber."
      },
      "cliente": {
        "bsonType": "object",
        "description": "Informações do cliente vinculado à conta (opcional)."
      },
      "vendaRelacionada": {
        "bsonType": "object",
        "description": "Venda que gerou esta conta a receber (opcional)."
      },
      "categoria": {
        "bsonType": "string",
        "description": "Categoria da receita (ex: Vendas, Serviços, Outros)."
      },
      "valor": {
        "bsonType": "double",
        "minimum": 0,
        "description": "Valor total a receber."
      },
      "dataEmissao": {
        "bsonType": "date",
        "description": "Data em que a conta foi emitida."
      },
      "dataVencimento": {
        "bsonType": "date",
        "description": "Data de vencimento da conta."
      },
      "status": {
        "enum": ["Pendente", "Recebido", "Vencido", "Parcial"],
        "description": "Status atual da conta a receber."
      },
      "observacoes": {
        "bsonType": "string",
        "description": "Observações gerais sobre a conta (opcional)."
      },
      "tipoCriacao": {
        "enum": ["Unica", "Parcelamento", "Replica"],
        "description": "Define se a conta é única, parcelada ou uma réplica."
      },
      "recebimento": {
        "bsonType": "object",
        "description": "Dados do recebimento (apenas para contas do tipo Única - opcional)."
      },
      "detalhesParcelamento": {
        "bsonType": "object",
        "description": "Informações gerais do parcelamento (apenas quando tipoCriacao = Parcelamento - opcional)."
      },
      "parcelas": {
        "bsonType": "array",
        "description": "Lista contendo todas as parcelas desta conta (apenas quando tipoCriacao = Parcelamento - opcional)."
      },
      "detalhesReplica": {
        "bsonType": "object",
        "description": "Informações referentes à réplica (somente para tipoCriacao = Replica - opcional)."
      },
      "replicaDe": {
        "bsonType": "string",
        "description": "ID da conta pai da qual esta conta foi replicada (opcional)."
      },
      "dataCadastro": {
        "bsonType": "date",
        "description": "Data em que a conta foi registrada no sistema."
      },
      "dataAtualizacao": {
        "bsonType": "date",
        "description": "Data da última modificação da conta."
      }
    }
  }
}
```

### Índices Recomendados

```javascript
// No MongoDB Shell ou Compass
db.contasReceber.createIndex({ numeroDocumento: 1 }, { unique: true });
db.contasReceber.createIndex({ status: 1 });
db.contasReceber.createIndex({ dataVencimento: 1 });
db.contasReceber.createIndex({ categoria: 1 });
db.contasReceber.createIndex({ tipoCriacao: 1 });
db.contasReceber.createIndex({ replicaDe: 1 });
```

---

## 📋 Como Aplicar os Schemas no MongoDB

### Opção 1: MongoDB Compass (Interface Gráfica) - RECOMENDADO

1. Abra o MongoDB Compass
2. Conecte-se ao seu banco de dados
3. Selecione a collection `contasPagar`
4. Clique em "Validation" na aba lateral
5. **IMPORTANTE**: Se já existe validação, REMOVA completamente antes de adicionar a nova
6. Cole o JSON Schema FLEXÍVEL correspondente (sem validação estrita de subdocumentos)
7. Clique em "Update"
8. Repita para `contasReceber`

### Opção 2: MongoDB Shell - REMOVER VALIDAÇÃO EXISTENTE

Se você já aplicou um schema muito restritivo, use estes comandos para REMOVER a validação:

```javascript
// Remover validação de contasPagar
db.runCommand({
  collMod: "contasPagar",
  validator: {},
  validationLevel: "off"
});

// Remover validação de contasReceber
db.runCommand({
  collMod: "contasReceber",
  validator: {},
  validationLevel: "off"
});
```

### Opção 3: Aplicar Schema Flexível

```javascript
// Para contasPagar
db.runCommand({
  collMod: "contasPagar",
  validator: {
    // Cole aqui o JSON Schema FLEXÍVEL de contasPagar
  },
  validationLevel: "moderate",
  validationAction: "error"
});

// Para contasReceber
db.runCommand({
  collMod: "contasReceber",
  validator: {
    // Cole aqui o JSON Schema FLEXÍVEL de contasReceber
  },
  validationLevel: "moderate",
  validationAction: "error"
});
```

---

## 🔧 Estrutura dos Dados por Tipo de Criação

### Tipo: Unica (Conta Única)

**Campos usados:**
- Todos os campos básicos (numeroDocumento, descricao, categoria, valor, etc.)
- `pagamento` (opcional - preenchido após o pagamento)
- `tipoCriacao: "Unica"`

**Campos NÃO usados:**
- detalhesParcelamento
- parcelas
- detalhesReplica

### Tipo: Parcelamento

**Campos usados:**
- Todos os campos básicos
- `detalhesParcelamento` (quantidadeParcelas, valorTotal)
- `parcelas[]` (array com as parcelas)
- `tipoCriacao: "Parcelamento"`

**Campos NÃO usados:**
- pagamento (nível raiz)
- detalhesReplica

### Tipo: Replica

**Campos usados:**
- Todos os campos básicos
- `detalhesReplica` (quantidadeReplicas, valor)
- `tipoCriacao: "Replica"`

**Contas filhas geradas:**
- Cada réplica é uma conta do tipo "Unica"
- Campo `replicaDe` aponta para o ID da conta pai

---

## ✅ Correções Implementadas

1. **Schemas Mongoose simplificados**: Removida estrutura complexa com `type: { ... }` aninhado
2. **Campos opcionais explícitos**: `detalhesParcelamento`, `parcelas`, `detalhesReplica` marcados como `required: false`
3. **Schemas MongoDB flexíveis**: Validação apenas dos campos obrigatórios, subdocumentos sem validação estrita
4. **Arrays opcionais**: Campo `parcelas` pode ser `undefined` ou array vazio

---

## 🧪 Testes Recomendados

Após aplicar os schemas flexíveis, teste:

1. ✅ Criar conta única (tipoCriacao: "Unica")
2. ✅ Criar parcelamento com N parcelas (tipoCriacao: "Parcelamento")
3. ✅ Criar réplica de contas mensais (tipoCriacao: "Replica")
4. ✅ Registrar pagamento em conta única
5. ✅ Registrar pagamento de parcela específica
6. ✅ Verificar se caixa aberto é obrigatório

---

## 🚨 Solução de Problemas

### Erro: "Document failed validation"

**Causa**: Schema MongoDB muito restritivo ou campos obrigatórios não fornecidos.

**Solução**:
1. Remova completamente a validação existente:
   ```javascript
   db.runCommand({ collMod: "contasPagar", validator: {}, validationLevel: "off" });
   db.runCommand({ collMod: "contasReceber", validator: {}, validationLevel: "off" });
   ```

2. Reinicie o servidor backend para recarregar os modelos Mongoose

3. Teste a criação de contas SEM validação MongoDB ativa

4. Se funcionar, aplique os schemas FLEXÍVEIS fornecidos acima

### Erro persiste mesmo sem validação MongoDB

**Causa**: Mongoose está aplicando validação no modelo.

**Solução**:
1. Verifique se os modelos em `server/models/` estão corretos
2. Confirme que campos opcionais têm `required: false`
3. Verifique logs do servidor para mensagens de erro detalhadas

---

## 📞 Suporte

**Passos para debug:**
1. Verifique logs do servidor (`console.log` nos controllers)
2. Confirme que caixa está aberto (obrigatório para pagamentos/recebimentos)
3. Valide que valores numéricos são >= 0
4. Confirme que forma de pagamento está entre as opções permitidas
5. Use MongoDB Compass para inspecionar documentos criados

**Comando útil para verificar validação ativa:**
```javascript
db.getCollectionInfos({ name: "contasPagar" })[0].options.validator
db.getCollectionInfos({ name: "contasReceber" })[0].options.validator
```
