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

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
