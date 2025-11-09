import express from 'express';
import * as contasReceberController from '../controllers/contasReceberController';

const router = express.Router();

router.get('/', contasReceberController.getAllContasReceber);
router.get('/resumo', contasReceberController.getResumoContasReceber);
router.get('/:numero', contasReceberController.getContaReceberByNumero);
router.post('/', contasReceberController.createContaReceber);
router.put('/:numero', contasReceberController.updateContaReceber);
router.post('/:numero/receber', contasReceberController.receberConta);
router.delete('/:numero', contasReceberController.deleteContaReceber);

export default router;
