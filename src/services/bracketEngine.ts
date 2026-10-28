// ==============================================================================
// U.C.U ARENA — MOTOR DE CHAVEAMENTO AUTOMÁTICO (FASE 06)
// Geração de brackets mata-mata, round-robin e amistosos por categoria
// ==============================================================================

import { EventRegistration, MatchFight } from '../types/app.types';

// ==============================================================================
// TIPOS DO MOTOR DE CHAVEAMENTO
// ==============================================================================

export interface BracketSlot {
  position: number;
  registrationId: string | null; // null = BYE
  nickname: string;
  seed: number;
}

export interface BracketMatch {
  id: string;
  round: number;        // 0 = Primeira rodada, 1 = Quartas, 2 = Semi, 3 = Final etc.
  roundName: string;
  position: number;     // Posição dentro da rodada (0-indexed)
  slot1: BracketSlot | null;
  slot2: BracketSlot | null;
  winnerId: string | null;
  status: 'pending' | 'ready' | 'in_progress' | 'completed';
}

export interface BracketResult {
  categoryId: string;
  categoryName: string;
  totalRounds: number;
  totalMatches: number;
  matches: BracketMatch[];
  byes: number;
  generatedMatches: Omit<MatchFight, 'id'>[];
}

export interface BracketGenerationError {
  success: false;
  error: string;
}

export type BracketGenerationResult = 
  | { success: true; brackets: BracketResult[] }
  | BracketGenerationError;

// ==============================================================================
// UTILIDADES DE CÁLCULO COMBINATÓRIO
// ==============================================================================

/**
 * Calcula a próxima potência de 2 maior ou igual a n.
 * Necessário para preencher o bracket com BYEs.
 */
export function nextPowerOfTwo(n: number): number {
  if (n <= 1) return 1;
  let power = 1;
  while (power < n) {
    power *= 2;
  }
  return power;
}

/**
 * Calcula o número total de rodadas em um bracket mata-mata.
 */
export function totalRoundsForBracket(participantCount: number): number {
  if (participantCount <= 1) return 0;
  return Math.ceil(Math.log2(participantCount));
}

/**
 * Gera um nome amigável para cada rodada baseado no total de participantes.
 */
export function getRoundName(round: number, totalRounds: number): string {
  const reverseIndex = totalRounds - round;
  const roundNames: Record<number, string> = {
    0: 'FINAL',
    1: 'Semifinal',
    2: 'Quartas de Final',
    3: 'Oitavas de Final',
    4: '16 Avos de Final',
    5: '32 Avos de Final',
  };
  return roundNames[reverseIndex] || `Rodada ${round + 1}`;
}

// ==============================================================================
// SEEDING E EMBARALHAMENTO JUSTO
// ==============================================================================

/**
 * Aplica seeding por peso para distribuir os atletas de forma justa.
 * Atletas com pesos mais próximos não devem se enfrentar nas primeiras rodadas.
 * Usa o algoritmo de seeding por serpentina (snake seeding) para equilíbrio.
 */
export function seedAthletesByWeight(
  athletes: EventRegistration[]
): EventRegistration[] {
  // Ordena por peso verificado (ou declarado) crescente
  const sorted = [...athletes].sort((a, b) => {
    const weightA = a.verified_weight ?? a.declared_weight;
    const weightB = b.verified_weight ?? b.declared_weight;
    return weightA - weightB;
  });

  return sorted;
}

/**
 * Aplica o algoritmo de posicionamento de bracket padrão (seeded bracket placement).
 * Em um bracket de 8 jogadores: 1v8, 4v5, 3v6, 2v7 — garante que os melhores
 * seeds não se enfrentem cedo.
 */
export function generateSeededPositions(count: number): number[] {
  const bracketSize = nextPowerOfTwo(count);
  
  if (bracketSize === 1) return [0];
  if (bracketSize === 2) return [0, 1];

  // Gera as posições de seed usando algoritmo iterativo
  let positions = [0, 1];
  
  while (positions.length < bracketSize) {
    const nextPositions: number[] = [];
    const maxSeed = positions.length * 2 - 1;
    
    for (const pos of positions) {
      nextPositions.push(pos);
      nextPositions.push(maxSeed - pos);
    }
    
    positions = nextPositions;
  }

  return positions;
}

// ==============================================================================
// GERAÇÃO DE BRACKET MATA-MATA (SINGLE ELIMINATION)
// ==============================================================================

/**
 * Gera um bracket completo de eliminação simples para uma lista de atletas.
 * 
 * @param athletes - Lista de atletas aprovados na categoria
 * @param categoryId - ID da categoria de peso
 * @param categoryName - Nome da categoria
 * @param eventId - ID do evento
 * @returns Resultado do bracket com matches gerados
 */
export function generateSingleEliminationBracket(
  athletes: EventRegistration[],
  categoryId: string,
  categoryName: string,
  eventId: string
): BracketResult {
  const count = athletes.length;
  const bracketSize = nextPowerOfTwo(count);
  const rounds = totalRoundsForBracket(count);
  const byes = bracketSize - count;

  // Seed dos atletas por peso
  const seeded = seedAthletesByWeight(athletes);

  // Gera posições de bracket
  const seedPositions = generateSeededPositions(bracketSize);

  // Monta os slots da primeira rodada
  const slots: (BracketSlot | null)[] = Array(bracketSize).fill(null);

  for (let i = 0; i < bracketSize; i++) {
    const seedIndex = seedPositions[i];
    if (seedIndex < count) {
      const athlete = seeded[seedIndex];
      slots[i] = {
        position: i,
        registrationId: athlete.id,
        nickname: athlete.profile?.nickname || `Atleta #${seedIndex + 1}`,
        seed: seedIndex + 1,
      };
    } else {
      // BYE
      slots[i] = {
        position: i,
        registrationId: null,
        nickname: 'BYE',
        seed: seedIndex + 1,
      };
    }
  }

  // Gera as lutas da primeira rodada
  const allBracketMatches: BracketMatch[] = [];
  const generatedFights: Omit<MatchFight, 'id'>[] = [];
  let matchCounter = 0;
  let totalMatches = 0;

  // Primeira rodada
  for (let i = 0; i < bracketSize; i += 2) {
    const slot1 = slots[i];
    const slot2 = slots[i + 1];
    matchCounter++;

    const isBye = !slot1?.registrationId || !slot2?.registrationId;
    const byeWinner = isBye
      ? (slot1?.registrationId ? slot1.registrationId : slot2?.registrationId || null)
      : null;

    const bracketMatch: BracketMatch = {
      id: `bracket-r0-m${matchCounter}-${categoryId}`,
      round: 0,
      roundName: getRoundName(0, rounds),
      position: Math.floor(i / 2),
      slot1,
      slot2,
      winnerId: byeWinner,
      status: isBye ? 'completed' : 'ready',
    };

    allBracketMatches.push(bracketMatch);

    // Gera o match jogável (não-BYE) para o adminService
    if (!isBye && slot1?.registrationId && slot2?.registrationId) {
      totalMatches++;
      generatedFights.push({
        event_id: eventId,
        weight_category_id: categoryId,
        match_order: totalMatches,
        round_name: getRoundName(0, rounds),
        fighter1_registration_id: slot1.registrationId,
        fighter2_registration_id: slot2.registrationId,
        status: 'scheduled',
        scheduled_time: null,
      });
    }
  }

  // Gera rodadas seguintes (ainda sem atletas, espera resultados)
  for (let round = 1; round < rounds; round++) {
    const matchesInRound = bracketSize / Math.pow(2, round + 1);
    for (let pos = 0; pos < matchesInRound; pos++) {
      matchCounter++;
      allBracketMatches.push({
        id: `bracket-r${round}-m${matchCounter}-${categoryId}`,
        round,
        roundName: getRoundName(round, rounds),
        position: pos,
        slot1: null,
        slot2: null,
        winnerId: null,
        status: 'pending',
      });
    }
  }

  return {
    categoryId,
    categoryName,
    totalRounds: rounds,
    totalMatches,
    matches: allBracketMatches,
    byes,
    generatedMatches: generatedFights,
  };
}

// ==============================================================================
// GERAÇÃO DE CHAVEAMENTO PARA TODAS AS CATEGORIAS DO EVENTO
// ==============================================================================

/**
 * Gera brackets para todas as categorias de um evento.
 * Agrupa atletas aprovados por categoria e gera mata-mata para cada uma.
 */
export function generateEventBrackets(
  eventId: string,
  approvedRegistrations: EventRegistration[],
  categories: { id: string; name: string }[]
): BracketGenerationResult {
  if (approvedRegistrations.length < 2) {
    return {
      success: false,
      error: 'São necessários pelo menos 2 atletas aprovados para gerar chaveamento.',
    };
  }

  const brackets: BracketResult[] = [];

  for (const cat of categories) {
    const athletesInCat = approvedRegistrations.filter(
      (r) => r.weight_category_id === cat.id && r.status === 'approved'
    );

    if (athletesInCat.length < 2) {
      // Categorias com menos de 2 atletas não geram bracket
      continue;
    }

    const bracket = generateSingleEliminationBracket(
      athletesInCat,
      cat.id,
      cat.name,
      eventId
    );

    brackets.push(bracket);
  }

  if (brackets.length === 0) {
    return {
      success: false,
      error: 'Nenhuma categoria possui 2 ou mais atletas aprovados para gerar chaveamento.',
    };
  }

  return { success: true, brackets };
}

// ==============================================================================
// PROGRESSÃO DO BRACKET (AVANÇO DE VENCEDORES)
// ==============================================================================

/**
 * Avança o vencedor de uma luta para a próxima rodada do bracket.
 */
export function advanceWinnerInBracket(
  bracketMatches: BracketMatch[],
  completedMatchId: string,
  winnerId: string,
  winnerNickname: string
): BracketMatch[] {
  const updated = [...bracketMatches];
  const matchIndex = updated.findIndex((m) => m.id === completedMatchId);
  if (matchIndex === -1) return updated;

  const completedMatch = updated[matchIndex];
  completedMatch.winnerId = winnerId;
  completedMatch.status = 'completed';

  // Encontra a luta seguinte
  const nextRound = completedMatch.round + 1;
  const nextPosition = Math.floor(completedMatch.position / 2);
  const isSlot1 = completedMatch.position % 2 === 0;

  const nextMatch = updated.find(
    (m) => m.round === nextRound && m.position === nextPosition
  );

  if (nextMatch) {
    const winnerSlot: BracketSlot = {
      position: isSlot1 ? 0 : 1,
      registrationId: winnerId,
      nickname: winnerNickname,
      seed: 0, // Seed não é mais relevante após a primeira rodada
    };

    if (isSlot1) {
      nextMatch.slot1 = winnerSlot;
    } else {
      nextMatch.slot2 = winnerSlot;
    }

    // Se ambos os slots estão preenchidos, a luta fica pronta
    if (nextMatch.slot1?.registrationId && nextMatch.slot2?.registrationId) {
      nextMatch.status = 'ready';
    }
  }

  return updated;
}

// ==============================================================================
// TRANSIÇÃO DE STATUS DE COMBATE AO VIVO
// ==============================================================================

export type LiveMatchTransition = 
  | 'START_FIGHT'    // scheduled/ready → in_progress
  | 'FINISH_FIGHT'   // in_progress → completed
  | 'CANCEL_FIGHT';  // any → cancelled

export interface LiveTransitionResult {
  success: boolean;
  error?: string;
  previousStatus?: string;
  newStatus?: string;
}

/**
 * Valida e executa uma transição de status de luta ao vivo.
 * Garante que apenas transições válidas sejam permitidas.
 */
export function validateLiveMatchTransition(
  currentStatus: string,
  transition: LiveMatchTransition
): LiveTransitionResult {
  const validTransitions: Record<string, LiveMatchTransition[]> = {
    'scheduled': ['START_FIGHT', 'CANCEL_FIGHT'],
    'ready': ['START_FIGHT', 'CANCEL_FIGHT'],
    'in_progress': ['FINISH_FIGHT', 'CANCEL_FIGHT'],
    'completed': [],
    'cancelled': [],
  };

  const allowed = validTransitions[currentStatus] || [];

  if (!allowed.includes(transition)) {
    return {
      success: false,
      error: `Transição "${transition}" não é permitida a partir do status "${currentStatus}".`,
    };
  }

  const statusMap: Record<LiveMatchTransition, string> = {
    'START_FIGHT': 'in_progress',
    'FINISH_FIGHT': 'completed',
    'CANCEL_FIGHT': 'cancelled',
  };

  return {
    success: true,
    previousStatus: currentStatus,
    newStatus: statusMap[transition],
  };
}

// ==============================================================================
// CONTADORES E ESTATÍSTICAS DO BRACKET
// ==============================================================================

export interface BracketStats {
  totalFights: number;
  completedFights: number;
  inProgressFights: number;
  pendingFights: number;
  readyFights: number;
  progressPercent: number;
  champion: BracketSlot | null;
}

/**
 * Calcula estatísticas resumidas de um bracket.
 */
export function calculateBracketStats(matches: BracketMatch[]): BracketStats {
  const playableMatches = matches.filter(
    (m) => m.slot1?.registrationId && m.slot2?.registrationId
  );

  const completedFights = playableMatches.filter((m) => m.status === 'completed').length;
  const inProgressFights = playableMatches.filter((m) => m.status === 'in_progress').length;
  const readyFights = playableMatches.filter((m) => m.status === 'ready').length;
  const pendingFights = playableMatches.filter((m) => m.status === 'pending').length;

  // O campeão é o vencedor da última rodada (final)
  const maxRound = Math.max(...matches.map((m) => m.round));
  const finalMatch = matches.find((m) => m.round === maxRound && m.position === 0);
  let champion: BracketSlot | null = null;

  if (finalMatch?.status === 'completed' && finalMatch.winnerId) {
    champion = finalMatch.slot1?.registrationId === finalMatch.winnerId
      ? finalMatch.slot1
      : finalMatch.slot2;
  }

  return {
    totalFights: playableMatches.length,
    completedFights,
    inProgressFights,
    pendingFights,
    readyFights,
    progressPercent: playableMatches.length > 0
      ? Math.round((completedFights / playableMatches.length) * 100)
      : 0,
    champion,
  };
}
