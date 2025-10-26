import { useState, useEffect } from "react";
import { Search, ShoppingBag, Tag, Sparkles, Package, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { estoqueAPI } from "@/lib/api";

const VitrineVirtual = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [vitrine, setVitrine] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVitrine();
  }, []);

  const loadVitrine = async () => {
    try {
      setLoading(true);
      const data = await estoqueAPI.getAll();
      setVitrine(data);
    } catch (error) {
      console.error('Erro ao carregar vitrine:', error);
      toast.error('Erro ao carregar vitrine virtual');
    } finally {
      setLoading(false);
    }
  };

  const filteredVitrine = vitrine.filter((item: any) => {
    const matchSearch = !searchTerm || 
      (item.nomeProduto || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.codigoProduto || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchCategoria = !filtroCategoria || item.categoria === filtroCategoria;
    
    const matchTipo = filtroTipo === "todos" ||
      (filtroTipo === "promocao" && item.emPromocao) ||
      (filtroTipo === "novidade" && item.isNovidade);
    
    return matchSearch && matchCategoria && matchTipo;
  });

  const categorias = [...new Set(vitrine.map(item => item.categoria).filter(Boolean))];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-2">Vitrine Virtual</h1>
        <p className="text-muted-foreground">
          Visualize produtos disponíveis, promoções e novidades
        </p>
      </div>

      <Card className="p-6 shadow-card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
            <SelectTrigger>
              <SelectValue placeholder="Todas as categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas as categorias</SelectItem>
              {categorias.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os produtos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os produtos</SelectItem>
              <SelectItem value="promocao">Em promoção</SelectItem>
              <SelectItem value="novidade">Novidades</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVitrine.map((item, index) => (
          <Card
            key={item._id || index}
            className="overflow-hidden hover:shadow-elegant transition-all duration-300 animate-slide-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="relative">
              {item.imagens && item.imagens.length > 0 ? (
                <img 
                  src={item.imagens[0]} 
                  alt={item.nomeProduto}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                  <Package className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
              
              <div className="absolute top-2 right-2 flex gap-2">
                {item.emPromocao && (
                  <Badge className="bg-accent text-accent-foreground">
                    <Tag className="h-3 w-3 mr-1" />
                    Promoção
                  </Badge>
                )}
                {item.isNovidade && (
                  <Badge className="bg-green-600 text-white">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Novo
                  </Badge>
                )}
              </div>
            </div>

            <CardContent className="p-4 space-y-3">
              <div>
                <h3 className="text-lg font-bold text-foreground line-clamp-1">
                  {item.nomeProduto || 'Produto sem nome'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {item.codigoProduto} • {item.categoria || 'Sem categoria'}
                </p>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tamanho:</span>
                <span className="font-medium">{item.tamanho}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Cor:</span>
                <span className="font-medium">{item.cor}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Disponível:</span>
                <span className="font-bold text-primary">
                  {item.quantidade || 0} un.
                </span>
              </div>

              <div className="border-t pt-3">
                {item.emPromocao && item.precoPromocional ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground line-through">
                        R$ {item.precoVenda?.toFixed(2)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        Economize R$ {(item.precoVenda - item.precoPromocional).toFixed(2)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-accent">
                        R$ {item.precoPromocional?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-foreground">
                      R$ {item.precoVenda?.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              <Button className="w-full gap-2" disabled={!item.quantidade || item.quantidade <= 0}>
                <ShoppingBag className="h-4 w-4" />
                {item.quantidade > 0 ? 'Disponível' : 'Esgotado'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredVitrine.length === 0 && !loading && (
        <Card className="p-12">
          <div className="text-center">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">
              Nenhum produto encontrado
            </h3>
            <p className="text-muted-foreground">
              Tente ajustar os filtros ou buscar por outros termos
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default VitrineVirtual;
