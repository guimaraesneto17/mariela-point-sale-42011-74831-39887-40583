import { useState } from "react";
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
import { Eye, EyeOff } from "lucide-react";

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
    stats: "Estatísticas",
    finance: "Financeiro",
    sales: "Vendas",
    ranking: "Rankings",
  };

  const groupedCards = Object.entries(categories).map(([key, label]) => ({
    category: key as keyof typeof categories,
    label,
    cards: localCards.filter((card) => card.category === key),
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Configurar Dashboard</DialogTitle>
          <DialogDescription>
            Selecione quais cards você deseja exibir no dashboard
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            {groupedCards.map((group) => (
              <div key={group.category} className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase">
                  {group.label}
                </h3>
                <div className="space-y-2">
                  {group.cards.map((card) => (
                    <div
                      key={card.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {card.visible ? (
                            <Eye className="h-4 w-4 text-primary" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          )}
                          <Label
                            htmlFor={card.id}
                            className="font-medium cursor-pointer"
                          >
                            {card.title}
                          </Label>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 ml-6">
                          {card.description}
                        </p>
                      </div>
                      <Switch
                        id={card.id}
                        checked={card.visible}
                        onCheckedChange={() => toggleCard(card.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar Configurações</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
