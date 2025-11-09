// Função helper para retornar imagem default por categoria
export const getDefaultImageByCategory = (categoria?: string): string => {
  // Sempre retorna a mesma imagem genérica para todos os produtos
  return '/produto-generico.png';
};

// Imagem genérica de produto como fallback
export const MARIELA_PRODUTO_GENERICO = '/produto-generico.png';
