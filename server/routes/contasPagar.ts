import express from 'express';
import * as contasPagarController from '../controllers/contasPagarController';

const router = express.Router();

router.get('/', contasPagarController.getAllContasPagar);
router.get('/resumo', contasPagarController.getResumoContasPagar);
router.get('/:numero', contasPagarController.getContaPagarByNumero);
router.post('/', contasPagarController.createContaPagar);
router.put('/:numero', contasPagarController.updateContaPagar);
router.post('/:numero/pagar', contasPagarController.pagarConta);
router.delete('/:numero', contasPagarController.deleteContaPagar);

export default router;
