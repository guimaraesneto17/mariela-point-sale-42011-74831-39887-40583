import { useState } from "react";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const Vendas = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroData, setFiltroData] = useState("");

  const [vendas] = useState([
    {
      codigo: "VENDA001",
      data: "12/10/2025",
      cliente: { codigo: "C001", nome: "Ana Souza" },
      vendedor: { codigo: "V001", nome: "Maria Silva" },
      total: 149.90,
      formaPagamento: "Cartão de Crédito",
      status: "concluida",
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
      itens: [
        { nome: "Calça Jeans Skinny", quantidade: 1, preco: 169.90 },
        { nome: "Saia Plissada Midi", quantidade: 1, preco: 109.90 },
      ]
    },
  ]);

  const filteredVendas = vendas.filter(venda => {
    // Busca inteligente: procura em vendedor, código vendedor, cliente, código cliente, código venda
    const matchSearch = !searchTerm || 
      venda.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venda.cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venda.cliente.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venda.vendedor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venda.vendedor.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchData = !filtroData || venda.data === filtroData;
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
          <Card key={venda.codigo} className="p-6 bg-gradient-card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold">{venda.codigo}</h3>
                <p className="text-muted-foreground text-sm">{venda.data}</p>
              </div>
              <Badge className="bg-primary">{venda.formaPagamento}</Badge>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Cliente:</span>
                <span className="font-medium">{venda.cliente.nome} ({venda.cliente.codigo})</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Vendedor:</span>
                <span className="font-medium text-primary">{venda.vendedor.nome} ({venda.vendedor.codigo})</span>
              </div>
            </div>

            <div className="border-t pt-4 space-y-2">
              <p className="font-medium text-sm mb-2">Itens:</p>
              {venda.itens.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm bg-background/50 p-2 rounded">
                  <span>{item.nome} (x{item.quantidade})</span>
                  <span className="font-medium">R$ {item.preco.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <span className="text-lg font-medium">Total:</span>
              <span className="text-2xl font-bold text-primary">R$ {venda.total.toFixed(2)}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Vendas;
