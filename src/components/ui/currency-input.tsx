import * as React from "react"
import { Input } from "@/components/ui/input"
import { applyCurrencyMask, removeCurrencyMask } from "@/lib/currencyMask"
import { cn } from "@/lib/utils"

export interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string;
  onValueChange?: (value: string) => void;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onValueChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState('');

    React.useEffect(() => {
      if (value !== undefined) {
        // Se o valor vem como número, formata
        const numericValue = parseFloat(value) || 0;
        setDisplayValue(applyCurrencyMask((numericValue * 100).toString()));
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const masked = applyCurrencyMask(inputValue);
      setDisplayValue(masked);
      
      if (onValueChange) {
        const numeric = removeCurrencyMask(inputValue);
        onValueChange(numeric);
      }
    };

    return (
      <Input
        type="text"
        className={cn(className)}
        value={displayValue}
        onChange={handleChange}
        ref={ref}
        {...props}
      />
    )
  }
)
CurrencyInput.displayName = "CurrencyInput"

export { CurrencyInput }
