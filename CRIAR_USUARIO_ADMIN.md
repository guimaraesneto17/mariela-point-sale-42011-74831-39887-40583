# 👤 Criar Usuário Admin Inicial

## Método 1: Via Script (Recomendado)

### 1. Acesse o servidor onde o backend está rodando

### 2. Execute o script de criação

```bash
cd server
npx tsx scripts/createAdminUser.ts
```

### 3. Credenciais do Admin

O script criará automaticamente um usuário admin com as seguintes credenciais:

```
Email: marielamodaf@gmail.com
Senha: mariela214365
Role: admin
```

## Método 2: Insert Manual no MongoDB

Se preferir fazer insert manual no banco de dados, use o seguinte código:

```javascript
// Conectar ao MongoDB e executar este código

const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;
const plainPassword = 'mariela214365';

// Gerar hash da senha
bcrypt.hash(plainPassword, SALT_ROUNDS, async function(err, hash) {
  if (err) {
    console.error('Erro ao gerar hash:', err);
    return;
  }

  // Insert no MongoDB
  db.users.insertOne({
    email: 'marielamodaf@gmail.com',
    password: hash,
    nome: 'Administrador Mariela',
    role: 'admin',
    ativo: true,
    codigoVendedor: null,
    dataCriacao: new Date(),
    ultimoAcesso: null,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  console.log('✅ Usuário admin criado com sucesso!');
  console.log('Email: marielamodaf@gmail.com');
  console.log('Senha: mariela214365');
});
```

## Método 3: Via MongoDB Compass (GUI)

1. Abra MongoDB Compass
2. Conecte ao banco de dados
3. Navegue até a collection `users`
4. Clique em "Insert Document"
5. Cole o seguinte JSON (substitua `HASH_BCRYPT_AQUI` pelo hash gerado):

```json
{
  "email": "marielamodaf@gmail.com",
  "password": "HASH_BCRYPT_AQUI",
  "nome": "Administrador Mariela",
  "role": "admin",
  "ativo": true,
  "codigoVendedor": null,
  "dataCriacao": { "$date": "2025-01-28T00:00:00.000Z" },
  "ultimoAcesso": null,
  "createdAt": { "$date": "2025-01-28T00:00:00.000Z" },
  "updatedAt": { "$date": "2025-01-28T00:00:00.000Z" }
}
```

**Para gerar o hash bcrypt da senha:**
```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('mariela214365', 10, (e,h) => console.log(h));"
```

## Verificar se Admin foi Criado

Execute no MongoDB:

```javascript
db.users.findOne({ email: 'marielamodaf@gmail.com' })
```

Deve retornar o documento do usuário admin.

## Fazer Login

Após criar o usuário admin:

1. Acesse: https://mariela-pdv.vercel.app/auth
2. Use as credenciais:
   - **Email:** marielamodaf@gmail.com
   - **Senha:** mariela214365
3. Após login, você terá acesso total ao sistema como admin

## Acessar Gerenciamento de Usuários

Como admin, você pode:

1. Acessar o menu lateral e clicar em **"Usuários"**
2. Nesta página você pode:
   - Ver todos os usuários cadastrados
   - Editar roles de usuários
   - Ativar/desativar usuários
   - Monitorar último acesso

## Criar Novos Usuários

⚠️ **IMPORTANTE:** O registro pelo frontend foi removido por segurança.

Para criar novos usuários, existem 2 opções:

### Opção 1: Via Admin (Recomendado)
- Futuramente será adicionado botão "Criar Usuário" na página /usuarios
- Por enquanto, use a Opção 2

### Opção 2: Via API Diretamente

Use o Swagger ou cURL para criar usuários:

**Swagger:**
1. Acesse: https://mariela-pdv-backend.onrender.com/api-docs
2. Faça login como admin e copie o token
3. Clique em "Authorize" e cole o token
4. Vá em POST /api/auth/register
5. Preencha os dados do novo usuário

**cURL:**
```bash
curl -X POST https://mariela-pdv-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN_AQUI" \
  -d '{
    "email": "vendedor@mariela.com",
    "password": "senha123",
    "nome": "João Vendedor",
    "role": "vendedor",
    "codigoVendedor": "V001"
  }'
```

## Roles Disponíveis

- **admin**: Acesso total, pode gerenciar usuários
- **gerente**: Acesso a relatórios e gerenciamento, exceto usuários
- **vendedor**: Acesso a vendas, caixa e consultas (requer codigoVendedor)

## Troubleshooting

### "Usuário admin já existe"
- O script detecta se o admin já foi criado
- Use as credenciais existentes para login

### "Erro ao conectar no banco"
- Verifique se a variável `MONGODB_URI` está configurada corretamente
- Verifique se o MongoDB está acessível

### "Não consigo fazer login"
- Verifique se digitou email e senha corretamente
- Email: marielamodaf@gmail.com (sem espaços)
- Senha: mariela214365 (sem espaços)
- Verifique se o usuário está ativo no banco

### "Token expirado"
- Tokens de acesso expiram em 1 hora
- O sistema renova automaticamente usando refresh token
- Se der erro, faça logout e login novamente
