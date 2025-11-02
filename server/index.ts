import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import connectDatabase from './config/database';
import swaggerSpec from './config/swagger';

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

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
// Lista de origens permitidas
const allowedOrigins = [
  'https://mariela-pdv.vercel.app',
  'https://mariela-pdv.lovable.app',
  'https://mariela-point-sale.vercel.app',
  'https://a9daa95e-02e8-4bad-a82b-327ad991a1b4.lovableproject.com',
  'https://id-preview--abd15f43-0482-44aa-9acd-05f459b644cb.lovable.app',
  'https://id-preview--474e004e-52f2-4568-9eac-ca58590d8820.lovable.app',
  'http://localhost:8080',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:5173',
  'http://192.168.0.11:8080'
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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// Rota de health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rotas da API
app.use('/api/produtos', produtosRouter);
app.use('/api/clientes', clientesRouter);
app.use('/api/vendas', vendasRouter);
app.use('/api/estoque', estoqueRouter);
app.use('/api/fornecedores', fornecedoresRouter);
app.use('/api/vendedores', vendedoresRouter);
app.use('/api/vitrine', vitrineVirtualRouter);
app.use('/api/recalculo', recalculoRouter);
app.use('/api/caixa', caixaRouter);

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
