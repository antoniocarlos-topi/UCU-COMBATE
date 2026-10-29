// ==============================================================================
// U.C.U ARENA — SERVIÇO DE INSCRIÇÃO E CADASTRO DE ATLETAS
// ==============================================================================

import { supabase } from '../lib/supabaseClient';
import {
  validateAthleteWeight,
  findWeightCategoryForWeight,
  validateMinorRegistration,
  normalizeNickname,
  calculateAgeAtEvent,
} from '../utils/validationRules';
import { EventInvitationData } from './eventService';
import { registerAthleteInUnifiedStore, getUnifiedStore } from './storeSync';

export interface RegistrationSubmissionData {
  event: EventInvitationData;
  fullName: string;
  nickname: string;
  password: string;
  recoveryEmail: string;
  phone: string;
  birthDate: string;
  declaredWeight: string;
  avatarFile: File | null;
  inviteCode?: string;
  guardianName?: string;
  guardianRelationship?: string;
  guardianPhone?: string;
  guardianDoc?: string;
  imageConsent: boolean;
  termsConsent: boolean;
}

export interface RegistrationSubmissionResult {
  success: boolean;
  registrationId?: string;
  status?: 'pending' | 'approved';
  whatsappUrl?: string | null;
  error?: string;
}

/**
 * Converte um arquivo File para Data URL de forma assíncrona
 */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

/**
 * Verifica se um apelido já está em uso (verificação case-insensitive)
 */
export async function checkNicknameAvailability(nickname: string): Promise<{ available: boolean; error?: string }> {
  const normalized = normalizeNickname(nickname);
  if (normalized.length < 3) {
    return { available: false, error: 'O apelido deve ter pelo menos 3 caracteres.' };
  }

  // 1. Verificar no store unificado local
  const store = getUnifiedStore();
  if (store.users.some((u) => u.nicknameNormalized === normalized)) {
    return { available: false, error: 'Este apelido de combate já está em uso na arena. Escolha outro.' };
  }

  const isSupabaseConfigured = Boolean(
    import.meta.env.VITE_SUPABASE_URL &&
    !import.meta.env.VITE_SUPABASE_URL.includes('placeholder')
  );

  if (!isSupabaseConfigured) {
    return { available: true };
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('nickname_normalized', normalized)
      .maybeSingle();

    if (!error && data) {
      return { available: false, error: 'Este apelido de combate já está em uso. Escolha outro.' };
    }
    return { available: true };
  } catch {
    return { available: true };
  }
}

/**
 * Processa a submissão completa da inscrição do atleta
 */
export async function submitAthleteRegistration(
  data: RegistrationSubmissionData
): Promise<RegistrationSubmissionResult> {
  // 1. Validação estrita de peso (50,00 a 90,00 kg)
  const weightVal = validateAthleteWeight(data.declaredWeight);
  if (!weightVal.valid || weightVal.parsedWeight === undefined) {
    return { success: false, error: weightVal.error || 'Peso inválido.' };
  }

  // 2. Alocação de categoria
  const category = findWeightCategoryForWeight(weightVal.parsedWeight, data.event.categories);
  if (!category) {
    return {
      success: false,
      error: `Não encontramos uma categoria de peso compatível para ${weightVal.parsedWeight.toFixed(2)} kg neste evento.`,
    };
  }

  // 3. Verificação de idade
  const age = calculateAgeAtEvent(data.birthDate);
  const isMinor = age < 18;

  // 4. Validação de dados de menores e consentimentos
  const minorVal = validateMinorRegistration({
    isMinor,
    guardianName: data.guardianName,
    guardianPhone: data.guardianPhone,
    guardianDoc: data.guardianDoc,
    imageConsent: data.imageConsent,
    termsConsent: data.termsConsent,
  });

  if (!minorVal.valid) {
    return { success: false, error: minorVal.error };
  }

  // 5. Validação de evento com código de convite restrito
  if (data.event.requires_invite) {
    if (!data.inviteCode || data.inviteCode.trim() !== (data.event.access_code || '')) {
      return { success: false, error: 'Este evento exige um código de convite exclusivo válido.' };
    }
  }

  // 6. Validação de foto obrigatória
  if (!data.avatarFile) {
    return { success: false, error: 'A foto de rosto do lutador é obrigatória para o card oficial.' };
  }

  // Converter foto para persistência imediata
  const avatarDataUrl = await fileToDataUrl(data.avatarFile);

  // 7. Gravar no Store Unificado Local (Garantindo que Login e Perfil funcionem imediatamente)
  const localStoreRes = registerAthleteInUnifiedStore({
    event: data.event,
    fullName: data.fullName,
    nickname: data.nickname,
    password: data.password,
    recoveryEmail: data.recoveryEmail,
    phone: data.phone,
    birthDate: data.birthDate,
    declaredWeight: weightVal.parsedWeight,
    category: {
      id: category.id,
      name: category.name,
      minWeight: category.minWeight,
      maxWeight: category.maxWeight,
    },
    avatarUrl: avatarDataUrl,
    isMinor,
    guardianName: data.guardianName,
    guardianRelationship: data.guardianRelationship,
    guardianPhone: data.guardianPhone,
    guardianDoc: data.guardianDoc,
    imageConsent: data.imageConsent,
    termsConsent: data.termsConsent,
  });

  if (!localStoreRes.success) {
    return { success: false, error: localStoreRes.error };
  }

  // 8. Persistência no Banco de Dados Global (Supabase)
  try {
    const profileId = (localStoreRes as any).profileId || `prof-${Date.now()}`;
    const regId = localStoreRes.registrationId;

    // Verificar se Supabase está configurado
    const isSupabaseConfigured = Boolean(
      import.meta.env.VITE_SUPABASE_URL &&
      !import.meta.env.VITE_SUPABASE_URL.includes('placeholder')
    );

    if (isSupabaseConfigured) {
      // Tentar cadastro no auth
      let finalAuthId: string | null = null;
      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.recoveryEmail,
          password: data.password,
          options: {
            data: {
              full_name: data.fullName,
              nickname: data.nickname,
            },
          },
        });
        if (!authError && authData?.user?.id) {
          finalAuthId = authData.user.id;
        }
      } catch {
        // Prossegue mesmo se auth falhar por rate limit ou confirmação pendente
      }

      // Gravar no perfil da nuvem
      // IMPORTANTE: Não incluir 'nickname_normalized' pois é uma coluna GENERATED ALWAYS
      // no PostgreSQL e não pode ser inserida/atualizada diretamente.
      if (finalAuthId) {
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: profileId,
          auth_user_id: finalAuthId,
          full_name: data.fullName,
          nickname: data.nickname,
          recovery_email: data.recoveryEmail,
          phone: data.phone,
          birth_date: data.birthDate,
          is_minor: isMinor,
          guardian_name: isMinor ? data.guardianName : null,
          guardian_relationship: isMinor ? data.guardianRelationship : null,
          guardian_phone: isMinor ? data.guardianPhone : null,
          guardian_document: isMinor ? data.guardianDoc : null,
          image_consent: data.imageConsent,
          terms_consent: data.termsConsent,
          avatar_url: avatarDataUrl,
        }, { onConflict: 'id' });

        if (profileError) {
          console.warn('[RegistrationService] Erro ao sincronizar perfil no Supabase:', profileError.message);
        } else {
          console.info('[RegistrationService] Perfil sincronizado com Supabase com sucesso.');
        }

        // Gravar a inscrição no evento na nuvem
        const { error: regError } = await supabase.from('event_registrations').upsert({
          id: regId,
          event_id: data.event.id,
          profile_id: profileId,
          weight_category_id: category.id || 'cat-meio-medio',
          declared_weight: weightVal.parsedWeight,
          status: 'pending',
          guardian_authorized: isMinor,
        }, { onConflict: 'id' });

        if (regError) {
          console.warn('[RegistrationService] Erro ao sincronizar inscrição no Supabase:', regError.message);
        } else {
          console.info('[RegistrationService] Inscrição sincronizada com Supabase com sucesso.');
        }
      }
    }

    return {
      success: true,
      registrationId: regId,
      status: 'pending',
      whatsappUrl: data.event.whatsapp_group_url,
    };
  } catch (err: any) {
    console.error('[RegistrationService] Exceção na sincronização com Supabase:', err);
    return {
      success: true,
      registrationId: localStoreRes.registrationId,
      status: 'pending',
      whatsappUrl: data.event.whatsapp_group_url,
    };
  }
}
