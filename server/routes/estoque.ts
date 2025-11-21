import express from 'express';
import * as estoqueController from '../controllers/estoqueController';

const router = express.Router();

/**
 * @swagger
 * /api/estoque:
 *   get:
 *     summary: Lista todo o estoque
 *     tags: [Estoque]
 *     responses:
 *       200:
 *         description: Lista de estoque retornada com sucesso
 *       500:
 *         description: Erro ao buscar estoque
 */
router.get('/', estoqueController.getAllEstoque);

/**
 * @swagger
 * /api/estoque/codigo/{codigo}:
 *   get:
 *     summary: Busca um item de estoque por código de produto
 *     tags: [Estoque]
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item de estoque encontrado
 *       404:
 *         description: Item de estoque não encontrado
 */
router.get('/codigo/:codigo', estoqueController.getEstoqueByCodigo);

/**
 * @swagger
 * /api/estoque/{id}:
 *   get:
 *     summary: Busca um item de estoque por ID
 *     tags: [Estoque]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item de estoque encontrado
 *       404:
 *         description: Item de estoque não encontrado
 */
router.get('/:id', estoqueController.getEstoqueById);

/**
 * @swagger
 * /api/estoque:
 *   post:
 *     summary: Cria um novo item de estoque
 *     tags: [Estoque]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Estoque'
 *     responses:
 *       201:
 *         description: Item de estoque criado com sucesso
 *       400:
 *         description: Erro ao criar item de estoque
 */
router.post('/', estoqueController.createEstoque);

/**
 * @swagger
 * /api/estoque/entrada:
 *   post:
 *     summary: Registra entrada de produtos no estoque
 *     tags: [Estoque]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - codigoProduto
 *               - cor
 *               - tamanho
 *               - quantidade
 *               - origem
 *             properties:
 *               codigoProduto:
 *                 type: string
 *                 example: P101
 *                 description: Código do produto
 *               cor:
 *                 type: string
 *                 example: Azul
 *                 description: Cor da variante
 *               tamanho:
 *                 type: string
 *                 example: M
 *                 description: Tamanho específico
 *               quantidade:
 *                 type: number
 *                 example: 10
 *                 description: Quantidade a ser adicionada
 *               origem:
 *                 type: string
 *                 enum: [venda, compra, entrada, baixa no estoque]
 *                 example: compra
 *                 description: Origem da entrada
 *               fornecedor:
 *                 type: string
 *                 example: F001
 *                 description: Código do fornecedor (opcional)
 *               observacao:
 *                 type: string
 *                 example: Compra mensal
 *                 description: Observação sobre a entrada (opcional)
 *     responses:
 *       200:
 *         description: Entrada registrada com sucesso
 *       404:
 *         description: Produto ou variante não encontrada no estoque
 *       400:
 *         description: Erro ao registrar entrada ou campos obrigatórios faltando
 */
router.post('/entrada', estoqueController.registrarEntrada);

/**
 * @swagger
 * /api/estoque/saida:
 *   post:
 *     summary: Registra saída de produtos do estoque
 *     tags: [Estoque]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - codigoProduto
 *               - cor
 *               - tamanho
 *               - quantidade
 *               - motivo
 *             properties:
 *               codigoProduto:
 *                 type: string
 *                 example: P101
 *                 description: Código do produto
 *               cor:
 *                 type: string
 *                 example: Azul
 *                 description: Cor da variante
 *               tamanho:
 *                 type: string
 *                 example: M
 *                 description: Tamanho específico
 *               quantidade:
 *                 type: number
 *                 example: 5
 *                 description: Quantidade a ser removida
 *               motivo:
 *                 type: string
 *                 example: Produto danificado
 *                 description: Motivo da saída
 *               observacao:
 *                 type: string
 *                 example: Dano durante transporte
 *                 description: Observação adicional (opcional)
 *     responses:
 *       200:
 *         description: Saída registrada com sucesso
 *       404:
 *         description: Produto ou variante não encontrada no estoque
 *       400:
 *         description: Erro ao registrar saída, campos faltando ou quantidade insuficiente
 */
router.post('/saida', estoqueController.registrarSaida);

/**
 * @swagger
 * /api/estoque/novidade/{codigo}:
 *   patch:
 *     summary: Atualiza o status de novidade de um produto
 *     tags: [Estoque]
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *         example: P101
 *         description: Código do produto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isNovidade
 *             properties:
 *               isNovidade:
 *                 type: boolean
 *                 example: true
 *                 description: Status de novidade (true ou false)
 *     responses:
 *       200:
 *         description: Status de novidade atualizado com sucesso
 *       404:
 *         description: Produto não encontrado no estoque
 *       400:
 *         description: Erro ao atualizar novidade
 */
router.patch('/novidade/:codigo', estoqueController.toggleNovidade);

/**
 * @swagger
 * /api/estoque/promocao/{codigo}:
 *   patch:
 *     summary: Atualiza o status de promoção de um produto
 *     tags: [Estoque]
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *         example: P101
 *         description: Código do produto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emPromocao
 *             properties:
 *               emPromocao:
 *                 type: boolean
 *                 example: true
 *                 description: Status de promoção
 *               precoPromocional:
 *                 type: number
 *                 minimum: 0
 *                 example: 79.90
 *                 description: Valor promocional (obrigatório quando emPromocao=true)
 *     responses:
 *       200:
 *         description: Status de promoção atualizado com sucesso
 *       404:
 *         description: Produto não encontrado no estoque
 *       400:
 *         description: Erro ao atualizar promoção ou valor promocional não informado
 */
router.patch('/promocao/:codigo', estoqueController.togglePromocao);

/**
 * @swagger
 * /api/estoque/variante/imagens/{codigo}:
 *   patch:
 *     summary: Atualiza as imagens de uma variante específica
 *     tags: [Estoque]
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *         example: P101
 *         description: Código do produto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cor
 *               - tamanho
 *               - imagens
 *             properties:
 *               cor:
 *                 type: string
 *                 example: Vermelho
 *                 description: Cor da variante
 *               tamanho:
 *                 type: string
 *                 example: M
 *                 description: Tamanho da variante
 *               imagens:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"]
 *                 description: Array de URLs das imagens
 *     responses:
 *       200:
 *         description: Imagens da variante atualizadas com sucesso
 *       404:
 *         description: Produto ou variante não encontrada
 *       400:
 *         description: Erro ao atualizar imagens ou campos obrigatórios faltando
 */
router.patch('/variante/imagens/:codigo', estoqueController.updateVariantImages);

/**
 * @swagger
 * /api/estoque/{id}:
 *   put:
 *     summary: Atualiza um item de estoque
 *     tags: [Estoque]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Estoque'
 *     responses:
 *       200:
 *         description: Item de estoque atualizado com sucesso
 *       404:
 *         description: Item de estoque não encontrado
 *       400:
 *         description: Erro ao atualizar item de estoque
 */
router.put('/:id', estoqueController.updateEstoque);

/**
 * @swagger
 * /api/estoque/{id}:
 *   delete:
 *     summary: Remove um item de estoque
 *     tags: [Estoque]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item de estoque removido com sucesso
 *       404:
 *         description: Item de estoque não encontrado
 *       500:
 *         description: Erro ao remover item de estoque
 */
router.delete('/:id', estoqueController.deleteEstoque);

export default router;
