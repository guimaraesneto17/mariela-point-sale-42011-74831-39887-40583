import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserRole } from '../models/User';
import RefreshToken from '../models/RefreshToken';

// Estender o tipo Request para incluir userId e userRole
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: UserRole;
    }
  }
}

// Fail-fast se secrets não estiverem configurados (segurança)
if (!process.env.JWT_SECRET) {
  throw new Error('CRITICAL: JWT_SECRET environment variable is not set. Application cannot start without it.');
}
if (!process.env.REFRESH_TOKEN_SECRET) {
  throw new Error('CRITICAL: REFRESH_TOKEN_SECRET environment variable is not set. Application cannot start without it.');
}

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const ACCESS_TOKEN_EXPIRY = '1h'; // Token de acesso: 1 hora
const REFRESH_TOKEN_EXPIRY = '7d'; // Refresh token: 7 dias

export interface JWTPayload {
  userId: string;
  email?: string;
  role?: UserRole;
  nome?: string;
  type?: 'access' | 'refresh';
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
      req.userRole = payload.role;
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
 * Gera um token de acesso (curta duração)
 */
export const generateAccessToken = (userId: string, email?: string, role?: UserRole, nome?: string): string => {
  const payload: JWTPayload = { userId, email, role, nome, type: 'access' };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
};

/**
 * Gera um refresh token (longa duração)
 */
export const generateRefreshToken = async (userId: string): Promise<string> => {
  const token = crypto.randomBytes(64).toString('hex');
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 dias

  // Salvar no banco
  await RefreshToken.create({
    userId,
    token,
    expiresAt
  });

  return token;
};

/**
 * Valida refresh token e retorna userId
 */
export const validateRefreshToken = async (token: string): Promise<string | null> => {
  try {
    const refreshToken = await RefreshToken.findOne({ 
      token,
      expiresAt: { $gt: new Date() }
    });

    if (!refreshToken) {
      return null;
    }

    return refreshToken.userId.toString();
  } catch (error) {
    return null;
  }
};

/**
 * Remove refresh token do banco
 */
export const revokeRefreshToken = async (token: string): Promise<void> => {
  await RefreshToken.deleteOne({ token });
};

/**
 * Remove todos os refresh tokens de um usuário
 */
export const revokeAllUserTokens = async (userId: string): Promise<void> => {
  await RefreshToken.deleteMany({ userId });
};

/**
 * Gera um token JWT para um usuário (compatibilidade)
 * @deprecated Use generateAccessToken + generateRefreshToken
 */
export const generateToken = (userId: string, email?: string, role?: UserRole, nome?: string): string => {
  return generateAccessToken(userId, email, role, nome);
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
