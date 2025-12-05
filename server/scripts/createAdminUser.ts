import bcrypt from 'bcrypt';
import User from '../models/User';
import connectDatabase from '../config/database';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

/**
 * Script para criar usuário admin inicial
 * Executar com: npx tsx server/scripts/createAdminUser.ts
 * 
 * VARIÁVEIS DE AMBIENTE NECESSÁRIAS:
 * - ADMIN_EMAIL: email do admin
 * - ADMIN_PASSWORD: senha do admin
 * - ADMIN_NOME (opcional): nome do admin
 */

// Validação de variáveis de ambiente obrigatórias
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_NOME = process.env.ADMIN_NOME || 'Administrador Mariela';
const SALT_ROUNDS = 10;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('❌ ERRO: Variáveis de ambiente obrigatórias não configuradas!');
  console.error('   Configure as seguintes variáveis:');
  console.error('   - ADMIN_EMAIL: email do administrador');
  console.error('   - ADMIN_PASSWORD: senha do administrador');
  console.error('   - ADMIN_NOME (opcional): nome do administrador');
  console.error('\n   Exemplo:');
  console.error('   ADMIN_EMAIL=admin@exemplo.com ADMIN_PASSWORD=senhaSegura123 npx tsx server/scripts/createAdminUser.ts');
  process.exit(1);
}

async function createAdminUser() {
  try {
    console.log('🔌 Conectando ao banco de dados...');
    await connectDatabase();

    // Verificar se já existe
    const existingUser = await User.findOne({ email: ADMIN_EMAIL });
    if (existingUser) {
      console.log('⚠️  Usuário admin já existe no banco de dados!');
      
      // Verificar se está desativado e ativar
      if (!existingUser.ativo) {
        console.log('🔄 Usuário estava desativado. Ativando...');
        existingUser.ativo = true;
        await existingUser.save();
        console.log('✅ Usuário admin foi ativado!');
      }
      
      console.log(`📧 Email: ${existingUser.email}`);
      console.log(`👤 Nome: ${existingUser.nome}`);
      console.log(`🎭 Role: ${existingUser.role}`);
      console.log(`✓ Ativo: ${existingUser.ativo}`);
      process.exit(0);
    }

    // Hash da senha
    console.log('🔐 Gerando hash da senha...');
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);

    // Criar usuário admin
    console.log('✨ Criando usuário admin...');
    const adminUser = new User({
      email: ADMIN_EMAIL,
      password: hashedPassword,
      nome: ADMIN_NOME,
      role: 'admin',
      ativo: true
    });

    await adminUser.save();

    console.log('\n✅ Usuário admin criado com sucesso!\n');
    console.log('==========================================');
    console.log('📧 Email:', ADMIN_EMAIL);
    console.log('🔑 Senha:', ADMIN_PASSWORD);
    console.log('👤 Nome:', ADMIN_NOME);
    console.log('🎭 Role: admin');
    console.log('==========================================\n');
    console.log('🚀 Você já pode fazer login no sistema!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error);
    process.exit(1);
  }
}

createAdminUser();
