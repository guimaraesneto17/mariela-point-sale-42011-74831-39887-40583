# Guia de Prefetching e Persistência de Cache

## Recursos Implementados

### 1. Persistência no localStorage
- ✅ Cache persiste entre recarregamentos da página
- ✅ Dados mantidos por até 24 horas
- ✅ Apenas dados de sucesso são persistidos
- ✅ Armazenamento em `localStorage` com chave `MARIELA_CACHE`

### 2. Prefetching Inteligente
- ✅ Carregamento antecipado baseado em navegação
- ✅ Prefetch estratégico por contexto de página
- ✅ Hooks customizados para cada entidade

## Como Funciona

### Persistência Automática

```typescript
// Ao fechar/recarregar o navegador
localStorage.setItem('MARIELA_CACHE', cacheSerializado);

// Ao abrir novamente
const cache = localStorage.getItem('MARIELA_CACHE');
// Cache restaurado automaticamente
```

**Configuração:**
- **maxAge**: 24 horas (cache expira após 1 dia)
- **gcTime**: 30 minutos (dados mantidos em memória)
- **staleTime**: 5 minutos (dados considerados frescos)

### Prefetching Estratégico

O sistema antecipa necessidades do usuário baseado no contexto:

#### 1. Dashboard
```typescript
prefetchForDashboard();
// Carrega: clientes, vendas, produtos, estoque, vendedores, caixa, contas
```

#### 2. Nova Venda
```typescript
prefetchForNovaVenda();
// Carrega: produtos, clientes, vendedores, estoque
```

#### 3. Financeiro
```typescript
prefetchForFinanceiro();
// Carrega: contas a pagar, contas a receber, fornecedores, clientes
```

#### 4. Estoque
```typescript
prefetchForEstoque();
// Carrega: produtos, estoque, fornecedores
```

## Hooks Disponíveis

### usePrefetch()

```typescript
import { usePrefetch } from '@/hooks/usePrefetch';

function MeuComponente() {
  const {
    prefetchClientes,
    prefetchVendas,
    prefetchForDashboard,
    // ... outros
  } = usePrefetch();

  // Prefetch individual
  const handleMouseEnter = () => {
    prefetchClientes();
  };

  // Prefetch estratégico
  const prepararDashboard = () => {
    prefetchForDashboard();
  };
}
```

### useCacheStatus()

```typescript
import { useCacheStatus } from '@/hooks/usePrefetch';

function MeuComponente() {
  const {
    isCached,
    getCacheAge,
    isStale,
    clientesCached,
    vendasCached,
  } = useCacheStatus();

  // Verificar se está em cache
  if (clientesCached) {
    console.log('Clientes em cache!');
  }

  // Verificar idade do cache
  const age = getCacheAge(QUERY_KEYS.CLIENTES);
  console.log(`Cache tem ${age}ms`);

  // Verificar se está stale
  if (isStale(QUERY_KEYS.VENDAS)) {
    console.log('Dados de vendas precisam atualizar');
  }
}
```

## Componentes

### PrefetchLink

Link inteligente com prefetching automático:

```typescript
import { PrefetchLink } from '@/components/PrefetchLink';

<PrefetchLink 
  to="/vendas" 
  prefetchOn="hover"  // 'hover' | 'mount' | 'both'
>
  Ver Vendas
</PrefetchLink>
```

**Comportamentos:**
- `hover`: Carrega dados ao passar o mouse
- `mount`: Carrega dados ao montar o componente
- `both`: Carrega em ambos os casos

### CacheIndicator

Indicador visual do status do cache:

```typescript
import { CacheIndicator } from '@/components/CacheIndicator';

// No Layout ou Header
<CacheIndicator />
```

Mostra:
- ✅ Dados em cache (verde)
- ⏰ Dados stale (laranja)
- ❌ Dados não carregados (cinza)
- 🕐 Idade de cada cache
- 💾 Status de persistência

## Estratégias de Uso

### 1. Navegação Fluida

```typescript
// Em Links de navegação
<PrefetchLink to="/clientes" prefetchOn="hover">
  Clientes
</PrefetchLink>

// Usuário passa o mouse → dados carregam
// Usuário clica → página abre instantaneamente
```

### 2. Preparação Antecipada

```typescript
function FormNovaVenda() {
  const { prefetchForNovaVenda } = usePrefetch();

  useEffect(() => {
    // Carregar dados assim que componente montar
    prefetchForNovaVenda();
  }, []);

  // Formulário já tem todos os dados necessários
}
```

### 3. Background Updates

```typescript
function Dashboard() {
  const { invalidateAll } = useInvalidateQueries();

  // Atualizar tudo em background a cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      invalidateAll();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);
}
```

## Benefícios

### Performance
- ⚡ **Carregamento instantâneo**: Dados já em cache
- 🚀 **Menos requisições**: Prefetch elimina espera
- 💨 **Navegação fluida**: Sem loading entre páginas

### Experiência do Usuário
- 😊 **Sem delays**: Tudo carrega rápido
- 🔄 **Trabalho offline**: Cache funciona sem internet
- 📱 **Economia de dados**: Menos requisições

### Desenvolvimento
- 🛠️ **Debug fácil**: CacheIndicator mostra status
- 📊 **Métricas claras**: Idade e status de cada cache
- 🎯 **Controle total**: Invalidação manual quando necessário

## Limpeza de Cache

### Manual
```typescript
// Limpar cache específico
queryClient.removeQueries({ queryKey: QUERY_KEYS.CLIENTES });

// Limpar todo cache
queryClient.clear();

// Limpar localStorage
localStorage.removeItem('MARIELA_CACHE');
```

### Automática
- Cache expira após 24 horas
- Dados stale são atualizados automaticamente
- Garbage collection após 30 minutos de inatividade

## Troubleshooting

### Cache não persiste?
```typescript
// Verificar se localStorage está disponível
if (typeof window !== 'undefined' && window.localStorage) {
  console.log('localStorage disponível');
}

// Verificar tamanho do cache
const cache = localStorage.getItem('MARIELA_CACHE');
console.log(`Cache size: ${cache?.length || 0} bytes`);
```

### Dados desatualizados?
```typescript
// Forçar atualização
const { refetch } = useVendas();
await refetch();

// Ou invalidar e recarregar
queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VENDAS });
```

### Cache muito grande?
```typescript
// Reduzir gcTime
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 10, // 10 minutos ao invés de 30
    },
  },
});
```

## Próximos Passos

1. ✅ Persistência no localStorage
2. ✅ Prefetching estratégico
3. ✅ Componentes visuais (CacheIndicator)
4. 🔄 Integrar PrefetchLink no Layout
5. 🔜 Optimistic Updates
6. 🔜 Background sync automático
7. 🔜 Service Worker para offline-first
