import { useMemo } from 'react';
import {
  useClientes,
  useVendas,
  useProdutos,
  useEstoque,
  useVendedores,
  useCaixaAberto,
  useContasPagar,
  useContasReceber,
} from './useQueryCache';
import { safeDate } from '@/lib/utils';
import { addDays } from 'date-fns';

export function useDashboardData(dataInicio?: Date, dataFim?: Date) {
  const { data: clientesData = [], isLoading: loadingClientes } = useClientes();
  const { data: vendasData = [], isLoading: loadingVendas } = useVendas();
  const { data: produtosData = [], isLoading: loadingProdutos } = useProdutos();
  const { data: estoqueData = [], isLoading: loadingEstoque } = useEstoque();
  const { data: vendedoresData = [], isLoading: loadingVendedores } = useVendedores();
  const { data: caixaAberto, isLoading: loadingCaixa } = useCaixaAberto();
  const { data: contasPagarData = [], isLoading: loadingContasPagar } = useContasPagar();
  const { data: contasReceberData = [], isLoading: loadingContasReceber } = useContasReceber();

  const isLoading = 
    loadingClientes || 
    loadingVendas || 
    loadingProdutos || 
    loadingEstoque || 
    loadingVendedores || 
    loadingCaixa ||
    loadingContasPagar ||
    loadingContasReceber;

  // Filter vendas by date range
  const vendasFiltradas = useMemo(() => {
    if (!dataInicio && !dataFim) return vendasData;
    
    return vendasData.filter((v: any) => {
      const vendaData = safeDate(v.data || v.dataVenda);
      if (!vendaData) return false;
      
      if (dataInicio && dataFim) {
        const inicio = new Date(dataInicio);
        const fim = new Date(dataFim);
        inicio.setHours(0, 0, 0, 0);
        fim.setHours(23, 59, 59, 999);
        return vendaData >= inicio && vendaData <= fim;
      } else if (dataInicio) {
        const inicio = new Date(dataInicio);
        inicio.setHours(0, 0, 0, 0);
        return vendaData >= inicio;
      } else if (dataFim) {
        const fim = new Date(dataFim);
        fim.setHours(23, 59, 59, 999);
        return vendaData <= fim;
      }
      return true;
    });
  }, [vendasData, dataInicio, dataFim]);

  // Calculate stats
  const stats = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const vendasHoje = vendasFiltradas.filter((v: any) => {
      const vendaData = safeDate(v.data || v.dataVenda);
      if (!vendaData) return false;
      vendaData.setHours(0, 0, 0, 0);
      return vendaData.getTime() === hoje.getTime();
    });

    const faturamentoDiario = vendasHoje.reduce((acc: number, v: any) => acc + (v.total || 0), 0);
    const totalClientes = clientesData.length;
    const produtosEstoque = estoqueData.reduce((acc: number, item: any) => acc + (item.quantidadeTotal || 0), 0);
    
    // Calcular Total Geral (todas as variantes)
    const totalGeralProdutos = estoqueData.reduce((acc: number, item: any) => {
      if (item.variantes && Array.isArray(item.variantes)) {
        return acc + item.variantes.reduce((sum: number, v: any) => sum + (v.quantidade || 0), 0);
      }
      return acc + (item.quantidadeTotal || 0);
    }, 0);
    
    // Calcular valor total do estoque (considerando preço promocional quando disponível)
    let valorEstoqueCusto = 0;
    let valorEstoqueVenda = 0;
    
    estoqueData.forEach((item: any) => {
      const quantidade = item.quantidadeTotal || 0;
      const precoCusto = item.precoCusto || 0;
      // Usar preço promocional se disponível e menor que o preço de venda
      const precoVenda = (item.precoPromocional && item.precoPromocional < item.precoVenda) 
        ? item.precoPromocional 
        : item.precoVenda || 0;
      
      valorEstoqueCusto += quantidade * precoCusto;
      valorEstoqueVenda += quantidade * precoVenda;
    });
    
    const margemLucro = valorEstoqueVenda > 0 ? ((valorEstoqueVenda - valorEstoqueCusto) / valorEstoqueVenda) * 100 : 0;
    
    // Calcular contas a vencer nos próximos 7 dias
    const dataHoje = new Date();
    dataHoje.setHours(0, 0, 0, 0);
    const daquiA7Dias = addDays(dataHoje, 7);
    
    const contasAVencer = contasPagarData.filter((conta: any) => {
      const statusLower = (conta.status || '').toLowerCase();
      if (statusLower === 'pago' || statusLower === 'paga') return false;
      const dataVencimento = new Date(conta.dataVencimento);
      dataVencimento.setHours(0, 0, 0, 0);
      return dataVencimento >= dataHoje && dataVencimento <= daquiA7Dias;
    });
    
    const contasAReceber = contasReceberData.filter((conta: any) => {
      const statusLower = (conta.status || '').toLowerCase();
      if (statusLower === 'recebido' || statusLower === 'recebida') return false;
      const dataVencimento = new Date(conta.dataVencimento);
      dataVencimento.setHours(0, 0, 0, 0);
      return dataVencimento >= dataHoje && dataVencimento <= daquiA7Dias;
    });

    const valorContasAVencer = contasAVencer.reduce((acc: number, c: any) => acc + (c.valor || 0), 0);
    const valorContasAReceber = contasAReceber.reduce((acc: number, c: any) => acc + (c.valor || 0), 0);

    return {
      vendasHoje: vendasHoje.length,
      faturamentoDiario,
      totalClientes,
      produtosEstoque,
      totalGeralProdutos, // Total de todas as variantes
      ticketMedio: vendasFiltradas.length > 0 
        ? vendasFiltradas.reduce((acc: number, v: any) => acc + (v.total || 0), 0) / vendasFiltradas.length 
        : 0,
      margemLucro,
      valorEstoqueCusto,
      valorEstoqueVenda,
      contasAVencer7Dias: valorContasAVencer,
      contasAReceber7Dias: valorContasAReceber,
    };
  }, [vendasFiltradas, clientesData, estoqueData, contasPagarData, contasReceberData]);

  return {
    clientes: clientesData,
    vendas: vendasFiltradas,
    produtos: produtosData,
    estoque: estoqueData,
    vendedores: vendedoresData,
    caixaAberto,
    contasPagar: contasPagarData,
    contasReceber: contasReceberData,
    stats,
    isLoading,
  };
}
