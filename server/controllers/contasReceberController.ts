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
    console.log('📝 [CREATE CONTA RECEBER] Payload recebido:', JSON.stringify(req.body, null, 2));
    
    // Gerar número CR### ou CRP-###-# se não vier informado ou inválido
    let numero = (req.body?.numeroDocumento || '').trim();
    const isParcelamento = req.body?.isParcelamento || false;
    const numeroParcela = req.body?.numeroParcela || 1;
    
    if (!numero) {
      if (isParcelamento) {
        // Formato CRP-001-1, CRP-001-2, etc para parcelamento
        let baseNum = 1;
        
        if (numeroParcela === 1) {
          // Primeira parcela: buscar o último número base e incrementar
          const last = await ContasReceber.findOne({ numeroDocumento: /^CRP-\d{3}-\d+$/ }).sort({ numeroDocumento: -1 });
          if (last) {
            const match = (last as any).numeroDocumento.match(/^CRP-(\d{3})-\d+$/);
            if (match) {
              baseNum = parseInt(match[1], 10) + 1;
            }
          }
        } else {
          // Parcelas subsequentes: buscar a parcela anterior e usar o mesmo número base
          const parcelaAnterior = await ContasReceber.findOne({ 
            numeroDocumento: new RegExp(`^CRP-\\d{3}-${numeroParcela - 1}$`) 
          }).sort({ _id: -1 });
          
          if (parcelaAnterior) {
            const match = (parcelaAnterior as any).numeroDocumento.match(/^CRP-(\d{3})-\d+$/);
            if (match) {
              baseNum = parseInt(match[1], 10);
            }
          } else {
            // Se não encontrar parcela anterior, buscar o último e incrementar
            const last = await ContasReceber.findOne({ numeroDocumento: /^CRP-\d{3}-\d+$/ }).sort({ numeroDocumento: -1 });
            if (last) {
              const match = (last as any).numeroDocumento.match(/^CRP-(\d{3})-\d+$/);
              if (match) {
                baseNum = parseInt(match[1], 10) + 1;
              }
            }
          }
        }
        
        numero = `CRP-${String(baseNum).padStart(3, '0')}-${numeroParcela}`;
      } else {
        // Formato CR001, CR002, etc para contas normais
        const last = await ContasReceber.findOne({ numeroDocumento: /^CR\d{3}$/ }).sort({ numeroDocumento: -1 });
        const next = last ? parseInt((last as any).numeroDocumento.slice(2), 10) + 1 : 1;
        numero = `CR${String(next).padStart(3, '0')}`;
      }
    }

    // Buscar dados do cliente se clienteCodigo foi enviado
    let clienteObj = null;
    if (req.body.clienteCodigo) {
      const Cliente = (await import('../models/Cliente')).default;
      const cliente = await Cliente.findOne({ codigoCliente: req.body.clienteCodigo });
      if (cliente) {
        clienteObj = {
          codigoCliente: cliente.codigoCliente,
          nome: cliente.nome
        };
        console.log('✅ [CREATE CONTA RECEBER] Cliente encontrado:', clienteObj);
      } else {
        console.warn('⚠️ [CREATE CONTA RECEBER] Cliente não encontrado:', req.body.clienteCodigo);
      }
    }

    // Converter datas de string para Date object se necessário
    const contaData: any = {
      numeroDocumento: numero,
      descricao: req.body.descricao,
      categoria: req.body.categoria,
      valor: Number(req.body.valor),
      valorRecebido: req.body.valorRecebido ? Number(req.body.valorRecebido) : 0,
      dataEmissao: req.body.dataEmissao ? new Date(req.body.dataEmissao) : new Date(),
      dataVencimento: new Date(req.body.dataVencimento),
      status: req.body.status || 'Pendente'
    };

    // Adicionar cliente se existir
    if (clienteObj) {
      contaData.cliente = clienteObj;
    }
    
    // Adicionar vendaRelacionada se existir
    if (req.body.codigoVenda) {
      contaData.vendaRelacionada = {
        codigoVenda: req.body.codigoVenda
      };
    }

    // Converter outras datas se presentes
    if (req.body.dataRecebimento) {
      contaData.dataRecebimento = new Date(req.body.dataRecebimento);
    }
    
    // Adicionar campos opcionais
    if (req.body.formaPagamento) {
      contaData.formaPagamento = req.body.formaPagamento;
    }
    
    if (req.body.observacoes) {
      contaData.observacoes = req.body.observacoes;
    }

    console.log('💾 [CREATE CONTA RECEBER] Dados preparados para salvar:', JSON.stringify(contaData, null, 2));

    const conta = new ContasReceber(contaData);

    // Verificar status baseado na data de vencimento
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = new Date(conta.dataVencimento);
    vencimento.setHours(0, 0, 0, 0);

    if (conta.status === 'Pendente' && vencimento < hoje) {
      conta.status = 'Vencido';
    }

    await conta.save();
    console.log('✅ [CREATE CONTA RECEBER] Conta salva com sucesso:', conta.numeroDocumento);
    res.status(201).json(conta);
  } catch (error: any) {
    console.error('❌ [CREATE CONTA RECEBER] Erro:', error);
    console.error('❌ [CREATE CONTA RECEBER] Stack:', error.stack);
    
    if (error?.code === 11000) {
      return res.status(400).json({ error: 'Número de documento já existe' });
    }
    if (error?.name === 'ValidationError') {
      const messages = Object.values(error.errors || {}).map((e: any) => e.message);
      console.error('❌ [CREATE CONTA RECEBER] Erros de validação:', messages);
      return res.status(400).json({ error: messages.join('; ') });
    }
    res.status(400).json({ error: `Erro ao criar conta a receber: ${error.message}` });
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

    console.log('📝 [RECEBER CONTA] Payload recebido:', JSON.stringify(req.body, null, 2));
    console.log('📝 [RECEBER CONTA] Número da conta:', req.params.numero);

    if (typeof valorRecebido !== 'number' || valorRecebido <= 0) {
      console.error('❌ [RECEBER CONTA] Valor inválido:', valorRecebido);
      return res.status(400).json({ error: 'valorRecebido deve ser um número positivo' });
    }

    if (!formaPagamento) {
      console.error('❌ [RECEBER CONTA] Forma de pagamento não informada');
      return res.status(400).json({ error: 'Forma de pagamento é obrigatória' });
    }

    // Verificar se existe caixa aberto antes de processar o recebimento
    const Caixa = (await import('../models/Caixa')).default;
    const caixaAberto = await Caixa.findOne({ status: 'aberto' }).sort({ dataAbertura: -1 });
    
    if (!caixaAberto) {
      console.error('❌ [RECEBER CONTA] Nenhum caixa aberto encontrado');
      return res.status(400).json({ 
        error: 'Não é possível registrar recebimento sem um caixa aberto. Por favor, abra o caixa primeiro.' 
      });
    }

    console.log('✅ [RECEBER CONTA] Caixa aberto encontrado:', caixaAberto.codigoCaixa);

    const conta = await ContasReceber.findOne({ numeroDocumento: req.params.numero });
    if (!conta) {
      console.error('❌ [RECEBER CONTA] Conta não encontrada:', req.params.numero);
      return res.status(404).json({ error: 'Conta a receber não encontrada' });
    }

    console.log('✅ [RECEBER CONTA] Conta encontrada:', conta.numeroDocumento);
    console.log('📊 [RECEBER CONTA] Valor da conta:', conta.valor);
    console.log('📊 [RECEBER CONTA] Valor já recebido:', conta.valorRecebido || 0);

    // Converter dataRecebimento para Date object
    const dataConvertida = dataRecebimento ? new Date(dataRecebimento) : new Date();

    conta.valorRecebido = (conta.valorRecebido || 0) + valorRecebido;
    conta.dataRecebimento = dataConvertida;
    conta.formaPagamento = formaPagamento;

    // Histórico
    (conta as any).historicoRecebimentos = (conta as any).historicoRecebimentos || [];
    const historicoItem = {
      valor: valorRecebido,
      data: dataConvertida, // Date object, não string
      formaPagamento
    };
    
    // Adicionar observacoes apenas se tiver valor
    if (observacoes) {
      (historicoItem as any).observacoes = observacoes;
    }
    
    (conta as any).historicoRecebimentos.push(historicoItem);
    console.log('📝 [RECEBER CONTA] Item adicionado ao histórico:', JSON.stringify(historicoItem, null, 2));

    if (conta.valorRecebido >= conta.valor) {
      conta.status = 'Recebido';
      console.log('✅ [RECEBER CONTA] Status alterado para: Recebido');
    } else if (conta.valorRecebido > 0) {
      conta.status = 'Parcial';
      console.log('⚠️ [RECEBER CONTA] Status alterado para: Parcial');
    }

    console.log('💾 [RECEBER CONTA] Salvando conta...');
    console.log('💾 [RECEBER CONTA] Dados da conta antes de salvar:', JSON.stringify({
      numeroDocumento: conta.numeroDocumento,
      valorRecebido: conta.valorRecebido,
      status: conta.status,
      formaPagamento: conta.formaPagamento,
      dataRecebimento: conta.dataRecebimento,
      historicoLength: (conta as any).historicoRecebimentos.length
    }, null, 2));
    
    await conta.save();
    console.log('✅ [RECEBER CONTA] Conta salva com sucesso');

    // Registrar no caixa (obrigatório)
    const movimento = {
      tipo: 'entrada' as const,
      valor: valorRecebido,
      data: new Date(dataRecebimento || new Date()).toISOString(),
      codigoVenda: null,
      formaPagamento: formaPagamento || null,
      observacao: `Recebimento: ${conta.descricao} - ${conta.numeroDocumento}`
    };

    console.log('💰 [RECEBER CONTA] Registrando movimento no caixa:', JSON.stringify(movimento, null, 2));
    caixaAberto.movimentos.push(movimento);

    // Recalcular totais
    caixaAberto.entrada = caixaAberto.movimentos
      .filter((m: any) => m.tipo === 'entrada')
      .reduce((sum: number, m: any) => sum + m.valor, 0);

    caixaAberto.saida = caixaAberto.movimentos
      .filter((m: any) => m.tipo === 'saida')
      .reduce((sum: number, m: any) => sum + m.valor, 0);

    caixaAberto.performance = caixaAberto.entrada - caixaAberto.saida;

    console.log('📊 [RECEBER CONTA] Totais recalculados - Entrada:', caixaAberto.entrada, 'Saída:', caixaAberto.saida, 'Performance:', caixaAberto.performance);
    console.log('💾 [RECEBER CONTA] Salvando caixa...');
    
    await caixaAberto.save();
    console.log('✅ [RECEBER CONTA] Caixa salvo com sucesso');
    console.log('✅ [RECEBER CONTA] Operação finalizada com sucesso');

    res.json(conta);
  } catch (error: any) {
    console.error('❌ [RECEBER CONTA] ERRO COMPLETO:', error);
    console.error('❌ [RECEBER CONTA] Stack trace:', error.stack);
    console.error('❌ [RECEBER CONTA] Error name:', error.name);
    console.error('❌ [RECEBER CONTA] Error message:', error.message);
    
    if (error.name === 'ValidationError') {
      console.error('❌ [RECEBER CONTA] Erros de validação do Mongoose:', error.errors);
    }
    
    res.status(400).json({ error: `Erro ao registrar recebimento: ${error.message || 'Erro desconhecido'}` });
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
