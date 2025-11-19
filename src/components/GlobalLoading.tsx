import { Loader2 } from "lucide-react";

interface GlobalLoadingProps {
  message?: string;
}

export const GlobalLoading = ({ message = "Carregando..." }: GlobalLoadingProps) => {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card p-8 rounded-lg shadow-lg flex flex-col items-center gap-4 border">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg font-medium text-foreground">{message}</p>
      </div>
    </div>
  );
};
