import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely format a date value to locale string
 * Returns a default message if the date is invalid
 */
export function formatDate(dateValue: any, options?: Intl.DateTimeFormatOptions): string {
  if (!dateValue) return 'Data não informada';

  try {
    let date: Date;

    // Detecta formato simples YYYY-MM-DD e trata como data local (sem timezone)
    if (typeof dateValue === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      const [y, m, d] = dateValue.split('-').map(Number);
      date = new Date(y, m - 1, d);
    } else {
      date = new Date(dateValue);
    }

    if (isNaN(date.getTime())) return 'Data inválida';

    return date.toLocaleDateString('pt-BR', options || {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (error) {
    console.error('Erro ao formatar data:', dateValue, error);
    return 'Data inválida';
  }
}

/**
 * Safely format a date value to locale date and time string
 */
export function formatDateTime(dateValue: any): string {
  return formatDate(dateValue, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Safely create a Date object and validate it
 * Returns null if the date is invalid
 */
export function safeDate(dateValue: any): Date | null {
  if (!dateValue) return null;
  
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return null;
    return date;
  } catch (error) {
    console.error('Erro ao criar data:', dateValue, error);
    return null;
  }
}
