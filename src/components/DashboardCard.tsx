import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface DashboardCardProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export const DashboardCard = ({ id, children, className = "" }: DashboardCardProps) => {
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

  return (
    <div ref={setNodeRef} style={style} className={`relative group ${className}`}>
      <Card className="p-6 shadow-card h-full">
        <div
          className="absolute top-2 right-2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-accent rounded"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
        {children}
      </Card>
    </div>
  );
};
