import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";

interface MultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: string[];
  placeholder?: string;
  onCreateOption?: (value: string) => void;
}

export function MultiSelect({
  value,
  onChange,
  options,
  placeholder = "Selecione ou digite...",
  onCreateOption,
}: MultiSelectProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const handleUnselect = (item: string) => {
    onChange(value.filter((v) => v !== item));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const input = inputRef.current;
    if (input) {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (input.value === "" && value.length > 0) {
          onChange(value.slice(0, -1));
        }
      }
      if (e.key === "Escape") {
        input.blur();
      }
      // Enter key to add new value
      if (e.key === "Enter" && inputValue.trim()) {
        e.preventDefault();
        const trimmedValue = inputValue.trim();
        if (!value.includes(trimmedValue)) {
          onChange([...value, trimmedValue]);
          if (onCreateOption && !options.includes(trimmedValue)) {
            onCreateOption(trimmedValue);
          }
        }
        setInputValue("");
        setOpen(false);
      }
    }
  };

  const selectables = options.filter((option) => !value.includes(option));

  return (
    <Command onKeyDown={handleKeyDown} className="overflow-visible bg-transparent">
      <div className="group border border-input px-3 py-2 text-sm ring-offset-background rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <div className="flex gap-1 flex-wrap">
          {value.map((item) => (
            <Badge key={item} variant="secondary">
              {item}
              <button
                className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleUnselect(item);
                  }
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={() => handleUnselect(item)}
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
            </Badge>
          ))}
          <CommandPrimitive.Input
            ref={inputRef}
            value={inputValue}
            onValueChange={setInputValue}
            onBlur={() => setOpen(false)}
            onFocus={() => setOpen(true)}
            placeholder={value.length === 0 ? placeholder : ""}
            className="ml-2 bg-transparent outline-none placeholder:text-muted-foreground flex-1"
          />
        </div>
      </div>
      <div className="relative mt-2">
        {open && (selectables.length > 0 || inputValue.trim()) ? (
          <div className="absolute w-full z-50 top-0 rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
            <CommandGroup className="h-full overflow-auto max-h-[200px]">
              {selectables.map((option) => (
                <CommandItem
                  key={option}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onSelect={() => {
                    onChange([...value, option]);
                    setInputValue("");
                  }}
                  className="cursor-pointer"
                >
                  {option}
                </CommandItem>
              ))}
              {inputValue.trim() && !options.includes(inputValue.trim()) && (
                <CommandItem
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onSelect={() => {
                    const trimmedValue = inputValue.trim();
                    if (!value.includes(trimmedValue)) {
                      onChange([...value, trimmedValue]);
                      if (onCreateOption) {
                        onCreateOption(trimmedValue);
                      }
                    }
                    setInputValue("");
                  }}
                  className="cursor-pointer text-primary"
                >
                  <span className="font-medium">+ Criar "{inputValue.trim()}"</span>
                </CommandItem>
              )}
            </CommandGroup>
          </div>
        ) : null}
      </div>
    </Command>
  );
}
