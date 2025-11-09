// Função helper para retornar imagem default por categoria
export const getDefaultImageByCategory = (categoria?: string): string => {
  const categoryMap: { [key: string]: string } = {
    'Calça': '/logo-calca.png',
    'Saia': '/logo-saia.png',
    'Vestido': '/logo-vestido.png',
    'Blusa': '/logo-blusa.png',
    'Bolsa': '/logo-bolsa.png',
    'Acessório': '/logo-acessorio.png',
    'Outro': '/logo-mariela.png'
  };

  return categoryMap[categoria || 'Outro'] || '/logo-mariela.png';
};

// Logo genérico da Mariela como fallback
export const MARIELA_LOGO = '/logo-mariela.png';
