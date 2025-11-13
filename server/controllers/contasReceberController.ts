import { Request, Response } from 'express';
import ContasReceber from '../models/ContasReceber';

export const getAllContasReceber = async (req: Request, res: Response) => {
  try {
    const contas = await ContasReceber.find().sort({ dataVencimento: -1 });
    res.json(contas);
  } catch (error) {
    console.error('Erro ao buscar contas a receber:', error);
    res.status(500).json({ error: 'Erro ao buscar contas a receber' });
  }
};

export const getContaReceberByNumero = async (req: Request, res: Response) => {
  try {
    const conta = await ContasReceber.findOne({ numeroDocumento: req.params.numero });
    if (!conta) {
      return res.status(404).json({ error: 'Conta a receber não encontrada' });
    }
    res.json(conta);
  } catch (error) {
    console.error('Erro ao buscar conta a receber:', error);
    res.status(500).json({ error: 'Erro ao buscar conta a receber' });
  }
};

export const createContaReceber = async (req: Request, res: Response) => {
  try {
    // Gerar número CR### se não vier informado ou inválido
    let numero = (req.body?.numeroDocumento || '').trim();
    const pattern = /^CR\d{3}$/;
    if (!pattern.test(numero)) {
      const last = await ContasReceber.findOne({ numeroDocumento: /^CR\d{3}$/ }).sort({ numeroDocumento: -1 });
      const next = last ? parseInt((last as any).numeroDocumento.slice(2), 10) + 1 : 1;
      numero = `CR${String(next).padStart(3, '0')}`;
    }

    const conta = new ContasReceber({ ...req.body, numeroDocumento: numero });

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
    console.error('Erro ao criar conta a receber:', error);
    if (error?.code === 11000) {
      return res.status(400).json({ error: 'Número de documento já existe' });
    }
    if (error?.name === 'ValidationError') {
      const messages = Object.values(error.errors || {}).map((e: any) => e.message);
      return res.status(400).json({ error: messages.join('; ') });
    }
    res.status(400).json({ error: 'Erro ao criar conta a receber' });
  }
};

export const updateContaReceber = async (req: Request, res: Response) => {
  try {
    const conta = await ContasReceber.findOneAndUpdate(
      { numeroDocumento: req.params.numero },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!conta) {
      return res.status(404).json({ error: 'Conta a receber não encontrada' });
    }
    
    res.json(conta);
  } catch (error) {
    console.error('Erro ao atualizar conta a receber:', error);
    res.status(400).json({ error: 'Erro ao atualizar conta a receber' });
  }
};

export const receberConta = async (req: Request, res: Response) => {
  try {
    const { valorRecebido, dataRecebimento, formaPagamento, observacoes } = req.body;

    if (typeof valorRecebido !== 'number' || valorRecebido <= 0) {
      return res.status(400).json({ error: 'valorRecebido deve ser um número positivo' });
    }

    const conta = await ContasReceber.findOne({ numeroDocumento: req.params.numero });
    if (!conta) {
      return res.status(404).json({ error: 'Conta a receber não encontrada' });
    }

    conta.valorRecebido = (conta.valorRecebido || 0) + valorRecebido;
    conta.dataRecebimento = dataRecebimento || new Date();
    conta.formaPagamento = formaPagamento;

    // Histórico
    (conta as any).historicoRecebimentos = (conta as any).historicoRecebimentos || [];
    (conta as any).historicoRecebimentos.push({
      valor: valorRecebido,
      data: dataRecebimento || new Date(),
      formaPagamento,
      observacoes
    });

    if (conta.valorRecebido >= conta.valor) {
      conta.status = 'Recebido';
    } else if (conta.valorRecebido > 0) {
      conta.status = 'Parcial';
    }

    await conta.save();
    res.json(conta);
  } catch (error) {
    console.error('Erro ao registrar recebimento:', error);
    res.status(400).json({ error: 'Erro ao registrar recebimento' });
  }
};

export const deleteContaReceber = async (req: Request, res: Response) => {
  try {
    const conta = await ContasReceber.findOneAndDelete({ numeroDocumento: req.params.numero });
    if (!conta) {
      return res.status(404).json({ error: 'Conta a receber não encontrada' });
    }
    res.json({ message: 'Conta a receber removida com sucesso' });
  } catch (error) {
    console.error('Erro ao remover conta a receber:', error);
    res.status(500).json({ error: 'Erro ao remover conta a receber' });
  }
};

export const getResumoContasReceber = async (req: Request, res: Response) => {
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const totalPendente = await ContasReceber.aggregate([
      { $match: { status: { $in: ['Pendente', 'Parcial', 'Vencido'] } } },
      { $group: { _id: null, total: { $sum: { $subtract: ['$valor', '$valorRecebido'] } } } }
    ]);
    
    const totalRecebido = await ContasReceber.aggregate([
      { $match: { status: 'Recebido' } },
      { $group: { _id: null, total: { $sum: '$valor' } } }
    ]);
    
    const totalVencido = await ContasReceber.aggregate([
      { $match: { status: 'Vencido' } },
      { $group: { _id: null, total: { $sum: { $subtract: ['$valor', '$valorRecebido'] } } } }
    ]);
    
    const porCategoria = await ContasReceber.aggregate([
      { $group: { _id: '$categoria', total: { $sum: '$valor' } } },
      { $sort: { total: -1 } }
    ]);
    
    res.json({
      totalPendente: totalPendente[0]?.total || 0,
      totalRecebido: totalRecebido[0]?.total || 0,
      totalVencido: totalVencido[0]?.total || 0,
      porCategoria
    });
  } catch (error) {
    console.error('Erro ao buscar resumo:', error);
    res.status(500).json({ error: 'Erro ao buscar resumo' });
  }
};
