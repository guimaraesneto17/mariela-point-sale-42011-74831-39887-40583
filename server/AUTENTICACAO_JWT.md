# 🔐 Autenticação JWT - Mariela PDV

## Visão Geral

O sistema Mariela PDV implementa autenticação JWT (JSON Web Token) para proteger as APIs sensíveis contra acesso não autorizado. Este documento explica como funciona e como utilizar.

## 🛡️ Segurança Implementada

### 1. Rate Limiting
- **Rate Limiting Geral**: 1000 requisições por IP a cada 15 minutos para todas as rotas `/api/`
- **Rate Limiting Rigoroso**: 100 requisições por IP a cada 15 minutos para rotas protegidas

### 2. Autenticação JWT
- Token JWT válido por 24 horas
- Middleware de autenticação em todas as rotas sensíveis
- Validação automática de token expirado ou inválido

## 📍 Endpoints

### Rotas Públicas (sem autenticação)
- `GET /api/health` - Status do servidor
- `GET /api/vitrine` - Vitrine virtual (consulta)
- `POST /api/auth/login` - Login
- `GET /api/auth/validate` - Validar token

### Rotas Protegidas (requerem autenticação)
Todas as seguintes rotas requerem token JWT:
- `/api/produtos` - Gerenciamento de produtos
- `/api/clientes` - Gerenciamento de clientes
- `/api/vendas` - Gerenciamento de vendas
- `/api/estoque` - Gerenciamento de estoque
- `/api/fornecedores` - Gerenciamento de fornecedores
- `/api/vendedores` - Gerenciamento de vendedores
- `/api/caixa` - Gerenciamento de caixa
- `/api/contas-pagar` - Contas a pagar
- `/api/contas-receber` - Contas a receber
- `/api/categorias-financeiras` - Categorias financeiras
- `/api/recalculo` - Recálculo de totais

## 🔑 Como Usar a Autenticação

### 1. Fazer Login

**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
  "email": "admin@mariela.com",
  "password": "senha123"
}
```

**Response (Sucesso):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "24h",
  "message": "Login realizado com sucesso"
}
```

**Response (Erro):**
```json
{
  "error": "Email e senha são obrigatórios"
}
```

### 2. Usar o Token em Requisições

Após receber o token, inclua-o no header `Authorization` de todas as requisições para rotas protegidas:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Exemplo com cURL:**
```bash
curl -X GET https://mariela-pdv-backend.onrender.com/api/produtos \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Exemplo com JavaScript (Fetch):**
```javascript
const token = 'seu-token-jwt';

fetch('https://mariela-pdv-backend.onrender.com/api/produtos', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(response => response.json())
.then(data => console.log(data));
```

**Exemplo com Axios:**
```javascript
const token = 'seu-token-jwt';

axios.get('https://mariela-pdv-backend.onrender.com/api/produtos', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(response => console.log(response.data));
```

### 3. Validar Token

**Endpoint:** `GET /api/auth/validate`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (Token válido):**
```json
{
  "valid": true,
  "userId": "usuario@example.com"
}
```

**Response (Token inválido):**
```json
{
  "valid": false,
  "error": "Token inválido ou expirado"
}
```

## ⚠️ Códigos de Erro

### 401 Unauthorized
Token não foi fornecido no header da requisição.

```json
{
  "error": "Token de autenticação não fornecido",
  "message": "É necessário estar autenticado para acessar este recurso"
}
```

### 403 Forbidden
Token inválido ou expirado.

```json
{
  "error": "Token inválido ou expirado",
  "message": "Faça login novamente para continuar"
}
```

### 429 Too Many Requests
Limite de requisições excedido.

```json
{
  "message": "Limite de requisições excedido para esta operação"
}
```

## 🔧 Configuração

### Variável de Ambiente

O sistema usa a variável de ambiente `JWT_SECRET` para assinar os tokens. 

**⚠️ IMPORTANTE:** Em produção, configure esta variável com uma chave secreta forte:

```bash
JWT_SECRET=sua-chave-secreta-muito-forte-e-aleatoria
```

Se não configurada, o sistema usa um valor padrão (⚠️ NÃO RECOMENDADO PARA PRODUÇÃO).

### Duração do Token

Por padrão, os tokens expiram em **24 horas**. Para alterar, edite o arquivo `server/middleware/auth.ts`:

```typescript
return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' }); // Altere aqui
```

## 📝 Notas de Desenvolvimento

### Autenticação Temporária

**⚠️ ATENÇÃO:** A implementação atual aceita qualquer email/senha para fins de desenvolvimento.

Em produção, você DEVE:
1. Integrar com um banco de dados de usuários
2. Implementar hash de senhas com bcrypt
3. Validar credenciais reais
4. Implementar recuperação de senha
5. Adicionar autenticação de dois fatores (opcional)

### Teste no Swagger

A documentação Swagger está disponível em:
- **Produção:** https://mariela-pdv-backend.onrender.com/api-docs
- **Local:** http://localhost:3001/api-docs

Para testar endpoints protegidos no Swagger:
1. Faça login em `/api/auth/login` e copie o token
2. Clique no botão "Authorize" no topo da página
3. Cole o token (sem "Bearer", o Swagger adiciona automaticamente)
4. Clique em "Authorize"
5. Agora você pode testar todos os endpoints protegidos

## 🚀 Próximos Passos Recomendados

1. **Implementar banco de usuários real**
   - Criar tabela de usuários no MongoDB ou Supabase
   - Adicionar hash de senhas com bcrypt

2. **Adicionar refresh tokens**
   - Implementar tokens de curta duração + refresh tokens
   - Melhorar experiência do usuário

3. **Implementar níveis de permissão**
   - Admin, Gerente, Vendedor, etc.
   - Controle de acesso granular por role

4. **Adicionar logs de auditoria**
   - Registrar tentativas de login
   - Rastrear ações de usuários autenticados

5. **Implementar 2FA (autenticação de dois fatores)**
   - Aumentar segurança para operações críticas
