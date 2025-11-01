import * as React from "react";
import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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

interface SingleSelectBadgesProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  onCreateOption?: (value: string) => void;
  onDeleteOption?: (value: string) => void;
}

export function SingleSelectBadges({
  value,
  onChange,
  options,
  placeholder = "Digite uma nova opção",
  onCreateOption,
  onDeleteOption,
}: SingleSelectBadgesProps) {
  const [inputValue, setInputValue] = React.useState("");
  const [isAdding, setIsAdding] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [optionToDelete, setOptionToDelete] = React.useState<string>("");
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleAdd = () => {
    const trimmedValue = inputValue.trim();
    
    if (!trimmedValue) {
      setError("Digite um valor válido");
      return;
    }
    
    if (options.includes(trimmedValue)) {
      setError("Esta opção já existe");
      return;
    }
    
    if (onCreateOption) {
      onCreateOption(trimmedValue);
    }
    onChange(trimmedValue);
    setInputValue("");
    setIsAdding(false);
    setError("");
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      return;
    }
    
    if (onDeleteOption && optionToDelete) {
      onDeleteOption(optionToDelete);
      if (value === optionToDelete) {
        onChange("");
      }
    }
    setDeleteDialogOpen(false);
    setOptionToDelete("");
    setConfirmDelete(false);
  };

  const openDeleteDialog = (option: string) => {
    setOptionToDelete(option);
    setDeleteDialogOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    } else if (e.key === "Escape") {
      setInputValue("");
      setIsAdding(false);
      setError("");
    }
  };

  return (
    <>
      <div className="space-y-2">
        {isAdding ? (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setError("");
                }}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                autoFocus
                onBlur={() => {
                  if (!inputValue.trim()) {
                    setIsAdding(false);
                    setError("");
                  }
                }}
                className={error ? "border-red-500" : ""}
              />
              <Button
                type="button"
                size="sm"
                onClick={handleAdd}
                disabled={!inputValue.trim()}
              >
                Adicionar
              </Button>
            </div>
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>
        ) : (
          <div className="flex gap-2 flex-wrap items-center">
            {options.map((option) => (
              <div key={option} className="relative group">
                <Badge
                  variant={value === option ? "default" : "outline"}
                  className={`cursor-pointer transition-all pr-8 ${
                    value === option 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted"
                  }`}
                  onClick={() => onChange(option)}
                >
                  {option}
                </Badge>
                {onDeleteOption && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDeleteDialog(option);
                    }}
                    className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                  </button>
                )}
              </div>
            ))}
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="h-7 w-7 rounded-full"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a opção "{optionToDelete}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="flex items-center space-x-2 py-4">
            <Checkbox 
              id="confirm-delete" 
              checked={confirmDelete}
              onCheckedChange={(checked) => setConfirmDelete(checked as boolean)}
            />
            <Label 
              htmlFor="confirm-delete"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Confirmo que desejo excluir esta opção
            </Label>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setConfirmDelete(false);
              setOptionToDelete("");
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={!confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
