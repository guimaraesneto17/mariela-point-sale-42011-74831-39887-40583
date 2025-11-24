import { Request, Response } from 'express';
import Venda from '../models/Venda';
import Estoque from '../models/Estoque';
import Cliente from '../models/Cliente';
import Vendedor from '../models/Vendedor';
import Caixa from '../models/Caixa';
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
        // Buscar estoque pelo código do produto
        const estoque = await Estoque.findOne({ 
          codigoProduto: item.codigoProduto
        });
        
        if (estoque && estoque.variantes && estoque.variantes.length > 0) {
          // Buscar a variante específica pela cor
          const varianteIndex = estoque.variantes.findIndex(
            (v: any) => v.cor === item.cor
          );
          
          if (varianteIndex !== -1) {
            const variante = estoque.variantes[varianteIndex];
            
            // Verificar se a variante tem array de tamanhos
            if (Array.isArray(variante.tamanhos) && variante.tamanhos.length > 0) {
              // Nova estrutura: array de objetos {tamanho, quantidade}
              if (typeof variante.tamanhos[0] === 'object' && variante.tamanhos[0].tamanho) {
                const tamanhoIndex = variante.tamanhos.findIndex((t: any) => String(t.tamanho) === String(item.tamanho));
                
                if (tamanhoIndex !== -1) {
                  const tamanhoObj = variante.tamanhos[tamanhoIndex];
                  
                  // Verificar quantidade suficiente
                  if (tamanhoObj.quantidade < item.quantidade) {
                    return res.status(400).json({
                      error: 'Quantidade insuficiente no estoque',
                      message: `Produto ${item.nomeProduto} (${item.cor} - ${item.tamanho}) possui apenas ${tamanhoObj.quantidade} unidades disponíveis`,
                      produto: item.codigoProduto,
                      variante: { cor: item.cor, tamanho: item.tamanho }
                    });
                  }
                  
                  // Dar baixa no tamanho específico
                  estoque.variantes[varianteIndex].tamanhos[tamanhoIndex].quantidade -= item.quantidade;
                  
                  // Atualizar quantidade total da variante (cor)
                  estoque.variantes[varianteIndex].quantidade = variante.tamanhos.reduce(
                    (total: number, t: any) => total + (t.quantidade || 0),
                    0
                  );
                }
              }
            } else if (variante.tamanho === item.tamanho) {
              // Estrutura antiga: tamanho direto na variante
              if (variante.quantidade < item.quantidade) {
                return res.status(400).json({
                  error: 'Quantidade insuficiente no estoque',
                  message: `Produto ${item.nomeProduto} (${item.cor} - ${item.tamanho}) possui apenas ${variante.quantidade} unidades disponíveis`,
                  produto: item.codigoProduto,
                  variante: { cor: item.cor, tamanho: item.tamanho }
                });
              }
              
              // Dar baixa na variante
              estoque.variantes[varianteIndex].quantidade -= item.quantidade;
            }
            
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
            console.warn(`Variante cor não encontrada: ${item.codigoProduto} - ${item.cor}`);
          }
        }
      } catch (estoqueError) {
        console.error(`Erro ao processar estoque do produto ${item.codigoProduto}:`, estoqueError);
        // Continua processando os outros itens mesmo se houver erro
      }
    }
    
    await venda.save();
    
    // Atualizar dados do cliente
    try {
      await Cliente.findOneAndUpdate(
        { codigoCliente: venda.cliente.codigoCliente },
        {
          $inc: { 
            quantidadeCompras: 1,
            valorTotalComprado: venda.total 
          },
          $set: { dataUltimaCompra: new Date() }
        }
      );
    } catch (clienteError) {
      console.error('Erro ao atualizar dados do cliente:', clienteError);
    }
    
    // Atualizar dados do vendedor
    try {
      await Vendedor.findOneAndUpdate(
        { codigoVendedor: venda.vendedor.codigoVendedor },
        {
          $inc: { 
            vendasRealizadas: 1,
            totalVendido: venda.total 
          }
        }
      );
    } catch (vendedorError) {
      console.error('Erro ao atualizar dados do vendedor:', vendedorError);
    }
    
    // Registrar venda automaticamente no caixa aberto
    try {
      const caixaAberto = await Caixa.findOne({ status: 'aberto' });
      if (caixaAberto) {
        // Usar valorRecebido (que já desconta as taxas) em vez do total
        const valorEntrada = venda.valorRecebido || venda.total;
        
        caixaAberto.movimentos.push({
          tipo: 'entrada',
          valor: valorEntrada,
          data: venda.data.toISOString(),
          codigoVenda: venda.codigoVenda,
          formaPagamento: venda.formaPagamento,
          observacao: `Venda ${venda.codigoVenda} - ${venda.cliente.nome} (${venda.formaPagamento})`
        });

        // Recalcular totais do caixa
        caixaAberto.entrada = caixaAberto.movimentos
          .filter((m: any) => m.tipo === 'entrada')
          .reduce((sum: number, m: any) => sum + m.valor, 0);

        caixaAberto.saida = caixaAberto.movimentos
          .filter((m: any) => m.tipo === 'saida')
          .reduce((sum: number, m: any) => sum + m.valor, 0);

        caixaAberto.performance = caixaAberto.entrada - caixaAberto.saida;

        await caixaAberto.save();
        console.log(`✅ Venda ${venda.codigoVenda} registrada no caixa ${caixaAberto.codigoCaixa}`);
      } else {
        console.warn('⚠️ Nenhum caixa aberto encontrado para registrar a venda');
      }
    } catch (caixaError) {
      console.error('Erro ao registrar venda no caixa:', caixaError);
      // Não falha a venda se houver erro ao registrar no caixa
    }
    
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
