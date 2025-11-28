import connectDatabase from '../config/database';
import Estoque from '../models/Estoque';
import VitrineVirtual from '../models/VitrineVirtual';
import { uploadImageToBlob, isBase64Image } from '../services/imageUploadService';

/**
 * Script de migração de imagens base64 para Vercel Blob Storage
 * 
 * Este script:
 * 1. Busca todas as imagens base64 armazenadas no MongoDB
 * 2. Faz upload para o Vercel Blob Storage
 * 3. Substitui o base64 pela URL da imagem
 * 4. Salva as alterações no MongoDB
 * 
 * Executar com: npm run migrate-images
 */

interface MigrationStats {
  totalDocuments: number;
  totalImages: number;
  migratedImages: number;
  failedImages: number;
  errors: string[];
}

async function migrateEstoqueImages(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    totalDocuments: 0,
    totalImages: 0,
    migratedImages: 0,
    failedImages: 0,
    errors: []
  };

  try {
    console.log('\n📦 Migrando imagens do Estoque...');
    
    const estoques = await Estoque.find({});
    stats.totalDocuments = estoques.length;
    
    for (const estoque of estoques) {
      let hasChanges = false;
      
      // Processar imagens das variantes
      if (estoque.variantes && Array.isArray(estoque.variantes)) {
        for (const variante of estoque.variantes) {
          if (variante.imagens && Array.isArray(variante.imagens)) {
            const newImagens: string[] = [];
            
            for (const imagem of variante.imagens) {
              stats.totalImages++;
              
              if (isBase64Image(imagem)) {
                try {
                  console.log(`  ↑ Uploading image for ${estoque.codigoProduto} - ${variante.cor}...`);
                  const result = await uploadImageToBlob(imagem);
                  newImagens.push(result.url);
                  stats.migratedImages++;
                  hasChanges = true;
                } catch (error: any) {
                  console.error(`  ✗ Failed to upload image: ${error.message}`);
                  stats.failedImages++;
                  stats.errors.push(`${estoque.codigoProduto} - ${variante.cor}: ${error.message}`);
                  newImagens.push(imagem); // Mantém a imagem original em caso de erro
                }
              } else {
                newImagens.push(imagem); // Já é URL, mantém
              }
            }
            
            variante.imagens = newImagens;
          }
        }
      }
      
      // Salvar se houve mudanças
      if (hasChanges) {
        await estoque.save();
        console.log(`  ✓ Saved ${estoque.codigoProduto}`);
      }
    }
    
    console.log('✅ Migração do Estoque concluída!');
  } catch (error: any) {
    console.error('❌ Erro na migração do Estoque:', error);
    stats.errors.push(`Estoque migration error: ${error.message}`);
  }
  
  return stats;
}

async function migrateVitrineImages(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    totalDocuments: 0,
    totalImages: 0,
    migratedImages: 0,
    failedImages: 0,
    errors: []
  };

  try {
    console.log('\n🛍️  Migrando imagens da Vitrine Virtual...');
    
    const produtos = await VitrineVirtual.find({});
    stats.totalDocuments = produtos.length;
    
    for (const produto of produtos) {
      let hasChanges = false;
      
      // Processar imagens das variantes
      if (produto.variantes && Array.isArray(produto.variantes)) {
        for (const variante of produto.variantes) {
          if (variante.imagens && Array.isArray(variante.imagens)) {
            const newImagens: string[] = [];
            
            for (const imagem of variante.imagens) {
              stats.totalImages++;
              
              if (isBase64Image(imagem)) {
                try {
                  console.log(`  ↑ Uploading image for ${produto.codigoProduto} - ${variante.cor}...`);
                  const result = await uploadImageToBlob(imagem);
                  newImagens.push(result.url);
                  stats.migratedImages++;
                  hasChanges = true;
                } catch (error: any) {
                  console.error(`  ✗ Failed to upload image: ${error.message}`);
                  stats.failedImages++;
                  stats.errors.push(`${produto.codigoProduto} - ${variante.cor}: ${error.message}`);
                  newImagens.push(imagem); // Mantém a imagem original em caso de erro
                }
              } else {
                newImagens.push(imagem); // Já é URL, mantém
              }
            }
            
            variante.imagens = newImagens;
          }
        }
      }
      
      // Salvar se houve mudanças
      if (hasChanges) {
        await produto.save();
        console.log(`  ✓ Saved ${produto.codigoProduto}`);
      }
    }
    
    console.log('✅ Migração da Vitrine Virtual concluída!');
  } catch (error: any) {
    console.error('❌ Erro na migração da Vitrine Virtual:', error);
    stats.errors.push(`Vitrine migration error: ${error.message}`);
  }
  
  return stats;
}

async function runMigration() {
  console.log('🚀 Iniciando migração de imagens para Vercel Blob Storage...\n');
  console.log('⚠️  IMPORTANTE: Certifique-se de que a variável BLOB_READ_WRITE_TOKEN está configurada!\n');
  
  try {
    // Conectar ao banco de dados
    console.log('🔌 Conectando ao MongoDB...');
    await connectDatabase();
    console.log('✓ Conectado!\n');
    
    // Migrar Estoque
    const estoqueStats = await migrateEstoqueImages();
    
    // Migrar Vitrine Virtual
    const vitrineStats = await migrateVitrineImages();
    
    // Estatísticas finais
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DA MIGRAÇÃO');
    console.log('='.repeat(60));
    console.log('\n📦 Estoque:');
    console.log(`  • Documentos processados: ${estoqueStats.totalDocuments}`);
    console.log(`  • Total de imagens: ${estoqueStats.totalImages}`);
    console.log(`  • Imagens migradas: ${estoqueStats.migratedImages}`);
    console.log(`  • Falhas: ${estoqueStats.failedImages}`);
    
    console.log('\n🛍️  Vitrine Virtual:');
    console.log(`  • Documentos processados: ${vitrineStats.totalDocuments}`);
    console.log(`  • Total de imagens: ${vitrineStats.totalImages}`);
    console.log(`  • Imagens migradas: ${vitrineStats.migratedImages}`);
    console.log(`  • Falhas: ${vitrineStats.failedImages}`);
    
    console.log('\n📈 Total Geral:');
    console.log(`  • Documentos: ${estoqueStats.totalDocuments + vitrineStats.totalDocuments}`);
    console.log(`  • Imagens: ${estoqueStats.totalImages + vitrineStats.totalImages}`);
    console.log(`  • Migradas: ${estoqueStats.migratedImages + vitrineStats.migratedImages}`);
    console.log(`  • Falhas: ${estoqueStats.failedImages + vitrineStats.failedImages}`);
    
    if (estoqueStats.errors.length > 0 || vitrineStats.errors.length > 0) {
      console.log('\n⚠️  Erros encontrados:');
      [...estoqueStats.errors, ...vitrineStats.errors].forEach(error => {
        console.log(`  • ${error}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Migração concluída!');
    console.log('='.repeat(60));
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erro fatal na migração:', error);
    process.exit(1);
  }
}

// Executar migração
runMigration();
