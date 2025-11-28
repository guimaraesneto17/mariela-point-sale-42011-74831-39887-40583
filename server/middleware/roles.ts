import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/User';

// Estender o tipo Request para incluir userRole
declare global {
  namespace Express {
    interface Request {
      userRole?: UserRole;
    }
  }
}

/**
 * Middleware para verificar se o usuário tem a role necessária
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const userRole = req.userRole;

      if (!userRole) {
        res.status(403).json({ 
          error: 'Acesso negado',
          message: 'Não foi possível verificar suas permissões'
        });
        return;
      }

      // Admin tem acesso a tudo
      if (userRole === 'admin') {
        next();
        return;
      }

      // Verificar se a role do usuário está na lista de roles permitidas
      if (!allowedRoles.includes(userRole)) {
        res.status(403).json({ 
          error: 'Acesso negado',
          message: `Esta operação requer permissão de: ${allowedRoles.join(' ou ')}`,
          requiredRoles: allowedRoles,
          userRole
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Erro ao verificar role:', error);
      res.status(500).json({ 
        error: 'Erro ao verificar permissões',
        message: 'Ocorreu um erro ao processar sua solicitação'
      });
    }
  };
};

/**
 * Middleware específico para apenas admins
 */
export const requireAdmin = requireRole('admin');

/**
 * Middleware para admin ou gerente
 */
export const requireAdminOrGerente = requireRole('admin', 'gerente');

/**
 * Middleware para qualquer usuário autenticado (não verifica role específica)
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.userId) {
    res.status(401).json({ 
      error: 'Não autenticado',
      message: 'É necessário estar autenticado para acessar este recurso'
    });
    return;
  }
  next();
};
