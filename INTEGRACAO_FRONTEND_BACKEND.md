# Guia de Integração Frontend-Backend

## Backend MVC Completo ✅

### Estrutura Implementada

```
server/
├── controllers/          # Lógica de negócio
│   ├── clienteController.ts
│   ├── produtoController.ts
│   ├── vendaController.ts
│   ├── estoqueController.ts
│   ├── fornecedorController.ts
│   ├── vendedorController.ts
│   └── vitrineVirtualController.ts
├── models/              # Schemas MongoDB
├── routes/              # Rotas HTTP (usando controllers)
└── config/              # Configurações (DB, Swagger)
```

### Iniciar Servidor

```bash
cd server
npm install
npm run dev
```

Servidor rodará em: `http://localhost:3001`
Swagger Docs: `http://localhost:3001/api-docs`

## Frontend - Uso da API

### Importar módulo API

```typescript
import { clientesAPI, produtosAPI, vendasAPI, estoqueAPI } from '@/lib/api';
import { useAPI } from '@/hooks/useAPI';
```

### Exemplos de Uso

#### 1. Carregar dados com hook
```typescript
const { data: clientes, loading, error, refetch } = useAPI(clientesAPI.getAll);
```

#### 2. Criar registro
```typescript
const handleCreate = async (data) => {
  try {
    await clientesAPI.create(data);
    toast.success('Cliente criado!');
    refetch(); // Recarrega lista
  } catch (error) {
    toast.error(error.message);
  }
};
```

#### 3. Atualizar registro
```typescript
await produtosAPI.update(id, data);
```

#### 4. Deletar registro
```typescript
await vendasAPI.delete(id);
```

## Páginas que precisam integração

1. **Clientes** (`src/pages/Clientes.tsx`)
   - Substituir mock data por: `useAPI(clientesAPI.getAll)`
   - Integrar onSubmit com `clientesAPI.create/update`
   - Integrar handleDelete com `clientesAPI.delete`

2. **Produtos** (`src/pages/Produtos.tsx`)
   - Usar `produtosAPI.getAll()`
   - CRUD completo via `produtosAPI.*`

3. **Vendas** (`src/pages/Vendas.tsx`)
   - Carregar com `vendasAPI.getAll()`

4. **Estoque** (`src/pages/Estoque.tsx`)
   - Usar `estoqueAPI.getAll()`
   - Entradas: `estoqueAPI.registrarEntrada()`
   - Saídas: `estoqueAPI.registrarSaida()`

5. **Fornecedores** (`src/pages/Fornecedores.tsx`)
   - Integrar `fornecedoresAPI.*`

6. **Vendedores** (`src/pages/Vendedores.tsx`)
   - Já tem chamadas HTTP, só ajustar URL para `http://localhost:3001`

7. **Dashboard** (`src/pages/Dashboard.tsx`)
   - Buscar dados agregados das APIs

## Exemplo Completo - Clientes

```typescript
import { useAPI } from '@/hooks/useAPI';
import { clientesAPI } from '@/lib/api';

const Clientes = () => {
  const { data: clientes, loading, refetch } = useAPI(clientesAPI.getAll);

  const onSubmit = async (data) => {
    try {
      if (editingCliente) {
        await clientesAPI.update(editingCliente._id, data);
      } else {
        await clientesAPI.create(data);
      }
      toast.success('Cliente salvo!');
      refetch();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Confirmar exclusão?')) {
      try {
        await clientesAPI.delete(id);
        toast.success('Cliente excluído!');
        refetch();
      } catch (error) {
        toast.error(error.message);
      }
    }
  };

  if (loading) return <div>Carregando...</div>;

  return (
    // ... resto do JSX usando {clientes}
  );
};
```

## Próximos Passos

1. Substituir arrays mock por chamadas `useAPI` em cada página
2. Ajustar URLs de `http://localhost:3000` para `http://localhost:3001`
3. Testar CRUD completo em cada tela
4. Adicionar loading states e tratamento de erros
