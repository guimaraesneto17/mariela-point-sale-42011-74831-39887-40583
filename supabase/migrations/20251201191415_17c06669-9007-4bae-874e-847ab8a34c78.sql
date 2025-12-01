-- Corrigir política RLS da tabela profiles
-- Remove política permissiva que permite qualquer usuário autenticado ver todos os perfis
DROP POLICY IF EXISTS "Perfis são visíveis para usuários autenticados" ON profiles;

-- Cria política restritiva: usuários só podem ver seu próprio perfil (ou admins veem tudo)
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT
  USING (auth.uid() = id OR has_role(auth.uid(), 'admin'));

-- Corrigir política RLS da tabela image_cleanup_history
-- Remove política que permite qualquer usuário autenticado inserir registros
DROP POLICY IF EXISTS "Sistema pode inserir histórico" ON image_cleanup_history;

-- Cria política restritiva: apenas service_role pode inserir histórico
CREATE POLICY "Service role can insert history" ON image_cleanup_history
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');