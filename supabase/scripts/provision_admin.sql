-- ==============================================================================
-- U.C.U ARENA — PROCEDIMENTO SEGURO DE PROVISIONAMENTO DO ADMINISTRADOR ÚNICO
-- Execução: Console SQL do Supabase (Acesso exclusivo do proprietário)
-- ==============================================================================

-- PASSO 1: Obter o UUID do usuário criado pelo proprietário no painel de Auth
-- Substitua 'admin@ucu-arena.com' pelo e-mail com o qual o administrador se registrou.
DO $$
DECLARE
    target_user_id UUID;
    target_email TEXT := 'admin@ucu-arena.com'; -- << INSIRA O E-MAIL DO ADMINISTRADOR AQUI
BEGIN
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = target_email;

    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário com o e-mail % não foi encontrado em auth.users. Crie a conta primeiro no painel de Autenticação do Supabase.', target_email;
    END IF;

    -- PASSO 2: Inserir com papel de superadmin na tabela protegida por RLS
    INSERT INTO public.admin_users (user_id, role, is_active)
    VALUES (target_user_id, 'superadmin', true)
    ON CONFLICT (user_id) DO UPDATE SET
        role = 'superadmin',
        is_active = true;

    RAISE NOTICE 'Administrador principal (%) provisionado com sucesso com ID: %', target_email, target_user_id;
END $$;

-- PASSO 3: Validação da Permissão
-- Esta consulta deve retornar exatamente 1 registro ativo:
SELECT 
    au.user_id,
    u.email,
    au.role,
    au.is_active,
    au.created_at
FROM public.admin_users au
JOIN auth.users u ON u.id = au.user_id;
