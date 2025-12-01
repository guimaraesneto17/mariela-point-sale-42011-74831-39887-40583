import { createClient, RedisClientType } from 'redis';

/**
 * Configuração do Redis para cache distribuído
 * Suporta fallback para cache em memória se Redis não estiver disponível
 */

let redisClient: RedisClientType | null = null;
let isRedisAvailable = false;

export async function initializeRedis(): Promise<void> {
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    console.log('⚠️  REDIS_URL não configurado. Usando cache em memória.');
    return;
  }

  try {
    redisClient = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 10000,
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('❌ Redis: Máximo de tentativas de reconexão atingido');
            return new Error('Máximo de tentativas atingido');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis Error:', err);
      isRedisAvailable = false;
    });

    redisClient.on('connect', () => {
      console.log('🔄 Redis: Conectando...');
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis: Conectado e pronto');
      isRedisAvailable = true;
    });

    redisClient.on('reconnecting', () => {
      console.log('🔄 Redis: Reconectando...');
    });

    redisClient.on('end', () => {
      console.log('⚠️  Redis: Conexão encerrada');
      isRedisAvailable = false;
    });

    await redisClient.connect();
  } catch (error) {
    console.error('❌ Erro ao conectar ao Redis:', error);
    redisClient = null;
    isRedisAvailable = false;
  }
}

export function getRedisClient(): RedisClientType | null {
  return isRedisAvailable ? redisClient : null;
}

export function isRedisEnabled(): boolean {
  return isRedisAvailable;
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    isRedisAvailable = false;
    console.log('👋 Redis: Conexão fechada');
  }
}
