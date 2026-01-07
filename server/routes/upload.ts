import express from 'express';
import { uploadSingleImage, uploadMultipleImagesEndpoint } from '../controllers/uploadController';
import { validateImageUpload, sanitizeBody } from '../middleware/validation';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Upload
 *   description: Gerenciamento de upload de imagens
 */

/**
 * @swagger
 * /api/upload/single:
 *   post:
 *     summary: Upload de uma única imagem
 *     tags: [Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 description: Imagem em base64
 *     responses:
 *       200:
 *         description: URL da imagem uploadada
 *       400:
 *         description: Erro de validação
 *       500:
 *         description: Erro no servidor
 */
router.post('/single', sanitizeBody, validateImageUpload, uploadSingleImage);

/**
 * @swagger
 * /api/upload/multiple:
 *   post:
 *     summary: Upload de múltiplas imagens
 *     tags: [Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array de imagens em base64
 *     responses:
 *       200:
 *         description: URLs das imagens uploadadas
 *       400:
 *         description: Erro de validação
 *       500:
 *         description: Erro no servidor
 */
router.post('/multiple', sanitizeBody, validateImageUpload, uploadMultipleImagesEndpoint);

export default router;
