import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mariela Moda - API Documentation',
      version: '1.1.0',
      description: 'API para o sistema de PDV da Mariela Moda Feminina. Sistema completo de gestão de vendas, estoque, clientes, fornecedores e finanças.',
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
        name: 'Health',
        description: 'Endpoints de verificação de saúde do sistema'
      },
      {
        name: 'Autenticação',
        description: 'Endpoints de autenticação, login, registro e validação de token JWT'
      },
      {
        name: 'Permissions',
        description: 'Gerenciamento de permissões por role (requer autenticação)'
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
        description: 'Gerenciamento de estoque, variantes e movimentações (requer autenticação)'
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
        description: 'Gerenciamento de caixa, abertura, fechamento e movimentações (requer autenticação)'
      },
      {
        name: 'Contas a Pagar',
        description: 'Gerenciamento de contas a pagar (requer autenticação)'
      },
      {
        name: 'Contas a Receber',
        description: 'Gerenciamento de contas a receber (requer autenticação)'
      },
      {
        name: 'Categorias Financeiras',
        description: 'Gerenciamento de categorias financeiras para contas (requer autenticação)'
      },
      {
        name: 'Cache',
        description: 'Gerenciamento de cache e performance (requer admin)'
      },
      {
        name: 'Cleanup',
        description: 'Limpeza de imagens órfãs e manutenção de storage (requer autenticação)'
      },
      {
        name: 'Upload',
        description: 'Upload de imagens para Vercel Blob'
      },
      {
        name: 'Search',
        description: 'Busca avançada de produtos com filtros combinados (requer autenticação)'
      },
      {
        name: 'Recálculo',
        description: 'Recálculo de totais e estatísticas do sistema'
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
      schemas: {
        Cliente: {
          type: 'object',
          required: ['codigoCliente', 'nome', 'telefone'],
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
            email: {
              type: 'string',
              format: 'email',
              description: 'Email do cliente'
            },
            cpf: {
              type: 'string',
              pattern: '^\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}$',
              example: '123.456.789-00',
              description: 'CPF no formato XXX.XXX.XXX-XX'
            },
            dataNascimento: {
              type: 'string',
              format: 'date',
              example: '1990-01-15',
              description: 'Data de nascimento (YYYY-MM-DD)'
            },
            endereco: {
              type: 'string',
              description: 'Endereço do cliente'
            },
            cidade: {
              type: 'string',
              description: 'Cidade do cliente'
            },
            estado: {
              type: 'string',
              description: 'Estado (UF)'
            },
            cep: {
              type: 'string',
              pattern: '^\\d{5}-\\d{3}$',
              example: '01234-567',
              description: 'CEP no formato XXXXX-XXX'
            },
            observacao: {
              type: 'string',
              maxLength: 500,
              description: 'Observações sobre o cliente'
            },
            totalCompras: {
              type: 'number',
              description: 'Valor total de compras do cliente'
            },
            quantidadeCompras: {
              type: 'number',
              description: 'Quantidade de compras realizadas'
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
          required: ['codigoProduto', 'nome', 'categoria', 'precoVenda'],
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
            },
            historicoPrecosn: {
              type: 'array',
              description: 'Histórico de alterações de preço',
              items: {
                type: 'object',
                properties: {
                  data: {
                    type: 'string',
                    format: 'date-time'
                  },
                  precoAnterior: {
                    type: 'number'
                  },
                  precoNovo: {
                    type: 'number'
                  }
                }
              }
            },
            dataCadastro: {
              type: 'string',
              format: 'date-time',
              description: 'Data de cadastro do produto'
            }
          }
        },
        Estoque: {
          type: 'object',
          required: ['codigoProduto', 'quantidade', 'variantes', 'emPromocao', 'isNovidade', 'ativo'],
          properties: {
            codigoProduto: {
              type: 'string',
              pattern: '^P\\d{3}$',
              example: 'P101',
              description: 'Código do produto'
            },
            quantidade: {
              type: 'integer',
              minimum: 0,
              description: 'Quantidade total em estoque (soma de todas as variantes)'
            },
            variantes: {
              type: 'array',
              description: 'Lista de variantes do produto (cor, tamanhos, quantidade, imagens)',
              items: {
                type: 'object',
                required: ['cor', 'quantidade', 'tamanhos'],
                properties: {
                  cor: {
                    type: 'string',
                    description: 'Cor da variante'
                  },
                  quantidade: {
                    type: 'integer',
                    minimum: 0,
                    description: 'Quantidade total desta cor'
                  },
                  tamanhos: {
                    type: 'array',
                    description: 'Distribuição por tamanho',
                    items: {
                      type: 'object',
                      required: ['tamanho', 'quantidade'],
                      properties: {
                        tamanho: {
                          type: 'string',
                          description: 'Tamanho (PP, P, M, G, GG, U, etc.)'
                        },
                        quantidade: {
                          type: 'integer',
                          minimum: 0,
                          description: 'Quantidade disponível deste tamanho'
                        }
                      }
                    }
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
            },
            movimentacoes: {
              type: 'array',
              description: 'Histórico de movimentações de estoque',
              items: {
                type: 'object',
                properties: {
                  tipo: {
                    type: 'string',
                    enum: ['entrada', 'saida']
                  },
                  quantidade: {
                    type: 'number'
                  },
                  data: {
                    type: 'string',
                    format: 'date-time'
                  },
                  origem: {
                    type: 'string'
                  },
                  observacao: {
                    type: 'string'
                  }
                }
              }
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
                  precoOriginal: {
                    type: 'number',
                    minimum: 0,
                    description: 'Preço original (antes de promoção)'
                  },
                  precoFinalUnitario: {
                    type: 'number',
                    minimum: 0
                  },
                  descontoAplicado: {
                    type: 'number',
                    minimum: 0
                  },
                  emPromocao: {
                    type: 'boolean',
                    description: 'Se vendido em promoção'
                  },
                  isNovidade: {
                    type: 'boolean',
                    description: 'Se era novidade na venda'
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
            },
            codigoCaixa: {
              type: 'string',
              description: 'Código do caixa associado à venda'
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
            totalVendas: {
              type: 'number',
              description: 'Total acumulado de vendas'
            },
            quantidadeVendas: {
              type: 'number',
              description: 'Quantidade de vendas realizadas'
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
          required: ['codigoFornecedor', 'nome', 'telefone'],
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
              pattern: '^CX\\d{8}-\\d{3}$',
              example: 'CX20250102-001',
              description: 'Identificador único do caixa (formato: CX + data + sequencial)'
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
              description: 'Total de entradas (vendas + suprimentos)'
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
            responsavel: {
              type: 'string',
              description: 'Nome do responsável pela abertura'
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
                    enum: ['Dinheiro', 'Pix', 'Cartão de Crédito', 'Cartão de Débito'],
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
        ContaPagar: {
          type: 'object',
          required: ['numeroDocumento', 'descricao', 'categoria', 'valor', 'dataVencimento', 'status', 'tipoCriacao'],
          properties: {
            numeroDocumento: {
              type: 'string',
              example: 'CP001',
              description: 'Número único do documento'
            },
            descricao: {
              type: 'string',
              description: 'Descrição da conta a pagar'
            },
            categoria: {
              type: 'string',
              description: 'Categoria financeira'
            },
            valor: {
              type: 'number',
              minimum: 0,
              description: 'Valor da conta'
            },
            dataVencimento: {
              type: 'string',
              format: 'date',
              description: 'Data de vencimento'
            },
            status: {
              type: 'string',
              enum: ['Pendente', 'Pago', 'Parcial', 'Vencido'],
              description: 'Status da conta'
            },
            tipoCriacao: {
              type: 'string',
              enum: ['Unica', 'Parcelamento', 'Replica'],
              description: 'Tipo de criação da conta'
            },
            fornecedor: {
              type: 'string',
              description: 'Código do fornecedor'
            },
            pagamento: {
              type: 'object',
              description: 'Dados do pagamento (para contas únicas)',
              properties: {
                valor: {
                  type: 'number'
                },
                data: {
                  type: 'string',
                  format: 'date'
                },
                formaPagamento: {
                  type: 'string',
                  enum: ['Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro', 'Boleto', 'Transferência', 'Outro']
                },
                comprovante: {
                  type: 'string'
                },
                observacoes: {
                  type: 'string'
                }
              }
            },
            parcelas: {
              type: 'array',
              description: 'Array de parcelas (para parcelamento/replica)',
              items: {
                type: 'object'
              }
            }
          }
        },
        ContaReceber: {
          type: 'object',
          required: ['numeroDocumento', 'descricao', 'categoria', 'valor', 'dataVencimento', 'status', 'tipoCriacao'],
          properties: {
            numeroDocumento: {
              type: 'string',
              example: 'CR001',
              description: 'Número único do documento'
            },
            descricao: {
              type: 'string',
              description: 'Descrição da conta a receber'
            },
            categoria: {
              type: 'string',
              description: 'Categoria financeira'
            },
            valor: {
              type: 'number',
              minimum: 0,
              description: 'Valor da conta'
            },
            dataVencimento: {
              type: 'string',
              format: 'date',
              description: 'Data de vencimento'
            },
            status: {
              type: 'string',
              enum: ['Pendente', 'Recebido', 'Parcial', 'Vencido'],
              description: 'Status da conta'
            },
            tipoCriacao: {
              type: 'string',
              enum: ['Unica', 'Parcelamento', 'Replica'],
              description: 'Tipo de criação da conta'
            },
            cliente: {
              type: 'string',
              description: 'Código do cliente'
            },
            codigoVenda: {
              type: 'string',
              description: 'Código da venda associada'
            },
            recebimento: {
              type: 'object',
              description: 'Dados do recebimento (para contas únicas)',
              properties: {
                valor: {
                  type: 'number'
                },
                data: {
                  type: 'string',
                  format: 'date'
                },
                formaPagamento: {
                  type: 'string',
                  enum: ['Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro', 'Boleto', 'Transferência', 'Outro']
                },
                comprovante: {
                  type: 'string'
                },
                observacoes: {
                  type: 'string'
                }
              }
            },
            parcelas: {
              type: 'array',
              description: 'Array de parcelas (para parcelamento/replica)',
              items: {
                type: 'object'
              }
            }
          }
        },
        CategoriaFinanceira: {
          type: 'object',
          required: ['nome', 'tipo'],
          properties: {
            _id: {
              type: 'string',
              description: 'ID único da categoria'
            },
            nome: {
              type: 'string',
              example: 'Fornecedores',
              description: 'Nome da categoria'
            },
            tipo: {
              type: 'string',
              enum: ['pagar', 'receber', 'ambos'],
              description: 'Tipo da categoria'
            },
            cor: {
              type: 'string',
              example: '#FF5733',
              description: 'Cor da categoria em hexadecimal'
            },
            ordem: {
              type: 'integer',
              description: 'Ordem de exibição'
            },
            ativo: {
              type: 'boolean',
              description: 'Se a categoria está ativa'
            },
            categoriaPai: {
              type: 'string',
              description: 'ID da categoria pai'
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
        },
        Permission: {
          type: 'object',
          required: ['role', 'module', 'actions'],
          properties: {
            _id: {
              type: 'string',
              description: 'ID único da permissão'
            },
            role: {
              type: 'string',
              enum: ['admin', 'gerente', 'vendedor'],
              description: 'Role do usuário'
            },
            module: {
              type: 'string',
              description: 'Módulo do sistema',
              example: 'vendas'
            },
            actions: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['view', 'create', 'edit', 'delete', 'export']
              },
              description: 'Ações permitidas para o módulo'
            }
          }
        },
        User: {
          type: 'object',
          required: ['email', 'nome', 'role'],
          properties: {
            _id: {
              type: 'string',
              description: 'ID único do usuário'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email do usuário'
            },
            nome: {
              type: 'string',
              description: 'Nome do usuário'
            },
            role: {
              type: 'string',
              enum: ['admin', 'gerente', 'vendedor'],
              description: 'Role do usuário'
            },
            codigoVendedor: {
              type: 'string',
              description: 'Código do vendedor (se role=vendedor)'
            },
            ativo: {
              type: 'boolean',
              description: 'Se o usuário está ativo'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data de criação'
            }
          }
        },
        CacheConfig: {
          type: 'object',
          properties: {
            endpoint: {
              type: 'string',
              description: 'Endpoint da API'
            },
            ttl: {
              type: 'number',
              description: 'Time-to-live em segundos'
            },
            enabled: {
              type: 'boolean',
              description: 'Se o cache está habilitado'
            },
            compress: {
              type: 'boolean',
              description: 'Se a compressão está habilitada'
            },
            accessCount: {
              type: 'number',
              description: 'Contador de acessos'
            }
          }
        },
        StorageStats: {
          type: 'object',
          properties: {
            totalImages: {
              type: 'number',
              description: 'Total de imagens no storage'
            },
            referencedImages: {
              type: 'number',
              description: 'Imagens referenciadas no banco'
            },
            orphanImages: {
              type: 'number',
              description: 'Imagens órfãs (não referenciadas)'
            },
            totalSize: {
              type: 'number',
              description: 'Tamanho total em bytes'
            },
            date: {
              type: 'string',
              format: 'date-time',
              description: 'Data da estatística'
            }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            total: {
              type: 'integer',
              description: 'Total de itens'
            },
            page: {
              type: 'integer',
              description: 'Página atual'
            },
            limit: {
              type: 'integer',
              description: 'Itens por página'
            },
            pages: {
              type: 'integer',
              description: 'Total de páginas'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Tipo do erro'
            },
            message: {
              type: 'string',
              description: 'Mensagem de erro'
            },
            fields: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string'
                  },
                  message: {
                    type: 'string'
                  },
                  value: {
                    type: 'string'
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  apis: [
    './routes/*.ts',
    './routes/*.js',
    './dist/routes/*.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
