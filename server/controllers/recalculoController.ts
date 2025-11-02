import { Request, Response } from 'express';
import Venda from '../models/Venda';
import Cliente from '../models/Cliente';
import Vendedor from '../models/Vendedor';

export const recalcularTotais = async (req: Request, res: Response) => {
  try {
    console.log('Iniciando recálculo de totais...');
    
    // Buscar todas as vendas
    const vendas = await Venda.find();
    
    // Resetar todos os clientes
    await Cliente.updateMany({}, {
      $set: {
        quantidadeCompras: 0,
        valorTotalComprado: 0,
        dataUltimaCompra: null
      }
    });
    
    // Resetar todos os vendedores
    await Vendedor.updateMany({}, {
      $set: {
        vendasRealizadas: 0,
        totalVendido: 0
      }
    });
    
    // Agrupar vendas por cliente
    const vendasPorCliente: { [key: string]: { count: number; total: number; ultimaData: Date } } = {};
    const vendasPorVendedor: { [key: string]: { count: number; total: number } } = {};
    
    vendas.forEach(venda => {
      // Processar cliente
      const codigoCliente = venda.cliente.codigoCliente;
      if (!vendasPorCliente[codigoCliente]) {
        vendasPorCliente[codigoCliente] = { count: 0, total: 0, ultimaData: new Date(venda.data) };
      }
      vendasPorCliente[codigoCliente].count++;
      vendasPorCliente[codigoCliente].total += venda.total;
      
      const dataVenda = new Date(venda.data);
      if (dataVenda > vendasPorCliente[codigoCliente].ultimaData) {
        vendasPorCliente[codigoCliente].ultimaData = dataVenda;
      }
      
      // Processar vendedor
      const codigoVendedor = venda.vendedor.codigoVendedor || venda.vendedor.id;
      if (codigoVendedor) {
        if (!vendasPorVendedor[codigoVendedor]) {
          vendasPorVendedor[codigoVendedor] = { count: 0, total: 0 };
        }
        vendasPorVendedor[codigoVendedor].count++;
        vendasPorVendedor[codigoVendedor].total += venda.total;
      }
    });
    
    // Atualizar clientes
    const clientesAtualizados = [];
    for (const [codigoCliente, dados] of Object.entries(vendasPorCliente)) {
      const cliente = await Cliente.findOneAndUpdate(
        { codigoCliente },
        {
          $set: {
            quantidadeCompras: dados.count,
            valorTotalComprado: dados.total,
            dataUltimaCompra: dados.ultimaData
          }
        },
        { new: true }
      );
      if (cliente) {
        clientesAtualizados.push({
          codigo: codigoCliente,
          nome: cliente.nome,
          compras: dados.count,
          total: dados.total
        });
      }
    }
    
    // Atualizar vendedores
    const vendedoresAtualizados = [];
    for (const [codigoVendedor, dados] of Object.entries(vendasPorVendedor)) {
      const vendedor = await Vendedor.findOneAndUpdate(
        { codigoVendedor },
        {
          $set: {
            vendasRealizadas: dados.count,
            totalVendido: dados.total
          }
        },
        { new: true }
      );
      if (vendedor) {
        vendedoresAtualizados.push({
          codigo: codigoVendedor,
          nome: vendedor.nome,
          vendas: dados.count,
          total: dados.total
        });
      }
    }
    
    console.log('Recálculo concluído!');
    console.log(`Clientes atualizados: ${clientesAtualizados.length}`);
    console.log(`Vendedores atualizados: ${vendedoresAtualizados.length}`);
    
    res.json({
      success: true,
      message: 'Totais recalculados com sucesso',
      totalVendas: vendas.length,
      clientesAtualizados: clientesAtualizados.length,
      vendedoresAtualizados: vendedoresAtualizados.length,
      detalhes: {
        clientes: clientesAtualizados,
        vendedores: vendedoresAtualizados
      }
    });
  } catch (error) {
    console.error('Erro ao recalcular totais:', error);
    res.status(500).json({ 
      error: 'Erro ao recalcular totais',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
};
