# Schemas de Validação - Módulo Financeiro

Este documento contém os **JSON Schemas de validação** para as collections `contasPagar` e `contasReceber` do MongoDB.

## ⚠️ IMPORTANTE

Estes schemas devem ser aplicados **diretamente no MongoDB** através do MongoDB Compass, MongoDB Shell ou outra ferramenta de administração.

---

## 🔴 Collection: `contasPagar`

### Schema de Validação JSON

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
    "properties": {
      "numeroDocumento": {
        "bsonType": "string",
        "description": "Número único do documento (CP001, CPP-001, CPPAI-001)"
      },
      "descricao": {
        "bsonType": "string",
        "minLength": 3,
        "description": "Descrição da conta a pagar"
      },
      "fornecedor": {
        "bsonType": "object",
        "properties": {
          "codigoFornecedor": { "bsonType": "string" },
          "nome": { "bsonType": "string" }
        },
        "description": "Dados do fornecedor (opcional)"
      },
      "categoria": {
        "bsonType": "string",
        "description": "Categoria da despesa (ex: Fornecedores, Aluguel, Salários)"
      },
      "valor": {
        "bsonType": "double",
        "minimum": 0,
        "description": "Valor total da conta"
      },
      "dataEmissao": {
        "bsonType": "date",
        "description": "Data de emissão do documento"
      },
      "dataVencimento": {
        "bsonType": "date",
        "description": "Data de vencimento da conta"
      },
      "status": {
        "enum": ["Pendente", "Pago", "Vencido", "Parcial"],
        "description": "Status atual da conta"
      },
      "observacoes": {
        "bsonType": "string",
        "description": "Observações adicionais (opcional)"
      },
      "tipoCriacao": {
        "enum": ["Unica", "Parcelamento", "Replica"],
        "description": "Tipo de criação da conta"
      },
      "pagamento": {
        "bsonType": "object",
        "properties": {
          "valor": {
            "bsonType": "double",
            "minimum": 0
          },
          "data": {
            "bsonType": "date"
          },
          "formaPagamento": {
            "enum": ["Pix", "Cartão de Crédito", "Cartão de Débito", "Dinheiro", "Boleto", "Transferência", "Outro"]
          },
          "comprovante": {
            "bsonType": "string"
          },
          "observacoes": {
            "bsonType": "string"
          }
        },
        "description": "Dados do pagamento (apenas para contas únicas)"
      },
      "detalhesParcelamento": {
        "bsonType": "object",
        "properties": {
          "quantidadeParcelas": {
            "bsonType": "int",
            "minimum": 1
          },
          "valorTotal": {
            "bsonType": "double",
            "minimum": 0
          }
        },
        "description": "Detalhes do parcelamento (apenas para tipo Parcelamento)"
      },
      "parcelas": {
        "bsonType": "array",
        "items": {
          "bsonType": "object",
          "required": ["numeroParcela", "valor", "dataVencimento", "status"],
          "properties": {
            "numeroParcela": {
              "bsonType": "int"
            },
            "valor": {
              "bsonType": "double",
              "minimum": 0
            },
            "dataVencimento": {
              "bsonType": "date"
            },
            "status": {
              "enum": ["Pendente", "Pago", "Vencido", "Parcial"]
            },
            "pagamento": {
              "bsonType": "object",
              "properties": {
                "valor": {
                  "bsonType": "double",
                  "minimum": 0
                },
                "data": {
                  "bsonType": "date"
                },
                "formaPagamento": {
                  "enum": ["Pix", "Cartão de Crédito", "Cartão de Débito", "Dinheiro", "Boleto", "Transferência", "Outro"]
                },
                "comprovante": {
                  "bsonType": "string"
                },
                "observacoes": {
                  "bsonType": "string"
                }
              }
            }
          }
        },
        "description": "Lista de parcelas (apenas para tipo Parcelamento)"
      },
      "detalhesReplica": {
        "bsonType": "object",
        "properties": {
          "quantidadeReplicas": {
            "bsonType": "int",
            "minimum": 1
          },
          "valor": {
            "bsonType": "double",
            "minimum": 0
          }
        },
        "description": "Detalhes da réplica (apenas para tipo Replica)"
      },
      "replicaDe": {
        "bsonType": "string",
        "description": "ID da conta pai que originou esta réplica"
      },
      "dataCadastro": {
        "bsonType": "date",
        "description": "Data de cadastro (gerada automaticamente)"
      },
      "dataAtualizacao": {
        "bsonType": "date",
        "description": "Data de última atualização (gerada automaticamente)"
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

### Schema de Validação JSON

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
    "properties": {
      "numeroDocumento": {
        "bsonType": "string",
        "description": "Número único do documento (CR001, CRP-001, CRPAI-001)"
      },
      "descricao": {
        "bsonType": "string",
        "minLength": 3,
        "description": "Descrição da conta a receber"
      },
      "cliente": {
        "bsonType": "object",
        "properties": {
          "codigoCliente": { "bsonType": "string" },
          "nome": { "bsonType": "string" }
        },
        "description": "Dados do cliente (opcional)"
      },
      "vendaRelacionada": {
        "bsonType": "object",
        "properties": {
          "codigoVenda": { "bsonType": "string" }
        },
        "description": "Venda relacionada à conta (opcional)"
      },
      "categoria": {
        "bsonType": "string",
        "description": "Categoria da receita (ex: Vendas, Serviços, Outros)"
      },
      "valor": {
        "bsonType": "double",
        "minimum": 0,
        "description": "Valor total da conta"
      },
      "dataEmissao": {
        "bsonType": "date",
        "description": "Data de emissão do documento"
      },
      "dataVencimento": {
        "bsonType": "date",
        "description": "Data de vencimento da conta"
      },
      "status": {
        "enum": ["Pendente", "Recebido", "Vencido", "Parcial"],
        "description": "Status atual da conta"
      },
      "observacoes": {
        "bsonType": "string",
        "description": "Observações adicionais (opcional)"
      },
      "tipoCriacao": {
        "enum": ["Unica", "Parcelamento", "Replica"],
        "description": "Tipo de criação da conta"
      },
      "recebimento": {
        "bsonType": "object",
        "properties": {
          "valor": {
            "bsonType": "double",
            "minimum": 0
          },
          "data": {
            "bsonType": "date"
          },
          "formaPagamento": {
            "enum": ["Pix", "Cartão de Crédito", "Cartão de Débito", "Dinheiro", "Boleto", "Transferência", "Outro"]
          },
          "comprovante": {
            "bsonType": "string"
          },
          "observacoes": {
            "bsonType": "string"
          }
        },
        "description": "Dados do recebimento (apenas para contas únicas)"
      },
      "detalhesParcelamento": {
        "bsonType": "object",
        "properties": {
          "quantidadeParcelas": {
            "bsonType": "int",
            "minimum": 1
          },
          "valorTotal": {
            "bsonType": "double",
            "minimum": 0
          }
        },
        "description": "Detalhes do parcelamento (apenas para tipo Parcelamento)"
      },
      "parcelas": {
        "bsonType": "array",
        "items": {
          "bsonType": "object",
          "required": ["numeroParcela", "valor", "dataVencimento", "status"],
          "properties": {
            "numeroParcela": {
              "bsonType": "int"
            },
            "valor": {
              "bsonType": "double",
              "minimum": 0
            },
            "dataVencimento": {
              "bsonType": "date"
            },
            "status": {
              "enum": ["Pendente", "Recebido", "Vencido", "Parcial"]
            },
            "recebimento": {
              "bsonType": "object",
              "properties": {
                "valor": {
                  "bsonType": "double",
                  "minimum": 0
                },
                "data": {
                  "bsonType": "date"
                },
                "formaPagamento": {
                  "enum": ["Pix", "Cartão de Crédito", "Cartão de Débito", "Dinheiro", "Boleto", "Transferência", "Outro"]
                },
                "comprovante": {
                  "bsonType": "string"
                },
                "observacoes": {
                  "bsonType": "string"
                }
              }
            }
          }
        },
        "description": "Lista de parcelas (apenas para tipo Parcelamento)"
      },
      "detalhesReplica": {
        "bsonType": "object",
        "properties": {
          "quantidadeReplicas": {
            "bsonType": "int",
            "minimum": 1
          },
          "valor": {
            "bsonType": "double",
            "minimum": 0
          }
        },
        "description": "Detalhes da réplica (apenas para tipo Replica)"
      },
      "replicaDe": {
        "bsonType": "string",
        "description": "ID da conta pai que originou esta réplica"
      },
      "dataCadastro": {
        "bsonType": "date",
        "description": "Data de cadastro (gerada automaticamente)"
      },
      "dataAtualizacao": {
        "bsonType": "date",
        "description": "Data de última atualização (gerada automaticamente)"
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

### Opção 1: MongoDB Compass (Interface Gráfica)

1. Abra o MongoDB Compass
2. Conecte-se ao seu banco de dados
3. Selecione a collection `contasPagar`
4. Clique em "Validation" na aba lateral
5. Cole o JSON Schema correspondente
6. Clique em "Update"
7. Repita para `contasReceber`

### Opção 2: MongoDB Shell

```javascript
// Para contasPagar
db.runCommand({
  collMod: "contasPagar",
  validator: {
    // Cole aqui o JSON Schema de contasPagar
  },
  validationLevel: "moderate",
  validationAction: "error"
});

// Para contasReceber
db.runCommand({
  collMod: "contasReceber",
  validator: {
    // Cole aqui o JSON Schema de contasReceber
  },
  validationLevel: "moderate",
  validationAction: "error"
});
```

### Opção 3: Via Código (Mongoose já faz isso automaticamente)

Os schemas já estão definidos nos modelos Mongoose em:
- `server/models/ContasPagar.ts`
- `server/models/ContasReceber.ts`

O Mongoose cria automaticamente as validações no MongoDB quando os modelos são inicializados.

---

## ✅ Correções Implementadas

1. **Campos opcionais de pagamento/recebimento**: Agora são explicitamente opcionais e não causam erros de validação
2. **Subdocumentos de parcelas**: Os objetos de pagamento/recebimento dentro das parcelas também são opcionais
3. **Validação de enums**: Formas de pagamento validadas corretamente
4. **Valores mínimos**: Todos os valores financeiros devem ser >= 0

---

## 🔧 Testes Recomendados

Após aplicar os schemas, teste:

1. ✅ Criar conta única sem pagamento
2. ✅ Registrar pagamento em conta única
3. ✅ Criar parcelamento
4. ✅ Registrar pagamento de parcela específica
5. ✅ Criar réplica de contas
6. ✅ Verificar se caixa aberto é obrigatório para pagamentos/recebimentos

---

## 📞 Suporte

Se encontrar algum erro de validação:
1. Verifique se o caixa está aberto (obrigatório para pagamentos/recebimentos)
2. Confirme que os valores são números positivos
3. Valide que a forma de pagamento está entre as opções permitidas
4. Verifique os logs do servidor para mensagens de erro detalhadas
