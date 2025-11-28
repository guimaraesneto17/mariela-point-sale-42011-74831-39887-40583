import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import { fileURLToPath } from 'url';

// Obter __dirname em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
        name: 'Autenticação',
        description: 'Endpoints de autenticação e validação de token JWT'
      },
      {
        name: 'Clientes',
        description: 'Gerenciamento de clientes (requer autenticação)'
      },
      {
        name: 'Produtos',
        description: 'Gerenciamento de produtos (requer autenticação)'
      },
      {
        name: 'Estoque',
        description: 'Gerenciamento de estoque (requer autenticação)'
      },
      {
        name: 'Vendas',
        description: 'Gerenciamento de vendas (requer autenticação)'
      },
      {
        name: 'Vendedores',
        description: 'Gerenciamento de vendedores (requer autenticação)'
      },
      {
        name: 'Fornecedores',
        description: 'Gerenciamento de fornecedores (requer autenticação)'
      },
      {
        name: 'Vitrine Virtual',
        description: 'Produtos disponíveis na vitrine virtual (público)'
      },
      {
        name: 'Caixa',
        description: 'Gerenciamento de caixa (requer autenticação)'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtido através do endpoint de login (/api/auth/login)'
        }
      },
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
            required: ['codigoProduto', 'nome', 'categoria'],
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
              precoCusto: {
                type: 'number',
                minimum: 0,
                description: 'Preço de custo do produto'
              },
              precoVenda: {
                type: 'number',
                minimum: 0,
                description: 'Preço de venda do produto'
              },
              margemDeLucro: {
                type: 'number',
                description: 'Margem de lucro percentual'
              },
              fornecedor: {
                type: 'object',
                properties: {
                  codigoFornecedor: {
                    type: 'string',
                    pattern: '^F\\d{3}$'
                  },
                  nome: {
                    type: 'string'
                  }
                }
              }
            }
          },
          Estoque: {
            type: 'object',
            required: ['codigoProduto', 'quantidade', 'variantes'],
            properties: {
              codigoProduto: {
                type: 'string',
                pattern: '^P\\d{3}$',
                example: 'P101',
                description: 'Código do produto'
              },
              quantidade: {
                type: 'number',
                minimum: 0,
                description: 'Quantidade total em estoque (soma de todas as variantes)'
              },
              variantes: {
                type: 'array',
                description: 'Lista de variantes do produto (cor, tamanho, quantidade, imagens)',
                items: {
                  type: 'object',
                  required: ['cor', 'tamanho', 'quantidade'],
                  properties: {
                    cor: {
                      type: 'string',
                      description: 'Cor da variante'
                    },
                    tamanho: {
                      type: 'string',
                      description: 'Tamanho da variante'
                    },
                    quantidade: {
                      type: 'number',
                      minimum: 0,
                      description: 'Quantidade disponível dessa variante'
                    },
                    imagens: {
                      type: 'array',
                      description: 'URLs das imagens desta variante',
                      items: {
                        type: 'string'
                      }
                    }
                  }
                }
              },
              emPromocao: {
                type: 'boolean',
                description: 'Se o produto está em promoção'
              },
              isNovidade: {
                type: 'boolean',
                description: 'Se o produto é novidade'
              },
              precoPromocional: {
                type: 'number',
                minimum: 0,
                description: 'Preço promocional quando em promoção'
              },
              ativo: {
                type: 'boolean',
                description: 'Se o estoque está ativo'
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
          },
          Caixa: {
            type: 'object',
            required: ['codigoCaixa', 'dataAbertura', 'status', 'valorInicial', 'entrada', 'saida', 'performance', 'movimentos'],
            properties: {
              codigoCaixa: {
                type: 'string',
                pattern: '^CAIXA\\d{8}-\\d{3}$',
                example: 'CAIXA20250102-001',
                description: 'Identificador único do caixa (formato: CAIXA + data + sequencial)'
              },
              dataAbertura: {
                type: 'string',
                format: 'date-time',
                description: 'Data e hora de abertura do caixa'
              },
              dataFechamento: {
                type: 'string',
                format: 'date-time',
                nullable: true,
                description: 'Data e hora de fechamento do caixa (null enquanto aberto)'
              },
              status: {
                type: 'string',
                enum: ['aberto', 'fechado'],
                description: 'Status atual do caixa'
              },
              valorInicial: {
                type: 'number',
                minimum: 0,
                description: 'Valor inicial inserido no caixa ao abrir'
              },
              entrada: {
                type: 'number',
                minimum: 0,
                description: 'Total de entradas (vendas + injeções)'
              },
              saida: {
                type: 'number',
                minimum: 0,
                description: 'Total de saídas (sangrias)'
              },
              performance: {
                type: 'number',
                description: 'Resultado final: entrada - saída'
              },
              movimentos: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['tipo', 'valor', 'data'],
                  properties: {
                    tipo: {
                      type: 'string',
                      enum: ['entrada', 'saida'],
                      description: 'Tipo da movimentação'
                    },
                    valor: {
                      type: 'number',
                      minimum: 0,
                      description: 'Valor da movimentação'
                    },
                    data: {
                      type: 'string',
                      format: 'date-time',
                      description: 'Data e hora da movimentação'
                    },
                    codigoVenda: {
                      type: 'string',
                      nullable: true,
                      description: 'Código da venda associada (se aplicável)'
                    },
                    formaPagamento: {
                      type: 'string',
                      enum: ['Dinheiro', 'Pix', 'Cartão de Crédito', 'Cartão de Débito', null],
                      nullable: true,
                      description: 'Forma de pagamento (para vendas)'
                    },
                    observacao: {
                      type: 'string',
                      nullable: true,
                      description: 'Observação sobre a movimentação'
                    }
                  }
                }
              }
            }
          },
          VitrineVirtual: {
            type: 'object',
            description: 'View agregada de Produto + Estoque formatada para exibição na vitrine virtual',
            required: ['codigoProduto', 'nome', 'categoria', 'precoVenda', 'variantes', 'statusProduct', 'totalAvailable', 'isOnSale', 'isNew'],
            properties: {
              _id: {
                type: 'string',
                description: 'ID único do produto no MongoDB',
                example: '690eaeca920edfaa6e738b82'
              },
              codigoProduto: {
                type: 'string',
                pattern: '^P\\d{3}$',
                description: 'Código do produto',
                example: 'P002'
              },
              nome: {
                type: 'string',
                description: 'Nome do produto',
                example: 'Camisa'
              },
              descricao: {
                type: 'string',
                description: 'Descrição do produto',
                example: 'produto teste, descrição teste'
              },
              categoria: {
                type: 'string',
                description: 'Categoria do produto',
                example: 'Blusa'
              },
              precoVenda: {
                type: 'number',
                format: 'float',
                description: 'Preço de venda do produto',
                example: 102.00
              },
              precoPromocional: {
                type: 'number',
                format: 'float',
                nullable: true,
                description: 'Preço promocional quando em promoção',
                example: null
              },
              variantes: {
                type: 'array',
                description: 'Lista de variantes do produto (cor, tamanhos, quantidade, imagens)',
                items: {
                  type: 'object',
                  required: ['cor', 'quantidade', 'tamanhos'],
                  properties: {
                    _id: {
                      type: 'string',
                      description: 'ID único da variante',
                      example: '691ffe3b461fede890022835'
                    },
                    cor: {
                      type: 'string',
                      description: 'Cor da variante',
                      example: 'Amarelo'
                    },
                    quantidade: {
                      type: 'number',
                      description: 'Quantidade total da cor (soma de todos os tamanhos)',
                      example: 5
                    },
                    tamanhos: {
                      type: 'array',
                      description: 'Lista de tamanhos disponíveis para esta cor',
                      items: {
                        type: 'object',
                        required: ['tamanho', 'quantidade'],
                        properties: {
                          _id: {
                            type: 'string',
                            example: '691ffe3b461fede890022836'
                          },
                          tamanho: {
                            type: 'string',
                            description: 'Tamanho',
                            example: 'U'
                          },
                          quantidade: {
                            type: 'number',
                            description: 'Quantidade disponível deste tamanho',
                            example: 5
                          }
                        }
                      }
                    },
                    imagens: {
                      type: 'array',
                      description: 'URLs das imagens desta variante',
                      items: {
                        type: 'string'
                      },
                      example: []
                    }
                  }
                }
              },
              statusProduct: {
                type: 'string',
                enum: ['Disponível', 'Últimas unidades', 'Esgotado'],
                description: 'Status calculado baseado na disponibilidade total',
                example: 'Disponível'
              },
              totalAvailable: {
                type: 'number',
                description: 'Total disponível somando todas as variantes e tamanhos',
                example: 8
              },
              isOnSale: {
                type: 'boolean',
                description: 'Se o produto está em promoção',
                example: false
              },
              isNew: {
                type: 'boolean',
                description: 'Se o produto é novidade',
                example: false
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
                description: 'Data da última atualização',
                example: '2025-11-21T05:55:52.845Z'
              }
            }
          }
        }
      }
    },
    apis: [
      path.join(__dirname, '../routes/*.ts'),
      path.join(__dirname, '../routes/*.js')
    ]
  }
};
const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
