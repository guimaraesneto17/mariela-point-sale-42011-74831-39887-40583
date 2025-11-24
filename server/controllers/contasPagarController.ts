import { Request, Response } from 'express';
import ContasPagar from '../models/ContasPagar';
import { addMonths } from 'date-fns';

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
    
    const tipoCriacao = req.body.tipoCriacao || 'Unica';
    
    // Buscar fornecedor se fornecedorCodigo foi enviado
    let fornecedorObj = null;
    if (req.body.fornecedorCodigo) {
      const Fornecedor = (await import('../models/Fornecedor')).default;
      const fornecedor = await Fornecedor.findOne({ codigoFornecedor: req.body.fornecedorCodigo });
      if (fornecedor) {
        fornecedorObj = {
          codigoFornecedor: fornecedor.codigoFornecedor,
          nome: fornecedor.nome
        };
      }
    }

    if (tipoCriacao === 'Unica') {
      // CONTA ÚNICA
      const last = await ContasPagar.findOne({ numeroDocumento: /^CP\d{3}$/ }).sort({ numeroDocumento: -1 });
      const next = last ? parseInt((last as any).numeroDocumento.slice(2), 10) + 1 : 1;
      const numero = `CP${String(next).padStart(3, '0')}`;

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

      if (fornecedorObj) contaData.fornecedor = fornecedorObj;
      if (req.body.observacoes) contaData.observacoes = req.body.observacoes;

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
      console.log('✅ [CREATE CONTA PAGAR] Conta única criada:', conta.numeroDocumento);
      res.status(201).json(conta);

    } else if (tipoCriacao === 'Parcelamento') {
      // PARCELAMENTO
      const { quantidadeParcelas, valorTotal, dataInicio } = req.body;

      if (!quantidadeParcelas || quantidadeParcelas < 1) {
        return res.status(400).json({ error: 'Quantidade de parcelas deve ser >= 1' });
      }

      const last = await ContasPagar.findOne({ numeroDocumento: /^CPP-\d{3}$/ }).sort({ numeroDocumento: -1 });
      const next = last ? parseInt((last as any).numeroDocumento.split('-')[1], 10) + 1 : 1;
      const numeroBase = `CPP-${String(next).padStart(3, '0')}`;

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

      if (fornecedorObj) contaData.fornecedor = fornecedorObj;
      if (req.body.observacoes) contaData.observacoes = req.body.observacoes;

      const conta = new ContasPagar(contaData);
      await conta.save();
      console.log('✅ [CREATE CONTA PAGAR] Parcelamento criado:', conta.numeroDocumento);
      res.status(201).json(conta);

    } else if (tipoCriacao === 'Replica') {
      // REPLICAÇÃO (mesmo padrão do Parcelamento, mas com valor fixo)
      const { quantidadeReplicas, valor, dataInicio } = req.body;

      if (!quantidadeReplicas || quantidadeReplicas < 1) {
        return res.status(400).json({ error: 'Quantidade de réplicas deve ser >= 1' });
      }

      const last = await ContasPagar.findOne({ numeroDocumento: /^CPR-\d{3}$/ }).sort({ numeroDocumento: -1 });
      const next = last ? parseInt((last as any).numeroDocumento.split('-')[1], 10) + 1 : 1;
      const numeroBase = `CPR-${String(next).padStart(3, '0')}`;

      const dataInicioDate = new Date(dataInicio || req.body.dataVencimento);
      const valorTotal = valor * quantidadeReplicas;
      
      const parcelas = [];
      for (let i = 0; i < quantidadeReplicas; i++) {
        const dataVenc = addMonths(dataInicioDate, i);
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const venc = new Date(dataVenc);
        venc.setHours(0, 0, 0, 0);

        parcelas.push({
          numeroParcela: i + 1,
          valor: valor, // Valor fixo (não divide)
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
        tipoCriacao: 'Replica',
        detalhesReplica: {
          quantidadeReplicas,
          valor
        },
        parcelas
      };

      if (fornecedorObj) contaData.fornecedor = fornecedorObj;
      if (req.body.observacoes) contaData.observacoes = req.body.observacoes;

      const conta = new ContasPagar(contaData);
      await conta.save();
      console.log('✅ [CREATE CONTA PAGAR] Réplica criada:', conta.numeroDocumento);
      res.status(201).json(conta);

    } else {
      return res.status(400).json({ error: 'Tipo de criação inválido' });
    }

  } catch (error: any) {
    console.error('❌ [CREATE CONTA PAGAR] Erro:', error);
    if (error?.code === 11000) {
      return res.status(400).json({ error: 'Número de documento já existe' });
    }
    if (error?.name === 'ValidationError') {
      const messages = Object.values(error.errors || {}).map((e: any) => e.message);
      return res.status(400).json({ error: messages.join('; ') });
    }
    res.status(400).json({ error: `Erro ao criar conta a pagar: ${error.message}` });
  }
};

export const updateContaPagar = async (req: Request, res: Response) => {
  try {
    const conta = await ContasPagar.findOne({ numeroDocumento: req.params.numero });
    if (!conta) {
      return res.status(404).json({ error: 'Conta a pagar não encontrada' });
    }

    // Não permitir alterar tipoCriacao
    if (req.body.tipoCriacao && req.body.tipoCriacao !== conta.tipoCriacao) {
      return res.status(400).json({ error: 'Não é possível alterar o tipo de criação após criação' });
    }

    const contaAtualizada = await ContasPagar.findOneAndUpdate(
      { numeroDocumento: req.params.numero },
      req.body,
      { new: true, runValidators: true }
    );
    
    res.json(contaAtualizada);
  } catch (error) {
    console.error('Erro ao atualizar conta a pagar:', error);
    res.status(400).json({ error: 'Erro ao atualizar conta a pagar' });
  }
};

export const pagarConta = async (req: Request, res: Response) => {
  try {
    const { valor, data, formaPagamento, observacoes, numeroParcela, comprovante } = req.body;

    console.log('📝 [PAGAR CONTA] Payload recebido:', JSON.stringify(req.body, null, 2));

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
        error: 'Não é possível registrar pagamento sem um caixa aberto.' 
      });
    }

    const conta = await ContasPagar.findOne({ numeroDocumento: req.params.numero });
    if (!conta) {
      return res.status(404).json({ error: 'Conta a pagar não encontrada' });
    }

    const dataConvertida = data ? new Date(data) : new Date();

    if (conta.tipoCriacao === 'Unica') {
      // PAGAR CONTA ÚNICA
      conta.pagamento = {
        valor,
        data: dataConvertida,
        formaPagamento,
        observacoes,
        comprovante
      } as any;
      conta.status = 'Pago';
      
    } else if (conta.tipoCriacao === 'Parcelamento') {
      // PAGAR PARCELA
      if (numeroParcela === undefined) {
        return res.status(400).json({ error: 'Número da parcela é obrigatório para pagamento de parcelamento' });
      }

      const parcela = conta.parcelas.find((p: any) => p.numeroParcela === numeroParcela);
      if (!parcela) {
        return res.status(404).json({ error: 'Parcela não encontrada' });
      }

      (parcela as any).pagamento = {
        valor,
        data: dataConvertida,
        formaPagamento,
        observacoes,
        comprovante
      };
      (parcela as any).status = 'Pago';

      // Calcular status geral baseado nas parcelas
      const todasPagas = conta.parcelas.every((p: any) => p.status === 'Pago');
      const algumasPagas = conta.parcelas.some((p: any) => p.status === 'Pago');
      
      if (todasPagas) {
        conta.status = 'Pago';
      } else if (algumasPagas) {
        conta.status = 'Parcial';
      }
      
    } else {
      return res.status(400).json({ error: 'Tipo de conta não suporta pagamento direto' });
    }

    await conta.save();

    // Registrar no caixa
    const movimento = {
      tipo: 'saida' as const,
      valor,
      data: dataConvertida.toISOString(),
      codigoVenda: null,
      formaPagamento,
      observacao: `Pagamento: ${conta.descricao} - ${conta.numeroDocumento}${numeroParcela ? ` - Parcela ${numeroParcela}` : ''}`
    };

    caixaAberto.movimentos.push(movimento);

    caixaAberto.saida = caixaAberto.movimentos
      .filter((m: any) => m.tipo === 'saida')
      .reduce((sum: number, m: any) => sum + m.valor, 0);

    caixaAberto.entrada = caixaAberto.movimentos
      .filter((m: any) => m.tipo === 'entrada')
      .reduce((sum: number, m: any) => sum + m.valor, 0);

    caixaAberto.performance = caixaAberto.entrada - caixaAberto.saida;

    await caixaAberto.save();
    console.log('✅ [PAGAR CONTA] Operação finalizada com sucesso');

    res.json(conta);
  } catch (error: any) {
    console.error('❌ [PAGAR CONTA] Erro:', error);
    res.status(400).json({ error: `Erro ao registrar pagamento: ${error.message}` });
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
      { $group: { _id: null, total: { $sum: '$valor' } } }
    ]);
    
    const totalPago = await ContasPagar.aggregate([
      { $match: { status: 'Pago' } },
      { $group: { _id: null, total: { $sum: '$valor' } } }
    ]);
    
    const totalVencido = await ContasPagar.aggregate([
      { $match: { status: 'Vencido' } },
      { $group: { _id: null, total: { $sum: '$valor' } } }
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
