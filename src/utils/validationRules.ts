// ==============================================================================
// U.C.U ARENA — MOTOR CENTRALIZADO DE REGRAS DE NEGÓCIO E VALIDAÇÃO
// Fonte única da verdade compartilhada entre testes, validações e Edge Functions
// ==============================================================================

export const MIN_ALLOWED_WEIGHT = 50.0;
export const MAX_ALLOWED_WEIGHT = 90.0;

export interface WeightCategoryRule {
  id?: string;
  name: string;
  minWeight: number;
  maxWeight: number;
}

export const DEFAULT_WEIGHT_CATEGORIES: WeightCategoryRule[] = [
  { name: 'Peso Leve (50 a 60 kg)', minWeight: 50.0, maxWeight: 60.0 },
  { name: 'Peso Meio-Médio (Mais de 60 até 70 kg)', minWeight: 60.01, maxWeight: 70.0 },
  { name: 'Peso Médio (Mais de 70 até 80 kg)', minWeight: 70.01, maxWeight: 80.0 },
  { name: 'Peso Pesado (Mais de 80 até 90 kg)', minWeight: 80.01, maxWeight: 90.0 },
];

/**
 * Validação rigorosa do peso do atleta (duas casas decimais, faixa 50.00 a 90.00 kg)
 */
export function validateAthleteWeight(weight: number | string): { valid: boolean; error?: string; parsedWeight?: number } {
  let num: number;
  if (typeof weight === 'string') {
    num = parseFloat(weight.replace(',', '.'));
  } else {
    num = weight;
  }

  if (isNaN(num)) {
    return { valid: false, error: 'O peso informado não é um número válido.' };
  }

  // Arredonda para 2 casas decimais
  num = Math.round(num * 100) / 100;

  if (num < MIN_ALLOWED_WEIGHT) {
    return { valid: false, error: `O peso (${num.toFixed(2)} kg) está abaixo do limite mínimo permitido de ${MIN_ALLOWED_WEIGHT.toFixed(2)} kg.` };
  }

  if (num > MAX_ALLOWED_WEIGHT) {
    return { valid: false, error: `O peso (${num.toFixed(2)} kg) está acima do limite máximo permitido de ${MAX_ALLOWED_WEIGHT.toFixed(2)} kg.` };
  }

  return { valid: true, parsedWeight: num };
}

/**
 * Aloca o atleta na categoria de peso exata
 */
export function findWeightCategoryForWeight(
  weight: number,
  categories: WeightCategoryRule[] = DEFAULT_WEIGHT_CATEGORIES
): WeightCategoryRule | null {
  for (const cat of categories) {
    if (weight >= cat.minWeight && weight <= cat.maxWeight) {
      return cat;
    }
  }
  return null;
}

/**
 * Verifica se existem sobreposições de faixas de peso em um evento
 */
export function hasCategoryOverlap(categories: WeightCategoryRule[]): boolean {
  for (let i = 0; i < categories.length; i++) {
    for (let j = i + 1; j < categories.length; j++) {
      const c1 = categories[i];
      const c2 = categories[j];
      // Sobreposição: o início de uma faixa é menor que o fim da outra e vice-versa
      if (c1.minWeight < c2.maxWeight && c1.maxWeight > c2.minWeight) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Normaliza o apelido do atleta (LOWER + TRIM)
 */
export function normalizeNickname(nickname: string): string {
  return nickname.trim().toLowerCase();
}

/**
 * Calcula a idade com precisão em relação à data do evento
 */
export function calculateAgeAtEvent(birthDateStr: string, eventDate: Date = new Date()): number {
  const birthDate = new Date(birthDateStr);
  let age = eventDate.getFullYear() - birthDate.getFullYear();
  const m = eventDate.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && eventDate.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * Validação de integridade de participante menor de idade
 */
export function validateMinorRegistration(data: {
  isMinor: boolean;
  guardianName?: string | null;
  guardianPhone?: string | null;
  guardianDoc?: string | null;
  imageConsent: boolean;
  termsConsent: boolean;
}): { valid: boolean; error?: string } {
  if (data.isMinor) {
    if (!data.guardianName?.trim()) {
      return { valid: false, error: 'O nome do responsável legal é obrigatório para menores de 18 anos.' };
    }
    if (!data.guardianPhone?.trim()) {
      return { valid: false, error: 'O telefone do responsável legal é obrigatório para menores de 18 anos.' };
    }
    if (!data.guardianDoc?.trim()) {
      return { valid: false, error: 'O documento do responsável legal é obrigatório para menores de 18 anos.' };
    }
  }

  if (!data.imageConsent) {
    return { valid: false, error: 'O termo de cessão de uso de imagem é obrigatório.' };
  }

  if (!data.termsConsent) {
    return { valid: false, error: 'O termo de concordância com o regulamento esportivo é obrigatório.' };
  }

  return { valid: true };
}

/**
 * Validação de integridade de casamento de luta (Match)
 */
export function validateMatchIntegrity(params: {
  matchEventId: string;
  fighter1: { registrationId: string; eventId: string; status: string };
  fighter2: { registrationId: string; eventId: string; status: string };
  winnerRegistrationId?: string | null;
}): { valid: boolean; error?: string } {
  if (params.fighter1.registrationId === params.fighter2.registrationId) {
    return { valid: false, error: 'Um lutador não pode ser casado contra si mesmo.' };
  }

  if (params.fighter1.eventId !== params.matchEventId || params.fighter2.eventId !== params.matchEventId) {
    return { valid: false, error: 'Ambos os lutadores devem obrigatoriamente pertencer ao mesmo evento do combate.' };
  }

  if (params.fighter1.status !== 'approved' || params.fighter2.status !== 'approved') {
    return { valid: false, error: 'Apenas atletas com inscrição confirmada e APROVADA podem ser escalados no ringue.' };
  }

  if (params.winnerRegistrationId) {
    if (params.winnerRegistrationId !== params.fighter1.registrationId && params.winnerRegistrationId !== params.fighter2.registrationId) {
      return { valid: false, error: 'O vencedor registrado deve ser um dos participantes do confronto.' };
    }
  }

  return { valid: true };
}

/**
 * Sanitiza dados do perfil de atleta para visualização pública
 * Remove estritamente e-mail, telefone, dados de responsáveis e documentos
 */
export function sanitizePublicAthleteProfile(profile: {
  id: string;
  nickname: string;
  avatar_url?: string | null;
  recovery_email?: string;
  phone?: string;
  guardian_name?: string | null;
  guardian_document?: string | null;
  guardian_phone?: string | null;
  birth_date?: string;
}) {
  return {
    id: profile.id,
    nickname: profile.nickname,
    avatar_url: profile.avatar_url || null,
  };
}
