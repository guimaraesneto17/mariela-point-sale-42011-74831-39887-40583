import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Plus, Trash2, ShoppingCart, Edit2, User, UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { SelectProductDialog } from "@/components/SelectProductDialog";
import { SelectClientDialog } from "@/components/SelectClientDialog";
import { SelectVendedorDialog } from "@/components/SelectVendedorDialog";

interface ItemVenda {
  codigoProduto: string;
  nomeProduto: string;
  quantidade: number;
  precoUnitario: number;
  descontoAplicado: number;
  subtotal: number;
}

const NovaVenda = () => {
  const navigate = useNavigate();
  
  // Dialogs
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [showVendedorDialog, setShowVendedorDialog] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  
  // Estados
  const [clienteSelecionado, setClienteSelecionado] = useState<{ codigo: string; nome: string } | null>(null);
  const [vendedorSelecionado, setVendedorSelecionado] = useState<{ codigo: string; nome: string } | null>(null);
  const [formaPagamento, setFormaPagamento] = useState("");
  const [tipoDesconto, setTipoDesconto] = useState<"porcentagem" | "valor">("porcentagem");
  const [descontoTotal, setDescontoTotal] = useState(0);
  const [itensVenda, setItensVenda] = useState<ItemVenda[]>([]);
  const [taxaMaquininha, setTaxaMaquininha] = useState(0);
  const [parcelas, setParcelas] = useState(1);
  
  // Estados para adicionar/editar produto
  const [produtoSelecionado, setProdutoSelecionado] = useState<any>(null);
  const [quantidadeProduto, setQuantidadeProduto] = useState(1);
  const [descontoProduto, setDescontoProduto] = useState(0);
  const [itemEmEdicao, setItemEmEdicao] = useState<number | null>(null);

  // Mock data - substituir por dados da API
  const clientes = [
    { codigo: "C001", nome: "Ana Souza" },
    { codigo: "C002", nome: "Fernanda Ribeiro" },
    { codigo: "C003", nome: "Maria Silva" },
  ];

  const vendedores = [
    { codigo: "V001", nome: "Carla Santos" },
    { codigo: "V002", nome: "Juliana Lima" },
  ];

  const produtos = [
    { codigo: "P101", nome: "Vestido Floral Curto", preco: 149.90, categoria: "Vestido" },
    { codigo: "P102", nome: "Blusa Manga Longa", preco: 89.90, categoria: "Blusa" },
    { codigo: "P103", nome: "Calça Jeans Skinny", preco: 199.90, categoria: "Calça" },
  ];

  // Calcular subtotal dos itens
  const subtotalItens = itensVenda.reduce((acc, item) => acc + item.subtotal, 0);
  
  // Calcular desconto total em reais
  const valorDescontoTotal = tipoDesconto === "porcentagem" 
    ? (subtotalItens * descontoTotal) / 100 
    : descontoTotal;
  
  // Total final
  const totalFinal = Math.max(0, subtotalItens - valorDescontoTotal);
  
  // Calcular taxa da maquininha e valor recebido
  const valorTaxaMaquininha = (totalFinal * taxaMaquininha) / 100;
  const valorRecebidoLojista = totalFinal - valorTaxaMaquininha;

  const adicionarOuEditarProduto = () => {
    if (!produtoSelecionado || quantidadeProduto <= 0) {
      toast.error("Selecione um produto e quantidade válida!");
      return;
    }

    const precoComDesconto = produtoSelecionado.preco * (1 - descontoProduto / 100);
    const subtotal = precoComDesconto * quantidadeProduto;

    const novoItem: ItemVenda = {
      codigoProduto: produtoSelecionado.codigo,
      nomeProduto: produtoSelecionado.nome,
      quantidade: quantidadeProduto,
      precoUnitario: produtoSelecionado.preco,
      descontoAplicado: descontoProduto,
      subtotal: subtotal
    };

    if (itemEmEdicao !== null) {
      const novosItens = [...itensVenda];
      novosItens[itemEmEdicao] = novoItem;
      setItensVenda(novosItens);
      setItemEmEdicao(null);
      toast.success("Produto atualizado!");
    } else {
      setItensVenda([...itensVenda, novoItem]);
      toast.success("Produto adicionado!");
    }

    // Reset form
    setProdutoSelecionado(null);
    setQuantidadeProduto(1);
    setDescontoProduto(0);
  };

  const editarProduto = (index: number) => {
    const item = itensVenda[index];
    const produto = produtos.find(p => p.codigo === item.codigoProduto);
    setProdutoSelecionado(produto);
    setQuantidadeProduto(item.quantidade);
    setDescontoProduto(item.descontoAplicado);
    setItemEmEdicao(index);
  };

  const cancelarEdicao = () => {
    setProdutoSelecionado(null);
    setQuantidadeProduto(1);
    setDescontoProduto(0);
    setItemEmEdicao(null);
  };

  const removerProduto = (index: number) => {
    setItensVenda(itensVenda.filter((_, i) => i !== index));
    if (itemEmEdicao === index) {
      cancelarEdicao();
    }
    toast.info("Produto removido");
  };

  const handleFinalizarVenda = async () => {
    if (!clienteSelecionado) {
      toast.error("Selecione um cliente!");
      return;
    }
    if (!vendedorSelecionado) {
      toast.error("Selecione um vendedor!");
      return;
    }
    if (itensVenda.length === 0) {
      toast.error("Adicione pelo menos um produto!");
      return;
    }
    if (!formaPagamento) {
      toast.error("Selecione a forma de pagamento!");
      return;
    }

    toast.success("Venda registrada com sucesso!");
    navigate("/vendas");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-2">Nova Venda</h1>
        <p className="text-muted-foreground">Registrar uma nova venda</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda - Cliente e Vendedor */}
        <div className="space-y-6">
          {/* Seleção de Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cliente *</CardTitle>
            </CardHeader>
            <CardContent>
              {clienteSelecionado ? (
                <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium">{clienteSelecionado.nome}</p>
                      <p className="text-sm text-muted-foreground">{clienteSelecionado.codigo}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setClienteSelecionado(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => setShowClientDialog(true)}
                >
                  <User className="h-4 w-4 mr-2" />
                  Selecionar Cliente
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Seleção de Vendedor */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Vendedor *</CardTitle>
            </CardHeader>
            <CardContent>
              {vendedorSelecionado ? (
                <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium">{vendedorSelecionado.nome}</p>
                      <p className="text-sm text-muted-foreground">{vendedorSelecionado.codigo}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setVendedorSelecionado(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => setShowVendedorDialog(true)}
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Selecionar Vendedor
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Forma de Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Forma de Pagamento *</CardTitle>
            </CardHeader>
            <CardContent>
              <Select 
                value={formaPagamento} 
                onValueChange={(value) => {
                  setFormaPagamento(value);
                  // Zerar taxa e parcelas se não for cartão
                  if (value !== "Cartão de Crédito" && value !== "Cartão de Débito") {
                    setTaxaMaquininha(0);
                  }
                  // Zerar parcelas se não for cartão de crédito
                  if (value !== "Cartão de Crédito") {
                    setParcelas(1);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                  <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                  <SelectItem value="Pix">Pix</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Central e Direita - Produtos */}
        <div className="lg:col-span-2 space-y-6">
          {/* Adicionar/Editar Produto */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {itemEmEdicao !== null ? <Edit2 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                {itemEmEdicao !== null ? "Editar Produto" : "Adicionar Produtos"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Seleção de Produto */}
                <div>
                  <Label>Produto *</Label>
                  {produtoSelecionado ? (
                    <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg mt-2">
                      <div>
                        <p className="font-medium">{produtoSelecionado.nome}</p>
                        <p className="text-sm text-muted-foreground">{produtoSelecionado.codigo}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setProdutoSelecionado(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="w-full mt-2" 
                      onClick={() => setShowProductDialog(true)}
                    >
                      Selecionar Produto
                    </Button>
                  )}
                </div>

                {produtoSelecionado && (
                  <>
                    <div>
                      <Label>Valor Atual do Produto</Label>
                      <Input
                        value={`R$ ${produtoSelecionado.preco.toFixed(2)}`}
                        disabled
                        className="bg-muted"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Quantidade</Label>
                        <Input
                          type="number"
                          min="1"
                          value={quantidadeProduto}
                          onChange={(e) => setQuantidadeProduto(parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div>
                        <Label>Desconto (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={descontoProduto}
                          onChange={(e) => setDescontoProduto(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {itemEmEdicao !== null && (
                        <Button variant="outline" onClick={cancelarEdicao} className="flex-1">
                          Cancelar
                        </Button>
                      )}
                      <Button onClick={adicionarOuEditarProduto} className="flex-1 gap-2">
                        {itemEmEdicao !== null ? (
                          <>
                            <Edit2 className="h-4 w-4" />
                            Salvar Alterações
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4" />
                            Adicionar Produto
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lista de Produtos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Itens da Venda ({itensVenda.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {itensVenda.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhum produto adicionado</p>
              ) : (
                <div className="space-y-2">
                  {itensVenda.map((item, index) => (
                    <div 
                      key={index} 
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        itemEmEdicao === index ? 'bg-primary/10 border-primary' : 'bg-background/50'
                      }`}
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.nomeProduto}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantidade}x R$ {item.precoUnitario.toFixed(2)}
                          {item.descontoAplicado > 0 && (
                            <Badge className="ml-2 bg-accent">-{item.descontoAplicado}%</Badge>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-lg">R$ {item.subtotal.toFixed(2)}</p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => editarProduto(index)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removerProduto(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resumo da Venda */}
          <Card className="bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">Resumo da Venda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-lg">
                <span>Subtotal:</span>
                <span className="font-medium">R$ {subtotalItens.toFixed(2)}</span>
              </div>
              
              <div className="space-y-2">
                <Label>Tipo de Desconto</Label>
                <RadioGroup value={tipoDesconto} onValueChange={(value: "porcentagem" | "valor") => setTipoDesconto(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="porcentagem" id="porcentagem" />
                    <Label htmlFor="porcentagem" className="font-normal">Porcentagem (%)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="valor" id="valor" />
                    <Label htmlFor="valor" className="font-normal">Valor (R$)</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex items-center justify-between">
                <Label>Desconto Total</Label>
                <Input
                  type="number"
                  min="0"
                  step={tipoDesconto === "valor" ? "0.01" : "1"}
                  max={tipoDesconto === "porcentagem" ? "100" : undefined}
                  value={descontoTotal}
                  onChange={(e) => setDescontoTotal(parseFloat(e.target.value) || 0)}
                  className="w-32"
                  placeholder={tipoDesconto === "porcentagem" ? "0%" : "R$ 0,00"}
                />
              </div>

              {descontoTotal > 0 && (
                <div className="flex justify-between text-lg text-accent">
                  <span>Desconto {tipoDesconto === "porcentagem" ? `(${descontoTotal}%)` : ""}:</span>
                  <span className="font-medium">- R$ {valorDescontoTotal.toFixed(2)}</span>
                </div>
              )}

              <div className="border-t pt-4 flex justify-between text-2xl font-bold">
                <span>Total:</span>
                <span className="text-primary">R$ {totalFinal.toFixed(2)}</span>
              </div>

              {(formaPagamento === "Cartão de Crédito" || formaPagamento === "Cartão de Débito") && (
                <div className="space-y-3 pt-4 border-t">
                  {formaPagamento === "Cartão de Crédito" && (
                    <div className="flex items-center justify-between">
                      <Label>Parcelas</Label>
                      <Input
                        type="number"
                        min="1"
                        max="12"
                        value={parcelas}
                        onChange={(e) => setParcelas(parseInt(e.target.value) || 1)}
                        className="w-24"
                        placeholder="1x"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <Label>Taxa da Maquininha (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={taxaMaquininha}
                      onChange={(e) => setTaxaMaquininha(parseFloat(e.target.value) || 0)}
                      className="w-24"
                      placeholder="0%"
                    />
                  </div>
                  
                  {taxaMaquininha > 0 && (
                    <>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Valor da taxa ({taxaMaquininha}%):</span>
                        <span>- R$ {valorTaxaMaquininha.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex justify-between text-lg font-bold text-accent pt-2 border-t">
                        <span>Recebido pelo Lojista:</span>
                        <span>R$ {valorRecebidoLojista.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              <Button 
                onClick={handleFinalizarVenda} 
                className="w-full h-12 text-lg gap-2"
                disabled={itensVenda.length === 0 || !clienteSelecionado || !vendedorSelecionado}
              >
                <ShoppingCart className="h-5 w-5" />
                Finalizar Venda
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <SelectClientDialog 
        open={showClientDialog}
        onOpenChange={setShowClientDialog}
        clientes={clientes}
        onSelect={setClienteSelecionado}
      />
      
      <SelectVendedorDialog 
        open={showVendedorDialog}
        onOpenChange={setShowVendedorDialog}
        vendedores={vendedores}
        onSelect={setVendedorSelecionado}
      />

      <SelectProductDialog 
        open={showProductDialog}
        onOpenChange={setShowProductDialog}
        produtos={produtos}
        onSelect={setProdutoSelecionado}
      />
    </div>
  );
};

export default NovaVenda;
