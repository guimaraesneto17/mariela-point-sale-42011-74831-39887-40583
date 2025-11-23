import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

interface ExportOption {
  id: string;
  label: string;
  checked: boolean;
}

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportType: "sales" | "products" | "clients" | "financial";
  onExport: (format: "pdf" | "excel", selectedData: string[]) => Promise<void>;
  availableData: ExportOption[];
}

export const ExportDialog = ({
  open,
  onOpenChange,
  reportType,
  onExport,
  availableData
}: ExportDialogProps) => {
  const [selectedData, setSelectedData] = useState<string[]>(
    availableData.filter(d => d.checked).map(d => d.id)
  );
  const [exporting, setExporting] = useState(false);

  const handleToggle = (id: string) => {
    setSelectedData(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleExport = async (format: "pdf" | "excel") => {
    if (selectedData.length === 0) {
      toast.error("Selecione pelo menos um item para exportar");
      return;
    }

    setExporting(true);
    try {
      await onExport(format, selectedData);
      toast.success(`Relatório exportado em ${format.toUpperCase()} com sucesso!`);
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao exportar:", error);
      toast.error("Erro ao exportar relatório");
    } finally {
      setExporting(false);
    }
  };

  const reportTitles = {
    sales: "Vendas",
    products: "Produtos",
    clients: "Clientes",
    financial: "Financeiro"
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5 text-primary" />
            Exportar Relatório de {reportTitles[reportType]}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-3 text-foreground">
              Selecione os dados para incluir:
            </h4>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {availableData.map((item) => (
                <div key={item.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={item.id}
                    checked={selectedData.includes(item.id)}
                    onCheckedChange={() => handleToggle(item.id)}
                  />
                  <Label
                    htmlFor={item.id}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {item.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 text-xs text-muted-foreground">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedData(availableData.map(d => d.id))}
            >
              Selecionar Todos
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedData([])}
            >
              Limpar Seleção
            </Button>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={exporting}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => handleExport("excel")}
            disabled={exporting}
            className="bg-green-600 hover:bg-green-700"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button
            onClick={() => handleExport("pdf")}
            disabled={exporting}
            className="bg-red-600 hover:bg-red-700"
          >
            <FileDown className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
