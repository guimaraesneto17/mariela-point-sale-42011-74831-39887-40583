import { Request, Response } from 'express';
import ContasReceber from '../models/ContasReceber';
import { addMonths } from 'date-fns';

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
    
    const tipoCriacao = req.body.tipoCriacao || 'Unica';
    
    // Buscar cliente se clienteCodigo foi enviado
    let clienteObj = null;
    if (req.body.clienteCodigo) {
      const Cliente = (await import('../models/Cliente')).default;
      const cliente = await Cliente.findOne({ codigoCliente: req.body.clienteCodigo });
      if (cliente) {
        clienteObj = {
          codigoCliente: cliente.codigoCliente,
          nome: cliente.nome
        };
      }
    }

    if (tipoCriacao === 'Unica') {
      // CONTA ÚNICA
      const last = await ContasReceber.findOne({ numeroDocumento: /^CR\d{3}$/ }).sort({ numeroDocumento: -1 });
      const next = last ? parseInt((last as any).numeroDocumento.slice(2), 10) + 1 : 1;
      const numero = `CR${String(next).padStart(3, '0')}`;

      const contaData: any = {
        numeroDocumento: numero,
        descricao: req.body.descricao,
        categoria: req.body.categoria,
        valor: Number(req.body.valor),
        dataEmissao: req.body.dataEmissao ? new Date(req.body.dataEmissao) : new Date(),
        dataVencimento: new Date(req.body.dataVencimento),
        status: 'Pendente',
        tipoCriacao: 'Unica'
      };

      if (clienteObj) contaData.cliente = clienteObj;
      if (req.body.codigoVenda) {
        contaData.vendaRelacionada = { codigoVenda: req.body.codigoVenda };
      }
      if (req.body.observacoes) contaData.observacoes = req.body.observacoes;

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
      console.log('✅ [CREATE CONTA RECEBER] Conta única criada:', conta.numeroDocumento);
      res.status(201).json(conta);

    } else if (tipoCriacao === 'Parcelamento') {
      // PARCELAMENTO
      const { quantidadeParcelas, valorTotal, dataInicio } = req.body;

      if (!quantidadeParcelas || quantidadeParcelas < 1) {
        return res.status(400).json({ error: 'Quantidade de parcelas deve ser >= 1' });
      }

      const last = await ContasReceber.findOne({ numeroDocumento: /^CRP-\d{3}$/ }).sort({ numeroDocumento: -1 });
      const next = last ? parseInt((last as any).numeroDocumento.split('-')[1], 10) + 1 : 1;
      const numeroBase = `CRP-${String(next).padStart(3, '0')}`;

      const valorParcela = valorTotal / quantidadeParcelas;
      const dataInicioDate = new Date(dataInicio || req.body.dataVencimento);
      
      const parcelas = [];
      for (let i = 0; i < quantidadeParcelas; i++) {
        const dataVenc = addMonths(dataInicioDate, i);
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const venc = new Date(dataVenc);
        venc.setHours(0, 0, 0, 0);

        parcelas.push({
          numeroParcela: i + 1,
          valor: valorParcela,
          dataVencimento: dataVenc,
          status: venc < hoje ? 'Vencido' : 'Pendente'
        });
      }

      const contaData: any = {
        numeroDocumento: numeroBase,
        descricao: req.body.descricao,
        categoria: req.body.categoria,
        valor: valorTotal,
        dataEmissao: new Date(),
        dataVencimento: parcelas[0].dataVencimento,
        status: 'Pendente',
        tipoCriacao: 'Parcelamento',
        detalhesParcelamento: {
          quantidadeParcelas,
          valorTotal
        },
        parcelas
      };

      if (clienteObj) contaData.cliente = clienteObj;
      if (req.body.codigoVenda) {
        contaData.vendaRelacionada = { codigoVenda: req.body.codigoVenda };
      }
      if (req.body.observacoes) contaData.observacoes = req.body.observacoes;

      const conta = new ContasReceber(contaData);
      await conta.save();
      console.log('✅ [CREATE CONTA RECEBER] Parcelamento criado:', conta.numeroDocumento);
      res.status(201).json(conta);

    } else if (tipoCriacao === 'Replica') {
      // REPLICAÇÃO
      const { quantidadeReplicas, valor, dataInicio } = req.body;

      if (!quantidadeReplicas || quantidadeReplicas < 1) {
        return res.status(400).json({ error: 'Quantidade de réplicas deve ser >= 1' });
      }

      // Criar conta pai
      const lastPai = await ContasReceber.findOne({ numeroDocumento: /^CRPAI-\d{3}$/ }).sort({ numeroDocumento: -1 });
      const nextPai = lastPai ? parseInt((lastPai as any).numeroDocumento.split('-')[1], 10) + 1 : 1;
      const numeroPai = `CRPAI-${String(nextPai).padStart(3, '0')}`;

      const contaPaiData: any = {
        numeroDocumento: numeroPai,
        descricao: `${req.body.descricao} [Origem de Réplica]`,
        categoria: req.body.categoria,
        valor: 0, // Conta pai não tem valor próprio
        dataEmissao: new Date(),
        dataVencimento: new Date(dataInicio || req.body.dataVencimento),
        status: 'Pendente',
        tipoCriacao: 'Replica',
        detalhesReplica: {
          quantidadeReplicas,
          valor
        }
      };

      if (clienteObj) contaPaiData.cliente = clienteObj;
      if (req.body.observacoes) contaPaiData.observacoes = req.body.observacoes;

      const contaPai = new ContasReceber(contaPaiData);
      await contaPai.save();
      console.log('✅ [CREATE CONTA RECEBER] Conta pai de réplica criada:', contaPai.numeroDocumento);

      // Criar réplicas
      const dataInicioDate = new Date(dataInicio || req.body.dataVencimento);
      const replicas = [];
      
      for (let i = 0; i < quantidadeReplicas; i++) {
        const last = await ContasReceber.findOne({ numeroDocumento: /^CR\d{3}$/ }).sort({ numeroDocumento: -1 });
        const next = last ? parseInt((last as any).numeroDocumento.slice(2), 10) + 1 : 1;
        const numeroReplica = `CR${String(next).padStart(3, '0')}`;

        const dataVenc = addMonths(dataInicioDate, i);
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const venc = new Date(dataVenc);
        venc.setHours(0, 0, 0, 0);

        const replicaData: any = {
          numeroDocumento: numeroReplica,
          descricao: `${req.body.descricao} - Mês ${i + 1}/${quantidadeReplicas}`,
          categoria: req.body.categoria,
          valor,
          dataEmissao: new Date(),
          dataVencimento: dataVenc,
          status: venc < hoje ? 'Vencido' : 'Pendente',
          tipoCriacao: 'Unica',
          replicaDe: contaPai._id.toString()
        };

        if (clienteObj) replicaData.cliente = clienteObj;
        if (req.body.observacoes) replicaData.observacoes = req.body.observacoes;

        const replica = new ContasReceber(replicaData);
        await replica.save();
        replicas.push(replica);
      }

      console.log(`✅ [CREATE CONTA RECEBER] ${quantidadeReplicas} réplicas criadas`);
      res.status(201).json({ contaPai, replicas });

    } else {
      return res.status(400).json({ error: 'Tipo de criação inválido' });
    }

  } catch (error: any) {
    console.error('❌ [CREATE CONTA RECEBER] Erro:', error);
    if (error?.code === 11000) {
      return res.status(400).json({ error: 'Número de documento já existe' });
    }
    if (error?.name === 'ValidationError') {
      const messages = Object.values(error.errors || {}).map((e: any) => e.message);
      return res.status(400).json({ error: messages.join('; ') });
    }
    res.status(400).json({ error: `Erro ao criar conta a receber: ${error.message}` });
  }
};

export const updateContaReceber = async (req: Request, res: Response) => {
  try {
    const conta = await ContasReceber.findOne({ numeroDocumento: req.params.numero });
    if (!conta) {
      return res.status(404).json({ error: 'Conta a receber não encontrada' });
    }

    // Não permitir alterar tipoCriacao
    if (req.body.tipoCriacao && req.body.tipoCriacao !== conta.tipoCriacao) {
      return res.status(400).json({ error: 'Não é possível alterar o tipo de criação após criação' });
    }

    const contaAtualizada = await ContasReceber.findOneAndUpdate(
      { numeroDocumento: req.params.numero },
      req.body,
      { new: true, runValidators: true }
    );
    
    res.json(contaAtualizada);
  } catch (error) {
    console.error('Erro ao atualizar conta a receber:', error);
    res.status(400).json({ error: 'Erro ao atualizar conta a receber' });
  }
};

export const receberConta = async (req: Request, res: Response) => {
  try {
    const { valor, data, formaPagamento, observacoes, numeroParcela } = req.body;

    console.log('📝 [RECEBER CONTA] Payload recebido:', JSON.stringify(req.body, null, 2));

    if (typeof valor !== 'number' || valor <= 0) {
      return res.status(400).json({ error: 'Valor deve ser um número positivo' });
    }

    if (!formaPagamento) {
      return res.status(400).json({ error: 'Forma de pagamento é obrigatória' });
    }

    // Verificar caixa aberto
    const Caixa = (await import('../models/Caixa')).default;
    const caixaAberto = await Caixa.findOne({ status: 'aberto' }).sort({ dataAbertura: -1 });
    
    if (!caixaAberto) {
      return res.status(400).json({ 
        error: 'Não é possível registrar recebimento sem um caixa aberto.' 
      });
    }

    const conta = await ContasReceber.findOne({ numeroDocumento: req.params.numero });
    if (!conta) {
      return res.status(404).json({ error: 'Conta a receber não encontrada' });
    }

    const dataConvertida = data ? new Date(data) : new Date();

    if (conta.tipoCriacao === 'Unica') {
      // RECEBER CONTA ÚNICA
      conta.recebimento = {
        valor,
        data: dataConvertida,
        formaPagamento,
        observacoes
      } as any;
      conta.status = 'Recebido';
      
    } else if (conta.tipoCriacao === 'Parcelamento') {
      // RECEBER PARCELA
      if (numeroParcela === undefined) {
        return res.status(400).json({ error: 'Número da parcela é obrigatório para recebimento de parcelamento' });
      }

      const parcela = conta.parcelas.find((p: any) => p.numeroParcela === numeroParcela);
      if (!parcela) {
        return res.status(404).json({ error: 'Parcela não encontrada' });
      }

      (parcela as any).recebimento = {
        valor,
        data: dataConvertida,
        formaPagamento,
        observacoes
      };
      (parcela as any).status = 'Recebido';

      // Calcular status geral baseado nas parcelas
      const todasRecebidas = conta.parcelas.every((p: any) => p.status === 'Recebido');
      const algumasRecebidas = conta.parcelas.some((p: any) => p.status === 'Recebido');
      
      if (todasRecebidas) {
        conta.status = 'Recebido';
      } else if (algumasRecebidas) {
        conta.status = 'Parcial';
      }
      
    } else {
      return res.status(400).json({ error: 'Tipo de conta não suporta recebimento direto' });
    }

    await conta.save();

    // Registrar no caixa
    const movimento = {
      tipo: 'entrada' as const,
      valor,
      data: dataConvertida.toISOString(),
      codigoVenda: null,
      formaPagamento,
      observacao: `Recebimento: ${conta.descricao} - ${conta.numeroDocumento}${numeroParcela ? ` - Parcela ${numeroParcela}` : ''}`
    };

    caixaAberto.movimentos.push(movimento);

    caixaAberto.entrada = caixaAberto.movimentos
      .filter((m: any) => m.tipo === 'entrada')
      .reduce((sum: number, m: any) => sum + m.valor, 0);

    caixaAberto.saida = caixaAberto.movimentos
      .filter((m: any) => m.tipo === 'saida')
      .reduce((sum: number, m: any) => sum + m.valor, 0);

    caixaAberto.performance = caixaAberto.entrada - caixaAberto.saida;

    await caixaAberto.save();
    console.log('✅ [RECEBER CONTA] Operação finalizada com sucesso');

    res.json(conta);
  } catch (error: any) {
    console.error('❌ [RECEBER CONTA] Erro:', error);
    res.status(400).json({ error: `Erro ao registrar recebimento: ${error.message}` });
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
      { $group: { _id: null, total: { $sum: '$valor' } } }
    ]);
    
    const totalRecebido = await ContasReceber.aggregate([
      { $match: { status: 'Recebido' } },
      { $group: { _id: null, total: { $sum: '$valor' } } }
    ]);
    
    const totalVencido = await ContasReceber.aggregate([
      { $match: { status: 'Vencido' } },
      { $group: { _id: null, total: { $sum: '$valor' } } }
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
