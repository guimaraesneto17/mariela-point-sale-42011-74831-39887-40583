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
    console.log('📝 [CREATE CONTA PAGAR] Payload recebido:', JSON.stringify(req.body, null, 2));
    
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

    // Buscar dados do fornecedor se fornecedorCodigo foi enviado
    let fornecedorObj = null;
    if (req.body.fornecedorCodigo) {
      const Fornecedor = (await import('../models/Fornecedor')).default;
      const fornecedor = await Fornecedor.findOne({ codigoFornecedor: req.body.fornecedorCodigo });
      if (fornecedor) {
        fornecedorObj = {
          codigoFornecedor: fornecedor.codigoFornecedor,
          nome: fornecedor.nome
        };
        console.log('✅ [CREATE CONTA PAGAR] Fornecedor encontrado:', fornecedorObj);
      } else {
        console.warn('⚠️ [CREATE CONTA PAGAR] Fornecedor não encontrado:', req.body.fornecedorCodigo);
      }
    }

    // Converter datas de string para Date object se necessário
    const contaData: any = {
      numeroDocumento: numero,
      descricao: req.body.descricao,
      categoria: req.body.categoria,
      valor: Number(req.body.valor),
      valorPago: req.body.valorPago ? Number(req.body.valorPago) : 0,
      dataEmissao: req.body.dataEmissao ? new Date(req.body.dataEmissao) : new Date(),
      dataVencimento: new Date(req.body.dataVencimento),
      status: req.body.status || 'Pendente'
    };

    // Adicionar fornecedor se existir
    if (fornecedorObj) {
      contaData.fornecedor = fornecedorObj;
    }

    // Converter outras datas se presentes
    if (req.body.dataPagamento) {
      contaData.dataPagamento = new Date(req.body.dataPagamento);
    }
    
    // Adicionar campos opcionais
    if (req.body.formaPagamento) {
      contaData.formaPagamento = req.body.formaPagamento;
    }
    
    if (req.body.observacoes) {
      contaData.observacoes = req.body.observacoes;
    }
    
    if (req.body.anexos) {
      contaData.anexos = req.body.anexos;
    }

    console.log('💾 [CREATE CONTA PAGAR] Dados preparados para salvar:', JSON.stringify(contaData, null, 2));

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
    console.log('✅ [CREATE CONTA PAGAR] Conta salva com sucesso:', conta.numeroDocumento);
    res.status(201).json(conta);
  } catch (error: any) {
    console.error('❌ [CREATE CONTA PAGAR] Erro:', error);
    console.error('❌ [CREATE CONTA PAGAR] Stack:', error.stack);
    
    if (error?.code === 11000) {
      return res.status(400).json({ error: 'Número de documento já existe' });
    }
    if (error?.name === 'ValidationError') {
      const messages = Object.values(error.errors || {}).map((e: any) => e.message);
      console.error('❌ [CREATE CONTA PAGAR] Erros de validação:', messages);
      return res.status(400).json({ error: messages.join('; ') });
    }
    res.status(400).json({ error: `Erro ao criar conta a pagar: ${error.message}` });
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

    console.log('📝 [PAGAR CONTA] Payload recebido:', JSON.stringify(req.body, null, 2));
    console.log('📝 [PAGAR CONTA] Número da conta:', req.params.numero);

    if (typeof valorPago !== 'number' || valorPago <= 0) {
      console.error('❌ [PAGAR CONTA] Valor inválido:', valorPago);
      return res.status(400).json({ error: 'valorPago deve ser um número positivo' });
    }

    if (!formaPagamento) {
      console.error('❌ [PAGAR CONTA] Forma de pagamento não informada');
      return res.status(400).json({ error: 'Forma de pagamento é obrigatória' });
    }

    // Verificar se existe caixa aberto antes de processar o pagamento
    const Caixa = (await import('../models/Caixa')).default;
    const caixaAberto = await Caixa.findOne({ status: 'aberto' }).sort({ dataAbertura: -1 });
    
    if (!caixaAberto) {
      console.error('❌ [PAGAR CONTA] Nenhum caixa aberto encontrado');
      return res.status(400).json({ 
        error: 'Não é possível registrar pagamento sem um caixa aberto. Por favor, abra o caixa primeiro.' 
      });
    }

    console.log('✅ [PAGAR CONTA] Caixa aberto encontrado:', caixaAberto.codigoCaixa);

    const conta = await ContasPagar.findOne({ numeroDocumento: req.params.numero });
    if (!conta) {
      console.error('❌ [PAGAR CONTA] Conta não encontrada:', req.params.numero);
      return res.status(404).json({ error: 'Conta a pagar não encontrada' });
    }

    console.log('✅ [PAGAR CONTA] Conta encontrada:', conta.numeroDocumento);
    console.log('📊 [PAGAR CONTA] Valor atual da conta:', conta.valor);
    console.log('📊 [PAGAR CONTA] Valor já pago:', conta.valorPago || 0);

    // Converter dataPagamento para Date object
    const dataConvertida = dataPagamento ? new Date(dataPagamento) : new Date();

    conta.valorPago = (conta.valorPago || 0) + valorPago;
    conta.dataPagamento = dataConvertida;
    conta.formaPagamento = formaPagamento;

    // Histórico
    (conta as any).historicoPagamentos = (conta as any).historicoPagamentos || [];
    const historicoItem = {
      valor: valorPago,
      data: dataConvertida, // Date object, não string
      formaPagamento
    };
    
    // Adicionar observacoes apenas se tiver valor
    if (observacoes) {
      (historicoItem as any).observacoes = observacoes;
    }
    
    (conta as any).historicoPagamentos.push(historicoItem);
    console.log('📝 [PAGAR CONTA] Item adicionado ao histórico:', JSON.stringify(historicoItem, null, 2));

    if (conta.valorPago >= conta.valor) {
      conta.status = 'Pago';
      console.log('✅ [PAGAR CONTA] Status alterado para: Pago');
    } else if (conta.valorPago > 0) {
      conta.status = 'Parcial';
      console.log('⚠️ [PAGAR CONTA] Status alterado para: Parcial');
    }

    console.log('💾 [PAGAR CONTA] Salvando conta...');
    console.log('💾 [PAGAR CONTA] Dados da conta antes de salvar:', JSON.stringify({
      numeroDocumento: conta.numeroDocumento,
      valorPago: conta.valorPago,
      status: conta.status,
      formaPagamento: conta.formaPagamento,
      dataPagamento: conta.dataPagamento,
      historicoLength: (conta as any).historicoPagamentos.length
    }, null, 2));
    
    await conta.save();
    console.log('✅ [PAGAR CONTA] Conta salva com sucesso');

    // Registrar no caixa (obrigatório)
    const movimento = {
      tipo: 'saida' as const,
      valor: valorPago,
      data: new Date(dataPagamento || new Date()).toISOString(),
      codigoVenda: null,
      formaPagamento: formaPagamento || null,
      observacao: `Pagamento: ${conta.descricao} - ${conta.numeroDocumento}`
    };

    console.log('💰 [PAGAR CONTA] Registrando movimento no caixa:', JSON.stringify(movimento, null, 2));
    caixaAberto.movimentos.push(movimento);

    // Recalcular totais
    caixaAberto.saida = caixaAberto.movimentos
      .filter((m: any) => m.tipo === 'saida')
      .reduce((sum: number, m: any) => sum + m.valor, 0);

    caixaAberto.entrada = caixaAberto.movimentos
      .filter((m: any) => m.tipo === 'entrada')
      .reduce((sum: number, m: any) => sum + m.valor, 0);

    caixaAberto.performance = caixaAberto.entrada - caixaAberto.saida;

    console.log('📊 [PAGAR CONTA] Totais recalculados - Entrada:', caixaAberto.entrada, 'Saída:', caixaAberto.saida, 'Performance:', caixaAberto.performance);
    console.log('💾 [PAGAR CONTA] Salvando caixa...');
    
    await caixaAberto.save();
    console.log('✅ [PAGAR CONTA] Caixa salvo com sucesso');
    console.log('✅ [PAGAR CONTA] Operação finalizada com sucesso');

    res.json(conta);
  } catch (error: any) {
    console.error('❌ [PAGAR CONTA] ERRO COMPLETO:', error);
    console.error('❌ [PAGAR CONTA] Stack trace:', error.stack);
    console.error('❌ [PAGAR CONTA] Error name:', error.name);
    console.error('❌ [PAGAR CONTA] Error message:', error.message);
    
    if (error.name === 'ValidationError') {
      console.error('❌ [PAGAR CONTA] Erros de validação do Mongoose:', error.errors);
    }
    
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
