-- ==============================================================================
-- U.C.U ARENA — MIGRAÇÃO 02: CONFIGURAÇÃO DO SUPABASE STORAGE (BUCKET AVATARS)
-- Armazenamento seguro de fotos de perfil com validação estrita de MIME e tamanho
-- ==============================================================================

-- 1. CRIAÇÃO DO BUCKET 'avatars' COM RESTRIÇÕES DE SEGURANÇA
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    2097152, -- Limite estrito de 2 MB (2 * 1024 * 1024 bytes)
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 2. POLÍTICAS DE RLS PARA STORAGE.OBJECTS NO BUCKET AVATARS

-- Leitura pública das fotos para renderização rápida nos cards e confrontos
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Usuários autenticados só podem fazer upload dentro da pasta com seu próprio auth.uid
-- Caminho forçado: avatars/{auth.uid()}/{nome_arquivo}
DROP POLICY IF EXISTS "avatars_authenticated_upload_own" ON storage.objects;
CREATE POLICY "avatars_authenticated_upload_own"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Atualização restrita à própria pasta
DROP POLICY IF EXISTS "avatars_authenticated_update_own" ON storage.objects;
CREATE POLICY "avatars_authenticated_update_own"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Exclusão permitida apenas ao proprietário ou ao Administrador Principal
DROP POLICY IF EXISTS "avatars_delete_own_or_admin" ON storage.objects;
CREATE POLICY "avatars_delete_own_or_admin"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'avatars'
    AND (
        (auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text)
        OR public.is_admin()
    )
);
