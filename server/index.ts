import express, { Router } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import connectDatabase from './config/database';
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
import authRouter from './routes/auth';
import uploadRouter from './routes/upload';
import permissionsRouter from './routes/permissions';
import cleanupRouter from './routes/cleanup';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Confiar em proxies (necessário para Render.com e outros serviços de hospedagem)
app.set('trust proxy', true);

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
app.use(express.json({ limit: '50mb' })); // Aumentado para suportar imagens base64 temporariamente
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate Limiting - Proteção contra ataques DDoS
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // limite de 1000 requisições por IP
  message: 'Muitas requisições deste IP, tente novamente após 15 minutos',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting mais rigoroso para endpoints críticos
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requisições por IP
  message: 'Limite de requisições excedido para esta operação',
  standardHeaders: true,
  legacyHeaders: false,
});

// Aplicar rate limiting geral
app.use('/api/', apiLimiter);

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Mariela Moda API',
  customfavIcon: '/favicon.ico'
}));

// Rota para obter o JSON do Swagger
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Rotas da API
// Rotas públicas (sem autenticação)
app.use('/api/health', healthRouter);
app.use('/api/vitrine', vitrineVirtualRouter);
app.use('/api/auth', authRouter);

// Rotas protegidas (com autenticação JWT e rate limiting rigoroso)
app.use('/api/upload', strictLimiter, authenticateToken, uploadRouter);
app.use('/api/produtos', strictLimiter, authenticateToken, produtosRouter);
app.use('/api/clientes', strictLimiter, authenticateToken, clientesRouter);
app.use('/api/vendas', strictLimiter, authenticateToken, vendasRouter);
app.use('/api/estoque', strictLimiter, authenticateToken, estoqueRouter);
app.use('/api/fornecedores', strictLimiter, authenticateToken, fornecedoresRouter);
app.use('/api/vendedores', strictLimiter, authenticateToken, vendedoresRouter);
app.use('/api/recalculo', strictLimiter, authenticateToken, recalculoRouter);
app.use('/api/caixa', strictLimiter, authenticateToken, caixaRouter);
app.use('/api/contas-pagar', strictLimiter, authenticateToken, contasPagarRouter);
app.use('/api/contas-receber', strictLimiter, authenticateToken, contasReceberRouter);
app.use('/api/categorias-financeiras', strictLimiter, authenticateToken, categoriasFinanceirasRouter);
app.use('/api/permissions', strictLimiter, authenticateToken, permissionsRouter);
app.use('/api/cleanup', strictLimiter, authenticateToken, cleanupRouter);

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
