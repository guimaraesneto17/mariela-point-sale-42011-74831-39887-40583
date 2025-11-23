import { useState, useEffect, useCallback } from 'react';
import { vendasAPI, produtosAPI, clientesAPI, vendedoresAPI, estoqueAPI, caixaAPI, contasPagarAPI, contasReceberAPI } from '@/lib/api';
import { toast } from 'sonner';

export const useReportsData = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    vendas: [],
    produtos: [],
    estoque: [],
    clientes: [],
    vendedores: [],
    caixas: [],
    contasPagar: [],
    contasReceber: []
  });

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [
        vendasRes,
        produtosRes,
        estoqueRes,
        clientesRes,
        vendedoresRes,
        caixasRes,
        contasPagarRes,
        contasReceberRes
      ] = await Promise.all([
        vendasAPI.getAll().catch(() => ({ vendas: [] })),
        produtosAPI.getAll().catch(() => ({ produtos: [] })),
        estoqueAPI.getAll().catch(() => ({ itens: [] })),
        clientesAPI.getAll().catch(() => ({ clientes: [] })),
        vendedoresAPI.getAll().catch(() => ({ vendedores: [] })),
        caixaAPI.getAll().catch(() => ({ caixas: [] })),
        contasPagarAPI.getAll().catch(() => ({ contas: [] })),
        contasReceberAPI.getAll().catch(() => ({ contas: [] }))
      ]);

      setData({
        vendas: Array.isArray(vendasRes) ? vendasRes : (vendasRes.vendas || []),
        produtos: Array.isArray(produtosRes) ? produtosRes : (produtosRes.produtos || []),
        estoque: Array.isArray(estoqueRes) ? estoqueRes : (estoqueRes.itens || estoqueRes.estoque || []),
        clientes: Array.isArray(clientesRes) ? clientesRes : (clientesRes.clientes || []),
        vendedores: Array.isArray(vendedoresRes) ? vendedoresRes : (vendedoresRes.vendedores || []),
        caixas: Array.isArray(caixasRes) ? caixasRes : (caixasRes.caixas || []),
        contasPagar: Array.isArray(contasPagarRes) ? contasPagarRes : (contasPagarRes.contas || []),
        contasReceber: Array.isArray(contasReceberRes) ? contasReceberRes : (contasReceberRes.contas || [])
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados dos relatórios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  return { data, loading, refetch: fetchAllData };
};
