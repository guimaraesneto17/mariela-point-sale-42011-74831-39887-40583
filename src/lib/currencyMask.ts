/**
 * Formata valor numérico para BRL
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

/**
 * Converte string formatada BRL para número
 */
export function parseCurrency(value: string): number {
  const numericValue = value.replace(/[^\d,]/g, '').replace(',', '.');
  return parseFloat(numericValue) || 0;
}

/**
 * Aplica máscara de moeda BRL durante digitação
 */
export function applyCurrencyMask(value: string): string {
  // Remove tudo que não é dígito
  let numericValue = value.replace(/\D/g, '');
  
  // Se vazio, retorna vazio
  if (!numericValue) return '';
  
  // Converte para número e divide por 100 (centavos)
  const number = parseInt(numericValue, 10) / 100;
  
  // Formata como moeda brasileira
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(number);
}

/**
 * Remove a formatação e retorna apenas o número
 */
export function removeCurrencyMask(value: string): string {
  const numericValue = value.replace(/\D/g, '');
  if (!numericValue) return '0';
  return (parseInt(numericValue, 10) / 100).toString();
}
