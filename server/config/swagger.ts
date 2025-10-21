import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mariela Moda - API Documentation',
      version: '1.0.0',
      description: 'API para o sistema de PDV da Mariela Moda Feminina',
      contact: {
        name: 'Mariela Moda',
        email: 'contato@marielamoda.com.br'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Servidor de Desenvolvimento'
      }
    ],
    tags: [
      {
        name: 'Clientes',
        description: 'Gerenciamento de clientes'
      },
      {
        name: 'Produtos',
        description: 'Gerenciamento de produtos'
      },
      {
        name: 'Estoque',
        description: 'Gerenciamento de estoque'
      },
      {
        name: 'Vendas',
        description: 'Gerenciamento de vendas'
      },
      {
        name: 'Vendedores',
        description: 'Gerenciamento de vendedores'
      },
      {
        name: 'Fornecedores',
        description: 'Gerenciamento de fornecedores'
      },
      {
        name: 'Vitrine Virtual',
        description: 'Produtos disponíveis na vitrine virtual'
      }
    ],
    components: {
      schemas: {
        Cliente: {
          type: 'object',
          required: ['codigoCliente', 'nome', 'telefone', 'dataNascimento'],
          properties: {
            _id: {
              type: 'string',
              description: 'ID gerado automaticamente pelo MongoDB'
            },
            codigoCliente: {
              type: 'string',
              pattern: '^C\\d{3}$',
              example: 'C001',
              description: 'Código único do cliente (formato: C + 3 dígitos)'
            },
            nome: {
              type: 'string',
              minLength: 3,
              maxLength: 100,
              description: 'Nome completo do cliente'
            },
            telefone: {
              type: 'string',
              pattern: '^\\(\\d{2}\\) \\d{4,5}-\\d{4}$',
              example: '(11) 98765-4321',
              description: 'Telefone no formato (XX) XXXXX-XXXX'
            },
            dataNascimento: {
              type: 'string',
              pattern: '^\\d{4}-\\d{2}-\\d{2}$',
              example: '1990-01-15',
              description: 'Data de nascimento (YYYY-MM-DD)'
            },
            observacao: {
              type: 'string',
              maxLength: 500,
              description: 'Observações sobre o cliente'
            },
            dataCadastro: {
              type: 'string',
              format: 'date-time',
              description: 'Data de cadastro'
            }
          }
        },
        Produto: {
          type: 'object',
          required: ['codigo', 'nome', 'categoria', 'cor', 'precoCusto', 'precoVenda'],
          properties: {
            _id: {
              type: 'string'
            },
            codigo: {
              type: 'string',
              pattern: '^P\\d{3}$',
              example: 'P101'
            },
            nome: {
              type: 'string',
              minLength: 3,
              maxLength: 100
            },
            descricao: {
              type: 'string'
            },
            categoria: {
              type: 'string',
              enum: ['Calça', 'Saia', 'Vestido', 'Blusa', 'Bolsa', 'Acessório', 'Outro']
            },
            cor: {
              type: 'string'
            },
            precoCusto: {
              type: 'number',
              minimum: 0
            },
            precoVenda: {
              type: 'number',
              minimum: 0
            },
            precoPromocional: {
              type: 'number',
              minimum: 0
            },
            imagens: {
              type: 'array',
              items: {
                type: 'string'
              }
            }
          }
        },
        Estoque: {
          type: 'object',
          required: ['codigoProduto', 'tamanho', 'quantidade'],
          properties: {
            codigoProduto: {
              type: 'string',
              pattern: '^P\\d{3}$'
            },
            tamanho: {
              type: 'string',
              enum: ['PP', 'P', 'M', 'G', 'GG', 'U']
            },
            quantidade: {
              type: 'number',
              minimum: 0
            },
            emPromocao: {
              type: 'boolean'
            },
            isNovidade: {
              type: 'boolean'
            },
            valorPromocional: {
              type: 'number'
            }
          }
        },
        Venda: {
          type: 'object',
          required: ['codigoVenda', 'data', 'cliente', 'vendedor', 'itens', 'total', 'formaPagamento'],
          properties: {
            codigoVenda: {
              type: 'string',
              pattern: '^VENDA\\d{8}-\\d{3}$',
              example: 'VENDA20250117-001'
            },
            data: {
              type: 'string',
              format: 'date-time'
            },
            cliente: {
              type: 'object',
              properties: {
                codigoCliente: {
                  type: 'string'
                },
                nome: {
                  type: 'string'
                }
              }
            },
            vendedor: {
              type: 'object',
              properties: {
                id: {
                  type: 'string'
                },
                nome: {
                  type: 'string'
                }
              }
            },
            itens: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  codigoProduto: {
                    type: 'string'
                  },
                  nomeProduto: {
                    type: 'string'
                  },
                  tamanho: {
                    type: 'string'
                  },
                  quantidade: {
                    type: 'number'
                  },
                  precoUnitario: {
                    type: 'number'
                  },
                  precoFinalUnitario: {
                    type: 'number'
                  },
                  descontoAplicado: {
                    type: 'number'
                  },
                  subtotal: {
                    type: 'number'
                  }
                }
              }
            },
            total: {
              type: 'number'
            },
            totalDesconto: {
              type: 'number'
            },
            formaPagamento: {
              type: 'string',
              enum: ['Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro']
            }
          }
        },
        Vendedor: {
          type: 'object',
          required: ['codigoVendedor', 'nome'],
          properties: {
            codigoVendedor: {
              type: 'string',
              pattern: '^V\\d{3}$',
              example: 'V001'
            },
            nome: {
              type: 'string'
            },
            telefone: {
              type: 'string'
            },
            dataNascimento: {
              type: 'string',
              format: 'date'
            },
            ativo: {
              type: 'boolean'
            },
            metaMensal: {
              type: 'number'
            },
            observacao: {
              type: 'string'
            }
          }
        },
        Fornecedor: {
          type: 'object',
          required: ['codigoFornecedor', 'nome', 'telefone', 'endereco'],
          properties: {
            codigoFornecedor: {
              type: 'string',
              pattern: '^F\\d{3}$',
              example: 'F001'
            },
            nome: {
              type: 'string'
            },
            cnpj: {
              type: 'string',
              pattern: '^\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2}$'
            },
            telefone: {
              type: 'string'
            },
            instagram: {
              type: 'string'
            },
            endereco: {
              type: 'object',
              properties: {
                rua: {
                  type: 'string'
                },
                numero: {
                  type: 'string'
                },
                bairro: {
                  type: 'string'
                },
                cidade: {
                  type: 'string'
                },
                estado: {
                  type: 'string'
                },
                cep: {
                  type: 'string'
                }
              }
            },
            observacao: {
              type: 'string'
            }
          }
        }
      }
    }
  },
  apis: [
    './server/routes/*.ts',
    './server/routes/*.js',
    './dist/routes/*.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
