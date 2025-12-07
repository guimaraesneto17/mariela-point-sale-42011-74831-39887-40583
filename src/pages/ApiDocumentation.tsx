import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileCode, 
  Server, 
  Lock, 
  Users, 
  Package, 
  ShoppingCart, 
  Boxes,
  Truck,
  UserCheck,
  Store,
  Wallet,
  CreditCard,
  Receipt,
  Tags,
  Database,
  Trash2,
  Upload,
  Search,
  RefreshCw,
  Heart,
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  auth: boolean;
  adminOnly?: boolean;
  requestExample?: object;
  responseExample?: object;
}

interface ApiSection {
  name: string;
  icon: React.ReactNode;
  description: string;
  basePath: string;
  endpoints: Endpoint[];
}

const apiSections: ApiSection[] = [
  {
    name: 'Health',
    icon: <Heart className="h-5 w-5" />,
    description: 'Verificação de saúde do sistema e conexões',
    basePath: '/api/health',
    endpoints: [
      {
        method: 'GET',
        path: '/',
        description: 'Verifica status do backend e MongoDB',
        auth: false,
        responseExample: {
          status: 'ok',
          timestamp: '2025-01-28T10:30:00.000Z',
          database: { status: 'connected', name: 'mariela-db' },
          uptime: 86400.5
        }
      },
      {
        method: 'GET',
        path: '/collections',
        description: 'Verifica status de cada collection do MongoDB',
        auth: false,
        responseExample: {
          timestamp: '2025-01-28T10:30:00.000Z',
          collections: [
            { collection: 'produtos', status: 'success', responseTime: 45 },
            { collection: 'clientes', status: 'success', responseTime: 32 }
          ]
        }
      }
    ]
  },
  {
    name: 'Autenticação',
    icon: <Lock className="h-5 w-5" />,
    description: 'Login, registro e gerenciamento de tokens JWT',
    basePath: '/api/auth',
    endpoints: [
      {
        method: 'POST',
        path: '/login',
        description: 'Realiza login e retorna token JWT',
        auth: false,
        requestExample: { email: 'admin@mariela.com', password: 'senha123' },
        responseExample: { 
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', 
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          user: { id: '123', email: 'admin@mariela.com', nome: 'Admin', role: 'admin' }
        }
      },
      {
        method: 'POST',
        path: '/register',
        description: 'Registra novo usuário (apenas admin)',
        auth: true,
        adminOnly: true,
        requestExample: { email: 'vendedor@mariela.com', password: 'senha123', nome: 'João Silva', role: 'vendedor', codigoVendedor: 'V001' }
      },
      {
        method: 'GET',
        path: '/profile',
        description: 'Obtém perfil do usuário autenticado',
        auth: true
      },
      {
        method: 'PUT',
        path: '/update-password',
        description: 'Atualiza senha do usuário',
        auth: true,
        requestExample: { currentPassword: 'senha123', newPassword: 'novaSenha456' }
      },
      {
        method: 'GET',
        path: '/users',
        description: 'Lista todos os usuários (apenas admin)',
        auth: true,
        adminOnly: true
      },
      {
        method: 'PUT',
        path: '/users/:userId/role',
        description: 'Atualiza role de usuário (apenas admin)',
        auth: true,
        adminOnly: true,
        requestExample: { role: 'gerente', codigoVendedor: 'V002' }
      },
      {
        method: 'PUT',
        path: '/users/:userId/toggle-status',
        description: 'Ativa/desativa usuário (apenas admin)',
        auth: true,
        adminOnly: true
      },
      {
        method: 'POST',
        path: '/refresh',
        description: 'Renova access token usando refresh token',
        auth: false,
        requestExample: { refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
      },
      {
        method: 'POST',
        path: '/logout',
        description: 'Faz logout e revoga refresh token',
        auth: false,
        requestExample: { refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
      }
    ]
  },
  {
    name: 'Permissions',
    icon: <Shield className="h-5 w-5" />,
    description: 'Gerenciamento de permissões por role',
    basePath: '/api/permissions',
    endpoints: [
      {
        method: 'GET',
        path: '/role/:role',
        description: 'Obtém permissões de uma role',
        auth: true
      },
      {
        method: 'PUT',
        path: '/role/:role',
        description: 'Atualiza permissões de uma role (apenas admin)',
        auth: true,
        adminOnly: true,
        requestExample: { 
          permissions: [
            { module: 'vendas', actions: ['view', 'create', 'edit'] },
            { module: 'clientes', actions: ['view', 'create'] }
          ]
        }
      }
    ]
  },
  {
    name: 'Clientes',
    icon: <Users className="h-5 w-5" />,
    description: 'Gerenciamento de clientes',
    basePath: '/api/clientes',
    endpoints: [
      {
        method: 'GET',
        path: '/',
        description: 'Lista todos os clientes',
        auth: true,
        responseExample: [
          { codigoCliente: 'C001', nome: 'Maria Silva', telefone: '(11) 98765-4321', email: 'maria@email.com' }
        ]
      },
      {
        method: 'GET',
        path: '/:codigo',
        description: 'Busca cliente por código',
        auth: true
      },
      {
        method: 'POST',
        path: '/',
        description: 'Cria novo cliente',
        auth: true,
        requestExample: { codigoCliente: 'C002', nome: 'Ana Santos', telefone: '(11) 99999-8888' }
      },
      {
        method: 'PUT',
        path: '/:codigo',
        description: 'Atualiza cliente',
        auth: true
      },
      {
        method: 'DELETE',
        path: '/:codigo',
        description: 'Remove cliente',
        auth: true
      }
    ]
  },
  {
    name: 'Produtos',
    icon: <Package className="h-5 w-5" />,
    description: 'Gerenciamento de produtos',
    basePath: '/api/produtos',
    endpoints: [
      {
        method: 'GET',
        path: '/',
        description: 'Lista produtos com paginação',
        auth: true,
        responseExample: {
          data: [{ codigoProduto: 'P001', nome: 'Vestido Floral', precoVenda: 199.90 }],
          pagination: { total: 100, page: 1, limit: 50, pages: 2 }
        }
      },
      {
        method: 'GET',
        path: '/:codigo',
        description: 'Busca produto por código',
        auth: true
      },
      {
        method: 'POST',
        path: '/',
        description: 'Cria novo produto',
        auth: true,
        requestExample: { codigoProduto: 'P002', nome: 'Blusa Básica', categoria: 'Blusa', precoVenda: 89.90 }
      },
      {
        method: 'PUT',
        path: '/:codigo',
        description: 'Atualiza produto',
        auth: true
      },
      {
        method: 'DELETE',
        path: '/:codigo',
        description: 'Remove produto',
        auth: true
      }
    ]
  },
  {
    name: 'Estoque',
    icon: <Boxes className="h-5 w-5" />,
    description: 'Gerenciamento de estoque e variantes',
    basePath: '/api/estoque',
    endpoints: [
      {
        method: 'GET',
        path: '/',
        description: 'Lista estoque com paginação',
        auth: true
      },
      {
        method: 'GET',
        path: '/:codigoProduto',
        description: 'Busca estoque por produto',
        auth: true
      },
      {
        method: 'POST',
        path: '/',
        description: 'Cria registro de estoque',
        auth: true,
        requestExample: {
          codigoProduto: 'P001',
          variantes: [{ cor: 'Vermelho', tamanhos: [{ tamanho: 'M', quantidade: 5 }] }]
        }
      },
      {
        method: 'PUT',
        path: '/:codigoProduto',
        description: 'Atualiza estoque',
        auth: true
      },
      {
        method: 'PUT',
        path: '/:codigoProduto/variante',
        description: 'Adiciona/atualiza variante',
        auth: true
      },
      {
        method: 'PUT',
        path: '/:codigoProduto/promocao',
        description: 'Define promoção',
        auth: true,
        requestExample: { emPromocao: true, precoPromocional: 79.90 }
      },
      {
        method: 'PUT',
        path: '/:codigoProduto/novidade',
        description: 'Define como novidade',
        auth: true,
        requestExample: { isNovidade: true }
      },
      {
        method: 'DELETE',
        path: '/:codigoProduto',
        description: 'Remove estoque',
        auth: true
      }
    ]
  },
  {
    name: 'Vendas',
    icon: <ShoppingCart className="h-5 w-5" />,
    description: 'Gerenciamento de vendas',
    basePath: '/api/vendas',
    endpoints: [
      {
        method: 'GET',
        path: '/',
        description: 'Lista todas as vendas',
        auth: true
      },
      {
        method: 'GET',
        path: '/:codigo',
        description: 'Busca venda por código',
        auth: true
      },
      {
        method: 'POST',
        path: '/',
        description: 'Cria nova venda',
        auth: true,
        requestExample: {
          cliente: { codigoCliente: 'C001', nome: 'Maria' },
          vendedor: { codigoVendedor: 'V001', nome: 'João' },
          itens: [{ codigoProduto: 'P001', nomeProduto: 'Vestido', cor: 'Vermelho', tamanho: 'M', quantidade: 1, precoUnitario: 199.90, subtotal: 199.90 }],
          total: 199.90,
          formaPagamento: 'Pix',
          codigoCaixa: 'CX20250128-001'
        }
      },
      {
        method: 'PUT',
        path: '/:codigo',
        description: 'Atualiza venda',
        auth: true
      },
      {
        method: 'DELETE',
        path: '/:codigo',
        description: 'Remove venda',
        auth: true
      }
    ]
  },
  {
    name: 'Vendedores',
    icon: <UserCheck className="h-5 w-5" />,
    description: 'Gerenciamento de vendedores',
    basePath: '/api/vendedores',
    endpoints: [
      { method: 'GET', path: '/', description: 'Lista todos os vendedores', auth: true },
      { method: 'GET', path: '/:codigo', description: 'Busca vendedor por código', auth: true },
      { method: 'POST', path: '/', description: 'Cria novo vendedor', auth: true, requestExample: { codigoVendedor: 'V001', nome: 'João Silva', telefone: '(11) 98765-4321' } },
      { method: 'PUT', path: '/:codigo', description: 'Atualiza vendedor', auth: true },
      { method: 'DELETE', path: '/:codigo', description: 'Remove vendedor', auth: true }
    ]
  },
  {
    name: 'Fornecedores',
    icon: <Truck className="h-5 w-5" />,
    description: 'Gerenciamento de fornecedores',
    basePath: '/api/fornecedores',
    endpoints: [
      { method: 'GET', path: '/', description: 'Lista todos os fornecedores', auth: true },
      { method: 'GET', path: '/:codigo', description: 'Busca fornecedor por código', auth: true },
      { method: 'POST', path: '/', description: 'Cria novo fornecedor', auth: true },
      { method: 'PUT', path: '/:codigo', description: 'Atualiza fornecedor', auth: true },
      { method: 'DELETE', path: '/:codigo', description: 'Remove fornecedor', auth: true }
    ]
  },
  {
    name: 'Vitrine Virtual',
    icon: <Store className="h-5 w-5" />,
    description: 'Produtos disponíveis na vitrine (público)',
    basePath: '/api/vitrine',
    endpoints: [
      {
        method: 'GET',
        path: '/',
        description: 'Lista produtos da vitrine (público)',
        auth: false,
        responseExample: [
          { codigoProduto: 'P001', nome: 'Vestido', precoVenda: 199.90, isOnSale: true, isNew: false, totalAvailable: 15 }
        ]
      },
      { method: 'GET', path: '/:codigo', description: 'Busca produto da vitrine', auth: false }
    ]
  },
  {
    name: 'Caixa',
    icon: <Wallet className="h-5 w-5" />,
    description: 'Gerenciamento de caixa',
    basePath: '/api/caixa',
    endpoints: [
      { method: 'GET', path: '/', description: 'Lista todos os caixas', auth: true },
      { method: 'GET', path: '/aberto', description: 'Retorna caixa atualmente aberto', auth: true },
      { method: 'GET', path: '/:codigo', description: 'Busca caixa por código', auth: true },
      { method: 'POST', path: '/', description: 'Abre novo caixa', auth: true, requestExample: { valorInicial: 200, responsavel: 'Admin' } },
      { method: 'PUT', path: '/:codigo/fechar', description: 'Fecha caixa', auth: true },
      { method: 'PUT', path: '/:codigo/reabrir', description: 'Reabre caixa fechado', auth: true },
      { method: 'POST', path: '/:codigo/movimento', description: 'Adiciona movimento ao caixa', auth: true, requestExample: { tipo: 'entrada', valor: 50, observacao: 'Suprimento' } }
    ]
  },
  {
    name: 'Contas a Pagar',
    icon: <CreditCard className="h-5 w-5" />,
    description: 'Gerenciamento de contas a pagar',
    basePath: '/api/contas-pagar',
    endpoints: [
      { method: 'GET', path: '/', description: 'Lista contas a pagar', auth: true },
      { method: 'GET', path: '/:id', description: 'Busca conta por ID', auth: true },
      { method: 'POST', path: '/', description: 'Cria conta a pagar', auth: true, requestExample: { numeroDocumento: 'CP001', descricao: 'Fornecedor X', categoria: 'Fornecedores', valor: 1500, dataVencimento: '2025-02-15', status: 'Pendente', tipoCriacao: 'Unica' } },
      { method: 'PUT', path: '/:id', description: 'Atualiza conta', auth: true },
      { method: 'PUT', path: '/:id/pagar', description: 'Registra pagamento', auth: true, requestExample: { valor: 1500, data: '2025-02-10', formaPagamento: 'Pix' } },
      { method: 'PUT', path: '/:id/parcela/:parcelaIndex/pagar', description: 'Paga parcela específica', auth: true },
      { method: 'DELETE', path: '/:id', description: 'Remove conta', auth: true }
    ]
  },
  {
    name: 'Contas a Receber',
    icon: <Receipt className="h-5 w-5" />,
    description: 'Gerenciamento de contas a receber',
    basePath: '/api/contas-receber',
    endpoints: [
      { method: 'GET', path: '/', description: 'Lista contas a receber', auth: true },
      { method: 'GET', path: '/:id', description: 'Busca conta por ID', auth: true },
      { method: 'POST', path: '/', description: 'Cria conta a receber', auth: true },
      { method: 'PUT', path: '/:id', description: 'Atualiza conta', auth: true },
      { method: 'PUT', path: '/:id/receber', description: 'Registra recebimento', auth: true },
      { method: 'PUT', path: '/:id/parcela/:parcelaIndex/receber', description: 'Recebe parcela específica', auth: true },
      { method: 'DELETE', path: '/:id', description: 'Remove conta', auth: true }
    ]
  },
  {
    name: 'Categorias Financeiras',
    icon: <Tags className="h-5 w-5" />,
    description: 'Gerenciamento de categorias financeiras',
    basePath: '/api/categorias-financeiras',
    endpoints: [
      { method: 'GET', path: '/', description: 'Lista categorias', auth: true },
      { method: 'POST', path: '/', description: 'Cria categoria', auth: true, requestExample: { nome: 'Fornecedores', tipo: 'pagar', cor: '#FF5733' } },
      { method: 'PUT', path: '/:id', description: 'Atualiza categoria', auth: true },
      { method: 'DELETE', path: '/:id', description: 'Remove categoria', auth: true }
    ]
  },
  {
    name: 'Cache',
    icon: <Database className="h-5 w-5" />,
    description: 'Gerenciamento de cache e performance (admin)',
    basePath: '/api/cache',
    endpoints: [
      { method: 'GET', path: '/stats', description: 'Estatísticas do cache', auth: true, adminOnly: true },
      { method: 'GET', path: '/config', description: 'Configuração do cache', auth: true, adminOnly: true },
      { method: 'PUT', path: '/config', description: 'Atualiza configuração', auth: true, adminOnly: true },
      { method: 'DELETE', path: '/clear', description: 'Limpa todo o cache', auth: true, adminOnly: true },
      { method: 'DELETE', path: '/clear/:namespace', description: 'Limpa cache por namespace', auth: true, adminOnly: true }
    ]
  },
  {
    name: 'Cleanup',
    icon: <Trash2 className="h-5 w-5" />,
    description: 'Limpeza de imagens órfãs e manutenção',
    basePath: '/api/cleanup',
    endpoints: [
      { method: 'GET', path: '/orphan-images', description: 'Lista imagens órfãs', auth: true },
      { method: 'DELETE', path: '/orphan-images', description: 'Remove imagens órfãs', auth: true },
      { method: 'GET', path: '/history', description: 'Histórico de limpezas', auth: true },
      { method: 'DELETE', path: '/history', description: 'Limpa histórico', auth: true },
      { method: 'GET', path: '/cron-config', description: 'Configuração do cron', auth: true },
      { method: 'PUT', path: '/cron-config', description: 'Atualiza cron', auth: true }
    ]
  },
  {
    name: 'Upload',
    icon: <Upload className="h-5 w-5" />,
    description: 'Upload de imagens para Vercel Blob',
    basePath: '/api/upload',
    endpoints: [
      { method: 'POST', path: '/', description: 'Upload de imagem', auth: true, requestExample: { file: '(multipart/form-data)' } },
      { method: 'DELETE', path: '/', description: 'Remove imagem', auth: true, requestExample: { url: 'https://blob.vercel-storage.com/...' } }
    ]
  },
  {
    name: 'Search',
    icon: <Search className="h-5 w-5" />,
    description: 'Busca avançada de produtos',
    basePath: '/api/search',
    endpoints: [
      {
        method: 'GET',
        path: '/produtos',
        description: 'Busca produtos com filtros combinados',
        auth: true,
        responseExample: {
          data: [{ codigoProduto: 'P001', nome: 'Vestido', precoVenda: 199.90 }],
          pagination: { total: 10, page: 1, limit: 50, pages: 1 }
        }
      }
    ]
  },
  {
    name: 'Recálculo',
    icon: <RefreshCw className="h-5 w-5" />,
    description: 'Recálculo de totais e estatísticas',
    basePath: '/api/recalculo',
    endpoints: [
      { method: 'POST', path: '/clientes', description: 'Recalcula totais de clientes', auth: true },
      { method: 'POST', path: '/vendedores', description: 'Recalcula totais de vendedores', auth: true },
      { method: 'POST', path: '/estoque', description: 'Recalcula quantidades de estoque', auth: true }
    ]
  }
];

const methodColors: Record<string, string> = {
  GET: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  POST: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  PUT: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  DELETE: 'bg-red-500/20 text-red-400 border-red-500/30',
  PATCH: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
};

export default function ApiDocumentation() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['Health', 'Autenticação']));
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);
  const apiBaseUrl = 'https://mariela-pdv-backend.onrender.com';

  const toggleSection = (name: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(name)) {
        newSet.delete(name);
      } else {
        newSet.add(name);
      }
      return newSet;
    });
  };

  const copyToClipboard = (text: string, endpoint: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(endpoint);
    toast.success('Copiado para a área de transferência');
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const openSwagger = () => {
    window.open(`${apiBaseUrl}/api-docs`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <FileCode className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Documentação da API</h1>
              <p className="text-muted-foreground">Referência completa de todos os endpoints</p>
            </div>
          </div>
          <Button onClick={openSwagger} className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Abrir Swagger UI
          </Button>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <Server className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Base URL</p>
                <p className="font-mono text-sm text-foreground">{apiBaseUrl}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <Lock className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">Autenticação</p>
                <p className="text-sm text-foreground">Bearer Token JWT</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <FileCode className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-sm text-muted-foreground">Formato</p>
                <p className="text-sm text-foreground">JSON (application/json)</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* API Sections */}
        <div className="space-y-4">
          {apiSections.map((section) => (
            <Card key={section.name} className="bg-card/50 border-border/50 overflow-hidden">
              <Collapsible open={expandedSections.has(section.name)} onOpenChange={() => toggleSection(section.name)}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          {section.icon}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{section.name}</CardTitle>
                          <CardDescription className="text-sm">
                            {section.description} • <span className="font-mono text-xs">{section.basePath}</span>
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{section.endpoints.length} endpoints</Badge>
                        {expandedSections.has(section.name) ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-2">
                    {section.endpoints.map((endpoint, idx) => {
                      const fullPath = `${section.basePath}${endpoint.path}`;
                      const endpointKey = `${endpoint.method}-${fullPath}`;
                      
                      return (
                        <div
                          key={idx}
                          className="p-3 rounded-lg bg-muted/30 border border-border/30 hover:border-border/60 transition-colors"
                        >
                          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge className={`${methodColors[endpoint.method]} font-mono text-xs px-2 py-0.5`}>
                                {endpoint.method}
                              </Badge>
                              <code className="text-sm font-mono text-foreground">{fullPath}</code>
                            </div>
                            <div className="flex-1 flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">{endpoint.description}</span>
                              {endpoint.auth && (
                                <Badge variant="outline" className="text-xs">
                                  <Lock className="h-3 w-3 mr-1" />
                                  Auth
                                </Badge>
                              )}
                              {endpoint.adminOnly && (
                                <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/30">
                                  Admin
                                </Badge>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 flex-shrink-0"
                              onClick={() => copyToClipboard(`${apiBaseUrl}${fullPath}`, endpointKey)}
                            >
                              {copiedEndpoint === endpointKey ? (
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                          
                          {(endpoint.requestExample || endpoint.responseExample) && (
                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                              {endpoint.requestExample && (
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground font-medium">Request Body:</p>
                                  <pre className="text-xs bg-background/50 p-2 rounded-md overflow-x-auto">
                                    <code>{JSON.stringify(endpoint.requestExample, null, 2)}</code>
                                  </pre>
                                </div>
                              )}
                              {endpoint.responseExample && (
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground font-medium">Response:</p>
                                  <pre className="text-xs bg-background/50 p-2 rounded-md overflow-x-auto">
                                    <code>{JSON.stringify(endpoint.responseExample, null, 2)}</code>
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="font-semibold text-foreground">Swagger UI Interativo</h3>
                <p className="text-sm text-muted-foreground">
                  Acesse a documentação completa com testes interativos no Swagger UI
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Login: mariela</Badge>
                <Badge variant="outline">Senha: mariela214365</Badge>
                <Button onClick={openSwagger} size="sm" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Abrir
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}