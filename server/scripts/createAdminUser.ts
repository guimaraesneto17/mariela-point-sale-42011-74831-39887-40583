import bcrypt from 'bcrypt';
import User from '../models/User';
import connectDatabase from '../config/database';

/**
 * Script para criar usuário admin inicial
 * Executar com: npx tsx server/scripts/createAdminUser.ts
 */

const ADMIN_EMAIL = 'marielamodaf@gmail.com';
const ADMIN_PASSWORD = 'mariela214365';
const ADMIN_NOME = 'Administrador Mariela';
const SALT_ROUNDS = 10;

async function createAdminUser() {
  try {
    console.log('🔌 Conectando ao banco de dados...');
    await connectDatabase();

    // Verificar se já existe
    const existingUser = await User.findOne({ email: ADMIN_EMAIL });
    if (existingUser) {
      console.log('⚠️  Usuário admin já existe no banco de dados!');
      console.log(`📧 Email: ${existingUser.email}`);
      console.log(`👤 Nome: ${existingUser.nome}`);
      console.log(`🎭 Role: ${existingUser.role}`);
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
