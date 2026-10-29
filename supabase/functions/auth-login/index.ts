// ==============================================================================
// U.C.U ARENA — EDGE FUNCTION: AUTH-LOGIN
// Resolução segura de login por Apelido e Senha sem exposição de e-mail ao cliente
// ==============================================================================

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1';

// Headers CORS para permitir chamadas seguras da aplicação web
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiter em memória por IP (Proteção contra brute-force / enumeração)
interface RateLimitEntry {
  count: number;
  firstAttempt: number;
}
const rateLimitMap = new Map<string, RateLimitEntry>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutos

function isRateLimited(clientIp: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(clientIp);

  if (!entry) {
    rateLimitMap.set(clientIp, { count: 1, firstAttempt: now });
    return false;
  }

  if (now - entry.firstAttempt > WINDOW_MS) {
    // Reset da janela de tempo
    rateLimitMap.set(clientIp, { count: 1, firstAttempt: now });
    return false;
  }

  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

serve(async (req: Request) => {
  // Tratar requisição pre-flight do CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';

  // Verificar bloqueio por tentativas excessivas
  if (isRateLimited(clientIp)) {
    return new Response(
      JSON.stringify({
        error: 'Muitas tentativas consecutivas. Por favor, aguarde 15 minutos antes de tentar novamente.',
      }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { nickname, password } = await req.json();

    if (!nickname || typeof nickname !== 'string' || !password || typeof password !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Apelido e senha são obrigatórios.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    // Cliente com permissões de serviço para consultar o email interno sem expor ao frontend
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const normalizedNickname = nickname.trim().toLowerCase();

    // 1. Localizar o perfil pelo apelido normalizado com fallback case-insensitive
    let { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('auth_user_id, recovery_email, full_name, nickname, avatar_url')
      .eq('nickname_normalized', normalizedNickname)
      .maybeSingle();

    if (!profile) {
      const { data: fallbackProfile } = await supabaseAdmin
        .from('profiles')
        .select('auth_user_id, recovery_email, full_name, nickname, avatar_url')
        .ilike('nickname', normalizedNickname)
        .maybeSingle();
      if (fallbackProfile) {
        profile = fallbackProfile;
        profileError = null;
      }
    }

    // Resposta de erro genérica e constante para mitigar enumeração de contas
    const GENERIC_AUTH_ERROR = 'Apelido ou senha incorretos.';

    if (profileError || !profile || !profile.recovery_email) {
      return new Response(
        JSON.stringify({ error: GENERIC_AUTH_ERROR }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Realizar autenticação com as credenciais resolvidas
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: profile.recovery_email,
      password: password,
    });

    if (authError || !authData.session) {
      return new Response(
        JSON.stringify({ error: GENERIC_AUTH_ERROR }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Verificar privilégios de administrador
    const { data: adminRecord } = await supabaseAdmin
      .from('admin_users')
      .select('role')
      .eq('user_id', profile.auth_user_id)
      .eq('is_active', true)
      .maybeSingle();

    // 4. Retornar a sessão segura ao navegador (SEM EXPÔR O E-MAIL)
    return new Response(
      JSON.stringify({
        session: authData.session,
        user: {
          id: profile.auth_user_id,
          nickname: profile.nickname,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          is_admin: !!adminRecord,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Erro interno ao processar a autenticação.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
