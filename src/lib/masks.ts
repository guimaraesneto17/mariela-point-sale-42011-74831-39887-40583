// Máscaras de formatação para inputs

export const maskPhone = (value: string): string => {
  if (!value) return "";
  const cleaned = value.replace(/\D/g, "");
  
  if (cleaned.length <= 10) {
    return cleaned
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  
  return cleaned
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .substring(0, 15);
};

export const maskCNPJ = (value: string): string => {
  if (!value) return "";
  return value
    .replace(/\D/g, "")
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
    .substring(0, 18);
};

export const maskCEP = (value: string): string => {
  if (!value) return "";
  return value
    .replace(/\D/g, "")
    .replace(/^(\d{5})(\d)/, "$1-$2")
    .substring(0, 9);
};

export const maskDate = (value: string): string => {
  if (!value) return "";
  return value
    .replace(/\D/g, "")
    .replace(/^(\d{2})(\d)/, "$1/$2")
    .replace(/(\d{2})(\d)/, "$1/$2")
    .substring(0, 10);
};

export const maskInstagram = (value: string): string => {
  if (!value) return "";
  if (!value.startsWith("@")) {
    return "@" + value;
  }
  return value;
};

export const maskCodigo = (value: string, prefix: string): string => {
  if (!value) return "";
  const cleaned = value.replace(/\D/g, "");
  return prefix + cleaned.substring(0, 3);
};
