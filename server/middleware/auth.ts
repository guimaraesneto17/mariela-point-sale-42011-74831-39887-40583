import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Estender o tipo Request para incluir userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'mariela-pdv-secret-key-change-in-production';

export interface JWTPayload {
  userId: string;
  email?: string;
}

/**
 * Middleware de autenticação JWT
 * Verifica se o token JWT é válido e adiciona userId ao request
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ 
        error: 'Token de autenticação não fornecido',
        message: 'É necessário estar autenticado para acessar este recurso'
      });
      return;
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        res.status(403).json({ 
          error: 'Token inválido ou expirado',
          message: 'Faça login novamente para continuar'
        });
        return;
      }

      const payload = decoded as JWTPayload;
      req.userId = payload.userId;
      next();
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro ao validar autenticação',
      message: 'Ocorreu um erro ao processar sua solicitação'
    });
  }
};

/**
 * Gera um token JWT para um usuário
 */
export const generateToken = (userId: string, email?: string): string => {
  const payload: JWTPayload = { userId, email };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

/**
 * Verifica um token JWT e retorna o payload
 */
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
};
