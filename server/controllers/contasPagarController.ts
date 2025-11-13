import { Request, Response } from 'express';
import ContasPagar from '../models/ContasPagar';

export const getAllContasPagar = async (req: Request, res: Response) => {
  try {
    const contas = await ContasPagar.find().sort({ dataVencimento: -1 });
    res.json(contas);
  } catch (error) {
    console.error('Erro ao buscar contas a pagar:', error);
    res.status(500).json({ error: 'Erro ao buscar contas a pagar' });
  }
};

export const getContaPagarByNumero = async (req: Request, res: Response) => {
  try {
    const conta = await ContasPagar.findOne({ numeroDocumento: req.params.numero });
    if (!conta) {
      return res.status(404).json({ error: 'Conta a pagar não encontrada' });
    }
    res.json(conta);
  } catch (error) {
    console.error('Erro ao buscar conta a pagar:', error);
    res.status(500).json({ error: 'Erro ao buscar conta a pagar' });
  }
};

export const createContaPagar = async (req: Request, res: Response) => {
  try {
    let numero = (req.body?.numeroDocumento || '').trim();
    if (!numero) {
      const last = await ContasPagar.findOne({ numeroDocumento: /^CP\d{3}$/ }).sort({ numeroDocumento: -1 });
      const next = last ? parseInt((last as any).numeroDocumento.slice(2), 10) + 1 : 1;
      numero = `CP${String(next).padStart(3, '0')}`;
    }

    const conta = new ContasPagar({ ...req.body, numeroDocumento: numero });

    // Verificar status baseado na data de vencimento
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = new Date(conta.dataVencimento);
    vencimento.setHours(0, 0, 0, 0);

    if (conta.status === 'Pendente' && vencimento < hoje) {
      conta.status = 'Vencido';
    }

    await conta.save();
    res.status(201).json(conta);
  } catch (error: any) {
    console.error('Erro ao criar conta a pagar:', error);
    if (error?.code === 11000) {
      return res.status(400).json({ error: 'Número de documento já existe' });
    }
    if (error?.name === 'ValidationError') {
      const messages = Object.values(error.errors || {}).map((e: any) => e.message);
      return res.status(400).json({ error: messages.join('; ') });
    }
    res.status(400).json({ error: 'Erro ao criar conta a pagar' });
  }
};

export const updateContaPagar = async (req: Request, res: Response) => {
  try {
    const conta = await ContasPagar.findOneAndUpdate(
      { numeroDocumento: req.params.numero },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!conta) {
      return res.status(404).json({ error: 'Conta a pagar não encontrada' });
    }
    
    res.json(conta);
  } catch (error) {
    console.error('Erro ao atualizar conta a pagar:', error);
    res.status(400).json({ error: 'Erro ao atualizar conta a pagar' });
  }
};

export const pagarConta = async (req: Request, res: Response) => {
  try {
    const { valorPago, dataPagamento, formaPagamento, observacoes } = req.body;

    if (typeof valorPago !== 'number' || valorPago <= 0) {
      return res.status(400).json({ error: 'valorPago deve ser um número positivo' });
    }

    const conta = await ContasPagar.findOne({ numeroDocumento: req.params.numero });
    if (!conta) {
      return res.status(404).json({ error: 'Conta a pagar não encontrada' });
    }

    conta.valorPago = (conta.valorPago || 0) + valorPago;
    conta.dataPagamento = dataPagamento || new Date();
    conta.formaPagamento = formaPagamento;

    // Histórico
    (conta as any).historicoPagamentos = (conta as any).historicoPagamentos || [];
    (conta as any).historicoPagamentos.push({
      valor: valorPago,
      data: dataPagamento || new Date(),
      formaPagamento,
      observacoes
    });

    if (conta.valorPago >= conta.valor) {
      conta.status = 'Pago';
    } else if (conta.valorPago > 0) {
      conta.status = 'Parcial';
    }

    await conta.save();
    res.json(conta);
  } catch (error) {
    console.error('Erro ao registrar pagamento:', error);
    res.status(400).json({ error: 'Erro ao registrar pagamento' });
  }
};

export const deleteContaPagar = async (req: Request, res: Response) => {
  try {
    const conta = await ContasPagar.findOneAndDelete({ numeroDocumento: req.params.numero });
    if (!conta) {
      return res.status(404).json({ error: 'Conta a pagar não encontrada' });
    }
    res.json({ message: 'Conta a pagar removida com sucesso' });
  } catch (error) {
    console.error('Erro ao remover conta a pagar:', error);
    res.status(500).json({ error: 'Erro ao remover conta a pagar' });
  }
};

export const getResumoContasPagar = async (req: Request, res: Response) => {
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const totalPendente = await ContasPagar.aggregate([
      { $match: { status: { $in: ['Pendente', 'Parcial', 'Vencido'] } } },
      { $group: { _id: null, total: { $sum: { $subtract: ['$valor', '$valorPago'] } } } }
    ]);
    
    const totalPago = await ContasPagar.aggregate([
      { $match: { status: 'Pago' } },
      { $group: { _id: null, total: { $sum: '$valor' } } }
    ]);
    
    const totalVencido = await ContasPagar.aggregate([
      { $match: { status: 'Vencido' } },
      { $group: { _id: null, total: { $sum: { $subtract: ['$valor', '$valorPago'] } } } }
    ]);
    
    const porCategoria = await ContasPagar.aggregate([
      { $group: { _id: '$categoria', total: { $sum: '$valor' } } },
      { $sort: { total: -1 } }
    ]);
    
    res.json({
      totalPendente: totalPendente[0]?.total || 0,
      totalPago: totalPago[0]?.total || 0,
      totalVencido: totalVencido[0]?.total || 0,
      porCategoria
    });
  } catch (error) {
    console.error('Erro ao buscar resumo:', error);
    res.status(500).json({ error: 'Erro ao buscar resumo' });
  }
};
