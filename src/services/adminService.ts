// ==============================================================================
// U.C.U ARENA — SERVIÇO ADMINISTRATIVO CENTRAL (FASE 05)
// Centro de comando: Moderação, Pesagem, Chaveamento, Resultados, Mídia e Auditoria
// ==============================================================================

import {
  ArenaEvent,
  EventRegistration,
  MatchFight,
  AuditLog,
  EventAnnouncement,
  MediaItem,
  AdminKpiSummary,
  VictoryMethod,
} from '../types/app.types';
import {
  WeightCategoryRule,
  hasCategoryOverlap,
  findWeightCategoryForWeight,
  validateAthleteWeight,
} from '../utils/validationRules';
import { DEFAULT_INAUGURAL_EVENT } from './eventService';
import { SECOND_TEST_EVENT } from './athleteService';
import {
  getUnifiedStore,
  saveUnifiedStore,
  formatYoutubeEmbedUrl,
} from './storeSync';
import { supabase } from '../lib/supabaseClient';

// ==============================================================================
// ESTADO EM MEMÓRIA RESILIENTE (PARA AMBIENTE LOCAL / DEMO / TESTES)
// ==============================================================================

interface AdminDataStore {
  events: ArenaEvent[];
  registrations: EventRegistration[];
  matches: MatchFight[];
  announcements: EventAnnouncement[];
  mediaItems: MediaItem[];
  auditLogs: AuditLog[];
}

// Inicialização do estado administrativo
const initialEvents: ArenaEvent[] = [
  {
    id: DEFAULT_INAUGURAL_EVENT.id,
    slug: DEFAULT_INAUGURAL_EVENT.slug,
    title: DEFAULT_INAUGURAL_EVENT.title,
    description: DEFAULT_INAUGURAL_EVENT.invitation_text,
    event_date: '2026-11-15T18:00:00Z',
    location_name: DEFAULT_INAUGURAL_EVENT.location_name,
    location_address: 'Espaço M-thor, São Paulo - SP',
    whatsapp_group_url: DEFAULT_INAUGURAL_EVENT.whatsapp_group_url,
    rules_markdown: 'Regulamento oficial do Campeonato de Boxe Amador U.C.U Arena.',
    min_weight: 50.0,
    max_weight: 90.0,
    status: 'open_for_registration',
    format_type: 'mixed',
    created_at: '2026-10-20T10:00:00Z',
  },
  {
    id: SECOND_TEST_EVENT.id,
    slug: SECOND_TEST_EVENT.slug,
    title: SECOND_TEST_EVENT.title,
    description: SECOND_TEST_EVENT.invitation_text,
    event_date: '2026-12-20T19:00:00Z',
    location_name: SECOND_TEST_EVENT.location_name,
    location_address: 'Ginásio Central U.C.U, São Paulo - SP',
    whatsapp_group_url: SECOND_TEST_EVENT.whatsapp_group_url,
    rules_markdown: 'Regulamento oficial da segunda edição do circuito.',
    min_weight: 50.0,
    max_weight: 90.0,
    status: 'open_for_registration',
    format_type: 'friendly',
    created_at: '2026-10-25T14:00:00Z',
  },
];

const initialRegistrations: EventRegistration[] = [
  {
    id: 'reg-demo-01',
    event_id: DEFAULT_INAUGURAL_EVENT.id,
    profile_id: 'prof-demo-123',
    weight_category_id: 'cat-meio-medio',
    declared_weight: 67.5,
    verified_weight: 67.2,
    status: 'approved',
    guardian_authorized: false,
    checkin_status: true,
    registered_at: '2026-10-22T12:00:00Z',
    profile: {
      id: 'prof-demo-123',
      auth_user_id: 'auth-demo-user',
      full_name: 'Carlos Demolidor Silva',
      nickname: 'Demolidor',
      recovery_email: 'privado@atleta.com',
      phone: '(11) 99888-7777',
      birth_date: '2000-03-15',
      is_minor: false,
      image_consent: true,
      terms_consent: true,
      created_at: '2026-10-22T12:00:00Z',
      updated_at: '2026-10-22T12:00:00Z',
    },
    weight_category: {
      id: 'cat-meio-medio',
      event_id: DEFAULT_INAUGURAL_EVENT.id,
      name: 'Peso Meio-Médio (Mais de 60 até 70 kg)',
      min_weight: 60.01,
      max_weight: 70.0,
      display_order: 2,
    },
  },
  {
    id: 'reg-opp-02',
    event_id: DEFAULT_INAUGURAL_EVENT.id,
    profile_id: 'prof-opp-456',
    weight_category_id: 'cat-meio-medio',
    declared_weight: 68.0,
    verified_weight: 67.8,
    status: 'approved',
    guardian_authorized: false,
    checkin_status: true,
    registered_at: '2026-10-23T15:30:00Z',
    profile: {
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
      created_at: '2026-10-23T15:30:00Z',
      updated_at: '2026-10-23T15:30:00Z',
    },
    weight_category: {
      id: 'cat-meio-medio',
      event_id: DEFAULT_INAUGURAL_EVENT.id,
      name: 'Peso Meio-Médio (Mais de 60 até 70 kg)',
      min_weight: 60.01,
      max_weight: 70.0,
      display_order: 2,
    },
  },
  {
    id: 'reg-pending-03',
    event_id: DEFAULT_INAUGURAL_EVENT.id,
    profile_id: 'prof-pantera-789',
    weight_category_id: 'cat-leve',
    declared_weight: 58.5,
    verified_weight: null, // Pendente de pesagem oficial
    status: 'pending',
    guardian_authorized: true,
    checkin_status: false,
    registered_at: '2026-10-26T09:15:00Z',
    profile: {
      id: 'prof-pantera-789',
      auth_user_id: 'auth-pantera',
      full_name: 'Lucas Gabriel Souza',
      nickname: 'Pantera Negra',
      recovery_email: 'lucas@gmail.com',
      phone: '(11) 94444-5555',
      birth_date: '2009-08-10', // Menor de idade (17 anos)
      is_minor: true,
      guardian_name: 'Marcos Souza',
      guardian_relationship: 'Pai',
      guardian_phone: '(11) 93333-2222',
      guardian_document: '12.345.678-9',
      image_consent: true,
      terms_consent: true,
      created_at: '2026-10-26T09:15:00Z',
      updated_at: '2026-10-26T09:15:00Z',
    },
    weight_category: {
      id: 'cat-leve',
      event_id: DEFAULT_INAUGURAL_EVENT.id,
      name: 'Peso Leve (50 a 60 kg)',
      min_weight: 50.0,
      max_weight: 60.0,
      display_order: 1,
    },
  },
  {
    id: 'reg-pending-04',
    event_id: DEFAULT_INAUGURAL_EVENT.id,
    profile_id: 'prof-tigre-999',
    weight_category_id: 'cat-pesado',
    declared_weight: 84.0,
    verified_weight: null,
    status: 'pending',
    guardian_authorized: false,
    checkin_status: false,
    registered_at: '2026-10-26T14:45:00Z',
    profile: {
      id: 'prof-tigre-999',
      auth_user_id: 'auth-tigre',
      full_name: 'Marcos Tigre Ribeiro',
      nickname: 'Tigre do Norte',
      recovery_email: 'tigre@gmail.com',
      phone: '(11) 92222-1111',
      birth_date: '1995-12-05',
      is_minor: false,
      image_consent: true,
      terms_consent: true,
      created_at: '2026-10-26T14:45:00Z',
      updated_at: '2026-10-26T14:45:00Z',
    },
    weight_category: {
      id: 'cat-pesado',
      event_id: DEFAULT_INAUGURAL_EVENT.id,
      name: 'Peso Pesado (Mais de 80 até 90 kg)',
      min_weight: 80.01,
      max_weight: 90.0,
      display_order: 4,
    },
  },
];

const initialMatches: MatchFight[] = [
  {
    id: 'match-01',
    event_id: DEFAULT_INAUGURAL_EVENT.id,
    weight_category_id: 'cat-meio-medio',
    match_order: 1,
    round_name: 'Card Principal — Disputa de Cinturão',
    fighter1_registration_id: 'reg-demo-01',
    fighter2_registration_id: 'reg-opp-02',
    status: 'scheduled',
    scheduled_time: '19:30',
    fighter1: initialRegistrations[0],
    fighter2: initialRegistrations[1],
  },
  {
    id: 'match-past-02',
    event_id: DEFAULT_INAUGURAL_EVENT.id,
    weight_category_id: 'cat-meio-medio',
    match_order: 2,
    round_name: 'Luta Preliminar Amistosa',
    fighter1_registration_id: 'reg-demo-01',
    fighter2_registration_id: 'reg-opp-02',
    status: 'completed',
    winner_registration_id: 'reg-demo-01',
    victory_method: 'KO',
    score_details: 'Nocaute técnico aos 2:15 do 2º round',
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    completed_at: '2026-10-15T20:45:00Z',
    fighter1: initialRegistrations[0],
    fighter2: initialRegistrations[1],
  },
];

const initialAnnouncements: EventAnnouncement[] = [
  {
    id: 'ann-1',
    event_id: DEFAULT_INAUGURAL_EVENT.id,
    title: 'Pesagem Oficial Confirmada',
    content:
      'A pesagem oficial presencial terá início 2 horas antes da abertura dos portões no Espaço M-thor. Traga documento oficial com foto.',
    is_pinned: true,
    created_at: '2026-10-25T10:00:00Z',
  },
  {
    id: 'ann-2',
    event_id: DEFAULT_INAUGURAL_EVENT.id,
    title: 'Orientações de Bandagens e Luvas',
    content:
      'A organização fornecerá luvas oficiais lacradas no vestiário. Bandagens devem ser inspecionadas pela arbitragem antes do aquecimento.',
    is_pinned: false,
    created_at: '2026-10-20T14:30:00Z',
  },
];

const initialMediaItems: MediaItem[] = [
  {
    id: 'med-1',
    event_id: DEFAULT_INAUGURAL_EVENT.id,
    title: 'Melhores Momentos: Nocaute de Demolidor',
    description: 'Highlights do combate preliminar com nocaute técnico no 2º round.',
    media_type: 'video',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnail_url:
      'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=600&auto=format&fit=crop',
    match_id: 'match-past-02',
    is_public: true,
    created_at: '2026-10-26T18:00:00Z',
  },
];

const initialAuditLogs: AuditLog[] = [
  {
    id: 'log-1',
    event_id: DEFAULT_INAUGURAL_EVENT.id,
    action: 'EVENT_INITIALIZED',
    admin_id: 'admin-super',
    admin_nickname: 'Admin Principal',
    target_entity: 'events',
    target_id: DEFAULT_INAUGURAL_EVENT.id,
    details: 'Evento inaugural U.C.U Arena provisionado e publicado.',
    created_at: '2026-10-20T10:00:00Z',
  },
  {
    id: 'log-2',
    event_id: DEFAULT_INAUGURAL_EVENT.id,
    action: 'ATHLETE_APPROVED',
    admin_id: 'admin-super',
    admin_nickname: 'Admin Principal',
    target_entity: 'event_registrations',
    target_id: 'reg-demo-01',
    details: 'Atleta "Demolidor" aprovado no Peso Meio-Médio.',
    created_at: '2026-10-22T14:00:00Z',
  },
];

// Instância global em memória sincronizada
export const adminStore: AdminDataStore = {
  events: [...initialEvents],
  registrations: [...initialRegistrations],
  matches: [...initialMatches],
  announcements: [...initialAnnouncements],
  mediaItems: [...initialMediaItems],
  auditLogs: [...initialAuditLogs],
};

export function syncAdminStoreFromUnified(): void {
  try {
    const unified = getUnifiedStore();
    adminStore.events = [...unified.events];
    adminStore.registrations = [...unified.registrations];
    adminStore.matches = [...unified.matches];
    adminStore.announcements = [...unified.announcements];
    adminStore.mediaItems = [...unified.mediaItems];
    adminStore.auditLogs = [...unified.auditLogs];
  } catch (err) {
    console.warn('[AdminService] Falha ao sincronizar a partir do UnifiedStore:', err);
  }
}

export function syncAdminStoreToUnified(): void {
  try {
    const unified = getUnifiedStore();
    unified.events = [...adminStore.events];
    unified.registrations = [...adminStore.registrations];
    unified.matches = [...adminStore.matches];
    unified.announcements = [...adminStore.announcements];
    unified.mediaItems = [...adminStore.mediaItems];
    unified.auditLogs = [...adminStore.auditLogs];

    // Popular unified.users para qualquer perfil da nuvem que ainda não esteja no store local
    for (const reg of adminStore.registrations) {
      if (reg.profile && reg.profile.nickname) {
        const cleanNick = reg.profile.nickname.trim().toLowerCase();
        const existing = unified.users.find(
          (u) =>
            u.nicknameNormalized === cleanNick ||
            u.id === reg.profile?.auth_user_id ||
            u.profileId === reg.profile?.id
        );
        if (!existing) {
          unified.users.push({
            id: reg.profile.auth_user_id || reg.profile.id,
            nickname: reg.profile.nickname,
            nicknameNormalized: cleanNick,
            password: 'password',
            fullName: reg.profile.full_name,
            recoveryEmail: reg.profile.recovery_email,
            isAdmin: false,
            profileId: reg.profile.id,
            createdAt: reg.profile.created_at || new Date().toISOString(),
          });
        }
      }
    }

    saveUnifiedStore(unified);
  } catch (err) {
    console.error('[AdminService] Falha ao sincronizar para o UnifiedStore:', err);
  }
}

// Sincronização inicial automática
syncAdminStoreFromUnified();

function logAuditAction(
  eventId: string | null,
  action: string,
  targetEntity: string,
  targetId: string,
  details: string,
  adminNickname: string = 'Admin Principal'
) {
  const newLog: AuditLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    event_id: eventId,
    action,
    admin_id: 'admin-super',
    admin_nickname: adminNickname,
    target_entity: targetEntity,
    target_id: targetId,
    details,
    created_at: new Date().toISOString(),
  };
  adminStore.auditLogs.unshift(newLog);

  // Sincronizar qualquer ação administrativa imediatamente para o store compartilhado
  syncAdminStoreToUnified();
}

// ==============================================================================
// OPERAÇÕES DO PAINEL PRINCIPAL E VISÃO GERAL
// ==============================================================================

export async function getAdminDashboardSummary(eventSlug: string = 'arena-inaugural'): Promise<{
  activeEvent: ArenaEvent;
  allEvents: ArenaEvent[];
  kpi: AdminKpiSummary;
  registrations: EventRegistration[];
  matches: MatchFight[];
  announcements: EventAnnouncement[];
  auditLogs: AuditLog[];
}> {
  // 1. Sincronizar com inscrições e dados mais recentes salvos no storage local
  syncAdminStoreFromUnified();

  // 2. Sincronizar com o banco de dados global Supabase em tempo real
  try {
    // Busca paralela e resiliente para não depender de restrições de chave estrangeira no cache do PostgREST
    const [regRes, profRes, catRes, matchRes] = await Promise.all([
      supabase.from('event_registrations').select('*'),
      supabase.from('profiles').select('*'),
      supabase.from('weight_categories').select('*'),
      supabase.from('matches').select('*'),
    ]);

    if (!regRes.error && regRes.data && regRes.data.length > 0) {
      const profMap = new Map();
      for (const p of profRes.data || []) {
        profMap.set(p.id, p);
        if (p.auth_user_id) {
          profMap.set(p.auth_user_id, p);
        }
      }
      const catMap = new Map((catRes.data || []).map((c: any) => [c.id, c]));

      const mappedCloudRegs: EventRegistration[] = regRes.data.map((cr: any) => {
        const p = profMap.get(cr.profile_id);
        const c = catMap.get(cr.weight_category_id);
        return {
          id: cr.id,
          event_id: cr.event_id,
          profile_id: cr.profile_id,
          weight_category_id: cr.weight_category_id,
          declared_weight: Number(cr.declared_weight),
          verified_weight: cr.verified_weight ? Number(cr.verified_weight) : null,
          status: cr.status as any,
          rejection_reason: cr.rejection_reason || null,
          guardian_authorized: Boolean(cr.guardian_authorized),
          checkin_status: Boolean(cr.checkin_status),
          registered_at: cr.registered_at,
          reviewed_at: cr.reviewed_at || null,
          profile: p
            ? {
                id: p.id,
                auth_user_id: p.auth_user_id,
                full_name: p.full_name,
                nickname: p.nickname,
                recovery_email: p.recovery_email,
                phone: p.phone,
                birth_date: p.birth_date,
                is_minor: Boolean(p.is_minor),
                guardian_name: p.guardian_name,
                guardian_relationship: p.guardian_relationship,
                guardian_phone: p.guardian_phone,
                guardian_document: p.guardian_document,
                image_consent: Boolean(p.image_consent),
                terms_consent: Boolean(p.terms_consent),
                avatar_url: p.avatar_url,
                created_at: p.created_at,
                updated_at: p.updated_at,
              }
            : undefined,
          weight_category: c
            ? {
                id: c.id,
                event_id: c.event_id,
                name: c.name,
                min_weight: Number(c.min_weight),
                max_weight: Number(c.max_weight),
                display_order: Number(c.display_order || 1),
              }
            : undefined,
        };
      });

      // Mesclar registros da nuvem preservando integridade
      const cloudMap = new Map<string, EventRegistration>();
      for (const reg of mappedCloudRegs) {
        cloudMap.set(reg.id, reg);
      }

      // Adiciona registros locais que ainda não subiram
      for (const localReg of adminStore.registrations) {
        if (!cloudMap.has(localReg.id)) {
          cloudMap.set(localReg.id, localReg);
        }
      }

      adminStore.registrations = Array.from(cloudMap.values());

      // Sincronizar lutas da nuvem se disponíveis
      if (!matchRes.error && matchRes.data && matchRes.data.length > 0) {
        const regMap = new Map(adminStore.registrations.map((r) => [r.id, r]));
        const cloudMatches: MatchFight[] = matchRes.data.map((cm: any) => ({
          id: cm.id,
          event_id: cm.event_id,
          weight_category_id: cm.weight_category_id,
          match_order: Number(cm.match_order),
          round_name: cm.round_name,
          fighter1_registration_id: cm.fighter1_registration_id,
          fighter2_registration_id: cm.fighter2_registration_id,
          status: cm.status as any,
          winner_registration_id: cm.winner_registration_id || null,
          victory_method: cm.victory_method || null,
          score_details: cm.score_details || null,
          video_url: cm.video_url || undefined,
          scheduled_time: cm.scheduled_time || null,
          completed_at: cm.completed_at || null,
          fighter1: regMap.get(cm.fighter1_registration_id),
          fighter2: regMap.get(cm.fighter2_registration_id),
        }));

        const matchMap = new Map<string, MatchFight>();
        for (const m of cloudMatches) {
          matchMap.set(m.id, m);
        }
        for (const localM of adminStore.matches) {
          if (!matchMap.has(localM.id)) {
            matchMap.set(localM.id, localM);
          }
        }
        adminStore.matches = Array.from(matchMap.values());
      }

      syncAdminStoreToUnified();
    }
  } catch (err) {
    console.warn('[AdminService] Falha na sincronização cloud em tempo real:', err);
  }

  // Localiza evento ativo
  let activeEvent = adminStore.events.find((e) => e.slug === eventSlug);
  if (!activeEvent) {
    activeEvent = adminStore.events[0];
  }

  const eventRegs = adminStore.registrations.filter((r) => r.event_id === activeEvent!.id);
  const eventMatches = adminStore.matches.filter((m) => m.event_id === activeEvent!.id);

  const pendingRegistrations = eventRegs.filter((r) => r.status === 'pending').length;
  const approvedAthletes = eventRegs.filter((r) => r.status === 'approved').length;
  const upcomingMatches = eventMatches.filter((m) => m.status === 'scheduled').length;
  const unscheduledMatches = eventMatches.filter(
    (m) => m.status === 'scheduled' && !m.scheduled_time
  ).length;
  const minorPendingConsent = eventRegs.filter(
    (r) => r.profile?.is_minor && !r.guardian_authorized
  ).length;

  const kpi: AdminKpiSummary = {
    totalEvents: adminStore.events.length,
    totalAthletes: eventRegs.length,
    pendingRegistrations,
    approvedAthletes,
    totalMatches: eventMatches.length,
    upcomingMatches,
    unscheduledMatches,
    minorPendingConsent,
  };

  return {
    activeEvent,
    allEvents: adminStore.events,
    kpi,
    registrations: eventRegs,
    matches: eventMatches,
    announcements: adminStore.announcements.filter((a) => a.event_id === activeEvent!.id),
    auditLogs: adminStore.auditLogs.filter(
      (l) => !l.event_id || l.event_id === activeEvent!.id
    ),
  };
}

// ==============================================================================
// MODERAÇÃO DE PARTICIPANTES E PESAGEM OFICIAL
// ==============================================================================

export async function approveAthleteRegistration(
  registrationId: string,
  adminNickname: string = 'Admin Principal'
): Promise<{ success: boolean; error?: string }> {
  const reg = adminStore.registrations.find((r) => r.id === registrationId);
  if (!reg) return { success: false, error: 'Inscrição não encontrada.' };

  const nowIso = new Date().toISOString();
  reg.status = 'approved';
  reg.rejection_reason = null;
  reg.reviewed_at = nowIso;

  try {
    await supabase
      .from('event_registrations')
      .update({ status: 'approved', rejection_reason: null, reviewed_at: nowIso })
      .eq('id', registrationId);
  } catch (err) {
    console.warn('[AdminService] Falha ao aprovar no Supabase:', err);
  }

  logAuditAction(
    reg.event_id,
    'ATHLETE_APPROVED',
    'event_registrations',
    reg.id,
    `Atleta "${reg.profile?.nickname}" aprovado com sucesso no evento.`,
    adminNickname
  );

  syncAdminStoreToUnified();
  return { success: true };
}

export async function rejectAthleteRegistration(
  registrationId: string,
  reason: string,
  adminNickname: string = 'Admin Principal'
): Promise<{ success: boolean; error?: string }> {
  if (!reason.trim()) {
    return { success: false, error: 'É obrigatório informar o motivo da recusa.' };
  }

  const reg = adminStore.registrations.find((r) => r.id === registrationId);
  if (!reg) return { success: false, error: 'Inscrição não encontrada.' };

  const nowIso = new Date().toISOString();
  reg.status = 'rejected';
  reg.rejection_reason = reason.trim();
  reg.reviewed_at = nowIso;

  try {
    await supabase
      .from('event_registrations')
      .update({ status: 'rejected', rejection_reason: reason.trim(), reviewed_at: nowIso })
      .eq('id', registrationId);
  } catch (err) {
    console.warn('[AdminService] Falha ao rejeitar no Supabase:', err);
  }

  logAuditAction(
    reg.event_id,
    'ATHLETE_REJECTED',
    'event_registrations',
    reg.id,
    `Inscrição de "${reg.profile?.nickname}" recusada. Motivo: ${reason}`,
    adminNickname
  );

  syncAdminStoreToUnified();
  return { success: true };
}

export async function suspendAthleteRegistration(
  registrationId: string,
  reason: string,
  adminNickname: string = 'Admin Principal'
): Promise<{ success: boolean; error?: string }> {
  const reg = adminStore.registrations.find((r) => r.id === registrationId);
  if (!reg) return { success: false, error: 'Inscrição não encontrada.' };

  const nowIso = new Date().toISOString();
  reg.status = 'suspended';
  reg.rejection_reason = reason.trim() || 'Suspenso pela organização administrativa.';
  reg.reviewed_at = nowIso;

  try {
    await supabase
      .from('event_registrations')
      .update({ status: 'suspended', rejection_reason: reason.trim() || 'Suspenso pela organização', reviewed_at: nowIso })
      .eq('id', registrationId);
  } catch (err) {
    console.warn('[AdminService] Falha ao suspender no Supabase:', err);
  }

  logAuditAction(
    reg.event_id,
    'ATHLETE_SUSPENDED',
    'event_registrations',
    reg.id,
    `Atleta "${reg.profile?.nickname}" suspenso. Motivo: ${reason}`,
    adminNickname
  );

  syncAdminStoreToUnified();
  return { success: true };
}

export async function recordOfficialWeighIn(
  registrationId: string,
  officialWeight: number,
  adminNickname: string = 'Admin Principal'
): Promise<{ success: boolean; error?: string; reallocatedCategory?: string }> {
  const reg = adminStore.registrations.find((r) => r.id === registrationId);
  if (!reg) return { success: false, error: 'Inscrição não encontrada.' };

  const weightValidation = validateAthleteWeight(officialWeight);
  if (!weightValidation.valid) {
    return { success: false, error: weightValidation.error };
  }

  const prevWeight = reg.verified_weight;
  reg.verified_weight = Number(officialWeight.toFixed(2));
  reg.checkin_status = true;

  try {
    await supabase
      .from('event_registrations')
      .update({ verified_weight: Number(officialWeight.toFixed(2)), checkin_status: true })
      .eq('id', registrationId);
  } catch (err) {
    console.warn('[AdminService] Falha ao gravar pesagem no Supabase:', err);
  }

  // Verifica se o peso oficial ainda se enquadra na categoria
  let reallocatedCategory: string | undefined = undefined;
  const currentCat = reg.weight_category;
  if (currentCat) {
    if (officialWeight < currentCat.min_weight || officialWeight > currentCat.max_weight) {
      const matchCat = findWeightCategoryForWeight(officialWeight);
      if (matchCat) {
        reallocatedCategory = matchCat.name;
      }
    }
  }

  logAuditAction(
    reg.event_id,
    'OFFICIAL_WEIGH_IN_RECORDED',
    'event_registrations',
    reg.id,
    `Pesagem oficial de "${reg.profile?.nickname}": ${officialWeight.toFixed(2)} kg (Anterior: ${
      prevWeight ? prevWeight.toFixed(2) + ' kg' : 'Não aferido'
    }).${reallocatedCategory ? ` ALERTA: Fora da categoria! Sugestão: ${reallocatedCategory}` : ''}`,
    adminNickname
  );

  syncAdminStoreToUnified();
  return { success: true, reallocatedCategory };
}

// ==============================================================================
// GESTÃO DE CONFRONTOS (MATCHMAKER) E RESULTADOS OFICIAIS
// ==============================================================================

export async function createOrUpdateMatch(
  matchData: {
    id?: string;
    eventId: string;
    fighter1RegistrationId: string;
    fighter2RegistrationId: string;
    weightCategoryId: string;
    matchOrder: number;
    roundName: string;
    scheduledTime?: string;
    status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    videoUrl?: string;
  },
  adminNickname: string = 'Admin Principal'
): Promise<{ success: boolean; error?: string; match?: MatchFight }> {
  syncAdminStoreFromUnified();

  // 1. Validação de adversários idênticos
  if (matchData.fighter1RegistrationId === matchData.fighter2RegistrationId) {
    return { success: false, error: 'Um atleta não pode ser casado contra si mesmo.' };
  }

  // 2. Busca e validação dos lutadores
  const f1 = adminStore.registrations.find((r) => r.id === matchData.fighter1RegistrationId);
  const f2 = adminStore.registrations.find((r) => r.id === matchData.fighter2RegistrationId);

  if (!f1 || !f2) {
    return { success: false, error: 'Um ou ambos os lutadores não foram encontrados.' };
  }

  // 3. Validação de mesmo evento
  if (f1.event_id !== matchData.eventId || f2.event_id !== matchData.eventId) {
    return {
      success: false,
      error: 'Ambos os lutadores devem pertencer estritamente ao mesmo evento.',
    };
  }

  // 4. Validação de status aprovado
  if (f1.status !== 'approved' || f2.status !== 'approved') {
    return {
      success: false,
      error: 'Apenas lutadores com inscrição confirmada e APROVADA podem lutar no ringue.',
    };
  }

  const existingIndex = matchData.id
    ? adminStore.matches.findIndex((m) => m.id === matchData.id)
    : -1;

  const previousVideo = existingIndex >= 0 ? adminStore.matches[existingIndex].video_url : undefined;
  const formattedVideo = matchData.videoUrl !== undefined
    ? (matchData.videoUrl.trim() ? formatYoutubeEmbedUrl(matchData.videoUrl.trim()) : undefined)
    : previousVideo;

  const matchToSave: MatchFight = {
    id: matchData.id || `match-${Date.now()}`,
    event_id: matchData.eventId,
    weight_category_id: matchData.weightCategoryId,
    match_order: matchData.matchOrder,
    round_name: matchData.roundName,
    fighter1_registration_id: f1.id,
    fighter2_registration_id: f2.id,
    status: matchData.status || (existingIndex >= 0 ? adminStore.matches[existingIndex].status : 'scheduled'),
    scheduled_time: matchData.scheduledTime || (existingIndex >= 0 ? adminStore.matches[existingIndex].scheduled_time : null),
    video_url: formattedVideo,
    fighter1: f1,
    fighter2: f2,
  };

  if (existingIndex >= 0) {
    adminStore.matches[existingIndex] = {
      ...adminStore.matches[existingIndex],
      ...matchToSave,
    };
    logAuditAction(
      matchData.eventId,
      'MATCH_UPDATED',
      'matches',
      matchToSave.id,
      `Confronto #${matchToSave.match_order} atualizado (${f1.profile?.nickname} vs ${f2.profile?.nickname}).`,
      adminNickname
    );
  } else {
    adminStore.matches.push(matchToSave);
    logAuditAction(
      matchData.eventId,
      'MATCH_CREATED',
      'matches',
      matchToSave.id,
      `Novo confronto #${matchToSave.match_order} agendado: ${f1.profile?.nickname} vs ${f2.profile?.nickname}.`,
      adminNickname
    );
  }

  // Sincronizar na nuvem (Supabase)
  try {
    await supabase.from('matches').upsert(
      {
        id: matchToSave.id,
        event_id: matchToSave.event_id,
        weight_category_id: matchToSave.weight_category_id,
        match_order: matchToSave.match_order,
        round_name: matchToSave.round_name,
        fighter1_registration_id: matchToSave.fighter1_registration_id,
        fighter2_registration_id: matchToSave.fighter2_registration_id,
        status: matchToSave.status,
        scheduled_time: matchToSave.scheduled_time,
        video_url: matchToSave.video_url || null,
      },
      { onConflict: 'id' }
    );
  } catch (err) {
    console.warn('[AdminService] Falha ao sincronizar confronto no Supabase:', err);
  }

  syncAdminStoreToUnified();
  return { success: true, match: matchToSave };
}

export async function deleteMatch(
  matchId: string,
  eventId: string,
  adminNickname: string = 'Admin Principal'
): Promise<{ success: boolean; error?: string }> {
  syncAdminStoreFromUnified();
  const index = adminStore.matches.findIndex((m) => m.id === matchId);
  if (index === -1) {
    return { success: false, error: 'Confronto não encontrado.' };
  }
  const removed = adminStore.matches.splice(index, 1)[0];
  logAuditAction(
    eventId,
    'MATCH_DELETED',
    'matches',
    matchId,
    `Confronto #${removed.match_order} foi excluído permanentemente.`,
    adminNickname
  );

  // Sincronizar exclusão na nuvem (Supabase)
  try {
    await supabase.from('matches').delete().eq('id', matchId);
  } catch (err) {
    console.warn('[AdminService] Falha ao excluir confronto no Supabase:', err);
  }

  syncAdminStoreToUnified();
  return { success: true };
}

export async function updateMatchVideo(
  matchId: string,
  videoUrl: string,
  eventId: string,
  adminNickname: string = 'Admin Principal'
): Promise<{ success: boolean; error?: string }> {
  syncAdminStoreFromUnified();
  const match = adminStore.matches.find((m) => m.id === matchId);
  if (!match) {
    return { success: false, error: 'Confronto não encontrado.' };
  }
  match.video_url = videoUrl.trim() ? formatYoutubeEmbedUrl(videoUrl.trim()) : undefined;
  logAuditAction(
    eventId,
    'MATCH_VIDEO_UPDATED',
    'matches',
    matchId,
    `Vídeo da luta #${match.match_order} configurado: ${videoUrl || 'removido'}.`,
    adminNickname
  );

  // Sincronizar vídeo na nuvem (Supabase)
  try {
    await supabase
      .from('matches')
      .update({ video_url: match.video_url || null })
      .eq('id', matchId);
  } catch (err) {
    console.warn('[AdminService] Falha ao sincronizar vídeo no Supabase:', err);
  }

  syncAdminStoreToUnified();
  return { success: true };
}

export async function recordOfficialMatchResult(
  matchId: string,
  result: {
    winnerRegistrationId: string | null;
    victoryMethod: VictoryMethod;
    scoreDetails?: string;
    videoUrl?: string;
  },
  adminNickname: string = 'Admin Principal'
): Promise<{ success: boolean; error?: string }> {
  const match = adminStore.matches.find((m) => m.id === matchId);
  if (!match) return { success: false, error: 'Confronto não encontrado.' };

  // Validação: vencedor deve ser um dos participantes, exceto em DRAW ou NO_CONTEST
  if (result.winnerRegistrationId) {
    const isParticipant =
      result.winnerRegistrationId === match.fighter1_registration_id ||
      result.winnerRegistrationId === match.fighter2_registration_id;
    if (!isParticipant) {
      return {
        success: false,
        error: 'O vencedor registrado deve ser obrigatoriamente um dos participantes da luta.',
      };
    }
  } else if (result.victoryMethod !== 'DRAW' && result.victoryMethod !== 'NO_CONTEST') {
    return {
      success: false,
      error: 'Vencedor é obrigatório a menos que o resultado seja Empate (DRAW) ou Sem Resultado (NO_CONTEST).',
    };
  }

  match.status = 'completed';
  match.winner_registration_id = result.winnerRegistrationId;
  match.victory_method = result.victoryMethod;
  match.score_details = result.scoreDetails || null;
  match.completed_at = new Date().toISOString();
  if (result.videoUrl) {
    match.video_url = result.videoUrl;
  }

  const winnerName = result.winnerRegistrationId
    ? result.winnerRegistrationId === match.fighter1_registration_id
      ? match.fighter1?.profile?.nickname
      : match.fighter2?.profile?.nickname
    : 'EMPATE / SEM RESULTADO';

  logAuditAction(
    match.event_id,
    'OFFICIAL_RESULT_REGISTERED',
    'matches',
    match.id,
    `Resultado oficial registrado para luta #${match.match_order}: Vencedor [${winnerName}], Método [${result.victoryMethod}], Detalhes: ${result.scoreDetails || 'N/A'}.`,
    adminNickname
  );

  // Sincronizar resultado na nuvem (Supabase)
  try {
    await supabase
      .from('matches')
      .update({
        status: 'completed',
        winner_registration_id: result.winnerRegistrationId,
        victory_method: result.victoryMethod,
        score_details: result.scoreDetails || null,
        completed_at: match.completed_at,
        video_url: match.video_url || null,
      })
      .eq('id', matchId);
  } catch (err) {
    console.warn('[AdminService] Falha ao sincronizar resultado no Supabase:', err);
  }

  syncAdminStoreToUnified();
  return { success: true };
}

// ==============================================================================
// GESTÃO DE EVENTOS E CATEGORIAS
// ==============================================================================

export async function createEvent(
  eventData: {
    title: string;
    slug: string;
    description: string;
    eventDate: string;
    locationName: string;
    locationAddress: string;
    whatsappGroupUrl?: string;
    formatType?: 'mixed' | 'friendly' | 'single_elimination' | 'round_robin';
  },
  adminNickname: string = 'Admin Principal'
): Promise<{ success: boolean; error?: string; event?: ArenaEvent }> {
  const cleanSlug = eventData.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
  const existing = adminStore.events.find((e) => e.slug === cleanSlug);
  if (existing) {
    return { success: false, error: 'Já existe um evento cadastrado com este slug/identificador.' };
  }

  const newEvent: ArenaEvent = {
    id: `event-${Date.now()}`,
    slug: cleanSlug,
    title: eventData.title.trim(),
    description: eventData.description,
    event_date: eventData.eventDate,
    location_name: eventData.locationName,
    location_address: eventData.locationAddress,
    whatsapp_group_url: eventData.whatsappGroupUrl || null,
    rules_markdown: 'Regulamento oficial do evento U.C.U Arena.',
    min_weight: 50.0,
    max_weight: 90.0,
    status: 'open_for_registration',
    format_type: eventData.formatType || 'mixed',
    created_at: new Date().toISOString(),
  };

  adminStore.events.push(newEvent);

  logAuditAction(
    newEvent.id,
    'EVENT_CREATED',
    'events',
    newEvent.id,
    `Novo evento criado: "${newEvent.title}" (${newEvent.slug}).`,
    adminNickname
  );

  return { success: true, event: newEvent };
}

export async function updateEventDetails(
  eventId: string,
  updatedFields: Partial<ArenaEvent>,
  adminNickname: string = 'Admin Principal'
): Promise<{ success: boolean; error?: string }> {
  const ev = adminStore.events.find((e) => e.id === eventId);
  if (!ev) return { success: false, error: 'Evento não encontrado.' };

  Object.assign(ev, updatedFields);

  logAuditAction(
    ev.id,
    'EVENT_UPDATED',
    'events',
    ev.id,
    `Configurações do evento "${ev.title}" atualizadas.`,
    adminNickname
  );

  return { success: true };
}

export async function archiveEvent(
  eventId: string,
  adminNickname: string = 'Admin Principal'
): Promise<{ success: boolean; error?: string }> {
  const ev = adminStore.events.find((e) => e.id === eventId);
  if (!ev) return { success: false, error: 'Evento não encontrado.' };

  ev.status = 'archived';

  logAuditAction(
    ev.id,
    'EVENT_ARCHIVED',
    'events',
    ev.id,
    `Evento "${ev.title}" arquivado para preservação do histórico esportivo.`,
    adminNickname
  );

  return { success: true };
}

export async function deleteEventSafely(
  eventId: string,
  confirmationTitle: string,
  adminNickname: string = 'Admin Principal'
): Promise<{ success: boolean; error?: string }> {
  const index = adminStore.events.findIndex((e) => e.id === eventId);
  if (index === -1) return { success: false, error: 'Evento não encontrado.' };

  const ev = adminStore.events[index];
  if (confirmationTitle !== ev.title) {
    return {
      success: false,
      error: 'A confirmação explícita do título do evento é obrigatória para exclusão definitiva.',
    };
  }

  // Remove inscrições e confrontos associados em cascata controlada
  adminStore.registrations = adminStore.registrations.filter((r) => r.event_id !== eventId);
  adminStore.matches = adminStore.matches.filter((m) => m.event_id !== eventId);
  adminStore.events.splice(index, 1);

  logAuditAction(
    null,
    'EVENT_DELETED',
    'events',
    eventId,
    `Evento "${ev.title}" excluído definitivamente com remoção de histórico associado.`,
    adminNickname
  );

  return { success: true };
}

export function getCategoryChangeImpact(
  eventId: string,
  newCategories: WeightCategoryRule[]
): {
  hasOverlap: boolean;
  affectedAthletesCount: number;
  warnings: string[];
} {
  const hasOverlap = hasCategoryOverlap(newCategories);
  const athletes = adminStore.registrations.filter((r) => r.event_id === eventId);
  let affectedAthletesCount = 0;
  const warnings: string[] = [];

  if (hasOverlap) {
    warnings.push('As novas categorias possuem sobreposição de faixas de peso!');
  }

  for (const a of athletes) {
    const weight = a.verified_weight || a.declared_weight;
    let fitsInNew = false;
    for (const cat of newCategories) {
      if (weight >= cat.minWeight && weight <= cat.maxWeight) {
        fitsInNew = true;
        break;
      }
    }
    if (!fitsInNew) {
      affectedAthletesCount++;
      warnings.push(
        `Atleta "${a.profile?.nickname}" (${weight.toFixed(2)} kg) ficará fora de qualquer categoria configurada!`
      );
    }
  }

  return { hasOverlap, affectedAthletesCount, warnings };
}

// ==============================================================================
// GESTÃO DE COMUNICADOS E MÍDIA
// ==============================================================================

export async function saveAnnouncement(
  announcementData: {
    id?: string;
    eventId: string;
    title: string;
    content: string;
    isPinned: boolean;
  },
  adminNickname: string = 'Admin Principal'
): Promise<{ success: boolean; error?: string }> {
  if (!announcementData.title.trim() || !announcementData.content.trim()) {
    return { success: false, error: 'Título e conteúdo do comunicado são obrigatórios.' };
  }

  const existingIndex = announcementData.id
    ? adminStore.announcements.findIndex((a) => a.id === announcementData.id)
    : -1;

  if (existingIndex >= 0) {
    adminStore.announcements[existingIndex] = {
      ...adminStore.announcements[existingIndex],
      title: announcementData.title.trim(),
      content: announcementData.content.trim(),
      is_pinned: announcementData.isPinned,
    };
  } else {
    const newAnn: EventAnnouncement = {
      id: `ann-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      event_id: announcementData.eventId,
      title: announcementData.title.trim(),
      content: announcementData.content.trim(),
      is_pinned: announcementData.isPinned,
      created_at: new Date().toISOString(),
    };
    adminStore.announcements.unshift(newAnn);
  }

  logAuditAction(
    announcementData.eventId,
    'ANNOUNCEMENT_SAVED',
    'event_announcements',
    announcementData.id || 'new',
    `Comunicado oficial salvo: "${announcementData.title}"`,
    adminNickname
  );

  return { success: true };
}

export async function deleteAnnouncement(
  announcementId: string,
  adminNickname: string = 'Admin Principal'
): Promise<{ success: boolean; error?: string }> {
  const index = adminStore.announcements.findIndex((a) => a.id === announcementId);
  if (index === -1) return { success: false, error: 'Comunicado não encontrado.' };

  const ann = adminStore.announcements[index];
  adminStore.announcements.splice(index, 1);

  logAuditAction(
    ann.event_id,
    'ANNOUNCEMENT_DELETED',
    'event_announcements',
    announcementId,
    `Comunicado excluído: "${ann.title}"`,
    adminNickname
  );

  return { success: true };
}

export async function saveMediaItem(
  mediaData: {
    id?: string;
    eventId: string;
    title: string;
    description?: string;
    url: string;
    mediaType: 'video' | 'photo' | 'highlight';
    matchId?: string | null;
    isPublic: boolean;
  },
  adminNickname: string = 'Admin Principal'
): Promise<{ success: boolean; error?: string }> {
  if (!mediaData.title.trim() || !mediaData.url.trim()) {
    return { success: false, error: 'Título e URL do conteúdo são obrigatórios.' };
  }

  const finalUrl = formatYoutubeEmbedUrl(mediaData.url.trim());

  const existingIndex = mediaData.id
    ? adminStore.mediaItems.findIndex((m) => m.id === mediaData.id)
    : -1;

  if (existingIndex >= 0) {
    adminStore.mediaItems[existingIndex] = {
      ...adminStore.mediaItems[existingIndex],
      ...mediaData,
      url: finalUrl,
    };
  } else {
    const newMedia: MediaItem = {
      id: `med-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      event_id: mediaData.eventId,
      title: mediaData.title.trim(),
      description: mediaData.description || '',
      media_type: mediaData.mediaType,
      url: finalUrl,
      match_id: mediaData.matchId || null,
      is_public: mediaData.isPublic,
      created_at: new Date().toISOString(),
    };
    adminStore.mediaItems.unshift(newMedia);
  }

  logAuditAction(
    mediaData.eventId,
    'MEDIA_ITEM_SAVED',
    'media_items',
    mediaData.id || 'new',
    `Mídia/Vídeo salvo: "${mediaData.title}"`,
    adminNickname
  );

  return { success: true };
}

export async function deleteMediaItem(
  mediaItemId: string,
  adminNickname: string = 'Admin Principal'
): Promise<{ success: boolean; error?: string }> {
  const index = adminStore.mediaItems.findIndex((m) => m.id === mediaItemId);
  if (index === -1) return { success: false, error: 'Mídia não encontrada.' };

  const med = adminStore.mediaItems[index];
  adminStore.mediaItems.splice(index, 1);

  logAuditAction(
    med.event_id,
    'MEDIA_ITEM_DELETED',
    'media_items',
    mediaItemId,
    `Item de mídia excluído: "${med.title}"`,
    adminNickname
  );

  return { success: true };
}

// ==============================================================================
// EXPORTAÇÕES ADMINISTRATIVAS (CSV E BACKUP JSON)
// ==============================================================================

export function exportEventParticipantsCsv(eventId: string): string {
  const athletes = adminStore.registrations.filter((r) => r.event_id === eventId);

  const headers = [
    'ID Inscrição',
    'Nome Completo',
    'Apelido de Combate',
    'Status',
    'Categoria',
    'Peso Declarado (kg)',
    'Peso Oficial Aferido (kg)',
    'Menor de Idade',
    'Nome do Responsavel',
    'Telefone do Responsavel',
    'Documento do Responsavel',
    'Telefone do Atleta',
    'Email de Recuperacao',
    'Data de Inscricao',
  ];

  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = athletes.map((a) => [
    escapeCsv(a.id),
    escapeCsv(a.profile?.full_name),
    escapeCsv(a.profile?.nickname),
    escapeCsv(a.status),
    escapeCsv(a.weight_category?.name || 'Aguardando alocação'),
    escapeCsv(a.declared_weight ? Number(a.declared_weight).toFixed(2) : ''),
    escapeCsv(a.verified_weight ? Number(a.verified_weight).toFixed(2) : 'Não aferido'),
    escapeCsv(a.profile?.is_minor ? 'SIM' : 'NÃO'),
    escapeCsv(a.profile?.guardian_name || ''),
    escapeCsv(a.profile?.guardian_phone || ''),
    escapeCsv(a.profile?.guardian_document || ''),
    escapeCsv(a.profile?.phone || ''),
    escapeCsv(a.profile?.recovery_email || ''),
    escapeCsv(a.registered_at),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function exportEventJsonBackup(eventId: string): string {
  const ev = adminStore.events.find((e) => e.id === eventId);
  const athletes = adminStore.registrations.filter((r) => r.event_id === eventId);
  const matches = adminStore.matches.filter((m) => m.event_id === eventId);
  const announcements = adminStore.announcements.filter((a) => a.event_id === eventId);
  const media = adminStore.mediaItems.filter((m) => m.event_id === eventId);
  const logs = adminStore.auditLogs.filter((l) => l.event_id === eventId);

  const backupPackage = {
    exportedAt: new Date().toISOString(),
    event: ev,
    registrationsCount: athletes.length,
    matchesCount: matches.length,
    announcementsCount: announcements.length,
    mediaCount: media.length,
    data: {
      event: ev,
      registrations: athletes,
      matches,
      announcements,
      mediaItems: media,
      auditLogs: logs,
    },
    schemaVersion: '1.0.0',
    checksum: `backup-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
  };

  return JSON.stringify(backupPackage, null, 2);
}
