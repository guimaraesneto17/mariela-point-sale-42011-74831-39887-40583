import { Calendar, Filter, X, FileDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface ReportFiltersProps {
  dataInicio: string;
  dataFim: string;
  onDataInicioChange: (value: string) => void;
  onDataFimChange: (value: string) => void;
  onPeriodoChange?: (value: string) => void;
  additionalFilters?: React.ReactNode;
  activeFiltersCount?: number;
  onClearFilters?: () => void;
  onExport?: () => void;
}

export const ReportFilters = ({
  dataInicio,
  dataFim,
  onDataInicioChange,
  onDataFimChange,
  onPeriodoChange,
  additionalFilters,
  activeFiltersCount = 0,
  onClearFilters,
  onExport
}: ReportFiltersProps) => {
  const hasActiveFilters = dataInicio || dataFim || activeFiltersCount > 0;

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-background border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            Filtros
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {(dataInicio ? 1 : 0) + (dataFim ? 1 : 0) + activeFiltersCount} ativos
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            {onExport && (
              <Button
                variant="default"
                size="sm"
                onClick={onExport}
                className="h-8"
              >
                <FileDown className="h-4 w-4 mr-1" />
                Exportar
              </Button>
            )}
            {hasActiveFilters && onClearFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="h-8 px-2"
              >
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {onPeriodoChange && (
            <div>
              <Label className="text-sm font-medium mb-2 block">Período Rápido</Label>
              <Select onValueChange={onPeriodoChange} defaultValue="todos">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os períodos</SelectItem>
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="ontem">Ontem</SelectItem>
                  <SelectItem value="semana">Esta semana</SelectItem>
                  <SelectItem value="mes">Este mês</SelectItem>
                  <SelectItem value="ano">Este ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div>
            <Label className="text-sm font-medium mb-2 block flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Data Início
            </Label>
            <Input
              type="date"
              value={dataInicio}
              onChange={(e) => onDataInicioChange(e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Data Fim
            </Label>
            <Input
              type="date"
              value={dataFim}
              onChange={(e) => onDataFimChange(e.target.value)}
              className="w-full"
            />
          </div>

          {additionalFilters}
        </div>
      </CardContent>
    </Card>
  );
};
