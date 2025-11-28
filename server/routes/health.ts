import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Verifica o status do backend e conexão com MongoDB
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Status do sistema
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 database:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: connected
 *                     name:
 *                       type: string
 *                       example: mariela-db
 *       500:
 *         description: Erro no servidor
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

export default router;
