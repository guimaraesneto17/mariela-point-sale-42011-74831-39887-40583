import { Router } from 'express';

const router = Router();

/**
 * @swagger
 * /api/healthcheck:
 *   get:
 *     summary: Liveness probe - verifica se o processo está ativo
 *     description: |
 *       Endpoint de healthcheck leve para UptimeRobot.
 *       - NÃO acessa banco de dados
 *       - NÃO exige autenticação
 *       - Extremamente leve (sem lógica de negócio)
 *       - Sempre retorna HTTP 200 enquanto o processo estiver ativo
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Processo ativo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-01-28T10:30:00.000Z"
 *                 uptime:
 *                   type: number
 *                   example: 86400.5
 *                   description: Tempo de atividade em segundos
 */
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
