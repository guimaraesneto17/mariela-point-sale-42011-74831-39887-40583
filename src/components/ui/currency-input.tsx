import * as React from "react"
import { Input } from "@/components/ui/input"
import { applyCurrencyMask, removeCurrencyMask } from "@/lib/currencyMask"
import { cn } from "@/lib/utils"

export interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string | number;
  onValueChange?: (value: string) => void;
  min?: number;
  max?: number;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onValueChange, min = 0, max = 999999999, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState('R$ 0,00');
    const [isEditing, setIsEditing] = React.useState(false);

    React.useEffect(() => {
      // Não atualizar se estiver editando
      if (isEditing) return;
      
      if (value !== undefined && value !== null && value !== '') {
        const numericValue = typeof value === 'string' ? parseFloat(value) : value;
        if (!isNaN(numericValue) && numericValue >= 0) {
          setDisplayValue(new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(numericValue));
        } else {
          setDisplayValue('R$ 0,00');
        }
      } else {
        setDisplayValue('R$ 0,00');
      }
    }, [value, isEditing]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setIsEditing(true);
      const inputValue = e.target.value;
      
      // Aplicar máscara para visualização
      const masked = applyCurrencyMask(inputValue);
      setDisplayValue(masked);
      
      // Retornar o valor numérico (sem formatação) para o componente pai
      if (onValueChange) {
        const numeric = removeCurrencyMask(inputValue);
        const numericValue = parseFloat(numeric);
        
        // Validar min/max
        if (!isNaN(numericValue)) {
          if (numericValue < min) {
            onValueChange(min.toString());
            setIsEditing(false);
            return;
          }
          if (numericValue > max) {
            onValueChange(max.toString());
            setIsEditing(false);
            return;
          }
        }
        
        onValueChange(numeric);
      }
    };

    const handleBlur = () => {
      setIsEditing(false);
    };

    const handleFocus = () => {
      setIsEditing(true);
    };

    return (
      <Input
        type="text"
        inputMode="numeric"
        className={cn(className)}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        ref={ref}
        {...props}
      />
    )
  }
)
CurrencyInput.displayName = "CurrencyInput"

export { CurrencyInput }
