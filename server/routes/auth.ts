import express from 'express';
import * as authController from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/roles';

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registra um novo usuário
 *     description: |
 *       Cria um novo usuário no sistema com hash de senha bcrypt.
 *       Role padrão é "vendedor" se não especificado.
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
 *               - nome
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "vendedor@mariela.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: "senha123"
 *               nome:
 *                 type: string
 *                 minLength: 3
 *                 example: "João Silva"
 *               role:
 *                 type: string
 *                 enum: [admin, gerente, vendedor]
 *                 example: "vendedor"
 *               codigoVendedor:
 *                 type: string
 *                 pattern: '^V\d{3}$'
 *                 example: "V001"
 *                 description: "Obrigatório se role = vendedor"
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       409:
 *         description: Email já cadastrado
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Realiza login e retorna token JWT
 *     description: |
 *       Autentica o usuário validando email e senha com hash bcrypt.
 *       Retorna token JWT válido por 24 horas.
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
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Credenciais inválidas
 *       403:
 *         description: Usuário desativado
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Obtém perfil do usuário autenticado
 *     description: Retorna informações do usuário logado
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil do usuário
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Usuário não encontrado
 */
router.get('/profile', authenticateToken, authController.getProfile);

/**
 * @swagger
 * /api/auth/update-password:
 *   put:
 *     summary: Atualiza senha do usuário
 *     description: Permite ao usuário alterar sua própria senha
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Senha atualizada
 *       401:
 *         description: Senha atual incorreta
 */
router.put('/update-password', authenticateToken, authController.updatePassword);

/**
 * @swagger
 * /api/auth/users:
 *   get:
 *     summary: Lista todos os usuários (apenas admin)
 *     description: Retorna lista completa de usuários cadastrados
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuários
 *       403:
 *         description: Acesso negado (requer admin)
 */
router.get('/users', authenticateToken, requireAdmin, authController.listUsers);

/**
 * @swagger
 * /api/auth/users/{userId}/role:
 *   put:
 *     summary: Atualiza role de usuário (apenas admin)
 *     description: Permite admin alterar a role de um usuário
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, gerente, vendedor]
 *               codigoVendedor:
 *                 type: string
 *     responses:
 *       200:
 *         description: Role atualizada
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Usuário não encontrado
 */
router.put('/users/:userId/role', authenticateToken, requireAdmin, authController.updateUserRole);

/**
 * @swagger
 * /api/auth/users/{userId}/toggle-status:
 *   put:
 *     summary: Ativa/desativa usuário (apenas admin)
 *     description: Permite admin ativar ou desativar um usuário
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status alterado
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Usuário não encontrado
 */
router.put('/users/:userId/toggle-status', authenticateToken, requireAdmin, authController.toggleUserStatus);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Renova access token usando refresh token
 *     description: Gera novo access token sem precisar fazer login novamente
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token obtido no login
 *     responses:
 *       200:
 *         description: Token renovado
 *       400:
 *         description: Refresh token não fornecido
 *       401:
 *         description: Refresh token inválido ou expirado
 */
router.post('/refresh', authController.refreshAccessToken);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Faz logout e revoga refresh token
 *     description: Invalida o refresh token do usuário
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logout realizado
 */
router.post('/logout', authController.logout);

export default router;
