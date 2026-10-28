# U.C.U ARENA — Guia de Configuração e Provisionamento do Supabase

**Versão:** 1.0.0  
**Data:** 28 de Outubro de 2026  
**Finalidade:** Guia passo a passo para configuração do banco de dados relacional, autenticação, storage e políticas de segurança na nuvem gratuita do Supabase.

---

## 1. Criação do Projeto no Supabase

1. Acesse [https://supabase.com](https://supabase.com) e crie uma conta gratuita (ou faça login com GitHub).
2. Clique em **"New Project"**.
3. Preencha os dados do projeto:
   * **Name:** `ucu-arena-prod` (ou similar)
   * **Database Password:** Gere uma senha forte e armazene em cofre de senhas seguro.
   * **Region:** `sa-east-1 (São Paulo)` (recomendado para menor latência no Brasil) ou a mais próxima do público.
   * **Pricing Plan:** Free tier ($0/mês).
4. Aguarde cerca de 1 a 2 minutos até que a instância PostgreSQL seja inicializada.

---

## 2. Aplicação das Migrações SQL

No painel do Supabase, acesse o menu lateral **SQL Editor** e execute os scripts na ordem exata:

### Passo 2.1 — Esquema Central de Tabelas (Migração 00)
Copie o conteúdo de [`supabase/migrations/20261027000000_core_schema.sql`](../../supabase/migrations/20261027000000_core_schema.sql), cole no SQL Editor e clique em **Run**.
* Cria as 9 tabelas do sistema:
  * `events`
  * `weight_categories`
  * `profiles`
  * `admin_users`
  * `event_registrations`
  * `matches`
  * `media_items`
  * `event_announcements`
  * `audit_logs`
* Cria a função `public.is_admin()` para verificação de permissões do Administrador Principal.

### Passo 2.2 — Políticas de Segurança RLS (Migração 01)
Copie o conteúdo de [`supabase/migrations/20261027000001_security_and_rls.sql`](../../supabase/migrations/20261027000001_security_and_rls.sql), cole no SQL Editor e clique em **Run**.
* Ativa `ENABLE ROW LEVEL SECURITY` em todas as tabelas.
* Garante isolamento estrito de dados privados (e-mails, dados de responsáveis de menores).
* Cria a view pública protegida `public.public_athlete_cards`.

### Passo 2.3 — Configuração do Storage de Fotos (Migração 02)
Copie o conteúdo de [`supabase/migrations/20261027000002_storage_setup.sql`](../../supabase/migrations/20261027000002_storage_setup.sql), cole no SQL Editor e clique em **Run**.
* Provisiona o bucket `avatars` com restrição estrita:
  * Limite de tamanho: `2 MB` (2.097.152 bytes)
  * Tipos permitidos: `image/jpeg`, `image/png`, `image/webp`
  * Permissão de escrita apenas para o próprio atleta autenticado (`avatars/{auth.uid}/*`).

---

## 3. Provisionamento do Administrador Principal

Para habilitar o acesso ao painel `/admin`, a conta deve estar registrada na tabela `public.admin_users`.

1. Cadastre a conta de admin via Auth no painel (**Authentication** -> **Users** -> **Add user**) ou registre-se na página inicial com o apelido desejado.
2. Anote o `UUID` do usuário no Supabase Auth.
3. No **SQL Editor**, execute:
```sql
INSERT INTO public.admin_users (auth_user_id, role, full_name, nickname)
VALUES (
  'SEU-AUTH-USER-UUID-AQUI',
  'superadmin',
  'Nome do Administrador',
  'Admin'
)
ON CONFLICT (auth_user_id) DO NOTHING;
```
> Para detalhes completos e rotinas de rotação, consulte [`docs/security/ADMIN_PROVISIONING.md`](../security/ADMIN_PROVISIONING.md).

---

## 4. Deploy das Edge Functions

O projeto possui duas Edge Functions seguras para gerenciar o login e recuperação por apelido:

1. Instale a CLI do Supabase localmente (se ainda não tiver):
   ```bash
   npm install -g supabase
   ```
2. Faça login e vincule o projeto:
   ```bash
   supabase login
   supabase link --project-ref <SEU-PROJECT-REF>
   ```
3. Realize o deploy das funções:
   ```bash
   supabase functions deploy auth-login --no-verify-jwt
   supabase functions deploy auth-reset-request --no-verify-jwt
   ```

---

## 5. Extração das Chaves de API para o Frontend

1. No painel do Supabase, acesse **Project Settings** -> **API**.
2. Copie os seguintes valores:
   * **Project URL:** `https://xyzcompany.supabase.co`
   * **Project API Keys — `anon` (public):** Chave segura para uso no frontend.
3. Insira estas chaves nas variáveis do Cloudflare Pages e no seu `.env` local:
   ```env
   VITE_SUPABASE_URL=https://xyzcompany.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
4. 🔴 **REGRA DE OURO:** Jamais use a chave `service_role` (secret) no código cliente ou no arquivo `.env`.

---

## 6. Prevenção de Pausa por Inatividade

No plano gratuito do Supabase, projetos sem acessos por 7 dias corridos podem ser pausados. Para manter o projeto sempre ativo de forma 100% gratuita:
* O uso normal da organização e dos atletas já previne pausas automáticas.
* Caso o evento esteja em intervalo de meses, você pode configurar um simples GitHub Action gratuito (*heartbeat ping*) chamando a rota `/rest/v1/events?select=id&limit=1` a cada 3 dias.
