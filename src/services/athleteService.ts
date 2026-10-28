// ==============================================================================
// U.C.U ARENA — SERVIÇO DO PORTAL PRIVADO DO ATLETA
// Gestão de múltiplos eventos, confrontos, estatísticas esportivas e mídia
// ==============================================================================

import { supabase } from '../lib/supabaseClient';
import {
  ArenaEvent,
  EventRegistration,
  MatchFight,
  UserProfile,
  WeightCategory,
} from '../types/app.types';
import { DEFAULT_INAUGURAL_EVENT, EventInvitationData } from './eventService';

export interface AthleteCareerStats {
  totalFights: number;
  victories: number;
  defeats: number;
  draws: number;
  knockouts: number;
  submissions: number;
  decisionWins: number;
  winRate: number; // Porcentagem (0 a 100)
}

export interface AthleteEventDashboardData {
  athleteProfile: UserProfile;
  currentRegistration: EventRegistration;
  enrolledEvents: ArenaEvent[];
  selectedEvent: EventInvitationData;
  nextMatch: MatchFight | null;
  eventMatches: MatchFight[];
  announcements: Array<{
    id: string;
    title: string;
    content: string;
    createdAt: string;
    isPinned: boolean;
  }>;
  mediaItems: Array<{
    id: string;
    title: string;
    mediaType: 'video' | 'photo' | 'highlight';
    url: string;
    thumbnailUrl?: string;
  }>;
  careerStats: AthleteCareerStats;
}

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
  categories: DEFAULT_INAUGURAL_EVENT.categories,
};

/**
 * Calcula estatísticas esportivas a partir de uma lista de confrontos finalizados
 */
export function calculateCareerStats(
  profileId: string,
  matches: MatchFight[]
): AthleteCareerStats {
  let totalFights = 0;
  let victories = 0;
  let defeats = 0;
  let draws = 0;
  let knockouts = 0;
  let submissions = 0;
  let decisionWins = 0;

  for (const m of matches) {
    if (m.status !== 'completed') continue;

    const isFighter1 = m.fighter1?.profile_id === profileId;
    const isFighter2 = m.fighter2?.profile_id === profileId;

    if (!isFighter1 && !isFighter2) continue;

    totalFights++;

    if (m.victory_method === 'DRAW') {
      draws++;
      continue;
    }

    const won =
      (isFighter1 && m.winner_registration_id === m.fighter1_registration_id) ||
      (isFighter2 && m.winner_registration_id === m.fighter2_registration_id);

    if (won) {
      victories++;
      if (m.victory_method === 'KO' || m.victory_method === 'TKO') {
        knockouts++;
      } else if (m.victory_method === 'SUBMISSION') {
        submissions++;
      } else if (m.victory_method === 'POINTS') {
        decisionWins++;
      }
    } else {
      defeats++;
    }
  }

  const winRate = totalFights > 0 ? Math.round((victories / totalFights) * 100) : 0;

  return {
    totalFights,
    victories,
    defeats,
    draws,
    knockouts,
    submissions,
    decisionWins,
    winRate,
  };
}

/**
 * Busca os dados consolidados do participante para o evento selecionado
 */
export async function getAthleteDashboardData(
  authUserId: string,
  eventSlug: string = 'arena-inaugural'
): Promise<AthleteEventDashboardData> {
  const isSupabaseConfigured = Boolean(
    import.meta.env.VITE_SUPABASE_URL &&
    !import.meta.env.VITE_SUPABASE_URL.includes('placeholder')
  );

  // Se Supabase estiver conectado e configurado, busca dados reais
  if (isSupabaseConfigured) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_user_id', authUserId)
        .maybeSingle();

      if (profile) {
        const { data: registrations } = await supabase
          .from('event_registrations')
          .select('*, events(*), weight_categories(*)')
          .eq('profile_id', profile.id);

        const currentReg = (registrations || []).find(
          (r: any) => r.events?.slug === eventSlug
        );

        if (currentReg) {
          const { data: matchesData } = await supabase
            .from('matches')
            .select('*, fighter1:fighter1_registration_id(profile:profiles(*)), fighter2:fighter2_registration_id(profile:profiles(*))')
            .eq('event_id', currentReg.event_id);

          const { data: announcementsData } = await supabase
            .from('event_announcements')
            .select('*')
            .eq('event_id', currentReg.event_id)
            .order('created_at', { ascending: false });

          const { data: mediaData } = await supabase
            .from('media_items')
            .select('*')
            .eq('event_id', currentReg.event_id);

          const eventMatches: MatchFight[] = matchesData || [];
          const nextMatch =
            eventMatches.find(
              (m) =>
                m.status === 'scheduled' &&
                (m.fighter1_registration_id === currentReg.id ||
                  m.fighter2_registration_id === currentReg.id)
            ) || null;

          const stats = calculateCareerStats(profile.id, eventMatches);

          return {
            athleteProfile: profile as UserProfile,
            currentRegistration: currentReg as EventRegistration,
            enrolledEvents: (registrations || []).map((r: any) => r.events),
            selectedEvent: currentReg.events,
            nextMatch,
            eventMatches,
            announcements: (announcementsData || []).map((a: any) => ({
              id: a.id,
              title: a.title,
              content: a.content_markdown,
              createdAt: a.created_at,
              isPinned: a.is_pinned,
            })),
            mediaItems: (mediaData || []).map((m: any) => ({
              id: m.id,
              title: m.title,
              mediaType: m.media_type,
              url: m.url,
              thumbnailUrl: m.thumbnail_url,
            })),
            careerStats: stats,
          };
        }
      }
    } catch (err) {
      console.warn('[AthleteService] Falha na sincronização remota. Usando dados locais resilientes.');
    }
  }

  // DADOS ESTRUTURAIS DE DEMONSTRAÇÃO E TESTE DA FASE 04
  const demoProfileId = 'prof-demo-123';
  const demoProfile: UserProfile = {
    id: demoProfileId,
    auth_user_id: authUserId || 'auth-demo-user',
    full_name: 'Carlos Demolidor Silva',
    nickname: 'Demolidor',
    recovery_email: 'privado@atleta.com',
    phone: '(11) 99888-7777',
    birthDate: '2000-03-15',
    is_minor: false,
    image_consent: true,
    terms_consent: true,
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as any;

  const demoCategory: WeightCategory = {
    id: 'cat-meio-medio',
    event_id: DEFAULT_INAUGURAL_EVENT.id,
    name: 'Peso Meio-Médio (Mais de 60 até 70 kg)',
    min_weight: 60.01,
    max_weight: 70.0,
    display_order: 2,
  };

  const demoRegistration: EventRegistration = {
    id: 'reg-demo-01',
    event_id: DEFAULT_INAUGURAL_EVENT.id,
    profile_id: demoProfileId,
    weight_category_id: demoCategory.id,
    declared_weight: 67.5,
    verified_weight: 67.2, // Confirmado na pesagem oficial
    status: 'approved',
    guardian_authorized: false,
    checkin_status: true,
    registered_at: new Date().toISOString(),
    profile: demoProfile,
    weight_category: demoCategory,
  };

  const opponentProfile: UserProfile = {
    id: 'prof-opp-456',
    auth_user_id: 'auth-opp',
    full_name: 'Roberto Falcão Lima',
    nickname: 'Falcão da Noite',
    recovery_email: 'privado@falcao.com',
    phone: '(11) 91111-2222',
    birth_date: '1999-07-20',
    is_minor: false,
    image_consent: true,
    terms_consent: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const opponentRegistration: EventRegistration = {
    id: 'reg-opp-02',
    event_id: DEFAULT_INAUGURAL_EVENT.id,
    profile_id: opponentProfile.id,
    weight_category_id: demoCategory.id,
    declared_weight: 68.0,
    verified_weight: 67.8,
    status: 'approved',
    guardian_authorized: false,
    checkin_status: true,
    registered_at: new Date().toISOString(),
    profile: opponentProfile,
    weight_category: demoCategory,
  };

  const matches: MatchFight[] = [
    {
      id: 'match-01',
      event_id: DEFAULT_INAUGURAL_EVENT.id,
      weight_category_id: demoCategory.id,
      match_order: 3,
      round_name: 'Card Principal — Disputa de Cinturão',
      fighter1_registration_id: demoRegistration.id,
      fighter2_registration_id: opponentRegistration.id,
      status: 'scheduled',
      scheduled_time: '19:30',
      fighter1: demoRegistration,
      fighter2: opponentRegistration,
    },
    {
      id: 'match-00-past',
      event_id: DEFAULT_INAUGURAL_EVENT.id,
      weight_category_id: demoCategory.id,
      match_order: 1,
      round_name: 'Luta Preliminar Amistosa',
      fighter1_registration_id: demoRegistration.id,
      fighter2_registration_id: opponentRegistration.id,
      status: 'completed',
      winner_registration_id: demoRegistration.id,
      victory_method: 'KO',
      score_details: 'Nocaute técnico no 2º round aos 2:15',
      video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      completed_at: '2026-10-15T20:45:00Z',
      fighter1: demoRegistration,
      fighter2: opponentRegistration,
    },
  ];

  const stats = calculateCareerStats(demoProfileId, matches);

  const enrolledEvents: ArenaEvent[] = [
    {
      id: DEFAULT_INAUGURAL_EVENT.id,
      slug: DEFAULT_INAUGURAL_EVENT.slug,
      title: DEFAULT_INAUGURAL_EVENT.title,
      description: DEFAULT_INAUGURAL_EVENT.invitation_text,
      event_date: '2026-11-15T18:00:00Z',
      location_name: DEFAULT_INAUGURAL_EVENT.location_name,
      location_address: 'Av. dos Campeões, 1000 - São Paulo, SP',
      whatsapp_group_url: DEFAULT_INAUGURAL_EVENT.whatsapp_group_url,
      rules_markdown: 'Regulamento oficial da U.C.U Arena.',
      min_weight: 50.0,
      max_weight: 90.0,
      status: 'open_for_registration',
      format_type: 'mixed',
      created_at: new Date().toISOString(),
    },
    {
      id: SECOND_TEST_EVENT.id,
      slug: SECOND_TEST_EVENT.slug,
      title: SECOND_TEST_EVENT.title,
      description: SECOND_TEST_EVENT.invitation_text,
      event_date: '2026-12-20T19:00:00Z',
      location_name: SECOND_TEST_EVENT.location_name,
      location_address: 'Rua do Combate, 500 - São Paulo, SP',
      whatsapp_group_url: SECOND_TEST_EVENT.whatsapp_group_url,
      rules_markdown: 'Regulamento oficial do Desafio de Inverno.',
      min_weight: 50.0,
      max_weight: 90.0,
      status: 'open_for_registration',
      format_type: 'friendly',
      created_at: new Date().toISOString(),
    },
  ];

  const selectedEventData =
    eventSlug === SECOND_TEST_EVENT.slug ? SECOND_TEST_EVENT : DEFAULT_INAUGURAL_EVENT;

  return {
    athleteProfile: demoProfile,
    currentRegistration: demoRegistration,
    enrolledEvents,
    selectedEvent: selectedEventData,
    nextMatch: eventSlug === SECOND_TEST_EVENT.slug ? null : matches[0],
    eventMatches: eventSlug === SECOND_TEST_EVENT.slug ? [] : matches,
    announcements: [
      {
        id: 'ann-1',
        title: 'Pesagem Oficial Confirmada',
        content:
          'A pesagem oficial presencial terá início 2 horas antes da abertura dos portões no Espaço M-thor. Traga documento oficial com foto.',
        createdAt: '2026-10-25T10:00:00Z',
        isPinned: true,
      },
      {
        id: 'ann-2',
        title: 'Orientações de Bandagens e Luvas',
        content:
          'A organização fornecerá luvas oficiais lacradas no vestiário. Bandagens devem ser inspecionadas pela arbitragem antes do aquecimento.',
        createdAt: '2026-10-20T14:30:00Z',
        isPinned: false,
      },
    ],
    mediaItems: [
      {
        id: 'med-1',
        title: 'Melhores Momentos: Nocaute de Demolidor',
        mediaType: 'video',
        url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        thumbnailUrl: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=600&auto=format&fit=crop',
      },
    ],
    careerStats: stats,
  };
}
