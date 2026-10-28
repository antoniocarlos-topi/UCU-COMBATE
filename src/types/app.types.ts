// ==============================================================================
// U.C.U ARENA — DEFINIÇÕES DE TIPOS TYPESCRIPT
// ==============================================================================

export type EventStatus =
  | 'draft'
  | 'open_for_registration'
  | 'registration_closed'
  | 'in_progress'
  | 'finished'
  | 'archived'
  | 'cancelled';

export type EventFormat =
  | 'mixed'
  | 'friendly'
  | 'single_elimination'
  | 'round_robin';

export type RegistrationStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'suspended'
  | 'withdrawn';

export type MatchStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type VictoryMethod =
  | 'KO'
  | 'TKO'
  | 'SUBMISSION'
  | 'POINTS'
  | 'DQ'
  | 'DRAW'
  | 'NO_CONTEST';

export interface UserProfile {
  id: string;
  auth_user_id: string;
  full_name: string;
  nickname: string;
  recovery_email: string;
  phone: string;
  birth_date: string;
  is_minor: boolean;
  guardian_name?: string | null;
  guardian_relationship?: string | null;
  guardian_phone?: string | null;
  guardian_document?: string | null;
  image_consent: boolean;
  terms_consent: boolean;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WeightCategory {
  id: string;
  event_id: string;
  name: string;
  min_weight: number;
  max_weight: number;
  display_order: number;
}

export interface ArenaEvent {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  event_date: string;
  location_name: string;
  location_address: string;
  location_map_url?: string | null;
  whatsapp_group_url?: string | null;
  rules_markdown: string;
  banner_url?: string | null;
  logo_url?: string | null;
  min_weight: number;
  max_weight: number;
  status: EventStatus;
  format_type: EventFormat;
  created_at: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  profile_id: string;
  weight_category_id: string;
  declared_weight: number;
  verified_weight?: number | null;
  status: RegistrationStatus;
  rejection_reason?: string | null;
  guardian_authorized: boolean;
  checkin_status: boolean;
  registered_at: string;
  profile?: UserProfile;
  weight_category?: WeightCategory;
}

export interface MatchFight {
  id: string;
  event_id: string;
  weight_category_id: string;
  match_order: number;
  round_name: string;
  fighter1_registration_id: string;
  fighter2_registration_id: string;
  status: MatchStatus;
  winner_registration_id?: string | null;
  victory_method?: VictoryMethod | null;
  score_details?: string | null;
  video_url?: string | null;
  scheduled_time?: string | null;
  completed_at?: string | null;
  fighter1?: EventRegistration;
  fighter2?: EventRegistration;
}

export interface AuditLog {
  id: string;
  event_id?: string | null;
  action: string;
  admin_id: string;
  admin_nickname?: string;
  target_entity: string;
  target_id: string;
  details?: string | null;
  created_at: string;
}

export interface EventAnnouncement {
  id: string;
  event_id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
}

export interface MediaItem {
  id: string;
  event_id: string;
  title: string;
  description?: string;
  media_type: 'video' | 'photo' | 'highlight';
  url: string;
  thumbnail_url?: string;
  match_id?: string | null;
  is_public: boolean;
  created_at: string;
}

export interface AdminKpiSummary {
  totalEvents: number;
  totalAthletes: number;
  pendingRegistrations: number;
  approvedAthletes: number;
  totalMatches: number;
  upcomingMatches: number;
  unscheduledMatches: number;
  minorPendingConsent: number;
}
