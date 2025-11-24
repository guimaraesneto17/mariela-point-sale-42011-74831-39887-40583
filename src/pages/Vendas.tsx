import { useState } from "react";
import { Search, Tag, TrendingDown, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlobalLoading } from "@/components/GlobalLoading";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useVendas } from "@/hooks/useQueryCache";
import { caixaAPI } from "@/lib/api";
import { toast } from "sonner";

const Vendas = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroData, setFiltroData] = useState("");
  const [sincronizando, setSincronizando] = useState(false);
  
  const { data: vendas = [], isLoading } = useVendas();

  const handleSincronizarVendas = async () => {
    try {
      setSincronizando(true);
      const response = await caixaAPI.sincronizarVendas();
      toast.success(response.message || "Vendas sincronizadas com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao sincronizar vendas");
    } finally {
      setSincronizando(false);
    }
  };

  // Helper function para converter data de forma segura
  const getValidDateString = (dateValue: any): string => {
    if (!dateValue) return '';
    
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Erro ao converter data:', dateValue, error);
      return '';
    }
  };

  const filteredVendas = vendas.filter((venda: any) => {
    // Busca inteligente: procura em vendedor, código vendedor, cliente, código cliente, código venda
    const codigoVenda = venda.codigoVenda || venda.codigo || '';
    const clienteNome = venda.cliente?.nome || '';
    const clienteCodigo = venda.cliente?.codigoCliente || venda.cliente?.codigo || '';
    const vendedorNome = venda.vendedor?.nome || '';
    const vendedorCodigo = venda.vendedor?.id || venda.vendedor?.codigo || '';
    
    const matchSearch = !searchTerm || 
      codigoVenda.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clienteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clienteCodigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendedorNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendedorCodigo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const vendaData = getValidDateString(venda.data);
    const matchData = !filtroData || vendaData === filtroData;
    return matchSearch && matchData;
  });

  if (isLoading) {
    return <GlobalLoading message="Carregando vendas..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="text-center flex-1">
          <h1 className="text-4xl font-bold text-foreground mb-2">Vendas</h1>
          <p className="text-muted-foreground">
            Histórico e gerenciamento de vendas
          </p>
        </div>
        <Button
          onClick={handleSincronizarVendas}
          disabled={sincronizando}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${sincronizando ? 'animate-spin' : ''}`} />
          {sincronizando ? 'Sincronizando...' : 'Sincronizar Vendas'}
        </Button>
      </div>

      <Card className="p-4 md:p-6 shadow-card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              placeholder="Buscar por vendedor, código vendedor, cliente, código cliente ou código da venda..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div>
            <Input
              type="date"
              value={filtroData}
              onChange={(e) => setFiltroData(e.target.value)}
              placeholder="Filtrar por data"
            />
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {filteredVendas.map((venda) => (
          <Card key={venda.codigo || venda.codigoVenda || venda._id} className="p-4 md:p-6 bg-gradient-card">
              <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold">{venda.codigo || venda.codigoVenda || venda._id}</h3>
                <p className="text-muted-foreground text-sm">{formatDate(venda.data)}</p>
              </div>
              <div className="flex gap-2">
                <Badge className="bg-primary">{venda.formaPagamento || '—'}</Badge>
                {venda.formaPagamento === "Cartão de Crédito" && Number(venda.parcelas || 1) > 1 && (
                  <Badge variant="outline">{venda.parcelas}x de {formatCurrency((venda.total || 0) / (venda.parcelas || 1))}</Badge>
                )}
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Cliente:</span>
                <span className="font-medium">{venda.cliente?.nome} ({venda.cliente?.codigoCliente || venda.cliente?.codigo || '—'})</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Vendedor:</span>
                <span className="font-medium text-primary">{venda.vendedor?.nome} ({venda.vendedor?.codigoVendedor || venda.vendedor?.codigo || venda.vendedor?.id || '—'})</span>
              </div>
            </div>

            <div className="border-t pt-4 space-y-2">
              <p className="font-medium text-sm mb-2">Itens:</p>
              {Array.isArray(venda.itens) && venda.itens.map((item: any, idx: number) => {
                // Determinar se tem promoção ou desconto
                const precoFinal = item.precoFinalUnitario || item.preco || item.precoUnitario || 0;
                const precoOriginal = item.precoUnitario || item.preco || 0;
                const temPromocao = item.emPromocao || false;
                const tipoDesconto = item.tipoDesconto || "porcentagem";
                const descontoAplicado = item.descontoAplicado || 0;
                const descontoValor = item.descontoValor || 0;
                
                // Se tem desconto aplicado (porcentagem ou valor), o preço original é diferente do final
                const temDesconto = (descontoAplicado > 0 || descontoValor > 0) && !temPromocao;
                const mostrarPrecoOriginal = temPromocao || temDesconto;
                
                // Calcular economia em promoção
                const economia = temPromocao ? precoOriginal - precoFinal : 0;
                const percentualEconomia = temPromocao && precoOriginal > 0 ? ((economia / precoOriginal) * 100) : 0;
                
                return (
                  <div 
                    key={idx} 
                    className={`flex flex-col gap-2 p-3 rounded-lg transition-all ${
                      temPromocao 
                        ? 'bg-gradient-to-r from-red-50 via-orange-50 to-red-50 dark:from-red-950/30 dark:via-orange-950/20 dark:to-red-950/30 border-2 border-red-300 dark:border-red-700 shadow-lg shadow-red-100 dark:shadow-red-950/30' 
                        : temDesconto
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800'
                        : 'bg-background/50 border border-border/50'
                    }`}
                  >
                    {/* Linha superior: Nome e badges */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="font-medium">{item.nome || item.nomeProduto}</span>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">x{item.quantidade || 1}</span>
                        {/* Exibir cor e tamanho */}
                        {(item.cor || item.tamanho) && (
                          <div className="flex items-center gap-1">
                            {item.cor && (
                              <Badge variant="outline" className="text-xs">
                                {item.cor}
                              </Badge>
                            )}
                            {item.tamanho && (
                              <Badge variant="outline" className="text-xs">
                                {item.tamanho}
                              </Badge>
                            )}
                          </div>
                        )}
                        {temPromocao && (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md">
                            <Tag className="h-3 w-3" />
                            <span className="text-xs font-bold">PROMOÇÃO</span>
                          </div>
                        )}
                        {temDesconto && tipoDesconto === "porcentagem" && (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md">
                            <TrendingDown className="h-3 w-3" />
                            <span className="text-xs font-bold">DESCONTO {descontoAplicado.toFixed(0)}%</span>
                          </div>
                        )}
                        {temDesconto && tipoDesconto === "valor" && (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md">
                            <TrendingDown className="h-3 w-3" />
                            <span className="text-xs font-bold">DESCONTO R$ {descontoValor.toFixed(2)}</span>
                          </div>
                        )}
                        {item.novidade && (
                          <Badge variant="default" className="text-xs bg-gradient-to-r from-purple-600 to-pink-600 border-0 shadow-md text-white">
                            ✨ Novidade
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Linha inferior: Preços */}
                    <div className="flex items-center justify-between">
                      {temPromocao ? (
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-red-600 dark:text-red-400 tracking-wide">
                              Preço Promocional
                            </span>
                            <div className="flex items-baseline gap-2">
                              <span className="text-xs text-muted-foreground line-through">
                                {formatCurrency(precoOriginal)}
                              </span>
                              <span className="font-bold text-lg text-red-600 dark:text-red-400">
                                {formatCurrency(precoFinal)}
                              </span>
                            </div>
                          </div>
                          {economia > 0 && (
                            <div className="flex items-center gap-1 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-md">
                              <TrendingDown className="h-3 w-3 text-red-600 dark:text-red-400" />
                              <span className="text-xs font-bold text-red-600 dark:text-red-400">
                                Economia: {formatCurrency(economia * (item.quantidade || 1))}
                                {percentualEconomia > 0 && ` (${percentualEconomia.toFixed(0)}%)`}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : temDesconto ? (
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-green-600 dark:text-green-400 tracking-wide">
                              Com Desconto
                            </span>
                            <div className="flex items-baseline gap-2">
                              <span className="text-xs text-muted-foreground line-through">
                                {formatCurrency(precoOriginal)}
                              </span>
                              <span className="font-bold text-lg text-green-600 dark:text-green-400">
                                {formatCurrency(precoFinal)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">
                            Preço de Venda
                          </span>
                          <span className="font-bold text-lg">
                            {formatCurrency(precoFinal)}
                          </span>
                        </div>
                      )}
                      
                      {/* Subtotal do item */}
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">
                          Subtotal
                        </span>
                        <span className={`font-bold text-lg ${
                          temPromocao ? 'text-red-600 dark:text-red-400' : temDesconto ? 'text-green-600 dark:text-green-400' : ''
                        }`}>
                          {formatCurrency(precoFinal * (item.quantidade || 1))}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t space-y-2">
              {Number(venda.totalDesconto || 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-orange-500" />
                    Desconto Total Aplicado {venda.tipoDesconto === "valor" ? "(Valor)" : "(Porcentagem)"}:
                  </span>
                  <span className="font-medium text-orange-600 dark:text-orange-400">
                    - {formatCurrency(venda.totalDesconto || 0)}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">Total:</span>
                <span className="text-2xl font-bold text-primary">{formatCurrency(venda.total || 0)}</span>
              </div>
              
              {Number(venda.taxaMaquininha || 0) > 0 && (
                <>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Taxa maquininha ({Number(venda.taxaMaquininha || 0).toFixed(2)}%):</span>
                    <span>- {formatCurrency(venda.valorTaxa || 0)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-accent pt-2 border-t">
                    <span>Recebido pelo Lojista:</span>
                    <span>{formatCurrency(venda.valorRecebido ?? (Number(venda.total || 0) - Number(venda.valorTaxa || 0)))}</span>
                  </div>
                </>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Vendas;
