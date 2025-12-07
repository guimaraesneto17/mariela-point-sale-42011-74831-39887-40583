import { useState, useMemo } from "react";
import { Search, ShoppingCart, Eye, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, safeDate } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MinhasVendasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendas: any[];
  codigoVendedor: string;
}

export function MinhasVendasDialog({ 
  open, 
  onOpenChange, 
  vendas,
  codigoVendedor 
}: MinhasVendasDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVenda, setSelectedVenda] = useState<any>(null);

  // Filtrar vendas do vendedor atual
  const minhasVendas = useMemo(() => {
    if (!codigoVendedor) return [];
    return vendas.filter((v: any) => 
      v.vendedor?.codigoVendedor === codigoVendedor
    ).sort((a: any, b: any) => {
      const dataA = safeDate(a.data || a.dataVenda);
      const dataB = safeDate(b.data || b.dataVenda);
      return (dataB?.getTime() || 0) - (dataA?.getTime() || 0);
    });
  }, [vendas, codigoVendedor]);

  // Filtrar por busca
  const vendasFiltradas = useMemo(() => {
    if (!searchTerm) return minhasVendas;
    const search = searchTerm.toLowerCase();
    return minhasVendas.filter((venda: any) =>
      venda.codigoVenda?.toLowerCase().includes(search) ||
      venda.cliente?.nome?.toLowerCase().includes(search)
    );
  }, [minhasVendas, searchTerm]);

  // Estatísticas
  const stats = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();

    const vendasHoje = minhasVendas.filter((v: any) => {
      const vendaData = safeDate(v.data || v.dataVenda);
      if (!vendaData) return false;
      vendaData.setHours(0, 0, 0, 0);
      return vendaData.getTime() === hoje.getTime();
    });

    const vendasMes = minhasVendas.filter((v: any) => {
      const vendaData = safeDate(v.data || v.dataVenda);
      return vendaData && vendaData.getMonth() === mesAtual && vendaData.getFullYear() === anoAtual;
    });

    return {
      totalVendasHoje: vendasHoje.length,
      faturamentoHoje: vendasHoje.reduce((acc: number, v: any) => acc + (v.total || 0), 0),
      totalVendasMes: vendasMes.length,
      faturamentoMes: vendasMes.reduce((acc: number, v: any) => acc + (v.total || 0), 0),
    };
  }, [minhasVendas]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Minhas Vendas
            </DialogTitle>
            <DialogDescription>
              Visualize todas as suas vendas realizadas
            </DialogDescription>
          </DialogHeader>

          {/* Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <p className="text-xs text-muted-foreground">Vendas Hoje</p>
              <p className="text-lg font-bold">{stats.totalVendasHoje}</p>
              <p className="text-sm text-green-600">{formatCurrency(stats.faturamentoHoje)}</p>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg">
              <p className="text-xs text-muted-foreground">Vendas do Mês</p>
              <p className="text-lg font-bold">{stats.totalVendasMes}</p>
              <p className="text-sm text-green-600">{formatCurrency(stats.faturamentoMes)}</p>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-lg col-span-2">
              <p className="text-xs text-muted-foreground">Total de Vendas</p>
              <p className="text-lg font-bold">{minhasVendas.length} vendas</p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por código ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <ScrollArea className="h-[50vh]">
            {vendasFiltradas.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma venda encontrada
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendasFiltradas.map((venda: any) => (
                    <TableRow key={venda._id}>
                      <TableCell className="font-medium">{venda.codigoVenda}</TableCell>
                      <TableCell>
                        {format(safeDate(venda.data || venda.dataVenda) || new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>{venda.cliente?.nome || '-'}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatCurrency(venda.total)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{venda.formaPagamento}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedVenda(venda)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Dialog de detalhes da venda */}
      <Dialog open={!!selectedVenda} onOpenChange={() => setSelectedVenda(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Detalhes da Venda {selectedVenda?.codigoVenda}
            </DialogTitle>
          </DialogHeader>
          
          {selectedVenda && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Data</p>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(safeDate(selectedVenda.data || selectedVenda.dataVenda) || new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Cliente</p>
                  <p className="font-medium">{selectedVenda.cliente?.nome || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pagamento</p>
                  <Badge variant="secondary">{selectedVenda.formaPagamento}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Parcelas</p>
                  <p className="font-medium">{selectedVenda.parcelas || 1}x</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="font-medium mb-2">Itens da Venda</p>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {selectedVenda.itens?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <div>
                        <p className="font-medium">{item.nomeProduto}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.cor} • Tam: {item.tamanho} • Qtd: {item.quantidade}
                        </p>
                      </div>
                      <p className="font-medium">{formatCurrency(item.subtotal)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                {selectedVenda.totalDesconto > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Desconto:</span>
                    <span className="text-red-500">-{formatCurrency(selectedVenda.totalDesconto)}</span>
                  </div>
                )}
                {selectedVenda.taxaMaquininha > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Taxa Maquininha ({selectedVenda.taxaMaquininha}%):</span>
                    <span className="text-muted-foreground">-{formatCurrency(selectedVenda.valorTaxa)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold">
                  <span>Total:</span>
                  <span className="text-primary">{formatCurrency(selectedVenda.total)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
