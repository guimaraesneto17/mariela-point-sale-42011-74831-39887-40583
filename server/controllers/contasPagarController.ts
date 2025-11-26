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
      // ========== CONTA ÚNICA ==========
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

    } else if (tipoCriacao === 'Parcelamento' || tipoCriacao === 'Replica') {
      // ========== PARCELAMENTO ou RÉPLICA (MESMA ESTRUTURA) ==========
      const { dataInicio } = req.body;
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      let numeroBase: string;
      let parcelas: any[];
      let contaData: any;

      if (tipoCriacao === 'Parcelamento') {
        const { quantidadeParcelas, valorTotal } = req.body;

        if (!quantidadeParcelas || quantidadeParcelas < 1) {
          return res.status(400).json({ error: 'Quantidade de parcelas deve ser >= 1' });
        }

        // Gerar número documento
        const last = await ContasPagar.findOne({ numeroDocumento: /^CPP-\d{3}$/ }).sort({ numeroDocumento: -1 });
        const next = last ? parseInt((last as any).numeroDocumento.split('-')[1], 10) + 1 : 1;
        numeroBase = `CPP-${String(next).padStart(3, '0')}`;

        // Calcular parcelas (DIVIDE o valor total)
        const valorParcela = valorTotal / quantidadeParcelas;
        const dataInicioDate = new Date(dataInicio || req.body.dataVencimento);
        
        parcelas = [];
        for (let i = 0; i < quantidadeParcelas; i++) {
          const dataVenc = addMonths(dataInicioDate, i);
          const venc = new Date(dataVenc);
          venc.setHours(0, 0, 0, 0);

          parcelas.push({
            numeroParcela: i + 1,
            valor: valorParcela,
            dataVencimento: dataVenc,
            status: venc < hoje ? 'Vencido' : 'Pendente'
          });
        }

        contaData = {
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

      } else {
        // REPLICA
        const { quantidadeReplicas, valor } = req.body;

        if (!quantidadeReplicas || quantidadeReplicas < 1) {
          return res.status(400).json({ error: 'Quantidade de réplicas deve ser >= 1' });
        }

        // Gerar número documento
        const last = await ContasPagar.findOne({ numeroDocumento: /^CPR-\d{3}$/ }).sort({ numeroDocumento: -1 });
        const next = last ? parseInt((last as any).numeroDocumento.split('-')[1], 10) + 1 : 1;
        numeroBase = `CPR-${String(next).padStart(3, '0')}`;

        // Calcular réplicas (MANTÉM o valor fixo)
        const dataInicioDate = new Date(dataInicio || req.body.dataVencimento);
        const valorTotal = valor * quantidadeReplicas;
        
        parcelas = [];
        for (let i = 0; i < quantidadeReplicas; i++) {
          const dataVenc = addMonths(dataInicioDate, i);
          const venc = new Date(dataVenc);
          venc.setHours(0, 0, 0, 0);

          parcelas.push({
            numeroParcela: i + 1,
            valor: valor, // Valor fixo (não divide)
            dataVencimento: dataVenc,
            status: venc < hoje ? 'Vencido' : 'Pendente'
          });
        }

        contaData = {
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
      }

      // Adicionar fornecedor e observações (se houver)
      if (fornecedorObj) contaData.fornecedor = fornecedorObj;
      if (req.body.observacoes) contaData.observacoes = req.body.observacoes;

      const conta = new ContasPagar(contaData);
      await conta.save();
      console.log(`✅ [CREATE CONTA PAGAR] ${tipoCriacao} criado:`, conta.numeroDocumento);
      res.status(201).json(conta);

    } else {
      return res.status(400).json({ error: 'Tipo de criação inválido' });
    }

  } catch (error: any) {
    console.error('❌ [CREATE CONTA PAGAR] Erro:', error);
    if (error?.code === 11000) {
      return res.status(400).json({ error: 'Número de documento já existe' });
    }
    res.status(400).json({ error: error.message || 'Erro ao criar conta a pagar' });
  }
};

export const updateContaPagar = async (req: Request, res: Response) => {
  try {
    const conta = await ContasPagar.findOne({ numeroDocumento: req.params.numero });
    if (!conta) {
      return res.status(404).json({ error: 'Conta a pagar não encontrada' });
    }

    // Atualizar apenas campos permitidos
    if (req.body.descricao !== undefined) conta.descricao = req.body.descricao;
    if (req.body.valor !== undefined) conta.valor = Number(req.body.valor);
    if (req.body.categoria !== undefined) conta.categoria = req.body.categoria;
    if (req.body.dataVencimento !== undefined) conta.dataVencimento = new Date(req.body.dataVencimento);
    if (req.body.observacoes !== undefined) conta.observacoes = req.body.observacoes;

    // Atualizar fornecedor se enviado
    if (req.body.fornecedorCodigo) {
      const Fornecedor = (await import('../models/Fornecedor')).default;
      const fornecedor = await Fornecedor.findOne({ codigoFornecedor: req.body.fornecedorCodigo });
      if (fornecedor) {
        conta.fornecedor = {
          codigoFornecedor: fornecedor.codigoFornecedor,
          nome: fornecedor.nome
        };
      }
    }

    await conta.save();
    res.json(conta);
  } catch (error) {
    console.error('Erro ao atualizar conta a pagar:', error);
    res.status(400).json({ error: 'Erro ao atualizar conta a pagar' });
  }
};

export const pagarConta = async (req: Request, res: Response) => {
  try {
    console.log('💰 [PAGAR CONTA] Iniciando pagamento');
    console.log('💰 [PAGAR CONTA] Número da conta:', req.params.numero);
    console.log('💰 [PAGAR CONTA] Body:', JSON.stringify(req.body, null, 2));

    const conta = await ContasPagar.findOne({ numeroDocumento: req.params.numero });
    if (!conta) {
      console.error('❌ [PAGAR CONTA] Conta não encontrada');
      return res.status(404).json({ error: 'Conta a pagar não encontrada' });
    }

    const { valorPago, formaPagamento, observacoes, numeroParcela, comprovante, jurosMulta } = req.body;

    // Normalizar valor recebido (aceita número ou string como "10,00")
    const bruto = typeof valorPago === 'string'
      ? valorPago.replace(/[^\d,.-]/g, '').replace(',', '.')
      : valorPago;
    const valorNumerico = Number(bruto);
    
    if (valorNumerico === undefined || isNaN(valorNumerico) || valorNumerico <= 0) {
      console.error('❌ [PAGAR CONTA] Valor inválido:', valorPago, 'Normalizado:', bruto, 'Numérico:', valorNumerico);
      return res.status(400).json({ error: 'Valor pago deve ser maior que zero' });
    }

    if (!formaPagamento) {
      console.error('❌ [PAGAR CONTA] Forma de pagamento não informada');
      return res.status(400).json({ error: 'Forma de pagamento é obrigatória' });
    }

    const pagamentoData: any = {
      valor: valorNumerico,
      data: new Date(),
      formaPagamento,
      observacoes: observacoes || undefined,
      comprovante: comprovante || undefined,
      jurosMulta: jurosMulta || undefined
    };

    // Se for parcelamento/replica e tiver numeroParcela
    if ((conta.tipoCriacao === 'Parcelamento' || conta.tipoCriacao === 'Replica') && numeroParcela !== undefined) {
      console.log('💰 [PAGAR CONTA] Pagando parcela/réplica:', numeroParcela);
      
      const parcela = conta.parcelas?.find((p: any) => p.numeroParcela === numeroParcela);
      if (!parcela) {
        console.error('❌ [PAGAR CONTA] Parcela não encontrada');
        return res.status(404).json({ error: 'Parcela não encontrada' });
      }

      // Atualizar parcela
      parcela.pagamento = pagamentoData;
      
      const valorParcela = parcela.valor || 0;
      const totalPago = valorNumerico;

      if (totalPago >= valorParcela) {
        parcela.status = 'Pago';
      } else {
        parcela.status = 'Parcial';
      }

      console.log(`✅ [PAGAR CONTA] Parcela ${numeroParcela} atualizada:`, parcela.status);

    } else {
      // Conta única
      console.log('💰 [PAGAR CONTA] Pagando conta única');
      
      conta.pagamento = pagamentoData;
      
      const valorTotal = conta.valor || 0;
      const totalPago = valorNumerico;

      if (totalPago >= valorTotal) {
        conta.status = 'Pago';
      } else {
        conta.status = 'Parcial';
      }

      console.log('✅ [PAGAR CONTA] Conta única atualizada:', conta.status);
    }

    // Atualizar status geral da conta se for parcelamento/replica
    if (conta.tipoCriacao === 'Parcelamento' || conta.tipoCriacao === 'Replica') {
      const todasPagas = conta.parcelas?.every((p: any) => p.status === 'Pago');
      const algumaPaga = conta.parcelas?.some((p: any) => p.status === 'Pago' || p.status === 'Parcial');

      if (todasPagas) {
        conta.status = 'Pago';
      } else if (algumaPaga) {
        conta.status = 'Parcial';
      }
    }

    await conta.save();

    // Registrar no caixa
    try {
      const Caixa = (await import('../models/Caixa')).default;
      const caixaAberto = await Caixa.findOne({ status: 'aberto' });
      
      if (!caixaAberto) {
        console.warn('⚠️ [PAGAR CONTA] Nenhum caixa aberto encontrado');
      } else {
        // Registrar como saída no movimento do caixa
        caixaAberto.movimentos.push({
          tipo: 'saida',
          valor: valorNumerico,
          data: new Date().toISOString(),
          codigoVenda: null,
          formaPagamento,
          observacao: numeroParcela !== undefined 
            ? `Pagamento conta a pagar ${conta.numeroDocumento} - Parcela ${numeroParcela}/${conta.parcelas?.length}`
            : `Pagamento conta a pagar ${conta.numeroDocumento}`
        });

        // Recalcular totais do caixa
        caixaAberto.entrada = caixaAberto.movimentos
          .filter((m: any) => m.tipo === 'entrada')
          .reduce((sum: number, m: any) => sum + m.valor, 0);

        caixaAberto.saida = caixaAberto.movimentos
          .filter((m: any) => m.tipo === 'saida')
          .reduce((sum: number, m: any) => sum + m.valor, 0);

        caixaAberto.performance = caixaAberto.entrada - caixaAberto.saida;

        await caixaAberto.save();
        console.log('✅ [PAGAR CONTA] Lançado no caixa:', caixaAberto.codigoCaixa);
      }
    } catch (caixaError) {
      console.error('⚠️ [PAGAR CONTA] Erro ao registrar no caixa:', caixaError);
    }

    console.log('✅ [PAGAR CONTA] Operação concluída com sucesso');
    res.json(conta);
  } catch (error: any) {
    console.error('❌ [PAGAR CONTA] Erro:', error);
    res.status(400).json({ error: error.message || 'Erro ao registrar pagamento' });
  }
};

export const deleteContaPagar = async (req: Request, res: Response) => {
  try {
    const conta = await ContasPagar.findOneAndDelete({ numeroDocumento: req.params.numero });
    if (!conta) {
      return res.status(404).json({ error: 'Conta a pagar não encontrada' });
    }
    res.json({ message: 'Conta a pagar excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir conta a pagar:', error);
    res.status(500).json({ error: 'Erro ao excluir conta a pagar' });
  }
};

export const getResumoContasPagar = async (req: Request, res: Response) => {
  try {
    const contas = await ContasPagar.find();
    
    let totalPendente = 0;
    let totalPago = 0;
    let totalVencido = 0;

    contas.forEach((conta: any) => {
      if (conta.tipoCriacao === 'Parcelamento' || conta.tipoCriacao === 'Replica') {
        // Para parcelamento/replica, soma parcelas
        conta.parcelas?.forEach((parcela: any) => {
          if (parcela.status === 'Pago') {
            totalPago += parcela.pagamento?.valor || 0;
          } else if (parcela.status === 'Vencido') {
            totalVencido += parcela.valor - (parcela.pagamento?.valor || 0);
          } else if (parcela.status === 'Pendente') {
            totalPendente += parcela.valor - (parcela.pagamento?.valor || 0);
          } else if (parcela.status === 'Parcial') {
            const restante = parcela.valor - (parcela.pagamento?.valor || 0);
            totalPago += parcela.pagamento?.valor || 0;
            totalPendente += restante;
          }
        });
      } else {
        // Para conta única
        if (conta.status === 'Pago') {
          totalPago += conta.pagamento?.valor || conta.valor || 0;
        } else if (conta.status === 'Vencido') {
          totalVencido += conta.valor - (conta.pagamento?.valor || 0);
        } else if (conta.status === 'Pendente') {
          totalPendente += conta.valor - (conta.pagamento?.valor || 0);
        } else if (conta.status === 'Parcial') {
          const pago = conta.pagamento?.valor || 0;
          const restante = conta.valor - pago;
          totalPago += pago;
          totalPendente += restante;
        }
      }
    });

    res.json({
      totalPendente,
      totalPago,
      totalVencido,
      quantidadeContas: contas.length
    });
  } catch (error) {
    console.error('Erro ao buscar resumo de contas a pagar:', error);
    res.status(500).json({ error: 'Erro ao buscar resumo' });
  }
};
