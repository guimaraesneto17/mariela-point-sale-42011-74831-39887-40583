import { Request, Response } from 'express';
import Venda from '../models/Venda';
import Estoque from '../models/Estoque';
import Validations from '../utils/validations';

// Helper para formatar erros de validação do Mongoose
const formatValidationError = (error: any) => {
  if (error.name === 'ValidationError') {
    const errors = Object.keys(error.errors).map(key => ({
      field: key,
      message: error.errors[key].message,
      value: error.errors[key].value
    }));
    return {
      error: 'Erro de validação',
      message: 'Um ou mais campos estão inválidos',
      fields: errors
    };
  }
  
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return {
      error: 'Erro de duplicação',
      message: `O campo ${field} já existe no sistema`,
      fields: [{ field, message: 'Valor duplicado', value: error.keyValue[field] }]
    };
  }
  
  return {
    error: 'Erro ao processar requisição',
    message: error.message || 'Erro desconhecido'
  };
};

export const getAllVendas = async (req: Request, res: Response) => {
  try {
    const vendas = await Venda.find().sort({ data: -1 });
    res.json(vendas);
  } catch (error) {
    console.error('Erro ao buscar vendas:', error);
    res.status(500).json({ error: 'Erro ao buscar vendas' });
  }
};

export const getVendaByCodigo = async (req: Request, res: Response) => {
  try {
    const venda = await Venda.findOne({ codigoVenda: req.params.codigo });
    if (!venda) {
      return res.status(404).json({ error: 'Venda não encontrada' });
    }
    res.json(venda);
  } catch (error) {
    console.error('Erro ao buscar venda:', error);
    res.status(500).json({ error: 'Erro ao buscar venda' });
  }
};

export const createVenda = async (req: Request, res: Response) => {
  try {
    // Validar dados antes de criar
    const erros = Validations.venda(req.body);
    if (erros.length > 0) {
      return res.status(400).json({
        error: 'Erro de validação',
        message: 'Um ou mais campos estão inválidos',
        fields: erros.map(erro => ({ message: erro }))
      });
    }

    const venda = new Venda(req.body);
    
    // Processar baixa no estoque para cada item da venda
    for (const item of venda.itens) {
      try {
        // Buscar estoque pela combinação de produto, cor e tamanho
        const estoque = await Estoque.findOne({ 
          codigoProduto: item.codigoProduto
        });
        
        if (estoque && estoque.variantes && estoque.variantes.length > 0) {
          // Buscar a variante específica (cor e tamanho)
          const varianteIndex = estoque.variantes.findIndex(
            (v: any) => v.cor === item.cor && v.tamanho === item.tamanho
          );
          
          if (varianteIndex !== -1) {
            const variante = estoque.variantes[varianteIndex];
            
            // Verificar se há quantidade suficiente na variante
            if (variante.quantidade < item.quantidade) {
              return res.status(400).json({
                error: 'Quantidade insuficiente no estoque',
                message: `Produto ${item.nomeProduto} (${item.cor} - ${item.tamanho}) possui apenas ${variante.quantidade} unidades disponíveis`,
                produto: item.codigoProduto,
                variante: { cor: item.cor, tamanho: item.tamanho }
              });
            }
            
            // Dar baixa na variante específica
            estoque.variantes[varianteIndex].quantidade -= item.quantidade;
            
            // Atualizar quantidade total do estoque
            estoque.quantidade = estoque.variantes.reduce(
              (total: number, v: any) => total + (v.quantidade || 0), 
              0
            );
            
            // Registrar movimentação
            estoque.logMovimentacao.push({
              tipo: 'saida',
              quantidade: item.quantidade,
              data: new Date(),
              origem: 'venda',
              codigoVenda: venda.codigoVenda,
              observacao: `Venda - ${item.cor} - ${item.tamanho}`
            } as any);
            
            await estoque.save();
          } else {
            console.warn(`Variante não encontrada: ${item.codigoProduto} - ${item.cor} - ${item.tamanho}`);
          }
        }
      } catch (estoqueError) {
        console.error(`Erro ao processar estoque do produto ${item.codigoProduto}:`, estoqueError);
        // Continua processando os outros itens mesmo se houver erro
      }
    }
    
    await venda.save();
    res.status(201).json(venda);
  } catch (error) {
    console.error('Erro ao criar venda:', error);
    res.status(400).json(formatValidationError(error));
  }
};

export const updateVenda = async (req: Request, res: Response) => {
  try {
    // Validar dados antes de atualizar
    const erros = Validations.venda(req.body);
    if (erros.length > 0) {
      return res.status(400).json({
        error: 'Erro de validação',
        message: 'Um ou mais campos estão inválidos',
        fields: erros.map(erro => ({ message: erro }))
      });
    }

    const venda = await Venda.findOneAndUpdate(
      { codigoVenda: req.params.codigo },
      req.body,
      { new: true, runValidators: true }
    );
    if (!venda) {
      return res.status(404).json({ error: 'Venda não encontrada' });
    }
    res.json(venda);
  } catch (error) {
    console.error('Erro ao atualizar venda:', error);
    res.status(400).json(formatValidationError(error));
  }
};

export const deleteVenda = async (req: Request, res: Response) => {
  try {
    const venda = await Venda.findOneAndDelete({ codigoVenda: req.params.codigo });
    if (!venda) {
      return res.status(404).json({ error: 'Venda não encontrada' });
    }
    res.json({ message: 'Venda removida com sucesso' });
  } catch (error) {
    console.error('Erro ao remover venda:', error);
    res.status(500).json({ error: 'Erro ao remover venda' });
  }
};
