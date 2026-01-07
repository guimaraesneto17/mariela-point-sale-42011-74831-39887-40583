import { Request, Response, NextFunction } from 'express';
import Validations from '../utils/validations';

/**
 * Configuração de limites de validação
 */
const VALIDATION_LIMITS = {
  // Limites de query params
  page: { min: 1, max: 10000 },
  limit: { min: 1, max: 500 },
  search: { maxLength: 200 },
  
  // Limites de upload
  image: {
    maxSizeMB: 10, // 10MB por imagem
    maxImages: 20, // máximo de imagens por request
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  },
  
  // Limites de campos de texto
  text: {
    nome: { min: 2, max: 150 },
    descricao: { min: 0, max: 1000 },
    observacao: { min: 0, max: 500 }
  }
};

/**
 * Interface para erros de validação
 */
interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

/**
 * Resposta padronizada de erro de validação
 */
const sendValidationError = (res: Response, errors: ValidationError[]) => {
  return res.status(400).json({
    error: 'Erro de validação',
    message: 'Um ou mais campos estão inválidos',
    fields: errors
  });
};

/**
 * Middleware para validar query params de paginação
 */
export const validatePaginationParams = (req: Request, res: Response, next: NextFunction) => {
  const errors: ValidationError[] = [];
  
  // Validar page
  if (req.query.page !== undefined) {
    const page = parseInt(req.query.page as string);
    if (isNaN(page) || page < VALIDATION_LIMITS.page.min || page > VALIDATION_LIMITS.page.max) {
      errors.push({
        field: 'page',
        message: `page deve ser um número entre ${VALIDATION_LIMITS.page.min} e ${VALIDATION_LIMITS.page.max}`,
        value: req.query.page
      });
    } else {
      req.query.page = String(page); // sanitize
    }
  }
  
  // Validar limit
  if (req.query.limit !== undefined) {
    const limit = parseInt(req.query.limit as string);
    if (isNaN(limit) || limit < VALIDATION_LIMITS.limit.min || limit > VALIDATION_LIMITS.limit.max) {
      errors.push({
        field: 'limit',
        message: `limit deve ser um número entre ${VALIDATION_LIMITS.limit.min} e ${VALIDATION_LIMITS.limit.max}`,
        value: req.query.limit
      });
    } else {
      req.query.limit = String(limit); // sanitize
    }
  }
  
  // Validar search
  if (req.query.search !== undefined) {
    const search = String(req.query.search);
    if (search.length > VALIDATION_LIMITS.search.maxLength) {
      errors.push({
        field: 'search',
        message: `search deve ter no máximo ${VALIDATION_LIMITS.search.maxLength} caracteres`,
        value: search.substring(0, 50) + '...'
      });
    } else {
      // Sanitize: remover caracteres potencialmente perigosos para regex
      req.query.search = search.replace(/[<>{}]/g, '');
    }
  }
  
  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }
  
  next();
};

/**
 * Middleware para validar códigos em params (P001, C001, etc.)
 */
export const validateCodeParam = (pattern: RegExp, fieldName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const codigo = req.params.codigo;
    
    if (!codigo) {
      return sendValidationError(res, [{
        field: 'codigo',
        message: `${fieldName} é obrigatório`
      }]);
    }
    
    // Sanitize: uppercase and trim
    const sanitizedCode = codigo.trim().toUpperCase();
    
    if (!pattern.test(sanitizedCode)) {
      return sendValidationError(res, [{
        field: 'codigo',
        message: `${fieldName} deve seguir o formato correto`,
        value: codigo
      }]);
    }
    
    req.params.codigo = sanitizedCode;
    next();
  };
};

/**
 * Factory para criar middleware de validação de entidade
 */
export const validateEntity = (entityType: keyof typeof Validations) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const validator = Validations[entityType];
    
    if (!validator) {
      console.warn(`Validador não encontrado para: ${entityType}`);
      return next();
    }
    
    const errors = validator(req.body);
    
    if (errors.length > 0) {
      return sendValidationError(res, errors.map(err => ({
        field: err.split(' ')[0],
        message: err
      })));
    }
    
    next();
  };
};

/**
 * Middleware para validar upload de imagens
 */
export const validateImageUpload = (req: Request, res: Response, next: NextFunction) => {
  const errors: ValidationError[] = [];
  
  // Validar imagem única
  if (req.body.image) {
    const imageError = validateBase64Image(req.body.image);
    if (imageError) {
      errors.push({ field: 'image', message: imageError });
    }
  }
  
  // Validar múltiplas imagens
  if (req.body.images) {
    if (!Array.isArray(req.body.images)) {
      errors.push({ field: 'images', message: 'images deve ser um array' });
    } else if (req.body.images.length > VALIDATION_LIMITS.image.maxImages) {
      errors.push({ 
        field: 'images', 
        message: `Máximo de ${VALIDATION_LIMITS.image.maxImages} imagens permitidas`,
        value: req.body.images.length
      });
    } else {
      req.body.images.forEach((img: any, index: number) => {
        const imageError = validateBase64Image(img);
        if (imageError) {
          errors.push({ field: `images[${index}]`, message: imageError });
        }
      });
    }
  }
  
  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }
  
  next();
};

/**
 * Valida uma imagem base64
 */
function validateBase64Image(image: any): string | null {
  if (typeof image !== 'string') {
    return 'Imagem deve ser uma string base64';
  }
  
  // Verificar se é base64 válido
  const base64Regex = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;
  if (!base64Regex.test(image)) {
    return 'Formato de imagem inválido. Use JPEG, PNG, GIF ou WebP em base64';
  }
  
  // Verificar tamanho aproximado (base64 é ~33% maior que o binário)
  const base64Data = image.split(',')[1];
  if (base64Data) {
    const sizeInBytes = (base64Data.length * 3) / 4;
    const sizeInMB = sizeInBytes / (1024 * 1024);
    
    if (sizeInMB > VALIDATION_LIMITS.image.maxSizeMB) {
      return `Imagem excede o limite de ${VALIDATION_LIMITS.image.maxSizeMB}MB (tamanho: ${sizeInMB.toFixed(2)}MB)`;
    }
  }
  
  return null;
}

/**
 * Middleware para sanitizar body de requisição
 */
export const sanitizeBody = (req: Request, res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
};

/**
 * Sanitiza um objeto recursivamente
 */
function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key of Object.keys(obj)) {
      // Remover campos com nomes suspeitos
      if (key.startsWith('$') || key.startsWith('__')) {
        continue;
      }
      sanitized[key] = sanitizeObject(obj[key]);
    }
    return sanitized;
  }
  
  if (typeof obj === 'string') {
    // Trim strings e remover caracteres de controle
    return obj.trim().replace(/[\x00-\x1F\x7F]/g, '');
  }
  
  return obj;
}

/**
 * Padrões de códigos para validação
 */
export const CODE_PATTERNS = {
  produto: /^P\d{3}$/,
  cliente: /^C\d{3}$/,
  fornecedor: /^F\d{3}$/,
  estoque: /^E\d{3}$/,
  vendedor: /^V\d{3}$/,
  venda: /^VENDA\d{8}-\d{3}$/,
  caixa: /^CX\d{6}$/
};

/**
 * Middleware combinado para rotas de listagem
 */
export const validateListRoute = [
  sanitizeBody,
  validatePaginationParams
];

/**
 * Middleware combinado para rotas de criação/atualização
 */
export const createValidationMiddleware = (entityType: keyof typeof Validations) => [
  sanitizeBody,
  validateEntity(entityType)
];

/**
 * Middleware combinado para rotas com código no param
 */
export const createCodeValidationMiddleware = (entityType: keyof typeof CODE_PATTERNS) => [
  sanitizeBody,
  validateCodeParam(CODE_PATTERNS[entityType], `código${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`)
];
