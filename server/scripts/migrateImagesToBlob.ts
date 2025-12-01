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

// Configurações de migração
const BATCH_SIZE = 5; // Processar 5 documentos por vez
const DELAY_BETWEEN_BATCHES = 2000; // 2 segundos entre batches
const MAX_RETRIES = 3; // Número máximo de tentativas por operação

// Função para delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Função para retry com backoff exponencial
async function retryOperation<T>(
  operation: () => Promise<T>,
  retries: number = MAX_RETRIES,
  delayMs: number = 1000
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries === 0) throw error;
    
    console.log(`  ⚠️  Tentativa falhou, tentando novamente em ${delayMs}ms... (${retries} tentativas restantes)`);
    await delay(delayMs);
    return retryOperation(operation, retries - 1, delayMs * 2);
  }
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
    
    // Buscar total de documentos primeiro
    const totalCount = await Estoque.countDocuments({});
    console.log(`  📊 Total de documentos: ${totalCount}`);
    
    // Processar em batches
    for (let skip = 0; skip < totalCount; skip += BATCH_SIZE) {
      const batchNumber = Math.floor(skip / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(totalCount / BATCH_SIZE);
      
      console.log(`\n  📦 Processando batch ${batchNumber}/${totalBatches} (documentos ${skip + 1}-${Math.min(skip + BATCH_SIZE, totalCount)})`);
      
      // Buscar batch de documentos com retry
      const estoques = await retryOperation(() => 
        Estoque.find({})
          .skip(skip)
          .limit(BATCH_SIZE)
          .maxTimeMS(60000) // 60 segundos de timeout por query
          .exec()
      );
      
      stats.totalDocuments += estoques.length;
      
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
                    console.log(`    ↑ Uploading image for ${estoque.codigoProduto} - ${variante.cor}...`);
                    const result = await retryOperation(() => uploadImageToBlob(imagem));
                    newImagens.push(result.urls.full);
                    stats.migratedImages++;
                    hasChanges = true;
                    console.log(`    ✓ Uploaded successfully`);
                  } catch (error: any) {
                    console.error(`    ✗ Failed to upload image after retries: ${error.message}`);
                    stats.failedImages++;
                    stats.errors.push(`${estoque.codigoProduto} - ${variante.cor}: ${error.message}`);
                    newImagens.push(imagem);
                  }
                } else {
                  newImagens.push(imagem);
                }
              }
              
              variante.imagens = newImagens;
            }
          }
        }
        
        // Salvar se houve mudanças com retry
        if (hasChanges) {
          try {
            await retryOperation(() => estoque.save());
            console.log(`    ✓ Saved ${estoque.codigoProduto}`);
          } catch (error: any) {
            console.error(`    ✗ Failed to save ${estoque.codigoProduto}: ${error.message}`);
            stats.errors.push(`Save error for ${estoque.codigoProduto}: ${error.message}`);
          }
        }
      }
      
      // Delay entre batches para não sobrecarregar o servidor
      if (skip + BATCH_SIZE < totalCount) {
        console.log(`  ⏳ Aguardando ${DELAY_BETWEEN_BATCHES}ms antes do próximo batch...`);
        await delay(DELAY_BETWEEN_BATCHES);
      }
    }
    
    console.log('\n✅ Migração do Estoque concluída!');
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
    
    // Buscar total de documentos primeiro
    const totalCount = await VitrineVirtual.countDocuments({});
    console.log(`  📊 Total de documentos: ${totalCount}`);
    
    // Processar em batches
    for (let skip = 0; skip < totalCount; skip += BATCH_SIZE) {
      const batchNumber = Math.floor(skip / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(totalCount / BATCH_SIZE);
      
      console.log(`\n  🛍️  Processando batch ${batchNumber}/${totalBatches} (documentos ${skip + 1}-${Math.min(skip + BATCH_SIZE, totalCount)})`);
      
      // Buscar batch de documentos com retry
      const produtos = await retryOperation(() => 
        VitrineVirtual.find({})
          .skip(skip)
          .limit(BATCH_SIZE)
          .maxTimeMS(60000) // 60 segundos de timeout por query
          .exec()
      );
      
      stats.totalDocuments += produtos.length;
      
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
                    console.log(`    ↑ Uploading image for ${produto.codigoProduto} - ${variante.cor}...`);
                    const result = await retryOperation(() => uploadImageToBlob(imagem));
                    newImagens.push(result.urls.full);
                    stats.migratedImages++;
                    hasChanges = true;
                    console.log(`    ✓ Uploaded successfully`);
                  } catch (error: any) {
                    console.error(`    ✗ Failed to upload image after retries: ${error.message}`);
                    stats.failedImages++;
                    stats.errors.push(`${produto.codigoProduto} - ${variante.cor}: ${error.message}`);
                    newImagens.push(imagem);
                  }
                } else {
                  newImagens.push(imagem);
                }
              }
              
              variante.imagens = newImagens;
            }
          }
        }
        
        // Salvar se houve mudanças com retry
        if (hasChanges) {
          try {
            await retryOperation(() => produto.save());
            console.log(`    ✓ Saved ${produto.codigoProduto}`);
          } catch (error: any) {
            console.error(`    ✗ Failed to save ${produto.codigoProduto}: ${error.message}`);
            stats.errors.push(`Save error for ${produto.codigoProduto}: ${error.message}`);
          }
        }
      }
      
      // Delay entre batches para não sobrecarregar o servidor
      if (skip + BATCH_SIZE < totalCount) {
        console.log(`  ⏳ Aguardando ${DELAY_BETWEEN_BATCHES}ms antes do próximo batch...`);
        await delay(DELAY_BETWEEN_BATCHES);
      }
    }
    
    console.log('\n✅ Migração da Vitrine Virtual concluída!');
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
