// ==============================================================================
// U.C.U ARENA — STORE UNIFICADO REATIVO & PERSISTENTE
// Sincronização em tempo real entre Inscrição, Login, Portal do Atleta e Admin
// ==============================================================================

import {
  ArenaEvent,
  EventRegistration,
  MatchFight,
  UserProfile,
  EventAnnouncement,
  MediaItem,
  AuditLog,
} from '../types/app.types';
import { DEFAULT_INAUGURAL_EVENT, SECOND_TEST_EVENT } from './eventService';

export interface StoredUser {
  id: string;
  nickname: string;
  nicknameNormalized: string;
  password: string; // Em modo local para validação autônoma
  fullName: string;
  recoveryEmail: string;
  isAdmin: boolean;
  profileId: string;
  createdAt: string;
}

export interface UnifiedArenaStore {
  version: number;
  users: StoredUser[];
  events: ArenaEvent[];
  registrations: EventRegistration[];
  matches: MatchFight[];
  announcements: EventAnnouncement[];
  mediaItems: MediaItem[];
  auditLogs: AuditLog[];
}

const STORAGE_KEY = 'ucu_arena_unified_store_v3';
const STORE_CHANGE_EVENT = 'ucu_arena_store_updated';

// Helper para converter URLs do YouTube para o formato oficial embed
export function formatYoutubeEmbedUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();

  // Já é um embed
  if (trimmed.includes('youtube.com/embed/')) {
    return trimmed;
  }

  // Formato: https://www.youtube.com/watch?v=VIDEO_ID
  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch && watchMatch[1]) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }

  // Formato: https://youtu.be/VIDEO_ID
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch && shortMatch[1]) {
    return `https://www.youtube.com/embed/${shortMatch[1]}`;
  }

  // Formato: https://www.youtube.com/shorts/VIDEO_ID
  const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch && shortsMatch[1]) {
    return `https://www.youtube.com/embed/${shortsMatch[1]}`;
  }

  return trimmed;
}

// Inicializador de dados de demonstração oficiais
function createInitialStore(): UnifiedArenaStore {
  const catLeve = {
    id: 'cat-leve',
    event_id: DEFAULT_INAUGURAL_EVENT.id,
    name: 'Peso Leve (50 a 60 kg)',
    min_weight: 50.0,
    max_weight: 60.0,
    display_order: 1,
  };

  const catMeioMedio = {
    id: 'cat-meio-medio',
    event_id: DEFAULT_INAUGURAL_EVENT.id,
    name: 'Peso Meio-Médio (Mais de 60 até 70 kg)',
    min_weight: 60.01,
    max_weight: 70.0,
    display_order: 2,
  };

  const catPesado = {
    id: 'cat-pesado',
    event_id: DEFAULT_INAUGURAL_EVENT.id,
    name: 'Peso Pesado (Mais de 80 até 90 kg)',
    min_weight: 80.01,
    max_weight: 90.0,
    display_order: 4,
  };

  const regDemo01: EventRegistration = {
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
      avatar_url: null,
      created_at: '2026-10-22T12:00:00Z',
      updated_at: '2026-10-22T12:00:00Z',
    },
    weight_category: catMeioMedio,
  };

  const regOpp02: EventRegistration = {
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
      avatar_url: null,
      created_at: '2026-10-23T15:30:00Z',
      updated_at: '2026-10-23T15:30:00Z',
    },
    weight_category: catMeioMedio,
  };

  const regPending03: EventRegistration = {
    id: 'reg-pending-03',
    event_id: DEFAULT_INAUGURAL_EVENT.id,
    profile_id: 'prof-pantera-789',
    weight_category_id: 'cat-leve',
    declared_weight: 58.5,
    verified_weight: null,
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
      birth_date: '2009-08-10',
      is_minor: true,
      guardian_name: 'Marcos Souza',
      guardian_relationship: 'Pai',
      guardian_phone: '(11) 93333-2222',
      guardian_document: '12.345.678-9',
      image_consent: true,
      terms_consent: true,
      avatar_url: null,
      created_at: '2026-10-26T09:15:00Z',
      updated_at: '2026-10-26T09:15:00Z',
    },
    weight_category: catLeve,
  };

  const regPending04: EventRegistration = {
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
      avatar_url: null,
      created_at: '2026-10-26T14:45:00Z',
      updated_at: '2026-10-26T14:45:00Z',
    },
    weight_category: catPesado,
  };

  const initialUsers: StoredUser[] = [
    {
      id: 'usr-admin',
      nickname: 'admin',
      nicknameNormalized: 'admin',
      password: 'admin',
      fullName: 'Administrador Geral U.C.U',
      recoveryEmail: 'admin@ucuarena.com',
      isAdmin: true,
      profileId: 'prof-admin',
      createdAt: '2026-10-20T10:00:00Z',
    },
    {
      id: 'auth-demo-user',
      nickname: 'Demolidor',
      nicknameNormalized: 'demolidor',
      password: '123456',
      fullName: 'Carlos Demolidor Silva',
      recoveryEmail: 'privado@atleta.com',
      isAdmin: false,
      profileId: 'prof-demo-123',
      createdAt: '2026-10-22T12:00:00Z',
    },
    {
      id: 'auth-opp',
      nickname: 'Falcão da Noite',
      nicknameNormalized: 'falcao da noite',
      password: '123456',
      fullName: 'Roberto Falcão Lima',
      recoveryEmail: 'privado@falcao.com',
      isAdmin: false,
      profileId: 'prof-opp-456',
      createdAt: '2026-10-23T15:30:00Z',
    },
    {
      id: 'auth-pantera',
      nickname: 'Pantera Negra',
      nicknameNormalized: 'pantera negra',
      password: '123456',
      fullName: 'Lucas Gabriel Souza',
      recoveryEmail: 'lucas@gmail.com',
      isAdmin: false,
      profileId: 'prof-pantera-789',
      createdAt: '2026-10-26T09:15:00Z',
    },
    {
      id: 'auth-tigre',
      nickname: 'Tigre do Norte',
      nicknameNormalized: 'tigre do norte',
      password: '123456',
      fullName: 'Marcos Tigre Ribeiro',
      recoveryEmail: 'tigre@gmail.com',
      isAdmin: false,
      profileId: 'prof-tigre-999',
      createdAt: '2026-10-26T14:45:00Z',
    },
  ];

  const initialMatches: MatchFight[] = [
    {
      id: 'match-01',
      event_id: DEFAULT_INAUGURAL_EVENT.id,
      weight_category_id: 'cat-meio-medio',
      match_order: 3,
      round_name: 'Card Principal — Disputa de Cinturão',
      fighter1_registration_id: 'reg-demo-01',
      fighter2_registration_id: 'reg-opp-02',
      status: 'scheduled',
      scheduled_time: '19:30',
      fighter1: regDemo01,
      fighter2: regOpp02,
    },
    {
      id: 'match-00-past',
      event_id: DEFAULT_INAUGURAL_EVENT.id,
      weight_category_id: 'cat-meio-medio',
      match_order: 1,
      round_name: 'Luta Preliminar Amistosa',
      fighter1_registration_id: 'reg-demo-01',
      fighter2_registration_id: 'reg-opp-02',
      status: 'completed',
      winner_registration_id: 'reg-demo-01',
      victory_method: 'KO',
      score_details: 'Nocaute técnico no 2º round aos 2:15',
      video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      completed_at: '2026-10-15T20:45:00Z',
      fighter1: regDemo01,
      fighter2: regOpp02,
    },
  ];

  const initialMedia: MediaItem[] = [
    {
      id: 'med-1',
      event_id: DEFAULT_INAUGURAL_EVENT.id,
      title: 'Melhores Momentos: Nocaute de Demolidor',
      description: 'Highlights do combate preliminar com nocaute técnico no 2º round.',
      media_type: 'video',
      url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      thumbnail_url: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=600&auto=format&fit=crop',
      match_id: 'match-00-past',
      is_public: true,
      created_at: '2026-10-26T18:00:00Z',
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

  return {
    version: 3,
    users: initialUsers,
    events: [
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
        rules_markdown: 'Regulamento da segunda edição oficial.',
        min_weight: 50.0,
        max_weight: 90.0,
        status: 'open_for_registration',
        format_type: 'friendly',
        created_at: '2026-10-25T14:00:00Z',
      },
    ],
    registrations: [regDemo01, regOpp02, regPending03, regPending04],
    matches: initialMatches,
    announcements: initialAnnouncements,
    mediaItems: initialMedia,
    auditLogs: initialAuditLogs,
  };
}

// Carregar store unificado com fallback para localStorage
export function getUnifiedStore(): UnifiedArenaStore {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === 3) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[storeSync] Erro ao carregar localStorage. Inicializando dados padrão.');
  }

  const initial = createInitialStore();
  saveUnifiedStore(initial);
  return initial;
}

// Salvar store unificado no localStorage e disparar evento global
export function saveUnifiedStore(store: UnifiedArenaStore): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      window.dispatchEvent(new CustomEvent(STORE_CHANGE_EVENT, { detail: store }));
    }
  } catch (err) {
    console.error('[storeSync] Erro ao salvar store no localStorage:', err);
  }
}

// Inscrever-se para atualizações reativas do store
export function subscribeToStore(callback: (store: UnifiedArenaStore) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (event: Event) => {
    const custom = event as CustomEvent<UnifiedArenaStore>;
    if (custom.detail) {
      callback(custom.detail);
    } else {
      callback(getUnifiedStore());
    }
  };

  window.addEventListener(STORE_CHANGE_EVENT, handler);
  window.addEventListener('storage', handler);

  return () => {
    window.removeEventListener(STORE_CHANGE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

// Autenticar usuário por apelido e senha com validação real
export function authenticateInUnifiedStore(
  nickname: string,
  password: string
): { success: boolean; user?: StoredUser; profile?: UserProfile; isAdmin?: boolean; error?: string } {
  const store = getUnifiedStore();
  const cleanNick = nickname.trim().toLowerCase();

  // Procurar por apelido normalizado
  const foundUser = store.users.find(
    (u) => u.nicknameNormalized === cleanNick || u.nickname.toLowerCase() === cleanNick
  );

  if (!foundUser) {
    return {
      success: false,
      error: 'Apelido não cadastrado na arena. Verifique a digitação ou inscreva-se.',
    };
  }

  if (foundUser.password !== password) {
    return {
      success: false,
      error: 'Senha incorreta para este apelido de combate.',
    };
  }

  // Buscar perfil associado
  let profile: UserProfile | undefined;
  for (const reg of store.registrations) {
    if (reg.profile?.id === foundUser.profileId || reg.profile?.auth_user_id === foundUser.id) {
      profile = reg.profile;
      break;
    }
  }

  if (!profile && foundUser.isAdmin) {
    profile = {
      id: foundUser.profileId,
      auth_user_id: foundUser.id,
      full_name: foundUser.fullName,
      nickname: foundUser.nickname,
      recovery_email: foundUser.recoveryEmail,
      phone: '',
      birth_date: '1990-01-01',
      is_minor: false,
      image_consent: true,
      terms_consent: true,
      created_at: foundUser.createdAt,
      updated_at: foundUser.createdAt,
    };
  }

  return {
    success: true,
    user: foundUser,
    profile,
    isAdmin: foundUser.isAdmin,
  };
}

// Registrar nova inscrição e criar credenciais de acesso
export function registerAthleteInUnifiedStore(params: {
  event: ArenaEvent | { id: string; slug: string; title: string; whatsapp_group_url?: string | null };
  fullName: string;
  nickname: string;
  password: string;
  recoveryEmail: string;
  phone: string;
  birthDate: string;
  declaredWeight: number;
  category: { id?: string; name: string; minWeight?: number; maxWeight?: number };
  avatarUrl: string | null;
  isMinor: boolean;
  guardianName?: string;
  guardianRelationship?: string;
  guardianPhone?: string;
  guardianDoc?: string;
  imageConsent: boolean;
  termsConsent: boolean;
}): { success: boolean; registrationId: string; profileId?: string; error?: string } {
  const store = getUnifiedStore();
  const cleanNick = params.nickname.trim();
  const normalized = cleanNick.toLowerCase();

  // Validar unicidade do apelido
  if (store.users.some((u) => u.nicknameNormalized === normalized)) {
    return {
      success: false,
      registrationId: '',
      error: 'Este apelido de combate já está em uso por outro guerreiro.',
    };
  }

  const userId = `usr-${Date.now()}`;
  const profileId = `prof-${Date.now()}`;
  const regId = `reg-${Date.now()}`;

  const newProfile: UserProfile = {
    id: profileId,
    auth_user_id: userId,
    full_name: params.fullName,
    nickname: cleanNick,
    recovery_email: params.recoveryEmail,
    phone: params.phone,
    birth_date: params.birthDate,
    is_minor: params.isMinor,
    guardian_name: params.guardianName || null,
    guardian_relationship: params.guardianRelationship || null,
    guardian_phone: params.guardianPhone || null,
    guardian_document: params.guardianDoc || null,
    image_consent: params.imageConsent,
    terms_consent: params.termsConsent,
    avatar_url: params.avatarUrl,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const newStoredUser: StoredUser = {
    id: userId,
    nickname: cleanNick,
    nicknameNormalized: normalized,
    password: params.password,
    fullName: params.fullName,
    recoveryEmail: params.recoveryEmail,
    isAdmin: false,
    profileId,
    createdAt: new Date().toISOString(),
  };

  const newRegistration: EventRegistration = {
    id: regId,
    event_id: params.event.id,
    profile_id: profileId,
    weight_category_id: params.category.id || 'cat-auto',
    declared_weight: params.declaredWeight,
    verified_weight: null,
    status: 'pending', // Inicia pendente de aprovação do admin
    guardian_authorized: params.isMinor,
    checkin_status: false,
    registered_at: new Date().toISOString(),
    profile: newProfile,
    weight_category: {
      id: params.category.id || 'cat-auto',
      event_id: params.event.id,
      name: params.category.name,
      min_weight: params.category.minWeight || 50,
      max_weight: params.category.maxWeight || 90,
      display_order: 1,
    },
  };

  store.users.push(newStoredUser);
  store.registrations.unshift(newRegistration);
  saveUnifiedStore(store);

  return {
    success: true,
    registrationId: regId,
    profileId,
  };
}

// Atualizar avatar do perfil do atleta
export function updateAthleteAvatarInStore(profileId: string, newAvatarUrl: string): boolean {
  const store = getUnifiedStore();
  let updated = false;

  for (const reg of store.registrations) {
    if (reg.profile && (reg.profile.id === profileId || reg.profile.auth_user_id === profileId)) {
      reg.profile.avatar_url = newAvatarUrl;
      reg.profile.updated_at = new Date().toISOString();
      updated = true;
    }
  }

  if (updated) {
    saveUnifiedStore(store);
  }
  return updated;
}
