/**
 * ===========================================================
 * VALIDAÇÕES BASEADAS NOS JSON SCHEMAS DO MONGODB
 * ===========================================================
 * Regras:
 *  - Campos obrigatórios (required): sempre validados
 *  - Campos opcionais: validados somente se preenchidos
 *  - Segue estrutura e restrições conforme JSON Schemas enviados
 */

const regex = {
  codigoCliente: /^C\d{3}$/,
  codigoFornecedor: /^F\d{3}$/,
  codigoProduto: /^P\d{3}$/,
  codigoEstoque: /^E\d{3}$/,
  codigoVendedor: /^V\d{3}$/,
  codigoVenda: /^VENDA\d{8}-\d{3}$/,
  telefone: /^\(\d{2}\) \d{4,5}-\d{4}$/,
  dataISO: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/,
  data: /^\d{4}-\d{2}-\d{2}$/,
  cnpj: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
  instagram: /^@\w+/,
  cep: /^\d{5}-\d{3}$/,
  estado: /^[A-Z]{2}$/
};

/**
 * Helper para limpar strings vazias e tratar como null
 */
function limparDados(data: any): any {
  const cleaned = { ...data };
  Object.keys(cleaned).forEach(key => {
    if (cleaned[key] === '') {
      cleaned[key] = null;
    }
    if (typeof cleaned[key] === 'object' && cleaned[key] !== null && !Array.isArray(cleaned[key])) {
      cleaned[key] = limparDados(cleaned[key]);
    }
  });
  return cleaned;
}

/**
 * Função genérica de validação condicional
 */
function validarCampo(valor: any, pattern: RegExp, nomeCampo: string): boolean | string {
  if (valor === null || valor === undefined || valor === '') return true;
  return pattern.test(valor) || `${nomeCampo} está em formato inválido.`;
}

/**
 * Helper para checar tamanho mínimo/máximo
 */
function validarTamanho(valor: any, min: number, max: number, nomeCampo: string): boolean | string {
  if (valor === null || valor === undefined || valor === '') return true;
  if (typeof valor !== 'string') return `${nomeCampo} deve ser uma string.`;
  if (valor.length < min) return `${nomeCampo} deve ter pelo menos ${min} caracteres.`;
  if (valor.length > max) return `${nomeCampo} deve ter no máximo ${max} caracteres.`;
  return true;
}

/**
 * ===========================================================
 *  VALIDADORES POR COLEÇÃO
 * ===========================================================
 */

const Validations = {
  // -------------------- CLIENTE --------------------
  cliente: (data: any): string[] => {
    const erros: string[] = [];
    const cleaned = limparDados(data);

    // Campos obrigatórios
    if (!cleaned.codigoCliente) erros.push('codigoCliente é obrigatório.');
    else if (!regex.codigoCliente.test(cleaned.codigoCliente))
      erros.push('codigoCliente deve seguir o formato C001.');

    if (!cleaned.nome || cleaned.nome.length < 3 || cleaned.nome.length > 100)
      erros.push('nome deve ter entre 3 e 100 caracteres.');

    if (!cleaned.dataCadastro || !regex.dataISO.test(cleaned.dataCadastro))
      erros.push('dataCadastro é obrigatória e deve estar em formato ISO.');

    // Campos opcionais
    if (cleaned.telefone && !regex.telefone.test(cleaned.telefone))
      erros.push('telefone deve estar no formato (XX) XXXXX-XXXX.');

    if (cleaned.dataNascimento && !regex.data.test(cleaned.dataNascimento))
      erros.push('dataNascimento deve estar no formato YYYY-MM-DD.');

    if (cleaned.observacao && cleaned.observacao.length > 500)
      erros.push('observacao deve ter no máximo 500 caracteres.');

    if (cleaned.dataAtualizacao && !regex.dataISO.test(cleaned.dataAtualizacao))
      erros.push('dataAtualizacao deve estar em formato ISO.');

    return erros;
  },

  // -------------------- FORNECEDOR --------------------
  fornecedor: (data: any): string[] => {
    const erros: string[] = [];
    const cleaned = limparDados(data);

    if (!cleaned.codigoFornecedor || !regex.codigoFornecedor.test(cleaned.codigoFornecedor))
      erros.push('codigoFornecedor é obrigatório e deve seguir o formato F001.');

    if (!cleaned.nome || cleaned.nome.length < 3 || cleaned.nome.length > 150)
      erros.push('nome é obrigatório e deve ter entre 3 e 150 caracteres.');

    if (!cleaned.endereco) erros.push('endereco é obrigatório.');
    else {
      const e = cleaned.endereco;
      const camposObrig = ['cidade', 'estado'];
      camposObrig.forEach((c) => {
        if (e[c] === undefined || e[c] === null)
          erros.push(`endereco.${c} é obrigatório.`);
      });

      if (e.estado && !regex.estado.test(e.estado))
        erros.push('endereco.estado deve estar no formato de UF (ex: SP).');

      if (e.cep && !regex.cep.test(e.cep))
        erros.push('endereco.cep deve estar no formato 00000-000.');
    }

    if (!cleaned.dataCadastro || !regex.dataISO.test(cleaned.dataCadastro))
      erros.push('dataCadastro é obrigatória e deve estar em formato ISO.');

    if (cleaned.telefone && !regex.telefone.test(cleaned.telefone))
      erros.push('telefone deve estar no formato (XX) XXXXX-XXXX.');

    if (cleaned.cnpj && !regex.cnpj.test(cleaned.cnpj))
      erros.push('CNPJ deve estar no formato NN.NNN.NNN/NNNN-NN.');

    if (cleaned.instagram && !regex.instagram.test(cleaned.instagram))
      erros.push('instagram deve iniciar com @.');

    if (cleaned.observacao && cleaned.observacao.length > 500)
      erros.push('observacao deve ter no máximo 500 caracteres.');

    return erros;
  },

  // -------------------- PRODUTO --------------------
  produto: (data: any): string[] => {
    const erros: string[] = [];

    if (!data.codigoProduto || !regex.codigoProduto.test(data.codigoProduto))
      erros.push('codigoProduto é obrigatório e deve seguir o formato P001.');

    if (!data.nome || data.nome.length < 3 || data.nome.length > 100)
      erros.push('nome é obrigatório e deve ter entre 3 e 100 caracteres.');

    if (!data.categoria || !['Calça', 'Saia', 'Vestido', 'Blusa', 'Bolsa', 'Acessório', 'Outro'].includes(data.categoria))
      erros.push('categoria é obrigatória e deve ser um dos valores válidos.');

    ['precoCusto', 'margemDeLucro', 'precoVenda'].forEach((campo) => {
      if (data[campo] === undefined || data[campo] === null || data[campo] < 0)
        erros.push(`${campo} é obrigatório e deve ser >= 0.`);
    });

    if (!data.dataCadastro || !regex.dataISO.test(data.dataCadastro))
      erros.push('dataCadastro é obrigatória e deve estar em formato ISO.');

    if (data.descricao && (data.descricao.length < 10 || data.descricao.length > 500))
      erros.push('descricao deve ter entre 10 e 500 caracteres.');

    if (data.dataAtualizacao && !regex.dataISO.test(data.dataAtualizacao))
      erros.push('dataAtualizacao deve estar em formato ISO.');

    return erros;
  },

  // -------------------- ESTOQUE --------------------
  estoque: (data: any): string[] => {
    const erros: string[] = [];

    if (data.codigoEstoque && !regex.codigoEstoque.test(data.codigoEstoque))
      erros.push('codigoEstoque deve seguir o formato E001.');

    if (!data.codigoProduto || !regex.codigoProduto.test(data.codigoProduto))
      erros.push('codigoProduto é obrigatório e deve seguir o formato P001.');

    if (data.quantidade === undefined || data.quantidade === null || data.quantidade < 0)
      erros.push('quantidade é obrigatória e deve ser >= 0.');

    if (data.ativo === undefined || data.ativo === null)
      erros.push('ativo é obrigatório.');

    if (data.emPromocao === undefined || data.emPromocao === null)
      erros.push('emPromocao é obrigatório.');

    if (data.isNovidade === undefined || data.isNovidade === null)
      erros.push('isNovidade é obrigatório.');

    if (data.precoPromocional !== null && data.precoPromocional !== undefined && data.precoPromocional < 0)
      erros.push('precoPromocional deve ser >= 0.');

    // Validar variantes
    if (data.variantes && Array.isArray(data.variantes)) {
      data.variantes.forEach((variante: any, vIdx: number) => {
        if (!variante.cor || typeof variante.cor !== 'string')
          erros.push(`variantes[${vIdx}]: cor é obrigatória.`);
        
        if (!variante.tamanhos || !Array.isArray(variante.tamanhos) || variante.tamanhos.length === 0)
          erros.push(`variantes[${vIdx}]: tamanhos é obrigatório e deve ter ao menos um tamanho.`);
        else {
          variante.tamanhos.forEach((tam: any, tIdx: number) => {
            if (!tam.tamanho || typeof tam.tamanho !== 'string')
              erros.push(`variantes[${vIdx}].tamanhos[${tIdx}]: tamanho é obrigatório.`);
            if (tam.quantidade === undefined || tam.quantidade === null || tam.quantidade < 0)
              erros.push(`variantes[${vIdx}].tamanhos[${tIdx}]: quantidade deve ser >= 0.`);
          });
        }
        
        if (variante.quantidade === undefined || variante.quantidade === null || variante.quantidade < 0)
          erros.push(`variantes[${vIdx}]: quantidade é obrigatória e deve ser >= 0.`);
      });
    }

    // Validar logPromocao se existir
    if (data.logPromocao && Array.isArray(data.logPromocao)) {
      data.logPromocao.forEach((log: any, idx: number) => {
        if (!log.dataInicio || !regex.dataISO.test(log.dataInicio))
          erros.push(`logPromocao[${idx}]: dataInicio é obrigatória e deve estar em formato ISO.`);
        if (log.precoPromocional === undefined || log.precoPromocional < 0)
          erros.push(`logPromocao[${idx}]: precoPromocional é obrigatório e deve ser >= 0.`);
        if (log.ativo === undefined || log.ativo === null)
          erros.push(`logPromocao[${idx}]: ativo é obrigatório.`);
        if (log.tipoDeDesconto && !['valorDireto', 'porcentagem'].includes(log.tipoDeDesconto))
          erros.push(`logPromocao[${idx}]: tipoDeDesconto deve ser 'valorDireto' ou 'porcentagem'.`);
      });
    }

    // Validar logMovimentacao se existir
    if (data.logMovimentacao && Array.isArray(data.logMovimentacao)) {
      data.logMovimentacao.forEach((log: any, idx: number) => {
        if (!['entrada', 'saida'].includes(log.tipo))
          erros.push(`logMovimentacao[${idx}]: tipo deve ser 'entrada' ou 'saida'.`);
        if (!log.data || !regex.dataISO.test(log.data))
          erros.push(`logMovimentacao[${idx}]: data é obrigatória e deve estar em formato ISO.`);
        if (log.quantidade === undefined || log.quantidade < 1)
          erros.push(`logMovimentacao[${idx}]: quantidade deve ser >= 1.`);
        if (log.origem && !['venda', 'compra', 'entrada', 'baixa no estoque'].includes(log.origem))
          erros.push(`logMovimentacao[${idx}]: origem deve ser um valor válido.`);
      });
    }

    if (!data.dataCadastro || !regex.dataISO.test(data.dataCadastro))
      erros.push('dataCadastro é obrigatória e deve estar em formato ISO.');

    if (data.dataAtualizacao && !regex.dataISO.test(data.dataAtualizacao))
      erros.push('dataAtualizacao deve estar em formato ISO.');

    return erros;
  },

  // -------------------- VENDA --------------------
  venda: (data: any): string[] => {
    const erros: string[] = [];

    if (!data.codigoVenda || !regex.codigoVenda.test(data.codigoVenda))
      erros.push('codigoVenda é obrigatório e deve seguir o formato VENDAyyyymmdd-xxx.');

    if (!data.data || !regex.dataISO.test(data.data))
      erros.push('data é obrigatória e deve estar em formato ISO.');

    if (!data.formaPagamento || !['Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro'].includes(data.formaPagamento))
      erros.push('formaPagamento é obrigatória e deve ser válida.');

    if (!data.total || data.total < 0)
      erros.push('total é obrigatório e deve ser >= 0.');

    if (!data.itens || !Array.isArray(data.itens) || data.itens.length < 1)
      erros.push('itens é obrigatório e deve ter ao menos um produto.');

    return erros;
  },

  // -------------------- VENDEDOR --------------------
  vendedor: (data: any): string[] => {
    const erros: string[] = [];
    const cleaned = limparDados(data);

    if (!cleaned.codigoVendedor || !regex.codigoVendedor.test(cleaned.codigoVendedor))
      erros.push('codigoVendedor é obrigatório e deve seguir o formato V001.');

    if (!cleaned.nome || cleaned.nome.length < 3 || cleaned.nome.length > 120)
      erros.push('nome é obrigatório e deve ter entre 3 e 120 caracteres.');

    if (!cleaned.dataCadastro || !regex.dataISO.test(cleaned.dataCadastro))
      erros.push('dataCadastro é obrigatória e deve estar em formato ISO.');

    if (cleaned.telefone && !regex.telefone.test(cleaned.telefone))
      erros.push('telefone deve estar no formato (XX) XXXXX-XXXX.');

    if (cleaned.metaMensal !== null && cleaned.metaMensal !== undefined && cleaned.metaMensal < 0)
      erros.push('metaMensal deve ser >= 0.');

    if (cleaned.observacao && cleaned.observacao.length > 300)
      erros.push('observacao deve ter no máximo 300 caracteres.');

    return erros;
  }
};

export default Validations;
