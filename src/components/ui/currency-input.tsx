import * as React from "react"
import { Input } from "@/components/ui/input"
import { formatCurrency, cn } from "@/lib/utils"

const applyCurrencyMask = (value: string): string => {
  let numericValue = value.replace(/\D/g, '');
  if (!numericValue) return '';
  const number = parseInt(numericValue, 10) / 100;
  return formatCurrency(number);
};

const removeCurrencyMask = (value: string): string => {
  const numericValue = value.replace(/\D/g, '');
  if (!numericValue) return '0';
  return (parseInt(numericValue, 10) / 100).toString();
};

export interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string | number;
  onValueChange?: (value: string) => void;
  min?: number;
  max?: number;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onValueChange, min = 0, max = 999999999, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState('R$ 0,00');
    const isFocusedRef = React.useRef(false);
    // Prevent parent-provided handlers (like RHF's onChange) from overriding internal logic
    const { onChange: _ignoredOnChange, onBlur: _ignoredOnBlur, onFocus: _ignoredOnFocus, ...restProps } = props as any;

    React.useEffect(() => {
      // Só atualizar o displayValue se o input NÃO estiver focado
      if (isFocusedRef.current) return;
      
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
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
            return;
          }
          if (numericValue > max) {
            onValueChange(max.toString());
            return;
          }
        }
        
        onValueChange(numeric);
      }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pastedText = e.clipboardData.getData('text');
      
      // Detectar e processar diferentes formatos de moeda
      let cleanedValue = pastedText;
      
      // Remover símbolos de moeda comuns (R$, $, €, etc.)
      cleanedValue = cleanedValue.replace(/[R$€£¥]/g, '').trim();
      
      // Detectar formato: se tem ponto E vírgula, assumir formato brasileiro (1.234,56)
      if (cleanedValue.includes('.') && cleanedValue.includes(',')) {
        // Formato brasileiro: 1.234,56 -> remover pontos, trocar vírgula por ponto
        cleanedValue = cleanedValue.replace(/\./g, '').replace(',', '.');
      } 
      // Se tem apenas vírgula, assumir formato brasileiro (1234,56)
      else if (cleanedValue.includes(',')) {
        cleanedValue = cleanedValue.replace(',', '.');
      }
      // Se tem apenas ponto, pode ser formato americano (1234.56) - manter como está
      
      // Remover todos os caracteres não numéricos exceto o ponto decimal
      cleanedValue = cleanedValue.replace(/[^\d.]/g, '');
      
      // Converter para número
      const numericValue = parseFloat(cleanedValue);
      
      if (!isNaN(numericValue) && numericValue >= 0) {
        // Validar min/max
        let finalValue = numericValue;
        if (finalValue < min) finalValue = min;
        if (finalValue > max) finalValue = max;
        
        // Formatar e atualizar
        const formatted = new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(finalValue);
        
        setDisplayValue(formatted);
        
        if (onValueChange) {
          onValueChange(finalValue.toString());
        }
      }
    };

    const handleFocus = () => {
      isFocusedRef.current = true;
    };

    const handleBlur = () => {
      isFocusedRef.current = false;
      // Forçar re-formatação após perder o foco
      if (value !== undefined && value !== null && value !== '') {
        const numericValue = typeof value === 'string' ? parseFloat(value) : value;
        if (!isNaN(numericValue) && numericValue >= 0) {
          setDisplayValue(new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(numericValue));
        }
      }
    };

    return (
      <Input
        {...restProps}
        type="text"
        inputMode="numeric"
        className={cn(className)}
        value={displayValue}
        onChange={handleChange}
        onPaste={handlePaste}
        onBlur={handleBlur}
        onFocus={handleFocus}
        ref={ref}
      />
    )
  }
)
CurrencyInput.displayName = "CurrencyInput"

export { CurrencyInput }
