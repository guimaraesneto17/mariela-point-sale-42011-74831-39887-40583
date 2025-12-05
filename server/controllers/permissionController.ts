import { Request, Response } from 'express';
import Permission, { ModuleName, Action } from '../models/Permission';

/**
 * Obter todas as permissões
 */
export const getPermissions = async (req: Request, res: Response) => {
  try {
    const permissions = await Permission.find().sort({ role: 1, module: 1 });
    res.json(permissions);
  } catch (error) {
    console.error('Erro ao buscar permissões:', error);
    res.status(500).json({ error: 'Erro ao buscar permissões' });
  }
};

/**
 * Obter permissões de uma role específica
 */
export const getPermissionsByRole = async (req: Request, res: Response) => {
  try {
    const { role } = req.params;
    
    if (!['admin', 'gerente', 'vendedor'].includes(role)) {
      return res.status(400).json({ error: 'Role inválida' });
    }

    const permissions = await Permission.find({ role }).sort({ module: 1 });
    res.json(permissions);
  } catch (error) {
    console.error('Erro ao buscar permissões:', error);
    res.status(500).json({ error: 'Erro ao buscar permissões' });
  }
};

/**
 * Criar ou atualizar permissão
 */
export const upsertPermission = async (req: Request, res: Response) => {
  try {
    const { role, module, actions } = req.body;

    // Validação
    if (!role || !module || !actions) {
      return res.status(400).json({ error: 'Role, module e actions são obrigatórios' });
    }

    if (!['admin', 'gerente', 'vendedor'].includes(role)) {
      return res.status(400).json({ error: 'Role inválida' });
    }

    const validModules = [
      'dashboard', 'vendas', 'estoque', 'financeiro', 'produtos',
      'clientes', 'fornecedores', 'vendedores', 'caixa', 'relatorios',
      'vitrine', 'usuarios'
    ];

    if (!validModules.includes(module)) {
      return res.status(400).json({ error: 'Módulo inválido' });
    }

    const validActions = ['view', 'create', 'edit', 'delete', 'export'];
    const invalidActions = actions.filter((a: string) => !validActions.includes(a));
    
    if (invalidActions.length > 0) {
      return res.status(400).json({ 
        error: `Ações inválidas: ${invalidActions.join(', ')}` 
      });
    }

    // Criar ou atualizar permissão
    const permission = await Permission.findOneAndUpdate(
      { role, module },
      { role, module, actions },
      { upsert: true, new: true, runValidators: true }
    );

    res.json(permission);
  } catch (error) {
    console.error('Erro ao criar/atualizar permissão:', error);
    res.status(500).json({ error: 'Erro ao criar/atualizar permissão' });
  }
};

/**
 * Atualizar permissões em lote
 */
export const batchUpdatePermissions = async (req: Request, res: Response) => {
  try {
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      return res.status(400).json({ error: 'Permissions deve ser um array' });
    }

    const results = [];
    
    for (const perm of permissions) {
      const { role, module, actions } = perm;
      
      const permission = await Permission.findOneAndUpdate(
        { role, module },
        { role, module, actions },
        { upsert: true, new: true, runValidators: true }
      );
      
      results.push(permission);
    }

    res.json(results);
  } catch (error) {
    console.error('Erro ao atualizar permissões em lote:', error);
    res.status(500).json({ error: 'Erro ao atualizar permissões em lote' });
  }
};

/**
 * Deletar permissão
 */
export const deletePermission = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const permission = await Permission.findByIdAndDelete(id);

    if (!permission) {
      return res.status(404).json({ error: 'Permissão não encontrada' });
    }

    res.json({ message: 'Permissão deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar permissão:', error);
    res.status(500).json({ error: 'Erro ao deletar permissão' });
  }
};

/**
 * Inicializar permissões padrão para uma role
 */
export const initializeDefaultPermissions = async (req: Request, res: Response) => {
  try {
    const { role } = req.params;

    if (!['admin', 'gerente', 'vendedor'].includes(role)) {
      return res.status(400).json({ error: 'Role inválida' });
    }

    const modules: ModuleName[] = [
      'dashboard', 'vendas', 'estoque', 'financeiro', 'produtos',
      'clientes', 'fornecedores', 'vendedores', 'caixa', 'relatorios',
      'vitrine', 'usuarios'
    ];

    // Permissões padrão por role
    const defaultPermissions: Record<string, Action[]> = {
      admin: ['view', 'create', 'edit', 'delete', 'export'],
      gerente: ['view', 'create', 'edit', 'export'],
      vendedor: ['view', 'create']
    };

    const permissions = [];

    for (const module of modules) {
      // Vendedores não têm acesso a usuários
      if (role === 'vendedor' && module === 'usuarios') continue;

      const permission = await Permission.findOneAndUpdate(
        { role, module },
        { 
          role, 
          module, 
          actions: defaultPermissions[role] 
        },
        { upsert: true, new: true, runValidators: true }
      );

      permissions.push(permission);
    }

    res.json(permissions);
  } catch (error) {
    console.error('Erro ao inicializar permissões:', error);
    res.status(500).json({ error: 'Erro ao inicializar permissões' });
  }
};

/**
 * Verificar se usuário tem permissão para uma ação específica (somente própria role)
 */
export const checkOwnPermission = async (req: Request, res: Response) => {
  try {
    const { module, action } = req.query;
    const userRole = req.userRole; // Obtido do middleware de autenticação

    if (!module || !action) {
      return res.status(400).json({ 
        error: 'Module e action são obrigatórios' 
      });
    }

    if (!userRole) {
      return res.status(401).json({ 
        error: 'Usuário não autenticado' 
      });
    }

    // Admin tem todas as permissões
    if (userRole === 'admin') {
      return res.json({ hasPermission: true });
    }

    const permission = await Permission.findOne({ 
      role: userRole, 
      module: module as string 
    });

    if (!permission) {
      return res.json({ hasPermission: false });
    }

    const hasPermission = permission.actions.includes(action as Action);
    res.json({ hasPermission });
  } catch (error) {
    console.error('Erro ao verificar permissão:', error);
    res.status(500).json({ error: 'Erro ao verificar permissão' });
  }
};

/**
 * Verificar se uma role tem permissão (apenas para admin)
 * @deprecated Use checkOwnPermission para verificar próprias permissões
 */
export const checkPermission = async (req: Request, res: Response) => {
  try {
    const { role, module, action } = req.query;

    if (!role || !module || !action) {
      return res.status(400).json({ 
        error: 'Role, module e action são obrigatórios' 
      });
    }

    const permission = await Permission.findOne({ 
      role: role as string, 
      module: module as string 
    });

    if (!permission) {
      return res.json({ hasPermission: false });
    }

    const hasPermission = permission.actions.includes(action as Action);
    res.json({ hasPermission });
  } catch (error) {
    console.error('Erro ao verificar permissão:', error);
    res.status(500).json({ error: 'Erro ao verificar permissão' });
  }
};
