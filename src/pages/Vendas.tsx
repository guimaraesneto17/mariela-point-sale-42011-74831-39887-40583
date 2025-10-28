import { useState, useEffect } from "react";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { vendasAPI } from "@/lib/api";
import { toast } from "sonner";

const Vendas = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroData, setFiltroData] = useState("");
  const [vendas, setVendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVendas();
  }, []);

  const loadVendas = async () => {
    try {
      setLoading(true);
      const data = await vendasAPI.getAll();
      setVendas(data);
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
      toast.error('Erro ao carregar vendas');
    } finally {
      setLoading(false);
    }
  };

  const mockVendas = [
    {
      codigo: "VENDA001",
      data: "12/10/2025",
      cliente: { codigo: "C001", nome: "Ana Souza" },
      vendedor: { codigo: "V001", nome: "Maria Silva" },
      total: 149.90,
      formaPagamento: "Cartão de Crédito",
      status: "concluida",
      taxaMaquininha: 2.5,
      valorTaxa: 3.75,
      valorRecebido: 146.15,
      parcelas: 3,
      itens: [
        { nome: "Vestido Floral Curto", quantidade: 1, preco: 134.91 },
      ]
    },
    {
      codigo: "VENDA002",
      data: "13/10/2025",
      cliente: { codigo: "C002", nome: "Fernanda Ribeiro" },
      vendedor: { codigo: "V002", nome: "Julia Santos" },
      total: 289.80,
      formaPagamento: "Pix",
      status: "concluida",
      taxaMaquininha: 0,
      valorTaxa: 0,
      valorRecebido: 289.80,
      parcelas: 1,
      itens: [
        { nome: "Calça Jeans Skinny", quantidade: 1, preco: 169.90 },
        { nome: "Saia Plissada Midi", quantidade: 1, preco: 109.90 },
      ]
    },
  ];

  // Helper function para converter data de forma segura
  const getValidDateString = (dateValue: any): string => {
    if (!dateValue) return '';
    
    try {
      const date = new Date(dateValue);
      // Verifica se a data é válida
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Erro ao converter data:', dateValue, error);
      return '';
    }
  };

  // Helper para formatar data para exibição
  const formatDisplayDate = (dateValue: any): string => {
    if (!dateValue) return '—';
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return '—';
      return new Intl.DateTimeFormat('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      }).format(date);
    } catch (error) {
      return '—';
    }
  };

  // Helper para formatar valores monetários
  const formatCurrency = (value: any): string => {
    const numValue = Number(value ?? 0);
    return isNaN(numValue) ? 'R$ 0,00' : `R$ ${numValue.toFixed(2).replace('.', ',')}`;
  };

  const displayVendas = vendas.length > 0 ? vendas : mockVendas;
  const filteredVendas = displayVendas.filter((venda: any) => {
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-2">Vendas</h1>
        <p className="text-muted-foreground">
          Histórico e gerenciamento de vendas
        </p>
      </div>

      <Card className="p-6 shadow-card">
        <div className="grid grid-cols-2 gap-4">
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
          <Card key={venda.codigo || venda.codigoVenda || venda._id} className="p-6 bg-gradient-card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold">{venda.codigo || venda.codigoVenda || venda._id}</h3>
                <p className="text-muted-foreground text-sm">{formatDisplayDate(venda.data)}</p>
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
                <span className="font-medium text-primary">{venda.vendedor?.nome} ({venda.vendedor?.codigo || venda.vendedor?.id || '—'})</span>
              </div>
            </div>

            <div className="border-t pt-4 space-y-2">
              <p className="font-medium text-sm mb-2">Itens:</p>
              {Array.isArray(venda.itens) && venda.itens.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between text-sm bg-background/50 p-2 rounded">
                  <span>{item.nome || item.nomeProduto} (x{item.quantidade || 1})</span>
                  <span className="font-medium">{formatCurrency(item.preco || item.precoUnitario || item.precoFinalUnitario || 0)}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t space-y-2">
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
