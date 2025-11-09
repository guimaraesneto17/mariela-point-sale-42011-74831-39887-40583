import { useState, useEffect } from "react";
import { Search, ShoppingBag, Tag, Sparkles, Package, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { vitrineVirtualAPI } from "@/lib/api";
import { getDefaultImageByCategory } from "@/lib/defaultImages";

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
      const data = await vitrineVirtualAPI.getAll();
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
      (item.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.code || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchCategoria = !filtroCategoria || item.category === filtroCategoria;
    
    const matchTipo = filtroTipo === "todos" ||
      (filtroTipo === "promocao" && item.isOnSale) ||
      (filtroTipo === "novidade" && item.isNew);
    
    return matchSearch && matchCategoria && matchTipo;
  });

  const categorias = [...new Set(vitrine.map(item => item.category).filter(Boolean))];

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
          
          <Select value={filtroCategoria || "todos"} onValueChange={(value) => setFiltroCategoria(value === "todos" ? "" : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Todas as categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as categorias</SelectItem>
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
            key={item.id || index}
            className="overflow-hidden hover:shadow-elegant transition-all duration-300 animate-slide-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="relative">
              {item.image && item.image[0] && item.image[0] !== 'default.jpg' ? (
                <img 
                  src={item.image[0]} 
                  alt={item.title}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                  <img 
                    src={getDefaultImageByCategory(item.category)} 
                    alt={`${item.category || 'Produto'} - Logo Mariela`}
                    className="w-32 h-32 object-contain opacity-50"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = '<svg class="h-16 w-16 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>';
                    }}
                  />
                </div>
              )}
              
              <div className="absolute top-2 right-2 flex gap-2">
                {item.isOnSale && (
                  <Badge className="bg-accent text-accent-foreground">
                    <Tag className="h-3 w-3 mr-1" />
                    Promoção
                  </Badge>
                )}
                {item.isNew && (
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
                  {item.title || 'Produto sem nome'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {item.code} • {item.category || 'Sem categoria'}
                </p>
              </div>

              {item.variants && item.variants.length > 0 && (
                <>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-muted-foreground">Variantes:</span>
                    <div className="flex flex-wrap gap-1">
                      {item.variants.slice(0, 3).map((v: any, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {v.color} / {v.size}
                        </Badge>
                      ))}
                      {item.variants.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{item.variants.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Disponível:</span>
                <span className="font-bold text-primary">
                  {item.totalAvailable || 0} un.
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={item.totalAvailable > 0 ? "default" : "secondary"}>
                  {item.statusProduct}
                </Badge>
              </div>

              <div className="border-t pt-3">
                {item.isOnSale && item.originalPrice ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground line-through">
                        {item.originalPrice}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        Economize {item.originalPrice.replace(/[^\d,]/g, '')} - {item.price.replace(/[^\d,]/g, '')}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-accent">
                        {item.price}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-foreground">
                      {item.price}
                    </span>
                  </div>
                )}
              </div>

              <Button className="w-full gap-2" disabled={!item.totalAvailable || item.totalAvailable <= 0}>
                <ShoppingBag className="h-4 w-4" />
                {item.totalAvailable > 0 ? 'Disponível' : 'Esgotado'}
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
