import express from 'express';
import * as permissionController from '../controllers/permissionController';
import { requireAdmin } from '../middleware/roles';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Permissions
 *   description: Gerenciamento de permissões
 */

/**
 * @swagger
 * /api/permissions:
 *   get:
 *     summary: Obter todas as permissões
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de permissões
 */
router.get('/', requireAdmin, permissionController.getPermissions);

/**
 * @swagger
 * /api/permissions/role/{role}:
 *   get:
 *     summary: Obter permissões de uma role específica
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *           enum: [admin, gerente, vendedor]
 *     responses:
 *       200:
 *         description: Permissões da role
 */
// Permite que usuários busquem suas próprias permissões (não requer admin)
router.get('/role/:role', permissionController.getPermissionsByRole);

/**
 * @swagger
 * /api/permissions/check:
 *   get:
 *     summary: Verificar se o usuário tem permissão para uma ação (somente própria role)
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: module
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: action
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resultado da verificação
 */
router.get('/check', permissionController.checkOwnPermission);

/**
 * @swagger
 * /api/permissions:
 *   post:
 *     summary: Criar ou atualizar permissão
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, gerente, vendedor]
 *               module:
 *                 type: string
 *               actions:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [view, create, edit, delete, export]
 *     responses:
 *       200:
 *         description: Permissão criada/atualizada
 */
router.post('/', requireAdmin, permissionController.upsertPermission);

/**
 * @swagger
 * /api/permissions/batch:
 *   post:
 *     summary: Atualizar permissões em lote
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Permissões atualizadas
 */
router.post('/batch', requireAdmin, permissionController.batchUpdatePermissions);

/**
 * @swagger
 * /api/permissions/initialize/{role}:
 *   post:
 *     summary: Inicializar permissões padrão para uma role
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *           enum: [admin, gerente, vendedor]
 *     responses:
 *       200:
 *         description: Permissões inicializadas
 */
router.post('/initialize/:role', requireAdmin, permissionController.initializeDefaultPermissions);

/**
 * @swagger
 * /api/permissions/{id}:
 *   delete:
 *     summary: Deletar permissão
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Permissão deletada
 */
router.delete('/:id', requireAdmin, permissionController.deletePermission);

export default router;
