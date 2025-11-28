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

export default router;
