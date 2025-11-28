import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import User, { UserRole } from '../models/User';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  validateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens 
} from '../middleware/auth';

const SALT_ROUNDS = 10;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 30 * 60 * 1000; // 30 minutos em ms

/**
 * Registrar novo usuário
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, nome, role, codigoVendedor } = req.body;

    if (!email || !password || !nome) {
      res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({ error: 'Email já cadastrado no sistema' });
      return;
    }

    const validRoles: UserRole[] = ['admin', 'gerente', 'vendedor'];
    const userRole: UserRole = role && validRoles.includes(role) ? role : 'vendedor';

    if (userRole === 'vendedor' && !codigoVendedor) {
      res.status(400).json({ 
        error: 'Código de vendedor é obrigatório para usuários com role "vendedor"' 
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      nome,
      role: userRole,
      codigoVendedor: userRole === 'vendedor' ? codigoVendedor : null,
      ativo: true
    });

    await user.save();

    const accessToken = generateAccessToken(user.id, email, userRole, nome);
    const refreshToken = await generateRefreshToken(user.id);

    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      accessToken,
      refreshToken,
      expiresIn: '1h',
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        role: user.role,
        codigoVendedor: user.codigoVendedor
      }
    });
  } catch (error: any) {
    console.error('Erro ao registrar usuário:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({ error: messages.join(', ') });
      return;
    }
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
};

/**
 * Login de usuário
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email e senha são obrigatórios' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ error: 'Email ou senha incorretos' });
      return;
    }

    if (!user.ativo) {
      res.status(403).json({ error: 'Usuário desativado. Entre em contato com o administrador.' });
      return;
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      res.status(423).json({ 
        error: `Conta bloqueada devido a múltiplas tentativas de login. Tente novamente em ${minutesLeft} minutos.`,
        lockUntil: user.lockUntil
      });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      user.loginAttempts += 1;

      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_TIME);
        await user.save();
        res.status(423).json({ 
          error: 'Conta bloqueada devido a múltiplas tentativas de login. Tente novamente em 30 minutos.',
          lockUntil: user.lockUntil
        });
        return;
      }

      await user.save();
      const attemptsLeft = MAX_LOGIN_ATTEMPTS - user.loginAttempts;
      res.status(401).json({ error: `Email ou senha incorretos. ${attemptsLeft} tentativa(s) restante(s).` });
      return;
    }

    // Reset login attempts
    user.loginAttempts = 0;
    user.lockUntil = null;
    user.ultimoAcesso = new Date();
    await user.save();

    const accessToken = generateAccessToken(user.id, user.email, user.role, user.nome);
    const refreshToken = await generateRefreshToken(user.id);

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      accessToken,
      refreshToken,
      expiresIn: '1h',
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        role: user.role,
        codigoVendedor: user.codigoVendedor
      }
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ error: 'Erro ao processar login' });
  }
};

/**
 * Obter perfil do usuário autenticado
 */
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        role: user.role,
        codigoVendedor: user.codigoVendedor,
        ativo: user.ativo,
        dataCriacao: user.dataCriacao,
        ultimoAcesso: user.ultimoAcesso
      }
    });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'Erro ao buscar perfil do usuário' });
  }
};

/**
 * Atualizar senha do usuário
 */
export const updatePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'Nova senha deve ter no mínimo 6 caracteres' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      res.status(401).json({ error: 'Senha atual incorreta' });
      return;
    }

    user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await user.save();

    res.json({ success: true, message: 'Senha atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    res.status(500).json({ error: 'Erro ao atualizar senha' });
  }
};

/**
 * Listar todos os usuários (apenas admin)
 */
export const listUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find().select('-password').sort({ dataCriacao: -1 });

    res.json({
      success: true,
      count: users.length,
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        nome: user.nome,
        role: user.role,
        codigoVendedor: user.codigoVendedor,
        ativo: user.ativo,
        dataCriacao: user.dataCriacao,
        ultimoAcesso: user.ultimoAcesso
      }))
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
};

/**
 * Atualizar role de usuário (apenas admin)
 */
export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { role, codigoVendedor } = req.body;

    const validRoles: UserRole[] = ['admin', 'gerente', 'vendedor'];
    if (!role || !validRoles.includes(role)) {
      res.status(400).json({ error: 'Role inválida. Opções: admin, gerente, vendedor' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    user.role = role;
    if (role === 'vendedor' && codigoVendedor) {
      user.codigoVendedor = codigoVendedor;
    } else if (role !== 'vendedor') {
      user.codigoVendedor = null;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Role atualizada com sucesso',
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        role: user.role,
        codigoVendedor: user.codigoVendedor
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar role:', error);
    res.status(500).json({ error: 'Erro ao atualizar role do usuário' });
  }
};

/**
 * Ativar/desativar usuário (apenas admin)
 */
export const toggleUserStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    user.ativo = !user.ativo;
    await user.save();

    if (!user.ativo) {
      await revokeAllUserTokens(userId);
    }

    res.json({
      success: true,
      message: `Usuário ${user.ativo ? 'ativado' : 'desativado'} com sucesso`,
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        ativo: user.ativo
      }
    });
  } catch (error) {
    console.error('Erro ao alterar status:', error);
    res.status(500).json({ error: 'Erro ao alterar status do usuário' });
  }
};

/**
 * Refresh token - gera novo access token
 */
export const refreshAccessToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token é obrigatório' });
      return;
    }

    const userIdFromToken = await validateRefreshToken(refreshToken);
    if (!userIdFromToken) {
      res.status(401).json({ error: 'Refresh token inválido ou expirado' });
      return;
    }

    const user = await User.findById(userIdFromToken);
    if (!user || !user.ativo) {
      res.status(401).json({ error: 'Usuário não encontrado ou desativado' });
      return;
    }

    const accessToken = generateAccessToken(user.id, user.email, user.role, user.nome);

    res.json({
      success: true,
      accessToken,
      expiresIn: '1h'
    });
  } catch (error) {
    console.error('Erro ao renovar token:', error);
    res.status(500).json({ error: 'Erro ao renovar token' });
  }
};

/**
 * Logout - revoga refresh token
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    res.status(500).json({ error: 'Erro ao fazer logout' });
  }
};
