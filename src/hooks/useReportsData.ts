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

      // Normalize paginated responses - APIs return { data: [], pagination: {} } format
      const normalizeResponse = (res: any, fallbackKeys: string[] = []): any[] => {
        if (Array.isArray(res)) return res;
        if (res?.data && Array.isArray(res.data)) return res.data;
        for (const key of fallbackKeys) {
          if (res?.[key] && Array.isArray(res[key])) return res[key];
        }
        return [];
      };

      setData({
        vendas: normalizeResponse(vendasRes, ['vendas']),
        produtos: normalizeResponse(produtosRes, ['produtos', 'data']),
        estoque: normalizeResponse(estoqueRes, ['estoque', 'itens', 'data']),
        clientes: normalizeResponse(clientesRes, ['clientes']),
        vendedores: normalizeResponse(vendedoresRes, ['vendedores']),
        caixas: normalizeResponse(caixasRes, ['caixas']),
        contasPagar: normalizeResponse(contasPagarRes, ['contas']),
        contasReceber: normalizeResponse(contasReceberRes, ['contas'])
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
