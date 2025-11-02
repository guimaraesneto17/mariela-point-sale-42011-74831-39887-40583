/**
 * Script para corrigir o schema de validação da collection 'venda' no MongoDB
 * 
 * COMO EXECUTAR:
 * 1. Conecte-se ao seu banco MongoDB
 * 2. Execute este comando no MongoDB Shell ou MongoDB Compass
 */

db.runCommand({
  collMod: "venda",
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: [
        'codigoVenda',
        'data',
        'cliente',
        'vendedor',
        'formaPagamento',
        'itens',
        'total'
      ],
      properties: {
        _id: {
          bsonType: 'objectId',
          description: 'Identificador único gerado automaticamente pelo MongoDB'
        },
        codigoVenda: {
          bsonType: 'string',
          pattern: '^VENDA\\d{8}-\\d{3}$',
          description: 'Código da venda no formato VENDAyyyymmdd-xxx'
        },
        data: {
          bsonType: 'string',
          pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z$',
          description: 'Data e hora da venda em formato ISO (YYYY-MM-DDTHH:MM:SSZ)'
        },
        formaPagamento: {
          bsonType: 'string',
          'enum': [
            'Pix',
            'Cartão de Crédito',
            'Cartão de Débito',
            'Dinheiro'
          ],
          description: 'Forma de pagamento utilizada'
        },
        parcelamento: {
          bsonType: [
            'string',
            'null'
          ],
          description: 'Quantidade e valor do parcelamento (Quando formaPagamento: Cartão de Crédito)'
        },
        cliente: {
          bsonType: 'object',
          required: [
            'codigoCliente',
            'nome'
          ],
          properties: {
            codigoCliente: {
              bsonType: 'string',
              pattern: '^C\\d{3}$',
              description: 'Código do cliente (formato: C + 3 dígitos)'
            },
            nome: {
              bsonType: 'string',
              minLength: 3,
              maxLength: 100,
              description: 'Nome do cliente'
            }
          }
        },
        vendedor: {
          bsonType: 'object',
          required: [
            'codigoVendedor',
            'nome'
          ],
          properties: {
            codigoVendedor: {
              bsonType: 'string',
              pattern: '^V\\d{3}$',
              description: 'Código do vendedor (formato: V + 3 dígitos)'
            },
            nome: {
              bsonType: 'string',
              minLength: 3,
              maxLength: 100,
              description: 'Nome completo do vendedor'
            }
          }
        },
        itens: {
          bsonType: 'array',
          minItems: 1,
          description: 'Lista de produtos incluídos na venda',
          items: {
            bsonType: 'object',
            required: [
              'codigoProduto',
              'nomeProduto',
              'cor',
              'tamanho',
              'quantidade',
              'precoUnitario',
              'precoFinalUnitario'
            ],
            properties: {
              codigoProduto: {
                bsonType: 'string',
                pattern: '^P\\d{3}$',
                description: 'Código do produto (formato: P + 3 dígitos)'
              },
              nomeProduto: {
                bsonType: 'string',
                description: 'Nome do produto vendido'
              },
              cor: {
                bsonType: 'string',
                description: 'Cor do produto vendido'
              },
              tamanho: {
                bsonType: 'string',
                description: 'Tamanho do produto vendido (ex: P, M, G, U)'
              },
              quantidade: {
                bsonType: [
                  'int',
                  'double'
                ],
                minimum: 1,
                description: 'Quantidade vendida do item'
              },
              precoUnitario: {
                bsonType: [
                  'double',
                  'int'
                ],
                minimum: 0,
                description: 'Preço original unitário do produto'
              },
              descontoAplicado: {
                bsonType: [
                  'double',
                  'int'
                ],
                minimum: 0,
                maximum: 100,
                description: 'Percentual de desconto aplicado'
              },
              precoFinalUnitario: {
                bsonType: [
                  'double',
                  'int'
                ],
                minimum: 0,
                description: 'Preço final unitário após desconto'
              },
              subtotal: {
                bsonType: [
                  'double',
                  'int'
                ],
                minimum: 0,
                description: 'Subtotal do item (quantidade x precoFinalUnitario)'
              }
            }
          }
        },
        descontoAplicadoFinal: {
          bsonType: [
            'double',
            'int',
            'null'
          ],
          minimum: 0,
          maximum: 100,
          description: 'Percentual de desconto aplicado no final da venda'
        },
        taxaMaquininha: {
          bsonType: [
            'double',
            'int'
          ],
          minimum: 0,
          maximum: 100,
          description: 'Taxa da maquininha em percentual'
        },
        total: {
          bsonType: [
            'double',
            'int'
          ],
          minimum: 0,
          description: 'Valor total da venda'
        },
        parcelas: {
          bsonType: [
            'int',
            'double'
          ],
          minimum: 1,
          description: 'Número de parcelas'
        },
        valorTaxa: {
          bsonType: [
            'double',
            'int'
          ],
          minimum: 0,
          description: 'Valor da taxa em reais'
        },
        valorRecebido: {
          bsonType: [
            'double',
            'int'
          ],
          minimum: 0,
          description: 'Valor recebido pelo lojista'
        },
        totalDesconto: {
          bsonType: [
            'double',
            'int'
          ],
          minimum: 0,
          description: 'Total de desconto aplicado'
        },
        observacoes: {
          bsonType: 'string',
          description: 'Observações sobre a venda'
        },
        dataCadastro: {
          bsonType: 'date',
          description: 'Data de cadastro da venda'
        },
        dataAtualizacao: {
          bsonType: 'date',
          description: 'Data de atualização da venda'
        }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});
