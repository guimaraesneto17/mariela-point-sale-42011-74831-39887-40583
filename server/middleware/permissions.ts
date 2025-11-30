import { Request, Response, NextFunction } from 'express';
import Permission, { ModuleName, Action } from '../models/Permission';

/**
 * Middleware para verificar permissões granulares
 */
export const requirePermission = (module: ModuleName, action: Action) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userRole = req.userRole;

      if (!userRole) {
        res.status(403).json({ 
          error: 'Acesso negado',
          message: 'Não foi possível verificar suas permissões'
        });
        return;
      }

      // Admin tem acesso total
      if (userRole === 'admin') {
        next();
        return;
      }

      // Buscar permissões da role para o módulo
      const permission = await Permission.findOne({ 
        role: userRole, 
        module 
      });

      if (!permission) {
        res.status(403).json({ 
          error: 'Acesso negado',
          message: `Você não tem acesso ao módulo ${module}`
        });
        return;
      }

      // Verificar se a role tem a ação permitida
      if (!permission.actions.includes(action)) {
        res.status(403).json({ 
          error: 'Acesso negado',
          message: `Você não tem permissão para ${action} em ${module}`,
          requiredAction: action,
          module,
          userRole
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Erro ao verificar permissão:', error);
      res.status(500).json({ 
        error: 'Erro ao verificar permissões',
        message: 'Ocorreu um erro ao processar sua solicitação'
      });
    }
  };
};

/**
 * Helper para verificar múltiplas permissões
 */
export const requireAnyPermission = (permissions: Array<{ module: ModuleName; action: Action }>) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userRole = req.userRole;

      if (!userRole) {
        res.status(403).json({ 
          error: 'Acesso negado',
          message: 'Não foi possível verificar suas permissões'
        });
        return;
      }

      // Admin tem acesso total
      if (userRole === 'admin') {
        next();
        return;
      }

      // Verificar se tem pelo menos uma das permissões
      for (const { module, action } of permissions) {
        const permission = await Permission.findOne({ 
          role: userRole, 
          module 
        });

        if (permission && permission.actions.includes(action)) {
          next();
          return;
        }
      }

      res.status(403).json({ 
        error: 'Acesso negado',
        message: 'Você não tem permissão para acessar este recurso'
      });
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      res.status(500).json({ 
        error: 'Erro ao verificar permissões',
        message: 'Ocorreu um erro ao processar sua solicitação'
      });
    }
  };
};
