# Schema MongoDB Atualizado para Collection `estoque`

## Schema corrigido para consistência com Mongoose

```json
{
  "$jsonSchema": {
    "bsonType": "object",
    "required": [
      "codigoProduto",
      "quantidade",
      "ativo",
      "emPromocao",
      "isNovidade"
    ],
    "properties": {
      "_id": {
        "bsonType": "objectId",
        "description": "Identificador único gerado automaticamente pelo MongoDB"
      },
      "codigoEstoque": {
        "bsonType": ["string", "null"],
        "pattern": "^E\\d{3}$",
        "description": "Código único do estoque (ex: E001) - Opcional"
      },
      "codigoProduto": {
        "bsonType": "string",
        "pattern": "^P\\d{3}$",
        "description": "Código do produto vinculado ao estoque (ex: P101)"
      },
      "quantidade": {
        "bsonType": "int",
        "minimum": 0,
        "description": "Quantidade total em estoque"
      },
      "ativo": {
        "bsonType": "bool",
        "description": "Indica se o estoque está ativo"
      },
      "emPromocao": {
        "bsonType": "bool",
        "description": "Indica se o produto está em promoção"
      },
      "isNovidade": {
        "bsonType": "bool",
        "description": "Indica se o produto é uma novidade"
      },
      "precoPromocional": {
        "bsonType": ["double", "int", "null"],
        "minimum": 0,
        "description": "Preço promocional, se aplicável"
      },
      "variantes": {
        "bsonType": ["array", "null"],
        "description": "Lista de variantes do produto (cor, tamanho, quantidade)",
        "items": {
          "bsonType": "object",
          "required": ["cor", "quantidade", "tamanhos"],
          "properties": {
            "cor": {
              "bsonType": "string",
              "description": "Cor da variante"
            },
            "quantidade": {
              "bsonType": "int",
              "minimum": 0,
              "description": "Quantidade total dessa variante (soma de todos os tamanhos)"
            },
            "tamanhos": {
              "bsonType": "array",
              "description": "Lista de tamanhos da variante com quantidade por tamanho",
              "items": {
                "bsonType": "object",
                "required": ["tamanho", "quantidade"],
                "properties": {
                  "tamanho": {
                    "bsonType": "string",
                    "description": "Nome do tamanho (ex: P, M, G, GG, U, 36, 38, 40, 42, 44, 46, 48)"
                  },
                  "quantidade": {
                    "bsonType": "int",
                    "minimum": 0,
                    "description": "Quantidade disponível desse tamanho"
                  }
                }
              }
            },
            "imagens": {
              "bsonType": ["array", "null"],
              "description": "Lista de URLs ou nomes de arquivos de imagens do produto (pode ser vazia)",
              "items": {
                "bsonType": "string"
              }
            }
          }
        }
      },
      "logPromocao": {
        "bsonType": ["array", "null"],
        "description": "Histórico de promoções aplicadas ao produto",
        "items": {
          "bsonType": "object",
          "required": ["dataInicio", "precoPromocional", "ativo"],
          "properties": {
            "dataInicio": {
              "bsonType": "string",
              "description": "Data e hora de início da promoção no formato ISO (yyyy-MM-ddTHH:mm:ssZ)"
            },
            "dataFim": {
              "bsonType": ["string", "null"],
              "description": "Data e hora de término da promoção, se aplicável"
            },
            "precoPromocional": {
              "bsonType": ["double", "int"],
              "minimum": 0,
              "description": "Preço promocional aplicado durante a promoção"
            },
            "ativo": {
              "bsonType": "bool",
              "description": "Indica se a promoção ainda está ativa"
            },
            "observacao": {
              "bsonType": ["string", "null"],
              "maxLength": 200,
              "description": "Motivo ou observação da promoção (ex: Black Friday, Queima de estoque, etc.)"
            },
            "tipoDeDesconto": {
              "bsonType": ["string", "null"],
              "enum": ["valorDireto", "porcentagem", null],
              "description": "Tipo de desconto aplicado: valorDireto, porcentagem ou null se não aplicável"
            },
            "valorDesconto": {
              "bsonType": ["double", "int", "null"],
              "minimum": 0,
              "description": "Valor do desconto (absoluto ou percentual, dependendo do tipoDeDesconto)"
            }
          }
        }
      },
      "logMovimentacao": {
        "bsonType": ["array", "null"],
        "description": "Histórico de movimentações de entrada e saída do estoque",
        "items": {
          "bsonType": "object",
          "required": ["tipo", "data", "quantidade"],
          "properties": {
            "_id": {
              "bsonType": ["objectId", "null"],
              "description": "Identificador único da movimentação"
            },
            "tipo": {
              "bsonType": "string",
              "enum": ["entrada", "saida"],
              "description": "Tipo de movimentação (entrada ou saída)"
            },
            "data": {
              "bsonType": "string",
              "description": "Data e hora da movimentação no formato ISO (yyyy-MM-ddTHH:mm:ssZ)"
            },
            "quantidade": {
              "bsonType": "int",
              "minimum": 1,
              "description": "Quantidade movimentada"
            },
            "origem": {
              "bsonType": ["string", "null"],
              "enum": ["venda", "compra", "entrada", "baixa no estoque", null],
              "description": "Origem da movimentação"
            },
            "codigoVenda": {
              "bsonType": ["string", "null"],
              "pattern": "^VENDA\\d{8}-\\d{3}$",
              "description": "Código da venda associada, se houver"
            },
            "motivo": {
              "bsonType": ["string", "null"],
              "description": "Motivo da movimentação, quando aplicável"
            },
            "fornecedor": {
              "bsonType": ["string", "null"],
              "pattern": "^F\\d{3}$",
              "description": "Código do fornecedor, se aplicável"
            },
            "observacao": {
              "bsonType": ["string", "null"],
              "maxLength": 300,
              "description": "Observações adicionais sobre a movimentação"
            },
            "cor": {
              "bsonType": ["string", "null"],
              "description": "Cor da variante movimentada, se aplicável"
            },
            "tamanho": {
              "bsonType": ["string", "null"],
              "description": "Tamanho da variante movimentada, se aplicável"
            }
          }
        }
      },
      "dataCadastro": {
        "bsonType": "date",
        "description": "Data em que o registro foi criado"
      },
      "dataAtualizacao": {
        "bsonType": "date",
        "description": "Data da última atualização do registro"
      }
    }
  }
}
```

## Principais correções aplicadas:

### 1. **Adicionado campo `codigoEstoque`**
- Campo existe no Mongoose mas estava ausente no MongoDB schema
- Configurado como opcional (`["string", "null"]`) com pattern `^E\\d{3}$`

### 2. **Campo `ativo` agora é required**
- No Mongoose: `required: true, default: true`
- Adicionado em `required` array no MongoDB schema

### 3. **Campo `logMovimentacao` agora é opcional**
- No Mongoose não tem `required: true`
- Alterado de `"bsonType": "array"` para `"bsonType": ["array", "null"]`

### 4. **Campo `origem` em logMovimentacao agora é opcional**
- No Mongoose não tem `required: true`
- Adicionado `null` no enum: `"enum": ["venda", "compra", "entrada", "baixa no estoque", null]`

### 5. **Campo `imagens` em variantes agora permite null**
- Alterado para `"bsonType": ["array", "null"]`

## Como aplicar o schema atualizado:

### Opção 1: MongoDB Compass
1. Abra MongoDB Compass
2. Conecte ao seu banco de dados
3. Navegue até a collection `estoque`
4. Clique em "Validation" tab
5. Selecione "Update" e cole o JSON acima

### Opção 2: MongoDB Shell
```javascript
db.runCommand({
  collMod: "estoque",
  validator: {
    $jsonSchema: {
      // Cole o schema acima aqui
    }
  },
  validationLevel: "moderate",
  validationAction: "error"
})
```

### Opção 3: Script Node.js
Crie um arquivo `updateEstoqueSchema.js`:

```javascript
const mongoose = require('mongoose');

async function updateSchema() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const db = mongoose.connection.db;
    
    await db.command({
      collMod: 'estoque',
      validator: {
        // Cole o schema acima aqui
      },
      validationLevel: 'moderate',
      validationAction: 'error'
    });
    
    console.log('✅ Schema atualizado com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao atualizar schema:', error);
    process.exit(1);
  }
}

updateSchema();
```

Execute: `node updateEstoqueSchema.js`

## Observações importantes:

- O schema atualizado agora está 100% consistente com o modelo Mongoose
- Todos os campos com `default` values no Mongoose foram marcados como `required` no MongoDB
- Campos opcionais no Mongoose agora permitem `null` no MongoDB schema
- O campo `codigoEstoque` foi adicionado para evitar erros caso o código tente utilizá-lo
