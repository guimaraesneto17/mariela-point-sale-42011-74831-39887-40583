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
    const isParcelamento = req.body?.isParcelamento || false;
    const numeroParcela = req.body?.numeroParcela || 1;
    
    if (!numero) {
      if (isParcelamento) {
        // Formato CPP-001-1, CPP-001-2, etc para parcelamento
        let baseNum = 1;
        
        if (numeroParcela === 1) {
          // Primeira parcela: buscar o último número base e incrementar
          const last = await ContasPagar.findOne({ numeroDocumento: /^CPP-\d{3}-\d+$/ }).sort({ numeroDocumento: -1 });
          if (last) {
            const match = (last as any).numeroDocumento.match(/^CPP-(\d{3})-\d+$/);
            if (match) {
              baseNum = parseInt(match[1], 10) + 1;
            }
          }
        } else {
          // Parcelas subsequentes: buscar a parcela anterior e usar o mesmo número base
          const parcelaAnterior = await ContasPagar.findOne({ 
            numeroDocumento: new RegExp(`^CPP-\\d{3}-${numeroParcela - 1}$`) 
          }).sort({ _id: -1 });
          
          if (parcelaAnterior) {
            const match = (parcelaAnterior as any).numeroDocumento.match(/^CPP-(\d{3})-\d+$/);
            if (match) {
              baseNum = parseInt(match[1], 10);
            }
          } else {
            // Se não encontrar parcela anterior, buscar o último e incrementar
            const last = await ContasPagar.findOne({ numeroDocumento: /^CPP-\d{3}-\d+$/ }).sort({ numeroDocumento: -1 });
            if (last) {
              const match = (last as any).numeroDocumento.match(/^CPP-(\d{3})-\d+$/);
              if (match) {
                baseNum = parseInt(match[1], 10) + 1;
              }
            }
          }
        }
        
        numero = `CPP-${String(baseNum).padStart(3, '0')}-${numeroParcela}`;
      } else {
        // Formato CP001, CP002, etc para contas normais
        const last = await ContasPagar.findOne({ numeroDocumento: /^CP\d{3}$/ }).sort({ numeroDocumento: -1 });
        const next = last ? parseInt((last as any).numeroDocumento.slice(2), 10) + 1 : 1;
        numero = `CP${String(next).padStart(3, '0')}`;
      }
    }

    // Converter datas de string para Date object se necessário
    const contaData: any = {
      ...req.body,
      numeroDocumento: numero,
      dataEmissao: req.body.dataEmissao ? new Date(req.body.dataEmissao) : new Date(),
      dataVencimento: new Date(req.body.dataVencimento)
    };

    // Converter outras datas se presentes
    if (req.body.dataPagamento) {
      contaData.dataPagamento = new Date(req.body.dataPagamento);
    }

    const conta = new ContasPagar(contaData);

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

    console.log('📝 Iniciando registro de pagamento:', { valorPago, dataPagamento, formaPagamento, observacoes });

    if (typeof valorPago !== 'number' || valorPago <= 0) {
      console.error('❌ Valor inválido:', valorPago);
      return res.status(400).json({ error: 'valorPago deve ser um número positivo' });
    }

    // Verificar se existe caixa aberto antes de processar o pagamento
    const Caixa = (await import('../models/Caixa')).default;
    const caixaAberto = await Caixa.findOne({ status: 'aberto' }).sort({ dataAbertura: -1 });
    
    if (!caixaAberto) {
      console.error('❌ Nenhum caixa aberto encontrado');
      return res.status(400).json({ 
        error: 'Não é possível registrar pagamento sem um caixa aberto. Por favor, abra o caixa primeiro.' 
      });
    }

    console.log('✅ Caixa aberto encontrado:', caixaAberto.codigoCaixa);

    const conta = await ContasPagar.findOne({ numeroDocumento: req.params.numero });
    if (!conta) {
      console.error('❌ Conta não encontrada:', req.params.numero);
      return res.status(404).json({ error: 'Conta a pagar não encontrada' });
    }

    console.log('✅ Conta encontrada:', conta.numeroDocumento);

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

    console.log('💾 Salvando conta...');
    await conta.save();
    console.log('✅ Conta salva com sucesso');

    // Registrar no caixa (obrigatório)
    const movimento = {
      tipo: 'saida' as const,
      valor: valorPago,
      data: new Date(dataPagamento || new Date()),
      codigoVenda: null,
      formaPagamento: formaPagamento || null,
      observacao: `Pagamento: ${conta.descricao} - ${conta.numeroDocumento}`
    };

    console.log('💰 Registrando movimento no caixa:', movimento);
    caixaAberto.movimentos.push(movimento);

    // Recalcular totais
    caixaAberto.saida = caixaAberto.movimentos
      .filter((m: any) => m.tipo === 'saida')
      .reduce((sum: number, m: any) => sum + m.valor, 0);

    caixaAberto.entrada = caixaAberto.movimentos
      .filter((m: any) => m.tipo === 'entrada')
      .reduce((sum: number, m: any) => sum + m.valor, 0);

    caixaAberto.performance = caixaAberto.entrada - caixaAberto.saida;

    console.log('💾 Salvando caixa...');
    await caixaAberto.save();
    console.log('✅ Caixa salvo com sucesso');

    res.json(conta);
  } catch (error: any) {
    console.error('❌ ERRO COMPLETO ao registrar pagamento:', error);
    console.error('Stack trace:', error.stack);
    res.status(400).json({ error: `Erro ao registrar pagamento: ${error.message || 'Erro desconhecido'}` });
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
