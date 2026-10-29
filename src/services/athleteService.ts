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
import { getUnifiedStore, saveUnifiedStore } from './storeSync';

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
  eventSlug: string = 'arena-inaugural',
  userNickname?: string,
  profileIdHint?: string
): Promise<AthleteEventDashboardData> {
  const isSupabaseConfigured = Boolean(
    import.meta.env.VITE_SUPABASE_URL &&
    !import.meta.env.VITE_SUPABASE_URL.includes('placeholder')
  );

  // Se Supabase estiver conectado e configurado, busca dados reais com máxima resiliência
  if (isSupabaseConfigured) {
    try {
      // 1. Localizar o perfil do atleta por todos os identificadores possíveis
      let profile: any = null;

      // A. Busca direta por ID do perfil (prof-xxx) se fornecido
      if (profileIdHint) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profileIdHint)
          .maybeSingle();
        if (data) profile = data;
      }

      // B. Busca por auth_user_id ou ID do perfil usando authUserId
      if (!profile && authUserId && authUserId !== 'demo-auth-id') {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .or(`auth_user_id.eq.${authUserId},id.eq.${authUserId}`)
          .maybeSingle();
        if (data) profile = data;
      }

      // C. Busca por apelido (case-insensitive) se fornecido
      const nickToSearch = userNickname || (authUserId && !authUserId.includes('-') ? authUserId : undefined);
      if (!profile && nickToSearch) {
        const cleanNick = nickToSearch.trim().toLowerCase();
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .or(`nickname_normalized.eq.${cleanNick},nickname.ilike.${nickToSearch.trim()}`)
          .maybeSingle();
        if (data) profile = data;
      }

      if (profile) {
        // 2. Buscar inscrições associadas ao perfil no Supabase
        const regFilter = profile.auth_user_id
          ? `profile_id.eq.${profile.id},profile_id.eq.${profile.auth_user_id}`
          : `profile_id.eq.${profile.id}`;

        const [regRes, evtRes, catRes] = await Promise.all([
          supabase.from('event_registrations').select('*').or(regFilter),
          supabase.from('events').select('*'),
          supabase.from('weight_categories').select('*'),
        ]);

        const evtMap = new Map((evtRes.data || []).map((e: any) => [e.id, e]));
        const catMap = new Map((catRes.data || []).map((c: any) => [c.id, c]));

        const registrations = (regRes.data || []).map((r: any) => ({
          ...r,
          events: evtMap.get(r.event_id) || DEFAULT_INAUGURAL_EVENT,
          weight_categories: catMap.get(r.weight_category_id),
        }));

        let currentReg = registrations.find(
          (r: any) => r.events?.slug === eventSlug || r.event_id === eventSlug
        );

        if (!currentReg && registrations.length > 0) {
          currentReg = registrations[0];
        }

        if (currentReg) {
          // Sincronizar o status real da nuvem de volta para o unifiedStore local
          try {
            const store = getUnifiedStore();
            let storeUpdated = false;

            const localRegIndex = store.registrations.findIndex(
              (r) =>
                r.id === currentReg.id ||
                r.profile_id === profile.id ||
                r.profile?.auth_user_id === profile.auth_user_id
            );

            if (localRegIndex >= 0) {
              store.registrations[localRegIndex].status = currentReg.status;
              store.registrations[localRegIndex].rejection_reason = currentReg.rejection_reason || null;
              store.registrations[localRegIndex].verified_weight = currentReg.verified_weight;
              store.registrations[localRegIndex].reviewed_at = currentReg.reviewed_at;
              storeUpdated = true;
            }

            // Garantir que o usuário também esteja no store local
            const localUserIndex = store.users.findIndex(
              (u) =>
                u.profileId === profile.id ||
                u.id === profile.auth_user_id ||
                u.nicknameNormalized === profile.nickname_normalized
            );
            if (localUserIndex === -1) {
              store.users.push({
                id: profile.auth_user_id || profile.id,
                nickname: profile.nickname,
                nicknameNormalized: profile.nickname_normalized || profile.nickname.toLowerCase(),
                password: 'password',
                fullName: profile.full_name,
                recoveryEmail: profile.recovery_email,
                isAdmin: false,
                profileId: profile.id,
                createdAt: profile.created_at || new Date().toISOString(),
              });
              storeUpdated = true;
            }

            if (storeUpdated) {
              saveUnifiedStore(store);
            }
          } catch (syncErr) {
            console.warn('[AthleteService] Aviso ao sincronizar com store local:', syncErr);
          }

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

          const formattedEventData: EventInvitationData = {
            id: currentReg.events?.id || DEFAULT_INAUGURAL_EVENT.id,
            slug: currentReg.events?.slug || DEFAULT_INAUGURAL_EVENT.slug,
            title: currentReg.events?.title || DEFAULT_INAUGURAL_EVENT.title,
            headline: 'Comunicado Oficial U.C.U',
            invitation_text: currentReg.events?.description || DEFAULT_INAUGURAL_EVENT.invitation_text,
            signatories: DEFAULT_INAUGURAL_EVENT.signatories,
            location_name: currentReg.events?.location_name || DEFAULT_INAUGURAL_EVENT.location_name,
            event_date_text: currentReg.events?.event_date
              ? new Date(currentReg.events.event_date).toLocaleDateString('pt-BR')
              : DEFAULT_INAUGURAL_EVENT.event_date_text,
            whatsapp_group_url: currentReg.events?.whatsapp_group_url || DEFAULT_INAUGURAL_EVENT.whatsapp_group_url,
            requires_invite: Boolean(currentReg.events?.requires_invite),
            access_code: currentReg.events?.access_code,
            min_weight: Number(currentReg.events?.min_weight) || 50.0,
            max_weight: Number(currentReg.events?.max_weight) || 90.0,
            status: currentReg.events?.status || 'open_for_registration',
            categories: DEFAULT_INAUGURAL_EVENT.categories,
          };

          return {
            athleteProfile: profile as UserProfile,
            currentRegistration: currentReg as EventRegistration,
            enrolledEvents: (registrations || []).map((r: any) => r.events),
            selectedEvent: formattedEventData,
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
      console.warn('[AthleteService] Falha na sincronização remota. Usando dados locais resilientes:', err);
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
