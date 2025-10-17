import mongoose from 'mongoose';

/**
 * Configuração da conexão com MongoDB Atlas
 * 
 * Para conectar ao MongoDB Atlas:
 * 1. Crie uma variável de ambiente chamada MONGODB_URI
 * 2. O valor deve ser sua string de conexão do MongoDB Atlas
 * 3. Formato: mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
 * 
 * Exemplo de uso:
 * - Em desenvolvimento: adicione ao arquivo .env na raiz do projeto
 * - Em produção: configure nas variáveis de ambiente do seu servidor
 */

const MONGODB_URI = process.env.MONGODB_URI || '';

if (!MONGODB_URI) {
  console.warn(
    '⚠️  ATENÇÃO: Variável de ambiente MONGODB_URI não configurada!\n' +
    'Por favor, adicione sua string de conexão do MongoDB Atlas.\n' +
    'Exemplo: MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mariela-pdv'
  );
}

interface CachedConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: CachedConnection | undefined;
}

let cached: CachedConnection = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

/**
 * Conecta ao banco de dados MongoDB
 * Usa cache para evitar múltiplas conexões em desenvolvimento
 */
export async function connectDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!MONGODB_URI) {
    throw new Error(
      'Por favor, defina a variável de ambiente MONGODB_URI com sua string de conexão do MongoDB Atlas'
    );
  }

  if (!cached.promise) {
    const options = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, options).then((mongoose) => {
      console.log('✅ Conectado ao MongoDB Atlas com sucesso!');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    console.error('❌ Erro ao conectar ao MongoDB:', error);
    throw error;
  }

  return cached.conn;
}

/**
 * Desconecta do banco de dados
 */
export async function disconnectDatabase(): Promise<void> {
  if (cached.conn) {
    await cached.conn.disconnect();
    cached.conn = null;
    cached.promise = null;
    console.log('🔌 Desconectado do MongoDB');
  }
}

export default connectDatabase;
