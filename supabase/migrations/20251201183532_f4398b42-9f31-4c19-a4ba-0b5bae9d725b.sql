-- Criar tabela para histórico de limpeza de imagens
CREATE TABLE IF NOT EXISTS public.image_cleanup_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  execution_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_images_checked INTEGER NOT NULL DEFAULT 0,
  orphan_images_found INTEGER NOT NULL DEFAULT 0,
  images_deleted INTEGER NOT NULL DEFAULT 0,
  images_failed INTEGER NOT NULL DEFAULT 0,
  deleted_images JSONB DEFAULT '[]'::jsonb,
  failed_images JSONB DEFAULT '[]'::jsonb,
  execution_time_ms INTEGER,
  storage_freed_bytes BIGINT DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  error_message TEXT,
  triggered_by TEXT DEFAULT 'cron',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices para melhor performance
CREATE INDEX idx_cleanup_history_execution_date ON public.image_cleanup_history(execution_date DESC);
CREATE INDEX idx_cleanup_history_status ON public.image_cleanup_history(status);

-- Habilitar RLS
ALTER TABLE public.image_cleanup_history ENABLE ROW LEVEL SECURITY;

-- Policy para admins lerem o histórico
CREATE POLICY "Admins podem visualizar histórico de limpeza"
  ON public.image_cleanup_history
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy para o sistema inserir registros (service role)
CREATE POLICY "Sistema pode inserir histórico"
  ON public.image_cleanup_history
  FOR INSERT
  WITH CHECK (true);

-- Criar tabela para configuração do cron
CREATE TABLE IF NOT EXISTS public.cleanup_cron_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT true,
  schedule TEXT NOT NULL DEFAULT '0 0 1 * *', -- Primeiro dia de cada mês à meia-noite
  last_execution TIMESTAMP WITH TIME ZONE,
  next_execution TIMESTAMP WITH TIME ZONE,
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  notification_email TEXT,
  auto_delete BOOLEAN NOT NULL DEFAULT false, -- Se false, apenas reporta
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Inserir configuração padrão
INSERT INTO public.cleanup_cron_config (enabled, schedule, auto_delete)
VALUES (true, '0 0 1 * *', false)
ON CONFLICT DO NOTHING;

-- Habilitar RLS
ALTER TABLE public.cleanup_cron_config ENABLE ROW LEVEL SECURITY;

-- Policy para admins gerenciarem configuração
CREATE POLICY "Admins podem gerenciar config de limpeza"
  ON public.cleanup_cron_config
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Comentários para documentação
COMMENT ON TABLE public.image_cleanup_history IS 'Histórico de execuções da limpeza automática de imagens órfãs';
COMMENT ON TABLE public.cleanup_cron_config IS 'Configuração do cron job de limpeza de imagens';
COMMENT ON COLUMN public.cleanup_cron_config.schedule IS 'Expressão cron (formato: minuto hora dia mês dia_semana)';
COMMENT ON COLUMN public.cleanup_cron_config.auto_delete IS 'Se true, deleta automaticamente. Se false, apenas reporta';