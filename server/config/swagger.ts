import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mariela Moda - API Documentation',
      version: '1.0.1',
      description: 'API para o sistema de PDV da Mariela Moda Feminina',
    },
    servers: [
      {
        url: 'https://mariela-pdv-backend.onrender.com',
        description: 'Servidor de Produção (Render)'
      },
      {
        url: 'http://localhost:3001',
        description: 'Servidor de Desenvolvimento Local'
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
          required: ['codigoProduto', 'nome', 'categoria', 'cor'],
          properties: {
            codigoProduto: {
              type: 'string',
              pattern: '^P\\d{3}$',
              example: 'P101',
              description: 'Código único do produto (formato: P + 3 dígitos)'
            },
            nome: {
              type: 'string',
              minLength: 3,
              maxLength: 100,
              description: 'Nome do produto'
            },
            descricao: {
              type: 'string',
              description: 'Descrição detalhada do produto'
            },
            categoria: {
              type: 'string',
              enum: ['Calça', 'Saia', 'Vestido', 'Blusa', 'Bolsa', 'Acessório', 'Outro'],
              description: 'Categoria do produto'
            },
            cor: {
              type: 'string',
              description: 'Cor do produto'
            },
            ativo: {
              type: 'boolean',
              description: 'Se o produto está ativo'
            },
            imagens: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'URLs das imagens do produto'
            }
          }
        },
        Estoque: {
          type: 'object',
          required: ['codigoProduto', 'tamanho', 'quantidade', 'precoCusto', 'precoVenda'],
          properties: {
            codigoProduto: {
              type: 'string',
              pattern: '^P\\d{3}$',
              example: 'P101',
              description: 'Código do produto'
            },
            tamanho: {
              type: 'string',
              enum: ['PP', 'P', 'M', 'G', 'GG', 'U'],
              description: 'Tamanho do produto'
            },
            quantidade: {
              type: 'number',
              minimum: 0,
              description: 'Quantidade em estoque'
            },
            precoCusto: {
              type: 'number',
              minimum: 0,
              description: 'Preço de custo'
            },
            precoVenda: {
              type: 'number',
              minimum: 0,
              description: 'Preço de venda'
            },
            margemDeLucro: {
              type: 'number',
              description: 'Margem de lucro percentual'
            },
            emPromocao: {
              type: 'boolean',
              description: 'Se o produto está em promoção'
            },
            isNovidade: {
              type: 'boolean',
              description: 'Se o produto é novidade'
            },
            valorPromocional: {
              type: 'number',
              description: 'Valor promocional quando em promoção'
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
              example: 'VENDA20250117-001',
              description: 'Código único da venda (formato: VENDA + data + sequencial)'
            },
            data: {
              type: 'string',
              format: 'date-time',
              description: 'Data e hora da venda'
            },
            cliente: {
              type: 'object',
              required: ['codigoCliente', 'nome'],
              properties: {
                codigoCliente: {
                  type: 'string',
                  example: 'C001',
                  description: 'Código do cliente'
                },
                nome: {
                  type: 'string',
                  description: 'Nome do cliente'
                }
              }
            },
            vendedor: {
              type: 'object',
              required: ['codigoVendedor', 'nome'],
              properties: {
                codigoVendedor: {
                  type: 'string',
                  example: 'V001',
                  description: 'Código do vendedor'
                },
                nome: {
                  type: 'string',
                  description: 'Nome do vendedor'
                }
              }
            },
            itens: {
              type: 'array',
              items: {
                type: 'object',
                required: ['codigoProduto', 'nomeProduto', 'cor', 'tamanho', 'quantidade', 'precoUnitario', 'subtotal'],
                properties: {
                  codigoProduto: {
                    type: 'string',
                    example: 'P101'
                  },
                  nomeProduto: {
                    type: 'string'
                  },
                  cor: {
                    type: 'string',
                    example: 'Vermelho'
                  },
                  tamanho: {
                    type: 'string'
                  },
                  quantidade: {
                    type: 'number',
                    minimum: 1
                  },
                  precoUnitario: {
                    type: 'number',
                    minimum: 0
                  },
                  precoFinalUnitario: {
                    type: 'number',
                    minimum: 0
                  },
                  descontoAplicado: {
                    type: 'number',
                    minimum: 0
                  },
                  subtotal: {
                    type: 'number',
                    minimum: 0
                  }
                }
              }
            },
            total: {
              type: 'number',
              minimum: 0,
              description: 'Valor total da venda'
            },
            totalDesconto: {
              type: 'number',
              minimum: 0,
              description: 'Total de descontos aplicados'
            },
            formaPagamento: {
              type: 'string',
              enum: ['Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro'],
              description: 'Forma de pagamento'
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
              example: 'V001',
              description: 'Código único do vendedor (formato: V + 3 dígitos)'
            },
            nome: {
              type: 'string',
              description: 'Nome do vendedor'
            },
            telefone: {
              type: 'string',
              pattern: '^\\(\\d{2}\\) \\d{4,5}-\\d{4}$',
              example: '(11) 98765-4321',
              description: 'Telefone no formato (XX) XXXXX-XXXX'
            },
            dataNascimento: {
              type: 'string',
              format: 'date',
              description: 'Data de nascimento'
            },
            ativo: {
              type: 'boolean',
              description: 'Status ativo/inativo'
            },
            metaMensal: {
              type: 'number',
              minimum: 0,
              description: 'Meta de vendas mensal'
            },
            observacao: {
              type: 'string',
              maxLength: 500,
              description: 'Observações sobre o vendedor'
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
              example: 'F001',
              description: 'Código único do fornecedor (formato: F + 3 dígitos)'
            },
            nome: {
              type: 'string',
              description: 'Nome do fornecedor'
            },
            cnpj: {
              type: 'string',
              pattern: '^\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2}$',
              example: '12.345.678/0001-90',
              description: 'CNPJ no formato XX.XXX.XXX/XXXX-XX'
            },
            telefone: {
              type: 'string',
              pattern: '^\\(\\d{2}\\) \\d{4,5}-\\d{4}$',
              example: '(11) 98765-4321',
              description: 'Telefone no formato (XX) XXXXX-XXXX'
            },
            instagram: {
              type: 'string',
              description: 'Instagram do fornecedor'
            },
            endereco: {
              type: 'object',
              required: ['rua', 'cidade', 'estado'],
              properties: {
                rua: {
                  type: 'string',
                  description: 'Rua'
                },
                numero: {
                  type: 'string',
                  description: 'Número'
                },
                bairro: {
                  type: 'string',
                  description: 'Bairro'
                },
                cidade: {
                  type: 'string',
                  description: 'Cidade'
                },
                estado: {
                  type: 'string',
                  description: 'Estado (UF)'
                },
                cep: {
                  type: 'string',
                  pattern: '^\\d{5}-\\d{3}$',
                  example: '12345-678',
                  description: 'CEP no formato XXXXX-XXX'
                }
              }
            },
            observacao: {
              type: 'string',
              maxLength: 500,
              description: 'Observações sobre o fornecedor'
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
