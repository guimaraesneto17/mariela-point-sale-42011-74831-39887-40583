import { useState } from "react";
import { Search, Package, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface Variante {
  cor: string;
  tamanhos?: Array<{tamanho: string, quantidade: number}>;
  tamanho?: string; // Para compatibilidade com estrutura antiga
  quantidade: number;
  imagens?: string[];
}

interface ProdutoEstoque {
  codigoProduto: string;
  nomeProduto: string;
  categoria?: string;
  precoVenda: number;
  precoCusto: number;
  margemDeLucro: number;
  variantes: Variante[];
  quantidadeTotal: number;
  emPromocao: boolean;
  isNovidade: boolean;
  precoPromocional?: number;
}

interface ItemSelecionado {
  codigoProduto: string;
  nomeProduto: string;
  precoVenda: number;
  precoPromocional?: number;
  cor: string;
  tamanho: string;
  quantidade: number;
  categoria?: string;
  emPromocao?: boolean;
  isNovidade?: boolean;
}

interface SelectProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estoque: ProdutoEstoque[];
  onSelect: (item: ItemSelecionado) => void;
}

export function SelectProductDialog({ open, onOpenChange, estoque, onSelect }: SelectProductDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoEstoque | null>(null);
  const [corSelecionada, setCorSelecionada] = useState("");
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState("");

  const filteredProdutos = estoque.filter(produto => 
    produto.nomeProduto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produto.codigoProduto?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Cores disponíveis do produto selecionado
  const coresDisponiveis = produtoSelecionado 
    ? [...new Set(produtoSelecionado.variantes.map(v => v.cor))]
    : [];

  // Tamanhos disponíveis para a cor selecionada
  const tamanhosDisponiveis = produtoSelecionado && corSelecionada
    ? (() => {
        // Encontrar variante com a cor selecionada
        const varianteDaCor = produtoSelecionado.variantes.find((v: Variante) => v.cor === corSelecionada);
        if (!varianteDaCor) return [];
        
        // Verificar se tem array de tamanhos (estrutura nova)
        if (Array.isArray(varianteDaCor.tamanhos) && varianteDaCor.tamanhos.length > 0) {
          // Filtrar apenas tamanhos com quantidade disponível
          return varianteDaCor.tamanhos
            .filter(t => t.quantidade > 0)
            .map(t => ({
              tamanho: String(t.tamanho),
              quantidade: t.quantidade
            }));
        } 
        // Fallback para estrutura antiga (campo tamanho único)
        else if (varianteDaCor.tamanho && varianteDaCor.quantidade > 0) {
          return [{ 
            tamanho: String(varianteDaCor.tamanho), 
            quantidade: varianteDaCor.quantidade 
          }];
        }
        
        return [];
      })()
    : [];

  const handleSelecionarProduto = (produto: ProdutoEstoque) => {
    setProdutoSelecionado(produto);
    setCorSelecionada("");
    setTamanhoSelecionado("");
  };

  const handleVoltar = () => {
    setProdutoSelecionado(null);
    setCorSelecionada("");
    setTamanhoSelecionado("");
  };

  const handleConfirmar = () => {
    if (!produtoSelecionado || !corSelecionada || !tamanhoSelecionado) return;
    
    // Encontrar a variante e quantidade do tamanho específico
    const varianteDaCor = produtoSelecionado.variantes.find(
      (v: Variante) => v.cor === corSelecionada
    );
    
    if (!varianteDaCor) return;
    
    // Buscar quantidade do tamanho específico
    let quantidadeDisponivel = 0;
    
    if (Array.isArray(varianteDaCor.tamanhos)) {
      const tamanhoObj = varianteDaCor.tamanhos.find(t => String(t.tamanho) === tamanhoSelecionado);
      quantidadeDisponivel = tamanhoObj?.quantidade || 0;
    } else if (varianteDaCor.tamanho === tamanhoSelecionado) {
      quantidadeDisponivel = varianteDaCor.quantidade;
    }
    
    const itemSelecionado: ItemSelecionado = {
      codigoProduto: produtoSelecionado.codigoProduto,
      nomeProduto: produtoSelecionado.nomeProduto,
      precoVenda: produtoSelecionado.precoVenda,
      precoPromocional: produtoSelecionado.emPromocao ? produtoSelecionado.precoPromocional : undefined,
      cor: corSelecionada,
      tamanho: tamanhoSelecionado,
      quantidade: quantidadeDisponivel,
      categoria: produtoSelecionado.categoria,
      emPromocao: produtoSelecionado.emPromocao,
      isNovidade: produtoSelecionado.isNovidade,
    };
    
    onSelect(itemSelecionado);
    onOpenChange(false);
    setProdutoSelecionado(null);
    setCorSelecionada("");
    setTamanhoSelecionado("");
    setSearchTerm("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            {produtoSelecionado ? (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleVoltar}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                Selecionar Cor e Tamanho
              </div>
            ) : (
              "Selecionar Produto"
            )}
          </DialogTitle>
        </DialogHeader>
        
        {!produtoSelecionado ? (
          <>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por nome ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
              {filteredProdutos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum produto encontrado no estoque</p>
                </div>
              ) : (
                filteredProdutos.map((produto) => (
                  <Button
                    key={produto.codigoProduto}
                    variant="outline"
                    className="w-full justify-between h-auto p-4 hover:bg-accent/10 transition-colors"
                    onClick={() => handleSelecionarProduto(produto)}
                    disabled={produto.quantidadeTotal <= 0}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <Package className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                      <div className="text-left flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-foreground">{produto.nomeProduto}</p>
                          {produto.emPromocao && (
                            <Badge variant="secondary" className="text-xs bg-accent text-accent-foreground">
                              Promoção
                            </Badge>
                          )}
                          {produto.isNovidade && (
                            <Badge variant="secondary" className="text-xs bg-green-600 text-white">
                              Novidade
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Código: {produto.codigoProduto}
                          {produto.categoria && ` • ${produto.categoria}`}
                        </p>
                        <p className="text-xs">
                          <span className={produto.quantidadeTotal <= 5 ? 'text-orange-600 font-bold' : 'text-green-600'}>
                            {produto.variantes?.length || 0} variante(s) • Total: <strong>{produto.quantidadeTotal || 0} un.</strong>
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-3">
                      <span className="font-bold text-lg text-foreground">R$ {produto.precoVenda?.toFixed(2) || '0.00'}</span>
                      {produto.quantidadeTotal <= 0 && (
                        <Badge variant="destructive" className="text-xs">
                          Esgotado
                        </Badge>
                      )}
                    </div>
                  </Button>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="space-y-6">
            {/* Informações do produto */}
            <div className="bg-primary/10 p-4 rounded-lg">
              <p className="font-medium text-lg">{produtoSelecionado.nomeProduto}</p>
              <p className="text-sm text-muted-foreground">
                {produtoSelecionado.codigoProduto}
                {produtoSelecionado.categoria && ` • ${produtoSelecionado.categoria}`}
              </p>
            </div>

            {/* Seleção de Cor */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Selecione a Cor *</Label>
              <RadioGroup value={corSelecionada} onValueChange={setCorSelecionada}>
                <div className="grid grid-cols-2 gap-2">
                  {coresDisponiveis.map((cor: string) => {
                    const qtdTotal = produtoSelecionado.variantes
                      .filter(v => v.cor === cor)
                      .reduce((sum, v) => sum + v.quantidade, 0);
                    return (
                      <div key={cor} className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-primary/5">
                        <RadioGroupItem value={cor} id={`cor-${cor}`} />
                        <Label htmlFor={`cor-${cor}`} className="flex-1 cursor-pointer">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{cor}</span>
                            <span className="text-xs text-muted-foreground">{qtdTotal} un.</span>
                          </div>
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </RadioGroup>
            </div>

            {/* Seleção de Tamanho */}
            {corSelecionada && (
              <div className="space-y-3">
                <Label className="text-base font-medium">Selecione o Tamanho *</Label>
                <RadioGroup value={tamanhoSelecionado} onValueChange={setTamanhoSelecionado}>
                  <div className="grid grid-cols-2 gap-2">
                    {tamanhosDisponiveis.length === 0 ? (
                      <p className="text-sm text-muted-foreground col-span-2 text-center py-4">
                        Nenhum tamanho disponível para esta cor
                      </p>
                    ) : (
                      tamanhosDisponiveis.map(({ tamanho, quantidade }) => (
                        <div key={tamanho} className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-primary/5">
                          <RadioGroupItem value={tamanho} id={`tamanho-${tamanho}`} />
                          <Label htmlFor={`tamanho-${tamanho}`} className="flex-1 cursor-pointer">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{tamanho}</span>
                              <span className="text-xs text-muted-foreground">{quantidade} un.</span>
                            </div>
                          </Label>
                        </div>
                      ))
                    )}
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Botão Confirmar */}
            <Button 
              className="w-full" 
              onClick={handleConfirmar}
              disabled={!corSelecionada || !tamanhoSelecionado}
            >
              Confirmar Seleção
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
