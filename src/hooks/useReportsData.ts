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
      
      // Helper to fetch all pages from paginated endpoints
      const fetchAllPages = async (fetchFn: (page: number, limit: number) => Promise<any>, limit: number = 100) => {
        let allData: any[] = [];
        let page = 1;
        let hasMore = true;
        
        while (hasMore) {
          const response = await fetchFn(page, limit);
          const data = response?.data || response || [];
          const pagination = response?.pagination;
          
          if (Array.isArray(data)) {
            allData = [...allData, ...data];
          }
          
          if (pagination) {
            hasMore = pagination.page < pagination.pages;
          } else {
            hasMore = Array.isArray(data) && data.length === limit;
          }
          
          page++;
          
          // Safety limit to prevent infinite loops
          if (page > 20) break;
        }
        
        return allData;
      };

      const [
        vendasRes,
        produtosData,
        estoqueData,
        clientesRes,
        vendedoresRes,
        caixasRes,
        contasPagarRes,
        contasReceberRes
      ] = await Promise.all([
        vendasAPI.getAll().catch(() => []),
        fetchAllPages(produtosAPI.getAll).catch(() => []),
        fetchAllPages(estoqueAPI.getAll).catch(() => []),
        clientesAPI.getAll().catch(() => []),
        vendedoresAPI.getAll().catch(() => []),
        caixaAPI.getAll().catch(() => []),
        contasPagarAPI.getAll().catch(() => []),
        contasReceberAPI.getAll().catch(() => [])
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
        produtos: Array.isArray(produtosData) ? produtosData : normalizeResponse(produtosData, ['produtos', 'data']),
        estoque: Array.isArray(estoqueData) ? estoqueData : normalizeResponse(estoqueData, ['estoque', 'itens', 'data']),
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
