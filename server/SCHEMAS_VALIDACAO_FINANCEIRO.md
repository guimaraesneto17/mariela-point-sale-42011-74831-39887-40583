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
    "description": "Schema de validação da coleção Contas a Pagar.",
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
        "description": "Objeto contendo os dados do fornecedor (opcional).",
        "properties": {
          "codigoFornecedor": {
            "bsonType": "string",
            "description": "Código único do fornecedor."
          },
          "nome": {
            "bsonType": "string",
            "description": "Nome completo do fornecedor."
          }
        }
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
        "description": "Dados do pagamento (somente para contas do tipo Única).",
        "properties": {
          "valor": {
            "bsonType": "double",
            "minimum": 0,
            "description": "Valor pago na operação."
          },
          "data": {
            "bsonType": "date",
            "description": "Data em que o pagamento foi realizado."
          },
          "formaPagamento": {
            "enum": [
              "Pix",
              "Cartão de Crédito",
              "Cartão de Débito",
              "Dinheiro",
              "Boleto",
              "Transferência",
              "Outro"
            ],
            "description": "Forma de pagamento utilizada."
          },
          "comprovante": {
            "bsonType": "string",
            "description": "Caminho ou nome do comprovante anexado."
          },
          "observacoes": {
            "bsonType": "string",
            "description": "Observação extra sobre o pagamento."
          }
        }
      },
      "detalhesParcelamento": {
        "bsonType": "object",
        "description": "Informações gerais do parcelamento (somente quando tipoCriacao = Parcelamento).",
        "properties": {
          "quantidadeParcelas": {
            "bsonType": "int",
            "minimum": 1,
            "description": "Quantidade total de parcelas."
          },
          "valorTotal": {
            "bsonType": "double",
            "minimum": 0,
            "description": "Valor total somado de todas as parcelas."
          }
        }
      },
      "parcelas": {
        "bsonType": "array",
        "description": "Lista de parcelas da conta (usada quando tipoCriacao = Parcelamento).",
        "items": {
          "bsonType": "object",
          "description": "Objeto contendo informações de cada parcela individual.",
          "required": ["numeroParcela", "valor", "dataVencimento", "status"],
          "properties": {
            "numeroParcela": {
              "bsonType": "int",
              "description": "Número sequencial da parcela."
            },
            "valor": {
              "bsonType": "double",
              "minimum": 0,
              "description": "Valor da parcela."
            },
            "dataVencimento": {
              "bsonType": "date",
              "description": "Data de vencimento da parcela."
            },
            "status": {
              "enum": ["Pendente", "Pago", "Vencido", "Parcial"],
              "description": "Status atual da parcela."
            },
            "pagamento": {
              "bsonType": "object",
              "description": "Informações de pagamento da parcela (opcional).",
              "properties": {
                "valor": {
                  "bsonType": "double",
                  "minimum": 0,
                  "description": "Valor pago na parcela."
                },
                "data": {
                  "bsonType": "date",
                  "description": "Data em que o pagamento da parcela foi realizado."
                },
                "formaPagamento": {
                  "enum": [
                    "Pix",
                    "Cartão de Crédito",
                    "Cartão de Débito",
                    "Dinheiro",
                    "Boleto",
                    "Transferência",
                    "Outro"
                  ],
                  "description": "Forma de pagamento utilizada na parcela."
                },
                "comprovante": {
                  "bsonType": "string",
                  "description": "Comprovante referente ao pagamento da parcela."
                },
                "observacoes": {
                  "bsonType": "string",
                  "description": "Observações adicionais sobre o pagamento da parcela."
                }
              }
            }
          }
        }
      },
      "detalhesReplica": {
        "bsonType": "object",
        "description": "Informações de replicação (somente quando tipoCriacao = Replica).",
        "properties": {
          "quantidadeReplicas": {
            "bsonType": "int",
            "minimum": 1,
            "description": "Número de contas geradas como réplica."
          },
          "valor": {
            "bsonType": "double",
            "minimum": 0,
            "description": "Valor de cada réplica criada."
          }
        }
      },
      "replicaDe": {
        "bsonType": "string",
        "description": "ID da conta pai da qual esta réplica foi gerada."
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

### Schema de Validação JSON

```json
{
  "$jsonSchema": {
    "bsonType": "object",
    "description": "Schema de validação da coleção Contas a Receber.",
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
        "description": "Informações do cliente vinculado à conta (opcional).",
        "properties": {
          "codigoCliente": {
            "bsonType": "string",
            "description": "Código único do cliente."
          },
          "nome": {
            "bsonType": "string",
            "description": "Nome do cliente."
          }
        }
      },
      "vendaRelacionada": {
        "bsonType": "object",
        "description": "Venda que gerou esta conta a receber (opcional).",
        "properties": {
          "codigoVenda": {
            "bsonType": "string",
            "description": "Código identificador da venda associada."
          }
        }
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
        "description": "Dados do recebimento (apenas para contas do tipo Única).",
        "properties": {
          "valor": {
            "bsonType": "double",
            "minimum": 0,
            "description": "Valor recebido do cliente."
          },
          "data": {
            "bsonType": "date",
            "description": "Data do recebimento."
          },
          "formaPagamento": {
            "enum": [
              "Pix",
              "Cartão de Crédito",
              "Cartão de Débito",
              "Dinheiro",
              "Boleto",
              "Transferência",
              "Outro"
            ],
            "description": "Forma de pagamento utilizada no recebimento."
          },
          "comprovante": {
            "bsonType": "string",
            "description": "Arquivo ou referência do comprovante de pagamento."
          },
          "observacoes": {
            "bsonType": "string",
            "description": "Observações adicionais sobre o recebimento."
          }
        }
      },
      "detalhesParcelamento": {
        "bsonType": "object",
        "description": "Informações gerais do parcelamento (apenas quando tipoCriacao = Parcelamento).",
        "properties": {
          "quantidadeParcelas": {
            "bsonType": "int",
            "minimum": 1,
            "description": "Quantidade total de parcelas geradas."
          },
          "valorTotal": {
            "bsonType": "double",
            "minimum": 0,
            "description": "Valor total somado das parcelas."
          }
        }
      },
      "parcelas": {
        "bsonType": "array",
        "description": "Lista contendo todas as parcelas desta conta (apenas quando tipoCriacao = Parcelamento).",
        "items": {
          "bsonType": "object",
          "description": "Informações individuais da parcela.",
          "required": ["numeroParcela", "valor", "dataVencimento", "status"],
          "properties": {
            "numeroParcela": {
              "bsonType": "int",
              "description": "Número sequencial da parcela."
            },
            "valor": {
              "bsonType": "double",
              "minimum": 0,
              "description": "Valor da parcela."
            },
            "dataVencimento": {
              "bsonType": "date",
              "description": "Data de vencimento da parcela."
            },
            "status": {
              "enum": ["Pendente", "Recebido", "Vencido", "Parcial"],
              "description": "Status atual da parcela."
            },
            "recebimento": {
              "bsonType": "object",
              "description": "Informações do recebimento desta parcela (opcional).",
              "properties": {
                "valor": {
                  "bsonType": "double",
                  "minimum": 0,
                  "description": "Valor pago referente à parcela."
                },
                "data": {
                  "bsonType": "date",
                  "description": "Data em que a parcela foi paga."
                },
                "formaPagamento": {
                  "enum": [
                    "Pix",
                    "Cartão de Crédito",
                    "Cartão de Débito",
                    "Dinheiro",
                    "Boleto",
                    "Transferência",
                    "Outro"
                  ],
                  "description": "Forma de pagamento utilizada no recebimento da parcela."
                },
                "comprovante": {
                  "bsonType": "string",
                  "description": "Caminho ou nome do comprovante desta parcela."
                },
                "observacoes": {
                  "bsonType": "string",
                  "description": "Observações gerais sobre o recebimento da parcela."
                }
              }
            }
          }
        }
      },
      "detalhesReplica": {
        "bsonType": "object",
        "description": "Informações referentes à réplica (somente para tipoCriacao = Replica).",
        "properties": {
          "quantidadeReplicas": {
            "bsonType": "int",
            "minimum": 1,
            "description": "Quantidade de contas replicadas."
          },
          "valor": {
            "bsonType": "double",
            "minimum": 0,
            "description": "Valor da réplica gerada."
          }
        }
      },
      "replicaDe": {
        "bsonType": "string",
        "description": "ID da conta pai da qual esta conta foi replicada."
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
