-- ==============================================================================
-- U.C.U ARENA — MIGRAÇÃO 00: ESQUEMA RELACIONAL CENTRAL
-- Motor: PostgreSQL 15+ (Supabase)
-- Suporte: Múltiplos Eventos, Categorias Decimais, Integridade e Auditoria
-- ==============================================================================

-- 1. EXTENSÕES NECESSÁRIAS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABELA DE PERFIS DE ATLETAS E USUÁRIOS
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    auth_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    nickname VARCHAR(30) NOT NULL,
    nickname_normalized VARCHAR(30) GENERATED ALWAYS AS (LOWER(TRIM(nickname))) STORED UNIQUE,
    recovery_email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    birth_date DATE NOT NULL,
    is_minor BOOLEAN NOT NULL DEFAULT false,
    guardian_name TEXT,
    guardian_relationship VARCHAR(50),
    guardian_phone VARCHAR(20),
    guardian_document VARCHAR(30),
    image_consent BOOLEAN NOT NULL DEFAULT false,
    terms_consent BOOLEAN NOT NULL DEFAULT false,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Restrições de Integridade de Menor e Consentimento
    CONSTRAINT check_minor_guardian CHECK (
        (is_minor = false) OR 
        (is_minor = true AND guardian_name IS NOT NULL AND guardian_phone IS NOT NULL AND guardian_document IS NOT NULL)
    ),
    CONSTRAINT check_consents CHECK (image_consent = true AND terms_consent = true),
    CONSTRAINT check_nickname_length CHECK (char_length(TRIM(nickname)) >= 3)
);

-- 3. TABELA DE ADMINISTRADORES AUTORIZADOS (CONTROLE CENTRALIZADO)
CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'superadmin',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_admin_role CHECK (role IN ('superadmin', 'organizer'))
);

-- 4. FUNÇÃO DE VERIFICAÇÃO DE ADMINISTRADOR (SECURITY DEFINER)
-- Impede qualquer adulteração de perfil para forjar privilégios administrativos
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, pg_temp
STABLE AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.admin_users 
        WHERE user_id = auth.uid() 
          AND is_active = true
    );
END;
$$;

-- 5. TABELA DE EVENTOS (MULTI-EVENTO)
CREATE TABLE IF NOT EXISTS public.events (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    slug VARCHAR(60) NOT NULL UNIQUE,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    event_date TIMESTAMPTZ NOT NULL,
    location_name VARCHAR(120) NOT NULL,
    location_address TEXT NOT NULL,
    location_map_url TEXT,
    whatsapp_group_url TEXT,
    rules_markdown TEXT NOT NULL,
    banner_url TEXT,
    logo_url TEXT,
    min_weight NUMERIC(5,2) NOT NULL DEFAULT 50.00,
    max_weight NUMERIC(5,2) NOT NULL DEFAULT 90.00,
    status VARCHAR(25) NOT NULL DEFAULT 'draft',
    format_type VARCHAR(25) NOT NULL DEFAULT 'mixed',
    requires_invite BOOLEAN NOT NULL DEFAULT false,
    access_code VARCHAR(50),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT check_event_weights CHECK (min_weight >= 40.00 AND min_weight < max_weight AND max_weight <= 150.00),
    CONSTRAINT check_event_status CHECK (status IN ('draft', 'open_for_registration', 'registration_closed', 'in_progress', 'finished', 'archived', 'cancelled')),
    CONSTRAINT check_format_type CHECK (format_type IN ('mixed', 'friendly', 'single_elimination', 'round_robin'))
);

-- 6. TABELA DE CATEGORIAS DE PESO ESPECÍFICAS POR EVENTO
CREATE TABLE IF NOT EXISTS public.weight_categories (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    name VARCHAR(60) NOT NULL,
    min_weight NUMERIC(5,2) NOT NULL,
    max_weight NUMERIC(5,2) NOT NULL,
    display_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_category_weights CHECK (min_weight < max_weight)
);

-- Função de validação para impedir sobreposição de faixas de peso no mesmo evento
CREATE OR REPLACE FUNCTION public.check_weight_category_overlap()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SET search_path = public, pg_temp AS $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM public.weight_categories
        WHERE event_id = NEW.event_id
          AND id <> COALESCE(NEW.id, '')
          AND (
              (NEW.min_weight >= min_weight AND NEW.min_weight < max_weight) OR
              (NEW.max_weight > min_weight AND NEW.max_weight <= max_weight) OR
              (NEW.min_weight <= min_weight AND NEW.max_weight >= max_weight)
          )
    ) THEN
        RAISE EXCEPTION 'A faixa de peso definida (%.2f a %.2f kg) sobrepõe uma categoria existente no mesmo evento.', NEW.min_weight, NEW.max_weight;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_weight_category_overlap ON public.weight_categories;
CREATE TRIGGER trg_check_weight_category_overlap
BEFORE INSERT OR UPDATE ON public.weight_categories
FOR EACH ROW EXECUTE FUNCTION public.check_weight_category_overlap();

-- 7. TABELA DE INSCRIÇÕES NO EVENTO
CREATE TABLE IF NOT EXISTS public.event_registrations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE RESTRICT,
    profile_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    weight_category_id TEXT NOT NULL REFERENCES public.weight_categories(id) ON DELETE RESTRICT,
    declared_weight NUMERIC(5,2) NOT NULL,
    verified_weight NUMERIC(5,2),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    rejection_reason TEXT,
    guardian_authorized BOOLEAN NOT NULL DEFAULT false,
    checkin_status BOOLEAN NOT NULL DEFAULT false,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    
    -- O mesmo usuário pode se inscrever em múltiplos eventos, mas apenas UMA vez por evento
    CONSTRAINT unique_event_athlete UNIQUE (event_id, profile_id),
    CONSTRAINT check_reg_status CHECK (status IN ('pending', 'approved', 'rejected', 'suspended', 'withdrawn')),
    -- Limite inegociável da U.C.U Arena: 50.00 kg a 90.00 kg
    CONSTRAINT check_strict_weight_range CHECK (declared_weight >= 50.00 AND declared_weight <= 90.00),
    CONSTRAINT check_verified_weight_range CHECK (verified_weight IS NULL OR (verified_weight >= 50.00 AND verified_weight <= 90.00))
);

-- Trigger para validar correspondência entre peso declarado e a categoria selecionada
CREATE OR REPLACE FUNCTION public.validate_registration_weight_match()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SET search_path = public, pg_temp AS $$
DECLARE
    cat_min NUMERIC(5,2);
    cat_max NUMERIC(5,2);
    cat_event TEXT;
BEGIN
    SELECT min_weight, max_weight, event_id INTO cat_min, cat_max, cat_event
    FROM public.weight_categories
    WHERE id = NEW.weight_category_id;

    IF cat_event IS NULL OR cat_event <> NEW.event_id THEN
        RAISE EXCEPTION 'A categoria de peso selecionada não pertence ao evento correspondente.';
    END IF;

    IF NEW.declared_weight < cat_min OR NEW.declared_weight > cat_max THEN
        RAISE EXCEPTION 'O peso declarado (%.2f kg) está fora dos limites da categoria selecionada (%.2f a %.2f kg).', NEW.declared_weight, cat_min, cat_max;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_registration_weight_match ON public.event_registrations;
CREATE TRIGGER trg_validate_registration_weight_match
BEFORE INSERT OR UPDATE ON public.event_registrations
FOR EACH ROW EXECUTE FUNCTION public.validate_registration_weight_match();

-- 8. TABELA DE CONFRONTOS (MATCHES)
CREATE TABLE IF NOT EXISTS public.matches (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE RESTRICT,
    weight_category_id TEXT NOT NULL REFERENCES public.weight_categories(id) ON DELETE RESTRICT,
    match_order INT NOT NULL DEFAULT 1,
    round_name VARCHAR(50) NOT NULL DEFAULT 'Luta Casada',
    fighter1_registration_id TEXT NOT NULL REFERENCES public.event_registrations(id) ON DELETE RESTRICT,
    fighter2_registration_id TEXT NOT NULL REFERENCES public.event_registrations(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    winner_registration_id TEXT REFERENCES public.event_registrations(id) ON DELETE RESTRICT,
    victory_method VARCHAR(40),
    score_details TEXT,
    video_url TEXT,
    scheduled_time TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT check_different_fighters CHECK (fighter1_registration_id <> fighter2_registration_id),
    CONSTRAINT check_match_status CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    CONSTRAINT check_victory_method CHECK (victory_method IS NULL OR victory_method IN ('KO', 'TKO', 'SUBMISSION', 'POINTS', 'DQ', 'DRAW', 'NO_CONTEST'))
);

-- Trigger de Integridade dos Confrontos:
-- Impede que lutadores de eventos distintos ou não aprovados lutem entre si
CREATE OR REPLACE FUNCTION public.check_match_integrity()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SET search_path = public, pg_temp AS $$
DECLARE
    f1_event TEXT;
    f1_status VARCHAR(20);
    f2_event TEXT;
    f2_status VARCHAR(20);
BEGIN
    SELECT event_id, status INTO f1_event, f1_status FROM public.event_registrations WHERE id = NEW.fighter1_registration_id;
    SELECT event_id, status INTO f2_event, f2_status FROM public.event_registrations WHERE id = NEW.fighter2_registration_id;

    IF f1_event <> NEW.event_id OR f2_event <> NEW.event_id THEN
        RAISE EXCEPTION 'Ambos os lutadores devem estar inscritos no mesmo evento do confronto.';
    END IF;

    IF f1_status <> 'approved' OR f2_status <> 'approved' THEN
        RAISE EXCEPTION 'Apenas lutadores com inscrição APROVADA podem ser escalados para confrontos.';
    END IF;

    IF NEW.winner_registration_id IS NOT NULL THEN
        IF NEW.winner_registration_id <> NEW.fighter1_registration_id AND NEW.winner_registration_id <> NEW.fighter2_registration_id THEN
            RAISE EXCEPTION 'O vencedor registrado deve ser um dos participantes do confronto.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_match_integrity ON public.matches;
CREATE TRIGGER trg_check_match_integrity
BEFORE INSERT OR UPDATE ON public.matches
FOR EACH ROW EXECUTE FUNCTION public.check_match_integrity();

-- 9. TABELA DE ITENS DE MÍDIA (VÍDEOS, FOTOS E HIGHLIGHTS)
CREATE TABLE IF NOT EXISTS public.media_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    match_id TEXT REFERENCES public.matches(id) ON DELETE SET NULL,
    title VARCHAR(150) NOT NULL,
    media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('video', 'photo', 'highlight')),
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. TABELA DE COMUNICADOS DO EVENTO
CREATE TABLE IF NOT EXISTS public.event_announcements (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    content_markdown TEXT NOT NULL,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. TABELA DE AUDITORIA DE AÇÕES ADMINISTRATIVAS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id TEXT NOT NULL,
    changes_payload JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. GATILHOS DE ATUALIZAÇÃO AUTOMÁTICA DE TIMESTAMP
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SET search_path = public, pg_temp AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_events_updated_at ON public.events;
CREATE TRIGGER trg_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_matches_updated_at ON public.matches;
CREATE TRIGGER trg_matches_updated_at BEFORE UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 13. ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user ON public.profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);
CREATE INDEX IF NOT EXISTS idx_registrations_event_status ON public.event_registrations(event_id, status);
CREATE INDEX IF NOT EXISTS idx_matches_event_order ON public.matches(event_id, match_order);
