import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Verifica o status do backend e conexão com MongoDB
 *     description: |
 *       Endpoint de health check que retorna informações sobre:
 *       - Status do servidor
 *       - Conexão com o banco de dados MongoDB
 *       - Tempo de atividade do servidor (uptime)
 *       - Uso de memória
 *       
 *       **Status Codes:**
 *       - 200: Sistema operacional
 *       - 503: Sistema degradado (banco de dados desconectado)
 *       - 500: Erro no servidor
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Sistema operacional
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                   description: Status geral do sistema
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-01-28T10:30:00.000Z"
 *                 database:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [connected, disconnected, connecting, disconnecting]
 *                       example: "connected"
 *                     name:
 *                       type: string
 *                       example: "mariela-db"
 *                     host:
 *                       type: string
 *                       example: "cluster0.mongodb.net"
 *                 uptime:
 *                   type: number
 *                   example: 86400.5
 *                   description: Tempo de atividade em segundos
 *                 memory:
 *                   type: object
 *                   description: Uso de memória do processo Node.js
 *       503:
 *         description: Sistema degradado - banco de dados desconectado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "degraded"
 *                 message:
 *                   type: string
 *                   example: "Banco de dados não está conectado"
 *       500:
 *         description: Erro no servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 error:
 *                   type: string
 *                   example: "Erro ao verificar status"
 */
router.get('/', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState;
    const dbStatusMap: { [key: number]: string } = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    const response = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatusMap[dbStatus] || 'unknown',
        name: mongoose.connection.name || 'N/A',
        host: mongoose.connection.host || 'N/A',
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };

    // Se o banco estiver desconectado, retornar status 503
    if (dbStatus !== 1) {
      return res.status(503).json({
        ...response,
        status: 'degraded',
        message: 'Banco de dados não está conectado',
      });
    }

    res.json(response);
  } catch (error) {
    console.error('❌ Erro no health check:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
});

/**
 * @swagger
 * /api/health/collections:
 *   get:
 *     summary: Verifica o status de cada collection do MongoDB
 *     description: Testa a conectividade e tempo de resposta de cada collection individualmente
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Status das collections
 */
router.get('/collections', async (req, res) => {
  try {
    // Verificar se o banco está conectado
    if (!mongoose.connection.db) {
      return res.status(503).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Banco de dados não conectado',
        collections: [],
      });
    }

    const collections = [
      'produtos',
      'clientes', 
      'vendas',
      'estoque',
      'fornecedores',
      'vendedores',
      'caixas',
      'contaspagar',
      'contasreceber',
      'vitrinevirtual'
    ];

    const results = await Promise.all(
      collections.map(async (collectionName) => {
        const startTime = Date.now();
        try {
          // Timeout de 5 segundos por collection
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 5000)
          );
          
          const queryPromise = mongoose.connection.db!
            .collection(collectionName)
            .findOne({}, { projection: { _id: 1 }, maxTimeMS: 5000 });

          await Promise.race([queryPromise, timeoutPromise]);
          
          const responseTime = Date.now() - startTime;
          
          return {
            collection: collectionName,
            status: 'success',
            responseTime,
          };
        } catch (error: any) {
          const responseTime = Date.now() - startTime;
          return {
            collection: collectionName,
            status: 'error',
            responseTime,
            error: error.message || 'Erro desconhecido',
          };
        }
      })
    );

    res.json({
      timestamp: new Date().toISOString(),
      collections: results,
    });
  } catch (error) {
    console.error('❌ Erro ao verificar collections:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
});

export default router;
