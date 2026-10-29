// ==============================================================================
// U.C.U ARENA — EDGE FUNCTION: AUTH-RESET-REQUEST
// Solicitação de redefinição de senha pelo Apelido com preservação de sigilo
// ==============================================================================

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { nickname } = await req.json();

    if (!nickname || typeof nickname !== 'string') {
      return new Response(
        JSON.stringify({ error: 'O apelido é obrigatório.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const normalizedNickname = nickname.trim().toLowerCase();

    // 1. Localizar email de recuperação silenciosamente (com fallback case-insensitive)
    let { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('recovery_email')
      .eq('nickname_normalized', normalizedNickname)
      .maybeSingle();

    if (!profile?.recovery_email) {
      const { data: fallbackProfile } = await supabaseAdmin
        .from('profiles')
        .select('recovery_email')
        .ilike('nickname', normalizedNickname)
        .maybeSingle();
      if (fallbackProfile) {
        profile = fallbackProfile;
      }
    }

    if (profile?.recovery_email) {
      // 2. Disparar link de redefinição oficial do Supabase para o e-mail cadastrado
      await supabaseAdmin.auth.resetPasswordForEmail(profile.recovery_email, {
        redirectTo: `${req.headers.get('origin') || 'https://ucu-arena.pages.dev'}/redefinir-senha`,
      });
    }

    // 3. Resposta deliberadamente genérica (evita adivinhação de contas existentes)
    return new Response(
      JSON.stringify({
        message: 'Se o apelido estiver cadastrado, as instruções de recuperação foram enviadas ao e-mail associado.',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Erro ao processar solicitação de recuperação.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
