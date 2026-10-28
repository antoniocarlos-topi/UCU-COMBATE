-- ==============================================================================
-- U.C.U ARENA — MIGRAÇÃO 01: SEGURANÇA E POLÍTICAS DE RLS (ROW LEVEL SECURITY)
-- Princípio: Zero Trust Client — Proteção total de dados privados e menores
-- ==============================================================================

-- 1. HABILITAÇÃO OBRIGATÓRIA DE RLS EM TODAS AS TABELAS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 2. POLÍTICAS PARA A TABELA PROFILES (PRIVACIDADE MÁXIMA)
-- Dados confidenciais (email de recuperação, telefone, documento e dados de responsáveis)
-- são visíveis EXCLUSIVAMENTE pelo próprio atleta logado ou pelo Administrador Principal.
CREATE POLICY "profiles_select_owner_or_admin"
ON public.profiles FOR SELECT
USING (
    auth.uid() = auth_user_id 
    OR public.is_admin()
);

-- Atletas autenticados podem criar seu próprio perfil
CREATE POLICY "profiles_insert_own"
ON public.profiles FOR INSERT
WITH CHECK (
    auth.uid() = auth_user_id
);

-- Atletas podem atualizar dados não críticos de contato e foto
CREATE POLICY "profiles_update_own_or_admin"
ON public.profiles FOR UPDATE
USING (
    auth.uid() = auth_user_id 
    OR public.is_admin()
)
WITH CHECK (
    auth.uid() = auth_user_id 
    OR public.is_admin()
);

-- Apenas o Administrador Principal pode excluir perfis
CREATE POLICY "profiles_delete_admin_only"
ON public.profiles FOR DELETE
USING (public.is_admin());

-- 3. POLÍTICAS PARA ADMIN_USERS (BLINDAGEM DE PRIVILÉGIOS)
-- Nenhum usuário comum consegue consultar quem são os admins nem inserir a si próprio
CREATE POLICY "admin_users_select_admin_only"
ON public.admin_users FOR SELECT
USING (public.is_admin());

CREATE POLICY "admin_users_all_admin_only"
ON public.admin_users FOR ALL
USING (public.is_admin());

-- 4. POLÍTICAS PARA EVENTS
-- Visitantes públicos só enxergam eventos publicados (não rascunhos)
CREATE POLICY "events_select_published_or_admin"
ON public.events FOR SELECT
USING (
    status <> 'draft' 
    OR public.is_admin()
);

CREATE POLICY "events_modify_admin_only"
ON public.events FOR ALL
USING (public.is_admin());

-- 5. POLÍTICAS PARA WEIGHT_CATEGORIES
CREATE POLICY "weight_categories_select_public"
ON public.weight_categories FOR SELECT
USING (true);

CREATE POLICY "weight_categories_modify_admin_only"
ON public.weight_categories FOR ALL
USING (public.is_admin());

-- 6. POLÍTICAS PARA EVENT_REGISTRATIONS
-- Inscrições aprovadas são públicas para visualização no card do campeonato.
-- Inscrições pendentes ou recusadas só são visíveis pelo próprio atleta e pelo admin.
CREATE POLICY "registrations_select_policy"
ON public.event_registrations FOR SELECT
USING (
    status = 'approved'
    OR profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    OR public.is_admin()
);

-- Atletas autenticados podem registrar sua inscrição
CREATE POLICY "registrations_insert_athlete"
ON public.event_registrations FOR INSERT
WITH CHECK (
    profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
);

-- Apenas Admin pode aprovar/recusar ou lançar peso oficial.
-- O próprio atleta pode somente sinalizar desistência ('withdrawn').
CREATE POLICY "registrations_update_policy"
ON public.event_registrations FOR UPDATE
USING (
    public.is_admin()
    OR (profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()))
)
WITH CHECK (
    public.is_admin()
    OR (
        profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
        AND status = 'withdrawn'
    )
);

CREATE POLICY "registrations_delete_admin_only"
ON public.event_registrations FOR DELETE
USING (public.is_admin());

-- 7. POLÍTICAS PARA MATCHES (CONFRONTOS)
CREATE POLICY "matches_select_public"
ON public.matches FOR SELECT
USING (true);

CREATE POLICY "matches_modify_admin_only"
ON public.matches FOR ALL
USING (public.is_admin());

-- 8. POLÍTICAS PARA MEDIA_ITEMS E COMUNICADOS
CREATE POLICY "media_select_public"
ON public.media_items FOR SELECT
USING (true);

CREATE POLICY "media_modify_admin_only"
ON public.media_items FOR ALL
USING (public.is_admin());

CREATE POLICY "announcements_select_public"
ON public.event_announcements FOR SELECT
USING (true);

CREATE POLICY "announcements_modify_admin_only"
ON public.event_announcements FOR ALL
USING (public.is_admin());

-- 9. POLÍTICAS PARA AUDIT_LOGS
CREATE POLICY "audit_logs_select_admin_only"
ON public.audit_logs FOR SELECT
USING (public.is_admin());

CREATE POLICY "audit_logs_insert_authenticated"
ON public.audit_logs FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 10. VISÃO SEGURA PARA CARDS PÚBLICOS DE LUTADORES
-- Permite ao público visualizar os atletas no card sem jamais expor e-mails ou dados de menores
CREATE OR REPLACE VIEW public.public_athlete_cards AS
SELECT
    p.id AS profile_id,
    p.nickname,
    p.avatar_url,
    er.id AS registration_id,
    er.event_id,
    er.weight_category_id,
    wc.name AS category_name,
    er.status AS registration_status
FROM public.profiles p
JOIN public.event_registrations er ON er.profile_id = p.id
JOIN public.weight_categories wc ON wc.id = er.weight_category_id
WHERE er.status = 'approved';

-- Concede leitura anônima e autenticada apenas para a visão segura
GRANT SELECT ON public.public_athlete_cards TO anon, authenticated;
