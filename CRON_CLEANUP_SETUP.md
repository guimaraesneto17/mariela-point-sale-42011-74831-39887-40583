# Configuração do Cron Job de Limpeza Automática

Este documento descreve como configurar o cron job no Supabase para executar a limpeza automática de imagens órfãs.

## 📋 Visão Geral

O sistema de limpeza automática:
- Executa periodicamente conforme agendamento configurado
- Identifica imagens órfãs (não referenciadas no MongoDB)
- Deleta imagens (se auto_delete estiver ativado) ou apenas reporta
- Salva histórico detalhado de cada execução
- Fornece interface de gerenciamento no frontend

## 🔧 Configuração Inicial

### 1. Habilitar Extensões no Supabase

Primeiro, habilite as extensões necessárias no seu projeto Supabase:

```sql
-- Habilitar pg_cron para agendamento
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Habilitar pg_net para requisições HTTP
CREATE EXTENSION IF NOT EXISTS pg_net;
```

### 2. Configurar o Cron Job

Execute o seguinte SQL para criar o cron job:

```sql
-- Agendar execução mensal (dia 1 de cada mês à meia-noite)
SELECT cron.schedule(
  'cleanup-orphan-images-monthly',
  '0 0 1 * *', -- Expressão cron: minuto hora dia mês dia_semana
  $$
  SELECT net.http_post(
    url := 'https://wlibyugthnikmrurmwub.supabase.co/functions/v1/cleanup-orphan-images',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsaWJ5dWd0aG5pa21ydXJtd3ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5ODA4NDMsImV4cCI6MjA3NzU1Njg0M30.Sm7K1tx73GkxokERY6bdvx5R6aNB2UEwfZbgh38NX5Q"}'::jsonb,
    body := '{"triggered_by": "cron"}'::jsonb
  ) as request_id;
  $$
);
```

### 3. Verificar Cron Jobs Ativos

Para visualizar os cron jobs configurados:

```sql
SELECT * FROM cron.job;
```

### 4. Remover um Cron Job (se necessário)

Se precisar remover o cron job:

```sql
SELECT cron.unschedule('cleanup-orphan-images-monthly');
```

## 📅 Expressões Cron

Formato: `minuto hora dia mês dia_da_semana`

### Exemplos Comuns

| Expressão | Descrição |
|-----------|-----------|
| `0 0 * * *` | Diariamente à meia-noite |
| `0 0 * * 0` | Semanalmente aos domingos à meia-noite |
| `0 0 1 * *` | Mensalmente no dia 1 à meia-noite |
| `0 3 * * *` | Diariamente às 3h da manhã |
| `*/30 * * * *` | A cada 30 minutos |
| `0 0,12 * * *` | Duas vezes por dia (meia-noite e meio-dia) |

### Campos da Expressão Cron

```
┌───────────── minuto (0 - 59)
│ ┌───────────── hora (0 - 23)
│ │ ┌───────────── dia do mês (1 - 31)
│ │ │ ┌───────────── mês (1 - 12)
│ │ │ │ ┌───────────── dia da semana (0 - 6) (Domingo a Sábado)
│ │ │ │ │
* * * * *
```

## 🎯 Funcionalidades do Sistema

### 1. Tabelas do Banco de Dados

#### cleanup_cron_config
Armazena a configuração do cron job:
- `enabled`: Ativar/desativar execução
- `schedule`: Expressão cron
- `auto_delete`: Se true, deleta. Se false, apenas reporta
- `last_execution`: Data da última execução
- `notifications_enabled`: Habilitar notificações por email

#### image_cleanup_history
Histórico completo de execuções:
- `execution_date`: Data/hora da execução
- `total_images_checked`: Total de imagens verificadas
- `orphan_images_found`: Imagens órfãs encontradas
- `images_deleted`: Imagens deletadas com sucesso
- `images_failed`: Imagens que falharam ao deletar
- `deleted_images`: Array JSON com paths das imagens deletadas
- `failed_images`: Array JSON com paths e erros
- `storage_freed_bytes`: Espaço liberado em bytes
- `execution_time_ms`: Tempo de execução em milissegundos
- `status`: 'success' | 'partial' | 'failed'
- `triggered_by`: 'cron' | 'manual'

### 2. Edge Function

**Endpoint**: `/functions/v1/cleanup-orphan-images`

**Fluxo de Execução**:
1. Lista todas as imagens no Supabase Storage
2. Busca todas as imagens referenciadas no MongoDB (produtos, estoque)
3. Identifica imagens órfãs (presentes no storage mas não no MongoDB)
4. Se `auto_delete` = true, deleta as imagens
5. Salva histórico detalhado no banco
6. Atualiza `last_execution` na configuração

**Headers**:
- `x-triggered-by`: Identifica origem da execução ('cron' ou 'manual')

### 3. Interface de Gerenciamento (Frontend)

Localizada em **Backend Status** > **Agendamento de Limpeza**

**Recursos**:
- ✅ Ativar/desativar limpeza automática
- ✅ Escolher frequência (diária, semanal, mensal, personalizada)
- ✅ Alternar entre modo report-only e auto-delete
- ✅ Executar limpeza manualmente
- ✅ Visualizar histórico de todas as execuções
- ✅ Ver detalhes de cada execução:
  - Imagens verificadas, órfãs, deletadas
  - Espaço liberado
  - Lista completa de imagens deletadas
  - Erros e falhas
  - Tempo de execução
- ✅ Estatísticas totais acumuladas

## 🔐 Segurança

### Row-Level Security (RLS)

**cleanup_cron_config**:
- Somente admins podem ler e modificar a configuração

**image_cleanup_history**:
- Admins podem ler o histórico
- Sistema (service role) pode inserir registros

### Modo Somente Leitura

Por padrão, o sistema inicia em **modo somente leitura** (`auto_delete: false`):
- Identifica imagens órfãs
- Gera relatórios detalhados
- **NÃO deleta** imagens automaticamente
- Permite revisão antes de ativar deleção automática

Para ativar deleção automática:
1. Acesse a interface de configuração
2. Ative o switch "Deletar Automaticamente"
3. Confirme as mudanças

## 📊 Monitoramento

### Verificar Execuções

```sql
-- Últimas 10 execuções
SELECT 
  execution_date,
  status,
  orphan_images_found,
  images_deleted,
  storage_freed_bytes / 1024.0 / 1024.0 as storage_freed_mb
FROM image_cleanup_history
ORDER BY execution_date DESC
LIMIT 10;
```

### Estatísticas Totais

```sql
-- Estatísticas acumuladas
SELECT 
  COUNT(*) as total_executions,
  SUM(total_images_checked) as total_checked,
  SUM(orphan_images_found) as total_orphans,
  SUM(images_deleted) as total_deleted,
  SUM(storage_freed_bytes) / 1024.0 / 1024.0 as total_freed_mb
FROM image_cleanup_history;
```

### Verificar Falhas

```sql
-- Execuções com falhas
SELECT 
  execution_date,
  images_failed,
  failed_images,
  error_message
FROM image_cleanup_history
WHERE status IN ('failed', 'partial')
ORDER BY execution_date DESC;
```

## 🚨 Troubleshooting

### Cron Job Não Executa

1. Verifique se `pg_cron` está habilitado:
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

2. Verifique se o job está agendado:
```sql
SELECT * FROM cron.job WHERE jobname = 'cleanup-orphan-images-monthly';
```

3. Verifique logs de execução:
```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'cleanup-orphan-images-monthly')
ORDER BY start_time DESC
LIMIT 10;
```

### Edge Function Falha

1. Verifique logs da edge function no dashboard do Supabase
2. Confirme que a URL do backend está correta
3. Verifique se as permissões de storage estão configuradas
4. Teste execução manual pela interface

### Imagens Não São Deletadas

1. Verifique se `auto_delete` está ativado na configuração
2. Confirme que existem imagens órfãs
3. Verifique permissões de storage (RLS policies)
4. Analise o campo `failed_images` no histórico

## 🔄 Alterando a Frequência

### Via Interface (Recomendado)

Acesse **Backend Status** > **Agendamento de Limpeza** e selecione a nova frequência.

### Via SQL (Avançado)

```sql
-- Alterar para execução semanal
SELECT cron.alter_job(
  job_id := (SELECT jobid FROM cron.job WHERE jobname = 'cleanup-orphan-images-monthly'),
  schedule := '0 0 * * 0' -- Domingos à meia-noite
);
```

## 📝 Notas Importantes

- ⚠️ **Backup**: Sempre faça backup antes de ativar `auto_delete`
- ⚠️ **Teste**: Execute manualmente em modo report antes de automatizar
- ⚠️ **Revisão**: Revise o histórico regularmente
- ⚠️ **Performance**: Para grandes volumes, considere execução em horários de baixo tráfego
- ⚠️ **Notificações**: Configure email para receber alertas de falhas

## 🎓 Exemplo de Uso

1. **Configuração Inicial**:
   - Execute o SQL de configuração do cron
   - Mantenha `auto_delete: false`
   - Configure frequência mensal

2. **Primeira Execução**:
   - Execute manualmente pela interface
   - Revise o relatório de imagens órfãs
   - Confirme que são realmente órfãs

3. **Ativação**:
   - Ative `auto_delete: true`
   - Aguarde próxima execução automática
   - Monitore histórico

4. **Manutenção**:
   - Revise histórico mensalmente
   - Ajuste frequência se necessário
   - Investigue falhas recorrentes

---

**Última atualização**: Dezembro 2025
**Versão**: 1.0
