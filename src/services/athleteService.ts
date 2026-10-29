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
} from '../types/app.types';
import { DEFAULT_INAUGURAL_EVENT, EventInvitationData, SECOND_TEST_EVENT } from './eventService';
import { getUnifiedStore } from './storeSync';

export { SECOND_TEST_EVENT };

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
        const [regRes, evtRes, catRes] = await Promise.all([
          supabase.from('event_registrations').select('*').eq('profile_id', profile.id),
          supabase.from('events').select('*'),
          supabase.from('weight_categories').select('*'),
        ]);

        const evtMap = new Map((evtRes.data || []).map((e: any) => [e.id, e]));
        const catMap = new Map((catRes.data || []).map((c: any) => [c.id, c]));

        const registrations = (regRes.data || []).map((r: any) => ({
          ...r,
          events: evtMap.get(r.event_id),
          weight_categories: catMap.get(r.weight_category_id),
        }));

        const currentReg = registrations.find(
          (r: any) => r.events?.slug === eventSlug
        );

        if (currentReg) {
          const { data: rawMatches } = await supabase
            .from('matches')
            .select('*')
            .eq('event_id', currentReg.event_id);

          const { data: allProfiles } = await supabase.from('profiles').select('*');
          const profLookup = new Map((allProfiles || []).map((p: any) => [p.id, p]));

          const eventMatches: MatchFight[] = (rawMatches || []).map((m: any) => ({
            ...m,
            fighter1: {
              id: m.fighter1_registration_id,
              profile: profLookup.get(m.fighter1_registration_id),
            },
            fighter2: {
              id: m.fighter2_registration_id,
              profile: profLookup.get(m.fighter2_registration_id),
            },
          })) as any;

          const { data: announcementsData } = await supabase
            .from('event_announcements')
            .select('*')
            .eq('event_id', currentReg.event_id)
            .order('created_at', { ascending: false });

          const { data: mediaData } = await supabase
            .from('media_items')
            .select('*')
            .eq('event_id', currentReg.event_id);

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

  // SINCRONIZAÇÃO DINÂMICA COM O STORE UNIFICADO (MODO LOCAL / DEMO RESILIENTE)
  const store = getUnifiedStore();

  // 1. Identificar usuário logado ou associado
  const user = store.users.find(
    (u) => u.id === authUserId || u.profileId === authUserId || u.nickname === authUserId
  );

  // 2. Identificar a inscrição do atleta no store
  let currentRegistration = store.registrations.find(
    (r) =>
      (user && (r.profile_id === user.profileId || r.profile?.auth_user_id === user.id)) ||
      r.profile?.auth_user_id === authUserId ||
      r.profile?.id === authUserId
  );

  // Fallback para primeira inscrição cadastrada caso seja admin ou visitante navegando
  if (!currentRegistration && store.registrations.length > 0) {
    currentRegistration = store.registrations[0];
  }

  const athleteProfile: UserProfile = currentRegistration?.profile || {
    id: user?.profileId || 'prof-demo',
    auth_user_id: user?.id || authUserId,
    full_name: user?.fullName || 'Atleta da Arena',
    nickname: user?.nickname || 'Guerreiro UCU',
    recovery_email: user?.recoveryEmail || '',
    phone: '',
    birth_date: '2000-01-01',
    is_minor: false,
    image_consent: true,
    terms_consent: true,
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const selectedEventData =
    eventSlug === SECOND_TEST_EVENT.slug ? SECOND_TEST_EVENT : DEFAULT_INAUGURAL_EVENT;

  const eventMatches = store.matches.filter(
    (m) => m.event_id === selectedEventData.id
  );

  const nextMatch =
    eventMatches.find(
      (m) =>
        m.status === 'scheduled' &&
        (m.fighter1_registration_id === currentRegistration?.id ||
          m.fighter2_registration_id === currentRegistration?.id)
    ) || (eventMatches.length > 0 ? eventMatches[0] : null);

  const stats = calculateCareerStats(athleteProfile.id, store.matches);

  const announcements = store.announcements.map((a) => ({
    id: a.id,
    title: a.title,
    content: a.content,
    createdAt: a.created_at,
    isPinned: a.is_pinned,
  }));

  const mediaItems = store.mediaItems.map((m) => ({
    id: m.id,
    title: m.title,
    mediaType: m.media_type as any,
    url: m.url,
  }));

  return {
    athleteProfile,
    currentRegistration: currentRegistration || {
      id: 'reg-fallback',
      event_id: selectedEventData.id,
      profile_id: athleteProfile.id,
      weight_category_id: 'cat-meio-medio',
      declared_weight: 68.0,
      verified_weight: null,
      status: 'approved',
      guardian_authorized: false,
      checkin_status: true,
      registered_at: new Date().toISOString(),
      profile: athleteProfile,
    },
    enrolledEvents: store.events,
    selectedEvent: selectedEventData,
    nextMatch,
    eventMatches,
    announcements,
    mediaItems,
    careerStats: stats,
  };
}
