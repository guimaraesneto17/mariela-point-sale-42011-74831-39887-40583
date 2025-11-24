# Guia de Uso do React Query

## O que foi implementado

Sistema completo de cache com React Query para otimizar carregamento de dados e reduzir chamadas à API.

## Configuração

### QueryClient (App.tsx)
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,      // 5 minutos - dados ficam "frescos"
      gcTime: 1000 * 60 * 10,         // 10 minutos - tempo antes do garbage collection
      refetchOnWindowFocus: false,     // Não recarrega ao focar janela
      retry: 1,                        // Tenta 1 vez em caso de erro
    },
  },
});
```

## Hooks Disponíveis

### Queries (Leitura)
- `useClientes()` - Lista de clientes
- `useVendas()` - Lista de vendas
- `useProdutos()` - Lista de produtos
- `useEstoque()` - Lista de estoque
- `useVendedores()` - Lista de vendedores
- `useFornecedores()` - Lista de fornecedores
- `useCaixaAberto()` - Caixa aberto
- `useContasPagar()` - Contas a pagar
- `useContasReceber()` - Contas a receber
- `useResumoPagar()` - Resumo contas a pagar
- `useResumoReceber()` - Resumo contas a receber
- `useCategoriasFinanceiras()` - Categorias financeiras

### Mutations (Escrita)
- `useCreateCliente()` - Criar cliente
- `useUpdateCliente()` - Atualizar cliente
- `useDeleteCliente()` - Deletar cliente
- (Padrão similar para todas as entidades)

### Utility Hooks
- `useInvalidateQueries()` - Invalidar múltiplas queries
- `useDashboardData(dataInicio?, dataFim?)` - Dados completos do dashboard com filtros

## Exemplos de Uso

### 1. Query Simples (Leitura)

```typescript
import { useVendas } from '@/hooks/useQueryCache';

function MinhasPagina() {
  const { data: vendas = [], isLoading, error } = useVendas();

  if (isLoading) return <div>Carregando...</div>;
  if (error) return <div>Erro ao carregar</div>;

  return (
    <div>
      {vendas.map(venda => (
        <div key={venda._id}>{venda.codigoVenda}</div>
      ))}
    </div>
  );
}
```

### 2. Mutation (Criação)

```typescript
import { useCreateCliente } from '@/hooks/useQueryCache';

function FormCliente() {
  const createCliente = useCreateCliente();

  const handleSubmit = async (data) => {
    await createCliente.mutateAsync(data);
    // Cache de clientes é automaticamente invalidado
    // Toast de sucesso já exibido automaticamente
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* campos do form */}
      <button disabled={createCliente.isPending}>
        {createCliente.isPending ? 'Salvando...' : 'Salvar'}
      </button>
    </form>
  );
}
```

### 3. Mutation (Atualização)

```typescript
import { useUpdateProduto } from '@/hooks/useQueryCache';

function EditarProduto({ produto }) {
  const updateProduto = useUpdateProduto();

  const handleUpdate = async (novosDados) => {
    await updateProduto.mutateAsync({
      id: produto.codigoProduto,
      data: novosDados
    });
  };

  return (
    <button onClick={() => handleUpdate(dados)}>
      Atualizar
    </button>
  );
}
```

### 4. Invalidação Manual

```typescript
import { useInvalidateQueries } from '@/hooks/useQueryCache';

function MinhaComponente() {
  const { invalidateVendas, invalidateAll } = useInvalidateQueries();

  const handleRefresh = () => {
    // Invalida vendas e dados relacionados
    invalidateVendas();
  };

  const handleRefreshAll = () => {
    // Invalida TODOS os dados
    invalidateAll();
  };

  return (
    <>
      <button onClick={handleRefresh}>Atualizar Vendas</button>
      <button onClick={handleRefreshAll}>Atualizar Tudo</button>
    </>
  );
}
```

### 5. Dashboard com Dados Agregados

```typescript
import { useDashboardData } from '@/hooks/useDashboardData';

function Dashboard() {
  const [dataInicio, setDataInicio] = useState<Date>();
  const [dataFim, setDataFim] = useState<Date>();

  const { 
    stats, 
    vendas, 
    clientes, 
    isLoading 
  } = useDashboardData(dataInicio, dataFim);

  if (isLoading) return <GlobalLoading />;

  return (
    <div>
      <h1>Vendas Hoje: {stats.vendasHoje}</h1>
      <h1>Faturamento: R$ {stats.faturamentoDiario.toFixed(2)}</h1>
      {/* ... */}
    </div>
  );
}
```

## Benefícios

1. **Cache Automático**: Dados são armazenados em cache por 5 minutos
2. **Deduplicação**: Múltiplos componentes usando o mesmo hook compartilham a mesma requisição
3. **Background Updates**: Dados são atualizados em background quando ficam "stale"
4. **Invalidação Inteligente**: Quando você cria/atualiza/deleta, o cache é automaticamente atualizado
5. **Loading States**: Estados de loading/error são gerenciados automaticamente
6. **Otimistic Updates**: Possível implementar atualizações otimistas
7. **Retry Automático**: Tenta novamente em caso de falha
8. **Performance**: Reduz drasticamente o número de requisições à API

## Query Keys

Todas as queries são identificadas por keys únicas:

```typescript
export const QUERY_KEYS = {
  CLIENTES: ['clientes'],
  VENDAS: ['vendas'],
  PRODUTOS: ['produtos'],
  ESTOQUE: ['estoque'],
  VENDEDORES: ['vendedores'],
  FORNECEDORES: ['fornecedores'],
  CAIXA_ABERTO: ['caixa', 'aberto'],
  CONTAS_PAGAR: ['contas-pagar'],
  CONTAS_RECEBER: ['contas-receber'],
  RESUMO_PAGAR: ['resumo-pagar'],
  RESUMO_RECEBER: ['resumo-receber'],
  CATEGORIAS_FINANCEIRAS: ['categorias-financeiras'],
};
```

## Migração de Código Antigo

### Antes (sem cache):
```typescript
const [clientes, setClientes] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const loadClientes = async () => {
    try {
      setLoading(true);
      const data = await clientesAPI.getAll();
      setClientes(data);
    } catch (error) {
      toast.error('Erro ao carregar');
    } finally {
      setLoading(false);
    }
  };
  loadClientes();
}, []);
```

### Depois (com cache):
```typescript
const { data: clientes = [], isLoading } = useClientes();
```

## Próximos Passos

1. ✅ Configuração básica do React Query
2. ✅ Hooks para todas as entidades
3. ✅ Mutations com invalidação automática
4. ✅ Hook agregado para Dashboard
5. 🔄 Migrar todas as páginas para usar os hooks
6. 🔜 Implementar Optimistic Updates
7. 🔜 Adicionar Infinite Queries para listas longas
8. 🔜 Implementar prefetching de dados
