# Documentação do Sistema de Novidades

## Visão Geral

O sistema de novidades permite marcar produtos como "novos" para destacá-los na vitrine virtual e nas páginas de listagem. Esta funcionalidade é integrada entre as collections `Produto`, `Estoque` e a view agregada `VitrineVirtual`.

---

## Arquitetura

### 1. **Modelo de Dados**

#### Collection: `Estoque`
- Campo: `isNovidade` (Boolean)
- Cada registro de estoque (que representa uma variante do produto) pode ser marcado como novidade
- Um produto é considerado novidade se **pelo menos uma** de suas variantes está marcada como `isNovidade: true`

#### Collection: `Produto`
- Não armazena diretamente o status de novidade
- O status é derivado dos registros de estoque associados

#### View Agregada: `VitrineVirtual`
- Combina dados de `Produto` + `Estoque`
- Campo: `isNew` (Boolean)
- É `true` quando pelo menos uma variante do produto tem `isNovidade: true` no estoque

---

## Endpoints Disponíveis

### 1. **Marcar/Desmarcar Produto como Novidade**

```http
PATCH /api/estoque/novidade/{codigo}
```

**Descrição:** Atualiza o status de novidade de TODAS as variantes de um produto no estoque.

**Parâmetros:**
- `codigo` (path): Código do produto (formato P + 3 dígitos, ex: `P001`)

**Body (JSON):**
```json
{
  "isNovidade": true
}
```

**Resposta de Sucesso (200):**
```json
{
  "message": "Produto marcado como novidade",
  "estoque": [
    {
      "codigoProduto": "P001",
      "isNovidade": true,
      // ... outros campos
    }
  ]
}
```

**Erros:**
- `404`: Produto não encontrado no estoque
- `400`: Erro ao atualizar novidade
- `500`: Erro interno

---

### 2. **Listar Novidades (Vitrine Virtual)**

```http
GET /api/vitrine/novidades
```

**Descrição:** Retorna todos os produtos marcados como novidade, formatados para exibição na vitrine.

**Resposta de Sucesso (200):**
```json
[
  {
    "_id": "64a5f8e3c1234567890abcde",
    "codigoProduto": "P001",
    "nome": "Vestido Floral Verão",
    "descricao": "Vestido leve e confortável para o verão",
    "categoria": "Vestido",
    "precoVenda": 199.90,
    "precoPromocional": null,
    "variantes": [
      {
        "cor": "Azul",
        "quantidade": 15,
        "tamanhos": ["P", "M", "G"],
        "imagens": ["url1", "url2"]
      }
    ],
    "statusProduct": "Disponível",
    "totalAvailable": 15,
    "isOnSale": false,
    "isNew": true,
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
]
```

---

### 3. **Listar Novidades (Produtos Base)**

```http
GET /api/produtos/novidades
```

**Descrição:** Retorna os produtos base (sem agregação de estoque) que possuem pelo menos uma variante marcada como novidade.

**Resposta de Sucesso (200):**
```json
[
  {
    "codigoProduto": "P001",
    "nome": "Vestido Floral Verão",
    "categoria": "Vestido",
    "precoVenda": 199.90,
    "descricao": "Vestido leve e confortável",
    "imagens": ["url1", "url2"],
    "dataCadastro": "2025-01-10T08:00:00.000Z"
  }
]
```

---

### 4. **Listar Todos os Produtos da Vitrine**

```http
GET /api/vitrine
```

**Descrição:** Retorna TODOS os produtos da vitrine, incluindo o campo `isNew` que indica se é novidade.

**Filtro por novidades:** Use o endpoint específico `/api/vitrine/novidades` para retornar apenas novidades.

---

## Fluxo de Uso no Frontend

### 1. **Marcar um Produto como Novidade**

```typescript
// Exemplo usando a API lib do frontend
import { estoqueAPI } from "@/lib/api";

const marcarComoNovidade = async (codigoProduto: string, isNovidade: boolean) => {
  try {
    await estoqueAPI.toggleNovidade(codigoProduto, isNovidade);
    toast.success(isNovidade ? "Produto marcado como novidade!" : "Produto removido das novidades!");
  } catch (error) {
    toast.error("Erro ao atualizar novidade");
  }
};
```

### 2. **Listar Novidades na Vitrine**

```typescript
// Exemplo de requisição
import { vitrineAPI } from "@/lib/api";

const listarNovidades = async () => {
  try {
    const novidades = await vitrineAPI.getNovidades();
    console.log("Novidades:", novidades);
  } catch (error) {
    console.error("Erro ao buscar novidades:", error);
  }
};
```

---

## Componentes do Frontend

### `NovidadeDialog.tsx`
- Componente de diálogo para confirmar marcação/desmarcação de novidade
- Localização: `src/components/NovidadeDialog.tsx`
- Props:
  - `open`: Boolean - controla visibilidade
  - `onOpenChange`: Função - callback para mudança de estado
  - `codigoProduto`: String - código do produto
  - `nomeProduto`: String - nome do produto
  - `isNovidade`: Boolean - status atual
  - `onSuccess`: Função - callback após sucesso

### Página de Estoque (`Estoque.tsx`)
- Exibe badge "Novidade" em produtos marcados
- Filtro para exibir apenas novidades: `filterNovidade`
- Botão para abrir `NovidadeDialog` e marcar/desmarcar produtos

---

## Regras de Negócio

1. **Marcação por Produto Completo:**
   - Ao marcar um produto como novidade, TODAS as suas variantes (cores, tamanhos) são marcadas
   - Não é possível marcar apenas uma variante específica como novidade

2. **Exibição na Vitrine:**
   - Um produto aparece como `isNew: true` na vitrine se pelo menos uma variante está marcada
   - Se todas as variantes forem desmarcadas, o produto deixa de ser novidade

3. **Ordenação:**
   - Produtos novos podem ser ordenados por `dataCadastro` (mais recentes primeiro)
   - Use `sort({ dataCadastro: -1 })` nas queries do backend

4. **Combinação com Promoções:**
   - Um produto pode ser novidade E estar em promoção simultaneamente
   - Os campos `isNew` e `isOnSale` são independentes

---

## Testes e Validação

### Teste Manual via Swagger UI
1. Acesse: `http://localhost:5001/api-docs`
2. Navegue até a seção **Estoque** ou **Vitrine Virtual**
3. Use o endpoint `PATCH /api/estoque/novidade/{codigo}` para marcar/desmarcar
4. Use o endpoint `GET /api/vitrine/novidades` para verificar a listagem

### Teste via Frontend
1. Acesse a página de Estoque
2. Clique no botão de novidade de um produto
3. Confirme a marcação no diálogo
4. Verifique se o badge "Novidade" aparece corretamente
5. Use o filtro de novidades para listar apenas produtos novos

---

## Troubleshooting

### Problema: Produto não aparece nas novidades após marcar
**Solução:**
- Verifique se o produto tem pelo menos um registro de estoque ativo
- Confirme que `isNovidade: true` foi salvo no banco de dados
- Verifique se o cache do frontend está atualizado (use React Query invalidation)

### Problema: Erro 404 ao marcar novidade
**Solução:**
- Confirme que o código do produto está correto (formato P + 3 dígitos)
- Verifique se o produto possui registros de estoque cadastrados

### Problema: Novidades não aparecem na vitrine mas aparecem no estoque
**Solução:**
- O endpoint `/api/vitrine/novidades` filtra por `isNew: true`
- Verifique se o campo `isNovidade` está correto no estoque
- O campo `isNew` é derivado do estoque durante a construção da view

---

## Melhorias Futuras (Sugestões)

1. **Novidade por Variante:**
   - Permitir marcar variantes específicas como novidade (ex: apenas a cor "Azul")
   
2. **Expiração Automática:**
   - Adicionar campo `dataValidadeNovidade` para remover automaticamente após X dias
   
3. **Histórico de Novidades:**
   - Registrar quando um produto foi marcado/desmarcado como novidade
   
4. **Limite de Novidades:**
   - Configurar número máximo de produtos que podem ser novidades simultaneamente

---

## Referências

- **Controller:** `server/controllers/vitrineVirtualController.ts` - Função `getNovidades()`
- **Controller:** `server/controllers/estoqueController.ts` - Função `toggleNovidade()`
- **Rotas:** `server/routes/vitrineVirtual.ts` e `server/routes/estoque.ts`
- **Model:** `server/models/Estoque.ts` - Campo `isNovidade`
- **Frontend:** `src/components/NovidadeDialog.tsx` e `src/pages/Estoque.tsx`
- **API Lib:** `src/lib/api.ts` - `estoqueAPI.toggleNovidade()` e `vitrineAPI.getNovidades()`
