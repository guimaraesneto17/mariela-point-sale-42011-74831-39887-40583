import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { GripVertical, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";

interface DashboardWidgetCardProps {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  iconBgColor?: string;
  valueColor?: string;
  comparison?: {
    percentage: number;
    label: string;
  };
  className?: string;
}

export const DashboardWidgetCard = ({
  id,
  title,
  value,
  subtitle,
  icon,
  iconBgColor = "bg-primary/10",
  valueColor = "text-foreground",
  comparison,
  className = "",
}: DashboardWidgetCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getComparisonIcon = () => {
    if (!comparison) return null;
    if (comparison.percentage > 0) return <TrendingUp className="h-3 w-3" />;
    if (comparison.percentage < 0) return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getComparisonColor = () => {
    if (!comparison) return "";
    if (comparison.percentage > 0) return "bg-green-500/10 text-green-600 border-green-500/20";
    if (comparison.percentage < 0) return "bg-red-500/10 text-red-600 border-red-500/20";
    return "bg-muted text-muted-foreground border-border";
  };

  return (
    <div ref={setNodeRef} style={style} className={`relative group ${className}`}>
      <Card className="p-5 shadow-card h-full hover:shadow-md transition-smooth bg-gradient-card border border-border">
        <div
          className="absolute top-2 right-2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-accent rounded"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className={`p-2 ${iconBgColor} rounded-lg`}>
            {icon}
          </div>
        </div>

        <p className={`text-3xl font-bold ${valueColor} mb-1`}>{value}</p>
        <p className="text-sm text-muted-foreground mb-2">{title}</p>

        {subtitle && (
          <p className="text-xs text-muted-foreground/80 mb-2">{subtitle}</p>
        )}

        {comparison && (
          <Badge
            variant="outline"
            className={`gap-1 text-xs font-medium ${getComparisonColor()}`}
          >
            {getComparisonIcon()}
            {comparison.percentage > 0 ? '+' : ''}{comparison.percentage.toFixed(1)}%
            <span className="text-xs opacity-70">{comparison.label}</span>
          </Badge>
        )}
      </Card>
    </div>
  );
};
