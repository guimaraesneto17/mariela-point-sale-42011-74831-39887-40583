import express, { Router } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import helmet from 'helmet';
import basicAuth from 'express-basic-auth';
import swaggerUi from 'swagger-ui-express';
import connectDatabase from './config/database';
import { initializeRedis } from './config/redis';
import swaggerSpec from './config/swagger';
import { authenticateToken } from './middleware/auth';
// Importar rotas
import produtosRouter from './routes/produtos';
import clientesRouter from './routes/clientes';
import vendasRouter from './routes/vendas';
import estoqueRouter from './routes/estoque';
import fornecedoresRouter from './routes/fornecedores';
import vendedoresRouter from './routes/vendedores';
import vitrineVirtualRouter from './routes/vitrineVirtual';
import recalculoRouter from './routes/recalculo';
import caixaRouter from './routes/caixa';
import contasPagarRouter from './routes/contasPagar';
import contasReceberRouter from './routes/contasReceber';
import categoriasFinanceirasRouter from './routes/categoriasFinanceiras';
import healthRouter from './routes/health';
import healthcheckRouter from './routes/healthcheck';
import authRouter from './routes/auth';
import uploadRouter from './routes/upload';
import permissionsRouter from './routes/permissions';
import cleanupRouter from './routes/cleanup';
import stockCleanupRouter from './routes/stockCleanup';
import searchRouter from './routes/search';
import cacheRouter from './routes/cache';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Confiar em proxies (necessário para Render.com e outros serviços de hospedagem)
app.set('trust proxy', true);

// HTTPS Redirect - Forçar HTTPS em produção
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    // Verificar header x-forwarded-proto (usado por proxies como Render, Heroku, etc.)
    if (req.headers['x-forwarded-proto'] !== 'https') {
      // Redirecionar para HTTPS com status 301 (permanente)
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}
// Helmet.js - Headers HTTP de segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Necessário para carregar imagens externas
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Permite CORS
}));

// Middlewares
// Lista de origens permitidas
const allowedOrigins = [
  'https://mariela-pdv.vercel.app',
  'https://mariela-pdv.lovable.app',
  'https://mariela-point-sale.vercel.app',
  'http://localhost:8080',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:5173'
];

// Configuração do CORS
app.use(cors({
  origin: (origin, callback) => {
    // Permitir requisições sem origin (ex: mobile apps, Postman, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    // Verificar se a origem está na lista de permitidas
    if (allowedOrigins.includes(origin)) {
      console.log(`✅ CORS permitido: ${origin}`);
      return callback(null, true);
    }

    // Permitir qualquer subdomínio do Lovable
    if (origin.endsWith('.lovableproject.com') || origin.endsWith('.lovable.app')) {
      console.log(`✅ CORS permitido (Lovable): ${origin}`);
      return callback(null, true);
    }

    // Permitir qualquer subdomínio da Vercel em desenvolvimento
    if (origin.includes('.vercel.app')) {
      console.log(`✅ CORS permitido (Vercel): ${origin}`);
      return callback(null, true);
    }

    // Bloquear outras origens
    console.warn(`🚫 Bloqueado por CORS: ${origin}`);
    callback(new Error('Não permitido pelo CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 horas
}));

// Compressão gzip para todas as respostas (reduz tráfego de rede em até 70%)
app.use(compression({
  filter: (req: express.Request, res: express.Response) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6, // Nível de compressão (0-9, 6 é o padrão e oferece bom equilíbrio)
  threshold: 1024, // Apenas comprimir respostas maiores que 1KB
}));

app.use(express.json({ limit: '50mb' })); // Aumentado para suportar imagens base64 temporariamente
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate Limiting - Proteção contra ataques DDoS (configuração mais permissiva para evitar 429 em uso normal)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10000, // limite de 10000 requisições por IP (leituras frequentes do frontend)
  message: 'Muitas requisições deste IP, tente novamente após alguns minutos',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate Limiting restritivo para autenticação - Proteção contra brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo 10 tentativas de login/registro por IP em 15 minutos
  message: { 
    error: 'Muitas tentativas de autenticação',
    message: 'Limite de tentativas excedido. Aguarde 15 minutos antes de tentar novamente.',
    retryAfter: '15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Não conta requisições bem-sucedidas
});

// Rate Limiting para refresh token - Um pouco mais permissivo
const refreshLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 30, // máximo 30 refreshes por hora por IP
  message: { 
    error: 'Muitas requisições de refresh token',
    message: 'Limite de refresh tokens excedido. Aguarde antes de tentar novamente.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Aplicar rate limiting geral para todos os endpoints da API
app.use('/api/', apiLimiter);

// Aplicar rate limiting restritivo para endpoints de autenticação
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/refresh', refreshLimiter);

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Swagger Documentation - Protegido por autenticação em produção
const swaggerAuth = basicAuth({
  users: { 
    [process.env.SWAGGER_USER || 'admin']: process.env.SWAGGER_PASSWORD || 'mariela@docs2024'
  },
  challenge: true,
  realm: 'Mariela API Documentation',
});

// Aplicar autenticação básica no Swagger apenas em produção
if (process.env.NODE_ENV === 'production') {
  app.use('/api-docs', swaggerAuth, swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Mariela Moda API',
    customfavIcon: '/favicon.ico'
  }));
  app.get('/api-docs.json', swaggerAuth, (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
} else {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Mariela Moda API',
    customfavIcon: '/favicon.ico'
  }));
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}

// Rotas da API
// Rotas públicas (sem autenticação)
app.use('/api/health', healthRouter);
app.use('/api/healthcheck', healthcheckRouter);
app.use('/api/vitrine', vitrineVirtualRouter);
app.use('/api/auth', authRouter);

// Rotas protegidas (com autenticação JWT)
app.use('/api/upload', authenticateToken, uploadRouter);
app.use('/api/produtos', authenticateToken, produtosRouter);
app.use('/api/clientes', authenticateToken, clientesRouter);
app.use('/api/vendas', authenticateToken, vendasRouter);
app.use('/api/estoque', authenticateToken, estoqueRouter);
app.use('/api/fornecedores', authenticateToken, fornecedoresRouter);
app.use('/api/vendedores', authenticateToken, vendedoresRouter);
app.use('/api/recalculo', authenticateToken, recalculoRouter);
app.use('/api/caixa', authenticateToken, caixaRouter);
app.use('/api/contas-pagar', authenticateToken, contasPagarRouter);
app.use('/api/contas-receber', authenticateToken, contasReceberRouter);
app.use('/api/categorias-financeiras', authenticateToken, categoriasFinanceirasRouter);
app.use('/api/permissions', authenticateToken, permissionsRouter);
app.use('/api/cleanup', authenticateToken, cleanupRouter);
app.use('/api/stock-cleanup', authenticateToken, stockCleanupRouter);
app.use('/api/search', authenticateToken, searchRouter);
app.use('/api/cache', authenticateToken, cacheRouter);

// Rota 404
app.use(/.*/, (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Erro:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Iniciar servidor
async function startServer() {
  try {
    // Conectar ao banco de dados
    await connectDatabase();
    
    // Inicializar Redis (opcional)
    await initializeRedis();
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║         🌸 Mariela Moda - Sistema PDV 🌸          ║
║                                                   ║
║  Servidor rodando em: http://localhost:${PORT}     ║
║                                                   ║
║  📚 Documentação Swagger:                         ║
║  http://localhost:${PORT}/api-docs                 ║
║                                                   ║
║  API Endpoints:                                   ║
║  • /api/produtos                                  ║
║  • /api/clientes                                  ║
║  • /api/vendas                                    ║
║  • /api/estoque                                   ║
║  • /api/fornecedores                              ║
║  • /api/vendedores                                ║
║  • /api/vitrine                                   ║
║  • /api/cache (gerenciamento)                     ║
║                                                   ║
║  Health Check: http://localhost:${PORT}/health     ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();

export default app;
