import { AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AlertDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemName?: string;
}

export function AlertDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "Confirmar exclusão",
  description = "Tem certeza que deseja excluir este cadastro? Esta ação não pode ser desfeita.",
  itemName,
}: AlertDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md bg-gradient-to-br from-background via-background to-destructive/5 border-2 border-destructive/20">
        <AlertDialogHeader className="space-y-4">
          <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-destructive/10 border-2 border-destructive/20">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <AlertDialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-destructive to-destructive/80 bg-clip-text text-transparent">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-base text-muted-foreground">
            {itemName && (
              <span className="block font-semibold text-foreground mb-2">
                {itemName}
              </span>
            )}
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-2 sm:gap-2">
          <AlertDialogCancel className="flex-1 border-2 hover:bg-muted/50 transition-all">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm} 
            className="flex-1 bg-gradient-to-r from-destructive to-destructive/90 hover:from-destructive/90 hover:to-destructive text-destructive-foreground border-2 border-destructive/20 shadow-lg hover:shadow-xl transition-all"
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
