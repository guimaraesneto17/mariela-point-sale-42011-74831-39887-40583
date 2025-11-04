import { Request, Response } from 'express';
import Caixa from '../models/Caixa';
import Venda from '../models/Venda';

const caixaController = {
  // Buscar todos os caixas
  async getAll(req: Request, res: Response) {
    try {
      const caixas = await Caixa.find().sort({ dataAbertura: -1 });
      res.json(caixas);
    } catch (error: any) {
      console.error('Erro ao buscar caixas:', error);
      res.status(500).json({ error: error.message || 'Erro ao buscar caixas' });
    }
  },

  // Buscar caixa aberto
  async getCaixaAberto(req: Request, res: Response) {
    try {
      const caixaAberto = await Caixa.findOne({ status: 'aberto' });
      res.json(caixaAberto);
    } catch (error: any) {
      console.error('Erro ao buscar caixa aberto:', error);
      res.status(500).json({ error: error.message || 'Erro ao buscar caixa aberto' });
    }
  },

  // Buscar caixa por código
  async getByCodigo(req: Request, res: Response) {
    try {
      const { codigo } = req.params;
      const caixa = await Caixa.findOne({ codigoCaixa: codigo });

      if (!caixa) {
        return res.status(404).json({ error: 'Caixa não encontrado' });
      }

      res.json(caixa);
    } catch (error: any) {
      console.error('Erro ao buscar caixa:', error);
      res.status(500).json({ error: error.message || 'Erro ao buscar caixa' });
    }
  },

  // Abrir novo caixa
  async abrirCaixa(req: Request, res: Response) {
    try {
      const { valorInicial } = req.body;

      if (valorInicial === undefined || valorInicial < 0) {
        return res.status(400).json({ error: 'Valor inicial inválido' });
      }

      // Verificar se já existe caixa aberto
      const caixaAberto = await Caixa.findOne({ status: 'aberto' });
      if (caixaAberto) {
        return res.status(400).json({ 
          error: 'Já existe um caixa aberto. Feche-o antes de abrir um novo.',
          caixaAberto 
        });
      }

      // Gerar código do caixa
      const hoje = new Date();
      const ano = hoje.getFullYear();
      const mes = String(hoje.getMonth() + 1).padStart(2, '0');
      const dia = String(hoje.getDate()).padStart(2, '0');
      const dataFormatada = `${ano}${mes}${dia}`;

      // Buscar último caixa do dia
      const ultimoCaixa = await Caixa.findOne({
        codigoCaixa: new RegExp(`^CAIXA${dataFormatada}-`)
      }).sort({ codigoCaixa: -1 });

      let sequencial = 1;
      if (ultimoCaixa) {
        const match = ultimoCaixa.codigoCaixa.match(/-(\d{3})$/);
        if (match) {
          sequencial = parseInt(match[1]) + 1;
        }
      }

      const codigoCaixa = `CAIXA${dataFormatada}-${String(sequencial).padStart(3, '0')}`;

      // Criar novo caixa
      const novoCaixa = new Caixa({
        codigoCaixa,
        dataAbertura: hoje.toISOString(),
        status: 'aberto',
        valorInicial,
        entrada: 0,
        saida: 0,
        performance: 0,
        movimentos: []
      });

      await novoCaixa.save();
      res.status(201).json(novoCaixa);
    } catch (error: any) {
      console.error('Erro ao abrir caixa:', error);
      res.status(500).json({ error: error.message || 'Erro ao abrir caixa' });
    }
  },

  // Adicionar movimentação (entrada ou saída)
  async adicionarMovimento(req: Request, res: Response) {
    try {
      const { tipo, valor, observacao } = req.body;

      if (!tipo || !valor || valor <= 0) {
        return res.status(400).json({ error: 'Dados inválidos para movimentação' });
      }

      // Buscar caixa aberto
      const caixaAberto = await Caixa.findOne({ status: 'aberto' });
      if (!caixaAberto) {
        return res.status(400).json({ error: 'Não há caixa aberto' });
      }

      // Criar movimento
      const movimento = {
        tipo,
        valor: Number(valor),
        data: new Date().toISOString(),
        codigoVenda: null,
        formaPagamento: null,
        observacao: observacao || (tipo === 'entrada' ? 'Injeção de dinheiro' : 'Sangria')
      };

      // Adicionar movimento
      caixaAberto.movimentos.push(movimento);

      // Recalcular totais
      caixaAberto.entrada = caixaAberto.movimentos
        .filter((m: any) => m.tipo === 'entrada')
        .reduce((sum: number, m: any) => sum + m.valor, 0);

      caixaAberto.saida = caixaAberto.movimentos
        .filter((m: any) => m.tipo === 'saida')
        .reduce((sum: number, m: any) => sum + m.valor, 0);

      caixaAberto.performance = caixaAberto.entrada - caixaAberto.saida;

      await caixaAberto.save();
      res.json(caixaAberto);
    } catch (error: any) {
      console.error('Erro ao adicionar movimentação:', error);
      res.status(500).json({ error: error.message || 'Erro ao adicionar movimentação' });
    }
  },

  // Sincronizar todas as vendas
  async sincronizarVendas(req: Request, res: Response) {
    try {
      // Buscar caixa aberto
      const caixaAberto = await Caixa.findOne({ status: 'aberto' });
      if (!caixaAberto) {
        return res.status(400).json({ error: 'Não há caixa aberto' });
      }

      // Buscar TODAS as vendas desde a abertura do caixa
      const vendas = await Venda.find({
        data: { $gte: new Date(caixaAberto.dataAbertura) }
      });

      console.log(`📦 Total de vendas coletadas: ${vendas.length}`);

      // Verificar quais vendas já estão registradas
      const vendasRegistradas = new Set(
        caixaAberto.movimentos
          .filter((m: any) => m.codigoVenda)
          .map((m: any) => m.codigoVenda)
      );

      // Adicionar novas vendas
      let novasVendas = 0;
      for (const venda of vendas) {
        if (!vendasRegistradas.has(venda.codigoVenda)) {
          // Usar valorRecebido (que já desconta as taxas) em vez do total
          const valorEntrada = venda.valorRecebido || venda.total;
          
          caixaAberto.movimentos.push({
            tipo: 'entrada',
            valor: valorEntrada,
            data: venda.data.toISOString(),
            codigoVenda: venda.codigoVenda,
            formaPagamento: venda.formaPagamento,
            observacao: `Venda ${venda.codigoVenda} - ${venda.cliente.nome} (${venda.formaPagamento})`
          });
          novasVendas++;
        }
      }

      // Recalcular totais
      caixaAberto.entrada = caixaAberto.movimentos
        .filter((m: any) => m.tipo === 'entrada')
        .reduce((sum: number, m: any) => sum + m.valor, 0);

      caixaAberto.saida = caixaAberto.movimentos
        .filter((m: any) => m.tipo === 'saida')
        .reduce((sum: number, m: any) => sum + m.valor, 0);

      caixaAberto.performance = caixaAberto.entrada - caixaAberto.saida;

      await caixaAberto.save();
      res.json({ 
        message: `${novasVendas} vendas sincronizadas`,
        caixa: caixaAberto 
      });
    } catch (error: any) {
      console.error('Erro ao sincronizar vendas:', error);
      res.status(500).json({ error: error.message || 'Erro ao sincronizar vendas' });
    }
  },

  // Fechar caixa
  async fecharCaixa(req: Request, res: Response) {
    try {
      // Buscar caixa aberto
      const caixaAberto = await Caixa.findOne({ status: 'aberto' });
      if (!caixaAberto) {
        return res.status(400).json({ error: 'Não há caixa aberto para fechar' });
      }

      // Recalcular totais antes de fechar
      caixaAberto.entrada = caixaAberto.movimentos
        .filter((m: any) => m.tipo === 'entrada')
        .reduce((sum: number, m: any) => sum + m.valor, 0);

      caixaAberto.saida = caixaAberto.movimentos
        .filter((m: any) => m.tipo === 'saida')
        .reduce((sum: number, m: any) => sum + m.valor, 0);

      caixaAberto.performance = caixaAberto.entrada - caixaAberto.saida;

      // Fechar caixa
      caixaAberto.status = 'fechado';
      caixaAberto.dataFechamento = new Date().toISOString();

      await caixaAberto.save();
      res.json(caixaAberto);
    } catch (error: any) {
      console.error('Erro ao fechar caixa:', error);
      res.status(500).json({ error: error.message || 'Erro ao fechar caixa' });
    }
  },

  // Deletar caixa
  async delete(req: Request, res: Response) {
    try {
      const { codigo } = req.params;
      const caixa = await Caixa.findOneAndDelete({ codigoCaixa: codigo });

      if (!caixa) {
        return res.status(404).json({ error: 'Caixa não encontrado' });
      }

      res.json({ message: 'Caixa deletado com sucesso' });
    } catch (error: any) {
      console.error('Erro ao deletar caixa:', error);
      res.status(500).json({ error: error.message || 'Erro ao deletar caixa' });
    }
  }
};

export default caixaController;
