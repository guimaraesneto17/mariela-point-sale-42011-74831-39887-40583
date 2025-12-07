import { useState } from "react";
import { Search, Package, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ColorBadge } from "@/components/ColorBadge";

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
  estoqueRetido?: Record<string, number>;
}

export function SelectProductDialog({ open, onOpenChange, estoque, onSelect, estoqueRetido = {} }: SelectProductDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoEstoque | null>(null);
  const [corSelecionada, setCorSelecionada] = useState("");
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState("");

  // Helper para criar chave única da variante
  const getVarianteKey = (codigoProduto: string, cor: string, tamanho: string) => {
    return `${codigoProduto}-${cor}-${tamanho}`;
  };

  // Helper para calcular estoque disponível considerando itens retidos
  const getEstoqueDisponivel = (codigoProduto: string, cor: string, tamanho: string, quantidadeOriginal: number) => {
    const key = getVarianteKey(codigoProduto, cor, tamanho);
    const retido = estoqueRetido[key] || 0;
    return Math.max(0, quantidadeOriginal - retido);
  };

  // Calcular quantidade total disponível de um produto considerando retidos
  const getQuantidadeTotalDisponivel = (produto: ProdutoEstoque) => {
    let total = 0;
    produto.variantes.forEach(variante => {
      if (Array.isArray(variante.tamanhos)) {
        variante.tamanhos.forEach(t => {
          const disponivel = getEstoqueDisponivel(
            produto.codigoProduto,
            variante.cor,
            String(t.tamanho),
            t.quantidade
          );
          total += disponivel;
        });
      } else if (variante.tamanho) {
        const disponivel = getEstoqueDisponivel(
          produto.codigoProduto,
          variante.cor,
          String(variante.tamanho),
          variante.quantidade
        );
        total += disponivel;
      }
    });
    return total;
  };

  // Filtrar produtos que ainda têm estoque disponível
  const filteredProdutos = estoque.filter(produto => {
    const matchesSearch = produto.nomeProduto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produto.codigoProduto?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Calcular quantidade disponível considerando retidos
    const quantidadeDisponivel = getQuantidadeTotalDisponivel(produto);
    
    return matchesSearch && quantidadeDisponivel > 0;
  });

  // Cores disponíveis do produto selecionado (apenas cores com quantidade disponível > 0)
  const coresDisponiveis = produtoSelecionado 
    ? [...new Set(
        produtoSelecionado.variantes
          .filter(v => {
            // Verificar se a cor tem algum tamanho com estoque disponível
            if (Array.isArray(v.tamanhos)) {
              return v.tamanhos.some(t => {
                const disponivel = getEstoqueDisponivel(
                  produtoSelecionado.codigoProduto,
                  v.cor,
                  String(t.tamanho),
                  t.quantidade
                );
                return disponivel > 0;
              });
            } else if (v.tamanho) {
              const disponivel = getEstoqueDisponivel(
                produtoSelecionado.codigoProduto,
                v.cor,
                String(v.tamanho),
                v.quantidade
              );
              return disponivel > 0;
            }
            return false;
          })
          .map(v => v.cor)
      )]
    : [];

  // Tamanhos disponíveis para a cor selecionada (considerando estoque retido)
  const tamanhosDisponiveis = produtoSelecionado && corSelecionada
    ? (() => {
        // Encontrar variante com a cor selecionada
        const varianteDaCor = produtoSelecionado.variantes.find((v: Variante) => v.cor === corSelecionada);
        if (!varianteDaCor) return [];
        
        // Verificar se tem array de tamanhos (estrutura nova)
        if (Array.isArray(varianteDaCor.tamanhos) && varianteDaCor.tamanhos.length > 0) {
          // Filtrar apenas tamanhos com quantidade disponível (descontando retidos)
          return varianteDaCor.tamanhos
            .map(t => {
              const disponivelReal = getEstoqueDisponivel(
                produtoSelecionado.codigoProduto,
                corSelecionada,
                String(t.tamanho),
                t.quantidade
              );
              return {
                tamanho: String(t.tamanho),
                quantidade: disponivelReal
              };
            })
            .filter(t => t.quantidade > 0);
        } 
        // Fallback para estrutura antiga (campo tamanho único)
        else if (varianteDaCor.tamanho) {
          const disponivelReal = getEstoqueDisponivel(
            produtoSelecionado.codigoProduto,
            corSelecionada,
            String(varianteDaCor.tamanho),
            varianteDaCor.quantidade
          );
          
          if (disponivelReal > 0) {
            return [{ 
              tamanho: String(varianteDaCor.tamanho), 
              quantidade: disponivelReal
            }];
          }
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
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-1">Nenhum produto encontrado</p>
                  <p className="text-sm">Tente ajustar sua busca</p>
                </div>
              ) : (
                filteredProdutos.map((produto) => {
                  const quantidadeDisponivel = getQuantidadeTotalDisponivel(produto);
                  
                  // Contar variantes (cor+tamanho) com estoque disponível
                  let variantesDisponiveis = 0;
                  produto.variantes.forEach(variante => {
                    if (Array.isArray(variante.tamanhos)) {
                      variante.tamanhos.forEach(t => {
                        const disponivel = getEstoqueDisponivel(
                          produto.codigoProduto,
                          variante.cor,
                          String(t.tamanho),
                          t.quantidade
                        );
                        if (disponivel > 0) variantesDisponiveis++;
                      });
                    } else if (variante.tamanho) {
                      const disponivel = getEstoqueDisponivel(
                        produto.codigoProduto,
                        variante.cor,
                        String(variante.tamanho),
                        variante.quantidade
                      );
                      if (disponivel > 0) variantesDisponiveis++;
                    }
                  });
                  
                  // Buscar primeira imagem disponível do produto
                  const imagemDestaque = produto.variantes
                    ?.find(v => v.imagens && v.imagens.length > 0)
                    ?.imagens?.[0];
                  
                  return (
                  <Button
                    key={produto.codigoProduto}
                    variant="outline"
                    className="w-full justify-start h-auto p-4 hover:bg-accent/50 hover:border-primary/50 transition-all duration-200"
                    onClick={() => handleSelecionarProduto(produto)}
                  >
                    <div className="flex items-start gap-4 flex-1 text-left">
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                        {imagemDestaque ? (
                          <img 
                            src={imagemDestaque} 
                            alt={produto.nomeProduto}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.parentElement?.classList.add('bg-primary/10');
                              const icon = document.createElement('div');
                              icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6 text-primary"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>';
                              e.currentTarget.parentElement?.appendChild(icon.firstChild as Node);
                            }}
                          />
                        ) : (
                          <Package className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <p className="font-semibold text-foreground text-base">{produto.nomeProduto}</p>
                          {produto.emPromocao && (
                            <Badge variant="secondary" className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700">
                              🔥 Promoção
                            </Badge>
                          )}
                          {produto.isNovidade && (
                            <Badge variant="secondary" className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700">
                              ✨ Novidade
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-muted-foreground">
                          <span className="font-mono">{produto.codigoProduto}</span>
                          {produto.categoria && (
                            <>
                              <span className="hidden sm:inline">•</span>
                              <span>{produto.categoria}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge 
                            variant={quantidadeDisponivel > 10 ? "default" : quantidadeDisponivel > 5 ? "secondary" : "destructive"}
                            className="text-xs"
                          >
                            {quantidadeDisponivel} disponíveis
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {variantesDisponiveis} variante(s)
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 ml-auto">
                        <span className="font-bold text-xl text-foreground whitespace-nowrap">
                          R$ {produto.precoVenda?.toFixed(2) || '0.00'}
                        </span>
                        {produto.emPromocao && produto.precoPromocional && (
                          <span className="text-xs line-through text-muted-foreground">
                            R$ {produto.precoVenda?.toFixed(2)}
                          </span>
                        )}
                        {produto.quantidadeTotal <= 0 && (
                          <Badge variant="destructive" className="text-xs mt-1">
                            Esgotado
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Button>
                  );
                })
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
                    // Calcular quantidade disponível real para esta cor
                    let qtdDisponivel = 0;
                    const varianteDaCor = produtoSelecionado.variantes.find(v => v.cor === cor);
                    if (varianteDaCor) {
                      if (Array.isArray(varianteDaCor.tamanhos)) {
                        varianteDaCor.tamanhos.forEach(t => {
                          qtdDisponivel += getEstoqueDisponivel(
                            produtoSelecionado.codigoProduto,
                            cor,
                            String(t.tamanho),
                            t.quantidade
                          );
                        });
                      } else if (varianteDaCor.tamanho) {
                        qtdDisponivel = getEstoqueDisponivel(
                          produtoSelecionado.codigoProduto,
                          cor,
                          String(varianteDaCor.tamanho),
                          varianteDaCor.quantidade
                        );
                      }
                    }
                    return (
                      <div key={cor} className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-primary/5">
                        <RadioGroupItem value={cor} id={`cor-${cor}`} />
                        <Label htmlFor={`cor-${cor}`} className="flex-1 cursor-pointer">
                          <div className="flex justify-between items-center">
                            <ColorBadge color={cor} size="sm" />
                            <span className="text-xs text-muted-foreground">{qtdDisponivel} un.</span>
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
