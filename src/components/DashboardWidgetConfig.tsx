import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings2, Eye, EyeOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export interface WidgetConfig {
  id: string;
  label: string;
  category: string;
  visible: boolean;
}

interface DashboardWidgetConfigProps {
  widgets: WidgetConfig[];
  onSave: (widgets: WidgetConfig[]) => void;
}

export const DashboardWidgetConfig = ({
  widgets,
  onSave,
}: DashboardWidgetConfigProps) => {
  const [open, setOpen] = useState(false);
  const [localWidgets, setLocalWidgets] = useState<WidgetConfig[]>(widgets);

  const toggleWidget = (id: string) => {
    setLocalWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w))
    );
  };

  const handleSave = () => {
    onSave(localWidgets);
    setOpen(false);
  };

  const handleReset = () => {
    const resetWidgets = localWidgets.map((w) => ({ ...w, visible: true }));
    setLocalWidgets(resetWidgets);
  };

  const categories = Array.from(new Set(localWidgets.map((w) => w.category)));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Personalizar Widgets
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configurar Widgets do Dashboard</DialogTitle>
          <DialogDescription>
            Escolha quais métricas você deseja ver no dashboard. Você também pode reordenar os widgets arrastando-os.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            {categories.map((category) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  {category}
                </h3>
                <div className="space-y-3">
                  {localWidgets
                    .filter((w) => w.category === category)
                    .map((widget) => (
                      <div
                        key={widget.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {widget.visible ? (
                            <Eye className="h-4 w-4 text-primary" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          )}
                          <Label
                            htmlFor={widget.id}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {widget.label}
                          </Label>
                        </div>
                        <Switch
                          id={widget.id}
                          checked={widget.visible}
                          onCheckedChange={() => toggleWidget(widget.id)}
                        />
                      </div>
                    ))}
                </div>
                <Separator className="mt-4" />
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between pt-4">
          <Button variant="outline" onClick={handleReset}>
            Mostrar Todos
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar Configuração
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
