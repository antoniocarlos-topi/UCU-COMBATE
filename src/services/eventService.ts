// ==============================================================================
// U.C.U ARENA — SERVIÇO DE EVENTOS E CONVITES MULTI-EVENTO
// ==============================================================================

import { supabase } from '../lib/supabaseClient';
import { DEFAULT_WEIGHT_CATEGORIES, WeightCategoryRule } from '../utils/validationRules';

export interface EventInvitationData {
  id: string;
  slug: string;
  title: string;
  headline: string;
  invitation_text: string;
  signatories: string[];
  location_name: string;
  event_date_text: string;
  whatsapp_group_url?: string | null;
  requires_invite: boolean;
  access_code?: string | null;
  min_weight: number;
  max_weight: number;
  status: 'draft' | 'open_for_registration' | 'registration_closed' | 'in_progress' | 'finished';
  categories: WeightCategoryRule[];
}

/**
 * Conteúdo padrão do primeiro evento (editável e armazenado no banco)
 */
export const DEFAULT_INAUGURAL_EVENT: EventInvitationData = {
  id: 'e100-inaugural-ucu-arena',
  slug: 'arena-inaugural',
  title: 'Campeonato Amador de Boxe U.C.U',
  headline: 'Comunicado Oficial U.C.U',
  invitation_text: `É com prazer que gostaríamos de anunciar a primeira edição do campeonato amador de boxe U.C.U. Selecionamos apenas os melhores entre os melhores, entre pessoas conhecidas, e é com honra que comunicamos que você foi escolhido para ser uma das estrelas do nosso evento como lutador oficial da U.C.U.

Iremos utilizar os equipamentos necessários para reduzir os riscos e contar com arbitragem adequada ao evento. Teremos luvas disponíveis e tatame.

Se realmente deseja participar, clique no botão ‘Quero lutar’. Caso não queira participar, clique em ‘Não quero participar’.`,
  signatories: [
    'Antônio Carlos',
    'Jardel Franklin',
    'Samuel Araújo',
    'Gabriel Brandão',
  ],
  location_name: 'Espaço M-thor',
  event_date_text: 'A combinar',
  whatsapp_group_url: 'https://chat.whatsapp.com/JTz3GBUwKYXK1n8bjbpmwr',
  requires_invite: false,
  min_weight: 50.0,
  max_weight: 90.0,
  status: 'open_for_registration',
  categories: DEFAULT_WEIGHT_CATEGORIES,
};

// Evento Secundário para teste de múltiplos eventos
export const SECOND_TEST_EVENT: EventInvitationData = {
  id: 'e200-desafio-inverno',
  slug: 'arena-desafio-inverno',
  title: 'U.C.U Arena — Desafio de Inverno',
  headline: 'Segunda Edição Oficial',
  invitation_text: 'O segundo grande evento do circuito de boxe U.C.U.',
  signatories: ['Antônio Carlos', 'Jardel Franklin'],
  location_name: 'Ginásio Central U.C.U',
  event_date_text: '20 de Dezembro de 2026',
  whatsapp_group_url: 'https://chat.whatsapp.com/UCUDesafioInverno',
  requires_invite: false,
  min_weight: 50.0,
  max_weight: 90.0,
  status: 'open_for_registration',
  categories: DEFAULT_WEIGHT_CATEGORIES,
};

/**
 * Busca os dados completos do convite de um evento por slug
 */
export async function getEventInvitationBySlug(slug: string): Promise<EventInvitationData> {
  if (slug === SECOND_TEST_EVENT.slug) {
    return SECOND_TEST_EVENT;
  }

  const isSupabaseConfigured = Boolean(
    import.meta.env.VITE_SUPABASE_URL &&
    !import.meta.env.VITE_SUPABASE_URL.includes('placeholder')
  );

  if (!isSupabaseConfigured) {
    return {
      ...DEFAULT_INAUGURAL_EVENT,
      slug: slug || 'arena-inaugural',
    };
  }

  try {
    const fetchPromise = supabase
      .from('events')
      .select('*, weight_categories(*)')
      .eq('slug', slug)
      .maybeSingle();

    const timeoutPromise = new Promise<{ data: null; error: any }>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout de rede Supabase')), 2500)
    );

    const { data: eventData, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

    if (!error && eventData) {
      const categories: WeightCategoryRule[] = (eventData.weight_categories || []).map((wc: any) => ({
        id: wc.id,
        name: wc.name,
        minWeight: Number(wc.min_weight),
        maxWeight: Number(wc.max_weight),
      }));

      return {
        id: eventData.id,
        slug: eventData.slug,
        title: eventData.title,
        headline: 'Comunicado Oficial U.C.U',
        invitation_text: eventData.description || DEFAULT_INAUGURAL_EVENT.invitation_text,
        signatories: DEFAULT_INAUGURAL_EVENT.signatories,
        location_name: eventData.location_name || DEFAULT_INAUGURAL_EVENT.location_name,
        event_date_text: eventData.event_date ? new Date(eventData.event_date).toLocaleDateString('pt-BR') : DEFAULT_INAUGURAL_EVENT.event_date_text,
        whatsapp_group_url: eventData.whatsapp_group_url,
        requires_invite: Boolean(eventData.requires_invite),
        access_code: eventData.access_code,
        min_weight: Number(eventData.min_weight) || 50.0,
        max_weight: Number(eventData.max_weight) || 90.0,
        status: eventData.status,
        categories: categories.length > 0 ? categories : DEFAULT_WEIGHT_CATEGORIES,
      };
    }
  } catch (err) {
    console.warn('[EventService] Usando dados configurados locais para evento:', slug);
  }

  // Fallback padrão seguro para demonstração e resiliência offline
  return {
    ...DEFAULT_INAUGURAL_EVENT,
    slug: slug || 'arena-inaugural',
  };
}

/**
 * Registra a recusa respeitosa do convite ("Não quero participar")
 */
export async function recordInvitationRefusal(slug: string, reason?: string): Promise<{ success: boolean }> {
  try {
    // Registra métrica anônima para controle do organizador
    await supabase.from('audit_logs').insert({
      action: 'INVITATION_REFUSED',
      entity_type: 'events',
      entity_id: '00000000-0000-0000-0000-000000000000',
      changes_payload: { event_slug: slug, reason: reason || 'Optou por não participar', timestamp: new Date().toISOString() },
    });
  } catch {
    // Falha silenciosa em caso de ausência de conexão, sem quebrar o usuário
  }
  return { success: true };
}
