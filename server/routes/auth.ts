import express from 'express';
import { generateToken } from '../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Realiza login e retorna token JWT
 *     description: |
 *       Autentica o usuário e retorna um token JWT válido por 24 horas.
 *       
 *       **IMPORTANTE**: Por enquanto, aceita qualquer email/senha para desenvolvimento.
 *       Em produção, deve ser integrado com sistema de autenticação real.
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "admin@mariela.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "senha123"
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 expiresIn:
 *                   type: string
 *                   example: "24h"
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Credenciais inválidas
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email e senha são obrigatórios' 
      });
    }

    // TODO: Implementar validação real de credenciais com banco de dados
    // Por enquanto, aceita qualquer login para desenvolvimento
    // Em produção, deve validar contra banco de dados com hash bcrypt
    
    const token = generateToken(email, email);

    res.json({
      success: true,
      token,
      expiresIn: '24h',
      message: 'Login realizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ error: 'Erro ao processar login' });
  }
});

/**
 * @swagger
 * /api/auth/validate:
 *   get:
 *     summary: Valida se o token JWT é válido
 *     description: Endpoint para verificar se o token ainda é válido
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token válido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                   example: true
 *                 userId:
 *                   type: string
 *                   example: "user@example.com"
 *       401:
 *         description: Token não fornecido
 *       403:
 *         description: Token inválido ou expirado
 */
router.get('/validate', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      valid: false,
      error: 'Token não fornecido' 
    });
  }

  const jwt = require('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET || 'mariela-pdv-secret-key-change-in-production';

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({
      valid: true,
      userId: decoded.userId
    });
  } catch (error) {
    res.status(403).json({ 
      valid: false,
      error: 'Token inválido ou expirado' 
    });
  }
});

export default router;
