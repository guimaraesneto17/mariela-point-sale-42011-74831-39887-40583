import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CleanupResult {
  totalImagesChecked: number;
  orphanImagesFound: number;
  imagesDeleted: number;
  imagesFailed: number;
  deletedImages: string[];
  failedImages: Array<{ path: string; error: string }>;
  storageFreed: number;
  executionTime: number;
  status: 'success' | 'partial' | 'failed';
  errorMessage?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    // Criar cliente Supabase com service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log('[Cleanup] Iniciando limpeza de imagens órfãs...');

    // 1. Buscar todas as imagens no storage
    const { data: storageFiles, error: storageError } = await supabaseAdmin
      .storage
      .from('product-images')
      .list('products', {
        limit: 10000,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (storageError) {
      throw new Error(`Erro ao listar arquivos do storage: ${storageError.message}`);
    }

    console.log(`[Cleanup] Total de arquivos no storage: ${storageFiles?.length || 0}`);

    // 2. Buscar todas as imagens referenciadas no MongoDB através do backend
    const BACKEND_API = Deno.env.get('BACKEND_API_URL') || 'https://mariela-pdv-backend.onrender.com/api';
    
    let referencedImages: Set<string> = new Set();
    
    try {
      // Buscar produtos da vitrine
      const vitrineResponse = await fetch(`${BACKEND_API}/vitrine-virtual`);
      if (vitrineResponse.ok) {
        const vitrineData = await vitrineResponse.json();
        vitrineData.forEach((produto: any) => {
          if (produto.imagemPrincipal) {
            const filename = produto.imagemPrincipal.split('/').pop();
            if (filename) referencedImages.add(filename);
          }
          if (produto.imagensAdicionais && Array.isArray(produto.imagensAdicionais)) {
            produto.imagensAdicionais.forEach((img: string) => {
              const filename = img.split('/').pop();
              if (filename) referencedImages.add(filename);
            });
          }
        });
      }

      // Buscar produtos do estoque
      const estoqueResponse = await fetch(`${BACKEND_API}/estoque`);
      if (estoqueResponse.ok) {
        const estoqueData = await estoqueResponse.json();
        estoqueData.forEach((produto: any) => {
          if (produto.imagens && Array.isArray(produto.imagens)) {
            produto.imagens.forEach((img: any) => {
              if (typeof img === 'string') {
                const filename = img.split('/').pop();
                if (filename) referencedImages.add(filename);
              } else if (img?.urls) {
                ['thumbnail', 'medium', 'full'].forEach(version => {
                  if (img.urls[version]) {
                    const filename = img.urls[version].split('/').pop();
                    if (filename) referencedImages.add(filename);
                  }
                });
              }
            });
          }
          // Variantes também podem ter imagens
          if (produto.variantes && Array.isArray(produto.variantes)) {
            produto.variantes.forEach((variante: any) => {
              if (variante.imagens && Array.isArray(variante.imagens)) {
                variante.imagens.forEach((img: any) => {
                  if (typeof img === 'string') {
                    const filename = img.split('/').pop();
                    if (filename) referencedImages.add(filename);
                  } else if (img?.urls) {
                    ['thumbnail', 'medium', 'full'].forEach(version => {
                      if (img.urls[version]) {
                        const filename = img.urls[version].split('/').pop();
                        if (filename) referencedImages.add(filename);
                      }
                    });
                  }
                });
              }
            });
          }
        });
      }
    } catch (error) {
      console.error('[Cleanup] Erro ao buscar imagens referenciadas:', error);
    }

    console.log(`[Cleanup] Total de imagens referenciadas: ${referencedImages.size}`);

    // 3. Identificar imagens órfãs
    const orphanImages = storageFiles?.filter(file => !referencedImages.has(file.name)) || [];
    
    console.log(`[Cleanup] Imagens órfãs encontradas: ${orphanImages.length}`);

    // 4. Deletar imagens órfãs (se auto_delete estiver habilitado)
    const { data: config } = await supabaseAdmin
      .from('cleanup_cron_config')
      .select('*')
      .single();

    const shouldDelete = config?.auto_delete ?? false;
    
    const deletedImages: string[] = [];
    const failedImages: Array<{ path: string; error: string }> = [];
    let storageFreed = 0;

    if (shouldDelete && orphanImages.length > 0) {
      console.log('[Cleanup] Modo auto-delete ativado. Deletando imagens...');
      
      for (const file of orphanImages) {
        const filePath = `products/${file.name}`;
        
        try {
          const { error: deleteError } = await supabaseAdmin
            .storage
            .from('product-images')
            .remove([filePath]);

          if (deleteError) {
            console.error(`[Cleanup] Erro ao deletar ${filePath}:`, deleteError);
            failedImages.push({ path: filePath, error: deleteError.message });
          } else {
            deletedImages.push(filePath);
            storageFreed += file.metadata?.size || 0;
            console.log(`[Cleanup] ✓ Deletado: ${filePath}`);
          }
        } catch (error: any) {
          console.error(`[Cleanup] Exceção ao deletar ${filePath}:`, error);
          failedImages.push({ path: filePath, error: error.message });
        }
      }
    } else {
      console.log('[Cleanup] Modo somente leitura. Nenhuma imagem será deletada.');
    }

    const executionTime = Date.now() - startTime;
    
    // 5. Determinar status
    let status: 'success' | 'partial' | 'failed' = 'success';
    if (failedImages.length > 0 && deletedImages.length === 0) {
      status = 'failed';
    } else if (failedImages.length > 0) {
      status = 'partial';
    }

    const result: CleanupResult = {
      totalImagesChecked: storageFiles?.length || 0,
      orphanImagesFound: orphanImages.length,
      imagesDeleted: deletedImages.length,
      imagesFailed: failedImages.length,
      deletedImages,
      failedImages,
      storageFreed,
      executionTime,
      status
    };

    // 6. Salvar histórico no banco
    try {
      const { error: insertError } = await supabaseAdmin
        .from('image_cleanup_history')
        .insert({
          total_images_checked: result.totalImagesChecked,
          orphan_images_found: result.orphanImagesFound,
          images_deleted: result.imagesDeleted,
          images_failed: result.imagesFailed,
          deleted_images: result.deletedImages,
          failed_images: result.failedImages,
          execution_time_ms: result.executionTime,
          storage_freed_bytes: result.storageFreed,
          status: result.status,
          triggered_by: req.headers.get('x-triggered-by') || 'cron'
        });

      if (insertError) {
        console.error('[Cleanup] Erro ao salvar histórico:', insertError);
      } else {
        console.log('[Cleanup] Histórico salvo com sucesso');
      }

      // Atualizar data da última execução
      await supabaseAdmin
        .from('cleanup_cron_config')
        .update({ last_execution: new Date().toISOString() })
        .eq('id', config?.id);

    } catch (error: any) {
      console.error('[Cleanup] Erro ao salvar no banco:', error);
    }

    console.log('[Cleanup] Limpeza concluída:', result);

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );

  } catch (error: any) {
    console.error('[Cleanup] Erro fatal:', error);
    
    const executionTime = Date.now() - startTime;
    const errorResult: CleanupResult = {
      totalImagesChecked: 0,
      orphanImagesFound: 0,
      imagesDeleted: 0,
      imagesFailed: 0,
      deletedImages: [],
      failedImages: [],
      storageFreed: 0,
      executionTime,
      status: 'failed',
      errorMessage: error.message
    };

    return new Response(
      JSON.stringify(errorResult),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
});
