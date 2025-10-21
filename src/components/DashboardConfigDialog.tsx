import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, BarChart3, DollarSign, ShoppingBag, Trophy } from "lucide-react";

export interface DashboardCardConfig {
  id: string;
  title: string;
  description: string;
  visible: boolean;
  category: "stats" | "finance" | "sales" | "ranking";
}

interface DashboardConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cards: DashboardCardConfig[];
  onSave: (cards: DashboardCardConfig[]) => void;
}

export const DashboardConfigDialog = ({
  open,
  onOpenChange,
  cards,
  onSave,
}: DashboardConfigDialogProps) => {
  const [localCards, setLocalCards] = useState(cards);

  useEffect(() => {
    setLocalCards(cards);
  }, [cards]);

  const toggleCard = (id: string) => {
    setLocalCards((prev) =>
      prev.map((card) =>
        card.id === id ? { ...card, visible: !card.visible } : card
      )
    );
  };

  const handleSave = () => {
    onSave(localCards);
    onOpenChange(false);
  };

  const categories = {
    stats: { label: "Estatísticas", icon: BarChart3, color: "text-purple-600 dark:text-purple-400" },
    finance: { label: "Financeiro", icon: DollarSign, color: "text-green-600 dark:text-green-400" },
    sales: { label: "Vendas", icon: ShoppingBag, color: "text-blue-600 dark:text-blue-400" },
    ranking: { label: "Rankings", icon: Trophy, color: "text-orange-600 dark:text-orange-400" },
  };

  const visibleCount = localCards.filter(c => c.visible).length;
  const totalCount = localCards.length;

  const groupedCards = Object.entries(categories).map(([key, value]) => ({
    category: key as keyof typeof categories,
    label: value.label,
    icon: value.icon,
    color: value.color,
    cards: localCards.filter((card) => card.category === key),
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Configurar Dashboard
              </DialogTitle>
              <DialogDescription className="mt-1">
                Personalize sua experiência selecionando os cards que deseja visualizar
              </DialogDescription>
            </div>
            <Badge variant="secondary" className="text-sm px-3 py-1.5">
              {visibleCount}/{totalCount} visíveis
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[480px] pr-4">
          <div className="space-y-6">
            {groupedCards.map((group) => {
              const CategoryIcon = group.icon;
              const visibleInCategory = group.cards.filter(c => c.visible).length;
              
              return (
                <div key={group.category} className="space-y-3">
                  <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                    <div className={`p-2 rounded-lg bg-gradient-to-br from-accent/10 to-accent/5`}>
                      <CategoryIcon className={`h-5 w-5 ${group.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-foreground">
                        {group.label}
                      </h3>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {visibleInCategory}/{group.cards.length}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    {group.cards.map((card) => (
                      <div
                        key={card.id}
                        className={`group relative overflow-hidden rounded-xl border transition-all duration-300 ${
                          card.visible
                            ? "bg-gradient-to-br from-primary/5 via-accent/5 to-transparent border-primary/20 shadow-sm hover:shadow-md hover:border-primary/40"
                            : "bg-muted/30 border-border/50 hover:bg-muted/50 hover:border-border"
                        }`}
                      >
                        <div className="flex items-center justify-between p-4">
                          <div className="flex-1 flex items-start gap-3">
                            <div className={`mt-1 transition-all duration-300 ${
                              card.visible ? "opacity-100 scale-100" : "opacity-50 scale-90"
                            }`}>
                              {card.visible ? (
                                <div className="p-2 rounded-lg bg-primary/10">
                                  <Eye className="h-4 w-4 text-primary" />
                                </div>
                              ) : (
                                <div className="p-2 rounded-lg bg-muted">
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <Label
                                htmlFor={card.id}
                                className={`font-semibold cursor-pointer transition-colors ${
                                  card.visible ? "text-foreground" : "text-muted-foreground"
                                }`}
                              >
                                {card.title}
                              </Label>
                              <p className={`text-xs mt-1 transition-colors ${
                                card.visible ? "text-muted-foreground" : "text-muted-foreground/70"
                              }`}>
                                {card.description}
                              </p>
                            </div>
                          </div>
                          
                          <Switch
                            id={card.id}
                            checked={card.visible}
                            onCheckedChange={() => toggleCard(card.id)}
                            className="ml-4"
                          />
                        </div>
                        
                        {/* Animated gradient border effect */}
                        {card.visible && (
                          <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 animate-pulse" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <p className="text-sm text-muted-foreground">
            Arraste os cards no dashboard para reorganizar
          </p>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="hover:bg-muted"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
            >
              Salvar Configurações
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
