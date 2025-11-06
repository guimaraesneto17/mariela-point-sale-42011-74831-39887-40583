# 📘 Exemplos Práticos - API Vitrine Virtual

Guia completo com exemplos práticos de uso da API da Vitrine Virtual.

---

## 🎯 Exemplos de Requisições

### 1. Listar Todos os Produtos da Vitrine

**Requisição:**
```http
GET /api/vitrine
Host: mariela-pdv-backend.onrender.com
Content-Type: application/json
```

**Resposta de Sucesso (200):**
```json
[
  {
    "isOnSale": true,
    "isNew": false,
    "variants": [
      {
        "color": "Vermelho",
        "size": "P",
        "available": 3
      },
      {
        "color": "Vermelho",
        "size": "M",
        "available": 2
      }
    ],
    "totalAvailable": 5,
    "statusProduct": "Disponível",
    "id": 1,
    "code": "P001",
    "image": ["https://exemplo.com/vestido-vermelho.jpg"],
    "title": "Vestido Floral Vermelho",
    "price": "R$ 89,90",
    "priceValue": 89.90,
    "originalPrice": "R$ 129,90",
    "originalPriceValue": 129.90,
    "category": "Vestido",
    "updatedAt": "2025-11-06T10:30:00.000Z"
  },
  {
    "isOnSale": false,
    "isNew": true,
    "variants": [
      {
        "color": "Azul",
        "size": "M",
        "available": 8
      }
    ],
    "totalAvailable": 8,
    "statusProduct": "Disponível",
    "id": 2,
    "code": "P002",
    "image": ["default.jpg"],
    "title": "Blusa Básica Azul",
    "price": "R$ 49,90",
    "priceValue": 49.90,
    "originalPrice": null,
    "originalPriceValue": null,
    "category": "Blusa",
    "updatedAt": "2025-11-06T09:15:00.000Z"
  }
]
```

---

### 2. Listar Apenas Promoções

**Requisição:**
```http
GET /api/vitrine/promocoes
Host: mariela-pdv-backend.onrender.com
Content-Type: application/json
```

**Resposta de Sucesso (200):**
```json
[
  {
    "isOnSale": true,
    "isNew": false,
    "variants": [
      {
        "color": "Rosa",
        "size": "G",
        "available": 2
      }
    ],
    "totalAvailable": 2,
    "statusProduct": "Últimas unidades",
    "id": 3,
    "code": "P003",
    "image": ["https://exemplo.com/saia-rosa.jpg"],
    "title": "Saia Plissada Rosa",
    "price": "R$ 59,90",
    "priceValue": 59.90,
    "originalPrice": "R$ 99,90",
    "originalPriceValue": 99.90,
    "category": "Saia",
    "updatedAt": "2025-11-05T14:20:00.000Z"
  }
]
```

**💡 Dica:** Use este endpoint para criar seções de "Ofertas" ou "Promoções" no seu e-commerce.

---

### 3. Listar Apenas Novidades

**Requisição:**
```http
GET /api/vitrine/novidades
Host: mariela-pdv-backend.onrender.com
Content-Type: application/json
```

**Resposta de Sucesso (200):**
```json
[
  {
    "isOnSale": false,
    "isNew": true,
    "variants": [
      {
        "color": "Preto",
        "size": "U",
        "available": 10
      }
    ],
    "totalAvailable": 10,
    "statusProduct": "Disponível",
    "id": 4,
    "code": "P004",
    "image": ["https://exemplo.com/bolsa-preta.jpg"],
    "title": "Bolsa Tote Preta",
    "price": "R$ 149,90",
    "priceValue": 149.90,
    "originalPrice": null,
    "originalPriceValue": null,
    "category": "Bolsa",
    "updatedAt": "2025-11-06T11:00:00.000Z"
  }
]
```

**💡 Dica:** Perfeito para criar uma seção "Lançamentos" ou "Novidades" na sua loja.

---

### 4. Buscar Produto por Código

**Requisição:**
```http
GET /api/vitrine/codigo/P001
Host: mariela-pdv-backend.onrender.com
Content-Type: application/json
```

**Resposta de Sucesso (200):**
```json
{
  "isOnSale": true,
  "isNew": false,
  "variants": [
    {
      "color": "Vermelho",
      "size": "P",
      "available": 3
    },
    {
      "color": "Vermelho",
      "size": "M",
      "available": 2
    }
  ],
  "totalAvailable": 5,
  "statusProduct": "Disponível",
  "id": 1,
  "code": "P001",
  "image": ["https://exemplo.com/vestido-vermelho.jpg"],
  "title": "Vestido Floral Vermelho",
  "price": "R$ 89,90",
  "priceValue": 89.90,
  "originalPrice": "R$ 129,90",
  "originalPriceValue": 129.90,
  "category": "Vestido",
  "updatedAt": "2025-11-06T10:30:00.000Z"
}
```

**Resposta de Erro (404):**
```json
{
  "error": "Produto da vitrine não encontrado"
}
```

---

### 5. Buscar Produto por ID Sequencial

**Requisição:**
```http
GET /api/vitrine/1
Host: mariela-pdv-backend.onrender.com
Content-Type: application/json
```

**Resposta:** Mesma estrutura do exemplo anterior (item 4).

---

## 🚫 Operações Não Permitidas

### Tentativa de Criar Produto na Vitrine

**Requisição:**
```http
POST /api/vitrine
Host: mariela-pdv-backend.onrender.com
Content-Type: application/json

{
  "codigoProduto": "P005",
  "nome": "Nova Blusa"
}
```

**Resposta (501 - Not Implemented):**
```json
{
  "error": "Vitrine Virtual é somente leitura - use Estoque e Produto para modificar dados"
}
```

**⚠️ Como fazer:** Use `/api/produtos` para criar produtos e `/api/estoque` para gerenciar estoque.

---

## 📱 Exemplos de Integração

### JavaScript / TypeScript (Frontend)

```typescript
// Buscar todos os produtos
async function listarProdutos() {
  try {
    const response = await fetch('https://mariela-pdv-backend.onrender.com/api/vitrine');
    const produtos = await response.json();
    
    console.log('Produtos:', produtos);
    return produtos;
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    throw error;
  }
}

// Buscar apenas promoções
async function listarPromocoes() {
  try {
    const response = await fetch('https://mariela-pdv-backend.onrender.com/api/vitrine/promocoes');
    const promocoes = await response.json();
    
    return promocoes;
  } catch (error) {
    console.error('Erro ao buscar promoções:', error);
    throw error;
  }
}

// Buscar produto específico
async function buscarProduto(codigo: string) {
  try {
    const response = await fetch(`https://mariela-pdv-backend.onrender.com/api/vitrine/codigo/${codigo}`);
    
    if (!response.ok) {
      throw new Error('Produto não encontrado');
    }
    
    const produto = await response.json();
    return produto;
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    throw error;
  }
}

// Usar na aplicação
async function exemplo() {
  // Listar todos
  const produtos = await listarProdutos();
  
  // Filtrar por categoria no frontend
  const vestidos = produtos.filter(p => p.category === 'Vestido');
  
  // Filtrar produtos disponíveis
  const disponiveis = produtos.filter(p => p.totalAvailable > 0);
  
  // Ordenar por preço
  const porPreco = [...produtos].sort((a, b) => a.priceValue - b.priceValue);
  
  console.log('Vestidos:', vestidos);
  console.log('Disponíveis:', disponiveis);
  console.log('Mais baratos primeiro:', porPreco);
}
```

---

### React Component Example

```tsx
import { useState, useEffect } from 'react';

interface VitrineProduct {
  isOnSale: boolean;
  isNew: boolean;
  variants: Array<{
    color: string;
    size: string;
    available: number;
  }>;
  totalAvailable: number;
  statusProduct: string;
  id: number;
  code: string;
  image: string[];
  title: string;
  price: string;
  priceValue: number;
  originalPrice: string | null;
  originalPriceValue: number | null;
  category: string;
  updatedAt: string;
}

export function VitrineList() {
  const [produtos, setProdutos] = useState<VitrineProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProdutos() {
      try {
        setLoading(true);
        const response = await fetch('https://mariela-pdv-backend.onrender.com/api/vitrine');
        
        if (!response.ok) {
          throw new Error('Erro ao carregar produtos');
        }
        
        const data = await response.json();
        setProdutos(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }

    loadProdutos();
  }, []);

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div className="grid grid-cols-3 gap-4">
      {produtos.map(produto => (
        <div key={produto.id} className="border rounded p-4">
          <img src={produto.image[0]} alt={produto.title} />
          <h3>{produto.title}</h3>
          
          {produto.isOnSale && produto.originalPrice && (
            <div>
              <span className="line-through text-gray-500">
                {produto.originalPrice}
              </span>
            </div>
          )}
          
          <p className="text-lg font-bold">{produto.price}</p>
          
          <div className="flex gap-2 mt-2">
            {produto.isOnSale && (
              <span className="bg-red-500 text-white px-2 py-1 rounded">
                Promoção
              </span>
            )}
            {produto.isNew && (
              <span className="bg-green-500 text-white px-2 py-1 rounded">
                Novo
              </span>
            )}
          </div>
          
          <p className="text-sm text-gray-600 mt-2">
            {produto.statusProduct} - {produto.totalAvailable} unidades
          </p>
        </div>
      ))}
    </div>
  );
}
```

---

### Python Example

```python
import requests
import json

BASE_URL = "https://mariela-pdv-backend.onrender.com/api"

def listar_produtos():
    """Lista todos os produtos da vitrine"""
    try:
        response = requests.get(f"{BASE_URL}/vitrine")
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Erro ao buscar produtos: {e}")
        return []

def listar_promocoes():
    """Lista apenas produtos em promoção"""
    try:
        response = requests.get(f"{BASE_URL}/vitrine/promocoes")
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Erro ao buscar promoções: {e}")
        return []

def buscar_produto(codigo):
    """Busca produto específico por código"""
    try:
        response = requests.get(f"{BASE_URL}/vitrine/codigo/{codigo}")
        response.raise_for_status()
        return response.json()
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            print(f"Produto {codigo} não encontrado")
        else:
            print(f"Erro ao buscar produto: {e}")
        return None
    except requests.exceptions.RequestException as e:
        print(f"Erro na requisição: {e}")
        return None

# Exemplo de uso
if __name__ == "__main__":
    # Listar todos os produtos
    produtos = listar_produtos()
    print(f"Total de produtos: {len(produtos)}")
    
    # Listar promoções
    promocoes = listar_promocoes()
    print(f"Produtos em promoção: {len(promocoes)}")
    
    # Buscar produto específico
    produto = buscar_produto("P001")
    if produto:
        print(f"Produto encontrado: {produto['title']}")
        print(f"Preço: {produto['price']}")
        print(f"Disponível: {produto['totalAvailable']} unidades")
```

---

## 🎨 Casos de Uso

### 1. Criar Seção de Promoções no E-commerce

```typescript
async function criarSecaoPromocoes() {
  const promocoes = await fetch('https://mariela-pdv-backend.onrender.com/api/vitrine/promocoes')
    .then(res => res.json());
  
  // Calcular economia
  promocoes.forEach(produto => {
    if (produto.originalPriceValue) {
      const economia = produto.originalPriceValue - produto.priceValue;
      const percentual = (economia / produto.originalPriceValue) * 100;
      
      console.log(`${produto.title}: economize ${percentual.toFixed(0)}%`);
    }
  });
  
  return promocoes;
}
```

### 2. Verificar Disponibilidade de Produto

```typescript
async function verificarDisponibilidade(codigo: string, cor: string, tamanho: string) {
  const produto = await fetch(`https://mariela-pdv-backend.onrender.com/api/vitrine/codigo/${codigo}`)
    .then(res => res.json());
  
  const variante = produto.variants.find(
    v => v.color === cor && v.size === tamanho
  );
  
  if (!variante) {
    return { disponivel: false, mensagem: "Variante não encontrada" };
  }
  
  if (variante.available === 0) {
    return { disponivel: false, mensagem: "Esgotado" };
  }
  
  if (variante.available < 3) {
    return { 
      disponivel: true, 
      mensagem: "Últimas unidades!",
      quantidade: variante.available
    };
  }
  
  return { 
    disponivel: true, 
    mensagem: "Disponível",
    quantidade: variante.available
  };
}
```

### 3. Exibir Badge de Status

```typescript
function getStatusBadge(produto: VitrineProduct) {
  const badges = [];
  
  if (produto.isNew) {
    badges.push({ text: "Novo", color: "green" });
  }
  
  if (produto.isOnSale) {
    badges.push({ text: "Promoção", color: "red" });
  }
  
  if (produto.statusProduct === "Últimas unidades") {
    badges.push({ text: "Últimas unidades", color: "orange" });
  }
  
  if (produto.statusProduct === "Esgotado") {
    badges.push({ text: "Esgotado", color: "gray" });
  }
  
  return badges;
}
```

---

## 📞 Suporte

Para dúvidas sobre a API:
- Consulte a documentação Swagger: `/api-docs`
- Revise este documento para exemplos práticos
- Verifique `ATUALIZACAO_SISTEMA.md` para detalhes técnicos

---

**🎉 API da Vitrine Virtual totalmente documentada!**

*Última atualização: 06/11/2025*
