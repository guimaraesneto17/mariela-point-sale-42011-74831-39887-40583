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
      // ========== CONTA ÚNICA ==========
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
        const last = await ContasReceber.findOne({ numeroDocumento: /^CRP-\d{3}$/ }).sort({ numeroDocumento: -1 });
        const next = last ? parseInt((last as any).numeroDocumento.split('-')[1], 10) + 1 : 1;
        numeroBase = `CRP-${String(next).padStart(3, '0')}`;

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
        const last = await ContasReceber.findOne({ numeroDocumento: /^CRR-\d{3}$/ }).sort({ numeroDocumento: -1 });
        const next = last ? parseInt((last as any).numeroDocumento.split('-')[1], 10) + 1 : 1;
        numeroBase = `CRR-${String(next).padStart(3, '0')}`;

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

      // Adicionar cliente, venda relacionada e observações (se houver)
      if (clienteObj) contaData.cliente = clienteObj;
      if (req.body.codigoVenda) {
        contaData.vendaRelacionada = { codigoVenda: req.body.codigoVenda };
      }
      if (req.body.observacoes) contaData.observacoes = req.body.observacoes;

      const conta = new ContasReceber(contaData);
      await conta.save();
      console.log(`✅ [CREATE CONTA RECEBER] ${tipoCriacao} criado:`, conta.numeroDocumento);
      res.status(201).json(conta);

    } else {
      return res.status(400).json({ error: 'Tipo de criação inválido' });
    }

  } catch (error: any) {
    console.error('❌ [CREATE CONTA RECEBER] Erro:', error);
    if (error?.code === 11000) {
      return res.status(400).json({ error: 'Número de documento já existe' });
    }
    res.status(400).json({ error: error.message || 'Erro ao criar conta a receber' });
  }
};

export const updateContaReceber = async (req: Request, res: Response) => {
  try {
    const conta = await ContasReceber.findOne({ numeroDocumento: req.params.numero });
    if (!conta) {
      return res.status(404).json({ error: 'Conta a receber não encontrada' });
    }

    // Atualizar apenas campos permitidos
    if (req.body.descricao !== undefined) conta.descricao = req.body.descricao;
    if (req.body.valor !== undefined) conta.valor = Number(req.body.valor);
    if (req.body.categoria !== undefined) conta.categoria = req.body.categoria;
    if (req.body.dataVencimento !== undefined) conta.dataVencimento = new Date(req.body.dataVencimento);
    if (req.body.observacoes !== undefined) conta.observacoes = req.body.observacoes;

    // Atualizar cliente se enviado
    if (req.body.clienteCodigo) {
      const Cliente = (await import('../models/Cliente')).default;
      const cliente = await Cliente.findOne({ codigoCliente: req.body.clienteCodigo });
      if (cliente) {
        conta.cliente = {
          codigoCliente: cliente.codigoCliente,
          nome: cliente.nome
        };
      }
    }

    await conta.save();
    res.json(conta);
  } catch (error) {
    console.error('Erro ao atualizar conta a receber:', error);
    res.status(400).json({ error: 'Erro ao atualizar conta a receber' });
  }
};

export const receberConta = async (req: Request, res: Response) => {
  try {
    console.log('💰 [RECEBER CONTA] Iniciando recebimento');
    console.log('💰 [RECEBER CONTA] Número da conta:', req.params.numero);
    console.log('💰 [RECEBER CONTA] Body:', JSON.stringify(req.body, null, 2));

    const conta = await ContasReceber.findOne({ numeroDocumento: req.params.numero });
    if (!conta) {
      console.error('❌ [RECEBER CONTA] Conta não encontrada');
      return res.status(404).json({ error: 'Conta a receber não encontrada' });
    }

    const { valorRecebido, formaPagamento, observacoes, numeroParcela, comprovante, jurosMulta } = req.body;

    if (!valorRecebido || valorRecebido <= 0) {
      console.error('❌ [RECEBER CONTA] Valor inválido:', valorRecebido);
      return res.status(400).json({ error: 'Valor recebido deve ser maior que zero' });
    }

    if (!formaPagamento) {
      console.error('❌ [RECEBER CONTA] Forma de pagamento não informada');
      return res.status(400).json({ error: 'Forma de pagamento é obrigatória' });
    }

    const recebimentoData: any = {
      valor: valorRecebido,
      data: new Date(),
      formaPagamento,
      observacoes: observacoes || undefined,
      comprovante: comprovante || undefined,
      jurosMulta: jurosMulta || undefined
    };

    // Se for parcelamento/replica e tiver numeroParcela
    if ((conta.tipoCriacao === 'Parcelamento' || conta.tipoCriacao === 'Replica') && numeroParcela !== undefined) {
      console.log('💰 [RECEBER CONTA] Recebendo parcela/réplica:', numeroParcela);
      
      const parcela = conta.parcelas?.find((p: any) => p.numeroParcela === numeroParcela);
      if (!parcela) {
        console.error('❌ [RECEBER CONTA] Parcela não encontrada');
        return res.status(404).json({ error: 'Parcela não encontrada' });
      }

      // Atualizar parcela
      parcela.recebimento = recebimentoData;
      
      const valorParcela = parcela.valor || 0;
      const totalRecebido = valorRecebido;

      if (totalRecebido >= valorParcela) {
        parcela.status = 'Recebido';
      } else {
        parcela.status = 'Parcial';
      }

      console.log(`✅ [RECEBER CONTA] Parcela ${numeroParcela} atualizada:`, parcela.status);

    } else {
      // Conta única
      console.log('💰 [RECEBER CONTA] Recebendo conta única');
      
      conta.recebimento = recebimentoData;
      
      const valorTotal = conta.valor || 0;
      const totalRecebido = valorRecebido;

      if (totalRecebido >= valorTotal) {
        conta.status = 'Recebido';
      } else {
        conta.status = 'Parcial';
      }

      console.log('✅ [RECEBER CONTA] Conta única atualizada:', conta.status);
    }

    // Atualizar status geral da conta se for parcelamento/replica
    if (conta.tipoCriacao === 'Parcelamento' || conta.tipoCriacao === 'Replica') {
      const todasRecebidas = conta.parcelas?.every((p: any) => p.status === 'Recebido');
      const algumaRecebida = conta.parcelas?.some((p: any) => p.status === 'Recebido' || p.status === 'Parcial');

      if (todasRecebidas) {
        conta.status = 'Recebido';
      } else if (algumaRecebida) {
        conta.status = 'Parcial';
      }
    }

    await conta.save();

    // Registrar no caixa
    try {
      const Caixa = (await import('../models/Caixa')).default;
      const caixaAberto = await Caixa.findOne({ status: 'Aberto' }).sort({ dataAbertura: -1 });
      
      if (!caixaAberto) {
        console.warn('⚠️ [RECEBER CONTA] Nenhum caixa aberto encontrado');
      } else {
        caixaAberto.entradas.push({
          descricao: numeroParcela !== undefined 
            ? `${conta.descricao} - Parcela ${numeroParcela}/${conta.parcelas?.length}`
            : conta.descricao,
          valor: valorRecebido,
          formaPagamento,
          categoria: conta.categoria,
          data: new Date(),
          tipo: 'Conta a Receber'
        });
        await caixaAberto.save();
        console.log('✅ [RECEBER CONTA] Lançado no caixa:', caixaAberto.codigoCaixa);
      }
    } catch (caixaError) {
      console.error('⚠️ [RECEBER CONTA] Erro ao registrar no caixa:', caixaError);
    }

    console.log('✅ [RECEBER CONTA] Operação concluída com sucesso');
    res.json(conta);
  } catch (error: any) {
    console.error('❌ [RECEBER CONTA] Erro:', error);
    res.status(400).json({ error: error.message || 'Erro ao registrar recebimento' });
  }
};

export const deleteContaReceber = async (req: Request, res: Response) => {
  try {
    const conta = await ContasReceber.findOneAndDelete({ numeroDocumento: req.params.numero });
    if (!conta) {
      return res.status(404).json({ error: 'Conta a receber não encontrada' });
    }
    res.json({ message: 'Conta a receber excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir conta a receber:', error);
    res.status(500).json({ error: 'Erro ao excluir conta a receber' });
  }
};

export const getResumoContasReceber = async (req: Request, res: Response) => {
  try {
    const contas = await ContasReceber.find();
    
    let totalPendente = 0;
    let totalRecebido = 0;
    let totalVencido = 0;

    contas.forEach((conta: any) => {
      if (conta.tipoCriacao === 'Parcelamento' || conta.tipoCriacao === 'Replica') {
        // Para parcelamento/replica, soma parcelas
        conta.parcelas?.forEach((parcela: any) => {
          if (parcela.status === 'Recebido') {
            totalRecebido += parcela.recebimento?.valor || 0;
          } else if (parcela.status === 'Vencido') {
            totalVencido += parcela.valor - (parcela.recebimento?.valor || 0);
          } else if (parcela.status === 'Pendente') {
            totalPendente += parcela.valor - (parcela.recebimento?.valor || 0);
          } else if (parcela.status === 'Parcial') {
            const restante = parcela.valor - (parcela.recebimento?.valor || 0);
            totalRecebido += parcela.recebimento?.valor || 0;
            totalPendente += restante;
          }
        });
      } else {
        // Para conta única
        if (conta.status === 'Recebido') {
          totalRecebido += conta.recebimento?.valor || conta.valor || 0;
        } else if (conta.status === 'Vencido') {
          totalVencido += conta.valor - (conta.recebimento?.valor || 0);
        } else if (conta.status === 'Pendente') {
          totalPendente += conta.valor - (conta.recebimento?.valor || 0);
        } else if (conta.status === 'Parcial') {
          const recebido = conta.recebimento?.valor || 0;
          const restante = conta.valor - recebido;
          totalRecebido += recebido;
          totalPendente += restante;
        }
      }
    });

    res.json({
      totalPendente,
      totalRecebido,
      totalVencido,
      quantidadeContas: contas.length
    });
  } catch (error) {
    console.error('Erro ao buscar resumo de contas a receber:', error);
    res.status(500).json({ error: 'Erro ao buscar resumo' });
  }
};
