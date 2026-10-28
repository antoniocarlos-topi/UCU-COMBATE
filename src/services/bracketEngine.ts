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
  bracketType?: 'winners' | 'losers' | 'bronze' | 'round_robin';
  method?: string | null;
  score1?: number;
  score2?: number;
  notes?: string;
}

export interface RoundRobinStanding {
  registrationId: string;
  nickname: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  finishBonus: number;
}

export interface TournamentConfig {
  title: string;
  format: 'single_elimination' | 'double_elimination' | 'round_robin' | 'superfight';
  bracketSize?: number | 'auto';
  seedingMethod: 'weight_snake' | 'ranking' | 'random' | 'manual';
  hasBronzeMatch: boolean;
  roundDurationMinutes: number;
  roundsCount: number;
  trophyName?: string;
  categoryId: string;
  categoryName: string;
  selectedAthleteIds?: string[];
}

export interface BracketResult {
  categoryId: string;
  categoryName: string;
  totalRounds: number;
  totalMatches: number;
  matches: BracketMatch[];
  byes: number;
  generatedMatches: Omit<MatchFight, 'id'>[];
  tournamentTitle?: string;
  format?: 'single_elimination' | 'double_elimination' | 'round_robin' | 'superfight';
  trophyName?: string;
  hasBronzeMatch?: boolean;
  roundDurationMinutes?: number;
  roundsCount?: number;
  standings?: RoundRobinStanding[];
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
  eventId: string,
  skipSeeding: boolean = false
): BracketResult {
  const count = athletes.length;
  const bracketSize = nextPowerOfTwo(count);
  const rounds = totalRoundsForBracket(count);
  const byes = bracketSize - count;

  // Se skipSeeding for true (manual), usa os atletas na ordem exata informada pelo admin
  const orderedAthletes = skipSeeding ? [...athletes] : seedAthletesByWeight(athletes);
  const seedPositions = skipSeeding
    ? Array.from({ length: bracketSize }, (_, i) => i)
    : generateSeededPositions(bracketSize);

  // Monta os slots da primeira rodada
  const slots: (BracketSlot | null)[] = Array(bracketSize).fill(null);

  for (let i = 0; i < bracketSize; i++) {
    const seedIndex = seedPositions[i];
    if (seedIndex < count) {
      const athlete = orderedAthletes[seedIndex];
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

// ==============================================================================
// GERAÇÃO DE CAMPEONATOS & TORNEIOS AVANÇADOS
// Suporte a Eliminatória Simples, Dupla Eliminação, Round Robin e Superfight
// ==============================================================================

/**
 * Ordena/semeia atletas de acordo com o método escolhido
 */
export function seedAthletes(
  athletes: EventRegistration[],
  method: 'weight_snake' | 'ranking' | 'random' | 'manual'
): EventRegistration[] {
  const list = [...athletes];

  switch (method) {
    case 'weight_snake':
      return seedAthletesByWeight(list);

    case 'ranking':
      // Ordena por peso verificado ou declarado
      return list.sort((a, b) => {
        const wA = a.verified_weight || a.declared_weight || 0;
        const wB = b.verified_weight || b.declared_weight || 0;
        return wB - wA;
      });

    case 'random':
      // Embaralhamento determinístico / aleatório
      for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
      }
      return list;

    case 'manual':
    default:
      return list;
  }
}

/**
 * Gera um torneio completo a partir da configuração do usuário
 */
export function generateAdvancedTournament(
  config: TournamentConfig,
  allRegistrations: EventRegistration[],
  eventId: string
): BracketResult {
  // 1. Filtrar atletas participantes
  let athletes = allRegistrations.filter((r) => r.status === 'approved');
  if (config.categoryId && config.categoryId !== 'openweight') {
    athletes = athletes.filter((r) => r.weight_category_id === config.categoryId);
  }
  if (config.selectedAthleteIds && config.selectedAthleteIds.length > 0) {
    athletes = athletes.filter((r) => config.selectedAthleteIds?.includes(r.id));
  }

  // Se limite de tamanho foi configurado
  if (typeof config.bracketSize === 'number' && athletes.length > config.bracketSize) {
    athletes = athletes.slice(0, config.bracketSize);
  }

  // 2. Aplicar Seeding
  const seededAthletes = seedAthletes(athletes, config.seedingMethod);

  // 3. Gerar de acordo com o formato escolhido
  if (config.format === 'round_robin') {
    return generateRoundRobinTournament(seededAthletes, config, eventId);
  }

  if (config.format === 'superfight') {
    return generateSuperfightTournament(seededAthletes, config, eventId);
  }

  if (config.format === 'double_elimination') {
    return generateDoubleEliminationTournament(seededAthletes, config, eventId);
  }

  // Padrão: Eliminatória Simples (com disputa de 3º opcional)
  const isManual = config.seedingMethod === 'manual';
  const baseBracket = generateSingleEliminationBracket(
    seededAthletes,
    config.categoryId,
    config.categoryName,
    eventId,
    isManual
  );

  baseBracket.tournamentTitle = config.title;
  baseBracket.format = config.format;
  baseBracket.trophyName = config.trophyName;
  baseBracket.hasBronzeMatch = config.hasBronzeMatch;
  baseBracket.roundDurationMinutes = config.roundDurationMinutes;
  baseBracket.roundsCount = config.roundsCount;

  // Adiciona Disputa de Bronze se solicitada e houver ao menos 4 atletas
  if (config.hasBronzeMatch && seededAthletes.length >= 4) {
    baseBracket.matches.push({
      id: `bracket-bronze-${config.categoryId}`,
      round: baseBracket.totalRounds - 1,
      roundName: 'Disputa de 3º Lugar (Bronze)',
      position: 99,
      slot1: null,
      slot2: null,
      winnerId: null,
      status: 'pending',
      bracketType: 'bronze',
    });
  }

  return baseBracket;
}

/**
 * Gera Torneio Round Robin (Todos contra Todos)
 */
function generateRoundRobinTournament(
  athletes: EventRegistration[],
  config: TournamentConfig,
  eventId: string
): BracketResult {
  const matches: BracketMatch[] = [];
  const generatedFights: Omit<MatchFight, 'id'>[] = [];
  let fightCounter = 0;

  // Gera todas as combinações i vs j
  for (let i = 0; i < athletes.length; i++) {
    for (let j = i + 1; j < athletes.length; j++) {
      fightCounter++;
      const a1 = athletes[i];
      const a2 = athletes[j];

      const match: BracketMatch = {
        id: `rr-m${fightCounter}-${config.categoryId}`,
        round: Math.floor(fightCounter / 2),
        roundName: `Rodada ${Math.floor(fightCounter / 2) + 1}`,
        position: fightCounter,
        slot1: {
          position: 0,
          registrationId: a1.id,
          nickname: a1.profile?.nickname || `Atleta ${i + 1}`,
          seed: i + 1,
        },
        slot2: {
          position: 1,
          registrationId: a2.id,
          nickname: a2.profile?.nickname || `Atleta ${j + 1}`,
          seed: j + 1,
        },
        winnerId: null,
        status: 'ready',
        bracketType: 'round_robin',
      };

      matches.push(match);

      generatedFights.push({
        event_id: eventId,
        weight_category_id: config.categoryId,
        match_order: fightCounter,
        round_name: match.roundName,
        fighter1_registration_id: a1.id,
        fighter2_registration_id: a2.id,
        status: 'scheduled',
        scheduled_time: null,
      });
    }
  }

  // Tabela inicial de classificação
  const standings: RoundRobinStanding[] = athletes.map((a) => ({
    registrationId: a.id,
    nickname: a.profile?.nickname || 'Atleta',
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    points: 0,
    finishBonus: 0,
  }));

  return {
    categoryId: config.categoryId,
    categoryName: config.categoryName,
    totalRounds: Math.ceil(matches.length / 2) || 1,
    totalMatches: matches.length,
    matches,
    byes: 0,
    generatedMatches: generatedFights,
    tournamentTitle: config.title,
    format: 'round_robin',
    trophyName: config.trophyName,
    roundDurationMinutes: config.roundDurationMinutes,
    roundsCount: config.roundsCount,
    standings,
  };
}

/**
 * Gera Torneio Super Fight / Desafio Único
 */
function generateSuperfightTournament(
  athletes: EventRegistration[],
  config: TournamentConfig,
  eventId: string
): BracketResult {
  const a1 = athletes[0];
  const a2 = athletes[1];

  const match: BracketMatch = {
    id: `superfight-1-${config.categoryId}`,
    round: 0,
    roundName: 'SUPER LUTA OFICIAL — DISPUTA DE TÍTULO',
    position: 0,
    slot1: a1 ? {
      position: 0,
      registrationId: a1.id,
      nickname: a1.profile?.nickname || 'Desafiante 1',
      seed: 1,
    } : null,
    slot2: a2 ? {
      position: 1,
      registrationId: a2.id,
      nickname: a2.profile?.nickname || 'Desafiante 2',
      seed: 2,
    } : null,
    winnerId: null,
    status: (a1 && a2) ? 'ready' : 'pending',
    bracketType: 'winners',
  };

  const generatedFights: Omit<MatchFight, 'id'>[] = [];
  if (a1 && a2) {
    generatedFights.push({
      event_id: eventId,
      weight_category_id: config.categoryId,
      match_order: 1,
      round_name: 'Super Luta',
      fighter1_registration_id: a1.id,
      fighter2_registration_id: a2.id,
      status: 'scheduled',
      scheduled_time: null,
    });
  }

  return {
    categoryId: config.categoryId,
    categoryName: config.categoryName,
    totalRounds: 1,
    totalMatches: 1,
    matches: [match],
    byes: 0,
    generatedMatches: generatedFights,
    tournamentTitle: config.title,
    format: 'superfight',
    trophyName: config.trophyName,
    roundDurationMinutes: config.roundDurationMinutes,
    roundsCount: config.roundsCount,
  };
}

/**
 * Gera Torneio de Dupla Eliminação (Winners Bracket + Losers Bracket + Grande Final)
 */
function generateDoubleEliminationTournament(
  athletes: EventRegistration[],
  config: TournamentConfig,
  eventId: string
): BracketResult {
  // Base dos vencedores
  const isManual = config.seedingMethod === 'manual';
  const winnersBracket = generateSingleEliminationBracket(
    athletes,
    config.categoryId,
    config.categoryName,
    eventId,
    isManual
  );

  // Marcar as lutas como chave de vencedores
  const allMatches: BracketMatch[] = winnersBracket.matches.map((m) => ({
    ...m,
    bracketType: 'winners',
  }));

  // Adiciona rodadas da Chave de Repescagem / Perdedores
  const losersRounds = Math.max(1, winnersBracket.totalRounds);
  let losersCounter = 0;

  for (let r = 0; r < losersRounds; r++) {
    const matchesInRound = Math.max(1, Math.floor(winnersBracket.matches.length / Math.pow(2, r + 2)));
    for (let p = 0; p < matchesInRound; p++) {
      losersCounter++;
      allMatches.push({
        id: `losers-r${r}-m${losersCounter}-${config.categoryId}`,
        round: r,
        roundName: `Repescagem — Fase ${r + 1}`,
        position: p,
        slot1: null,
        slot2: null,
        winnerId: null,
        status: 'pending',
        bracketType: 'losers',
      });
    }
  }

  // Grande Final da Dupla Eliminação (Campeão dos Vencedores vs Campeão da Repescagem)
  allMatches.push({
    id: `grand-final-${config.categoryId}`,
    round: winnersBracket.totalRounds,
    roundName: 'GRANDE FINAL UNIFICADA',
    position: 0,
    slot1: null,
    slot2: null,
    winnerId: null,
    status: 'pending',
    bracketType: 'winners',
  });

  return {
    categoryId: config.categoryId,
    categoryName: config.categoryName,
    totalRounds: winnersBracket.totalRounds + 1,
    totalMatches: allMatches.length,
    matches: allMatches,
    byes: winnersBracket.byes,
    generatedMatches: winnersBracket.generatedMatches,
    tournamentTitle: config.title,
    format: 'double_elimination',
    trophyName: config.trophyName,
    roundDurationMinutes: config.roundDurationMinutes,
    roundsCount: config.roundsCount,
  };
}

/**
 * Resolve uma luta diretamente dentro do bracket:
 * Atribui vencedor, método da vitória, placar e propaga o vencedor para a próxima fase.
 */
export function resolveBracketMatch(
  matches: BracketMatch[],
  matchId: string,
  winnerId: string,
  method?: string,
  score1?: number,
  score2?: number
): { updatedMatches: BracketMatch[]; champion: BracketSlot | null } {
  const updated = matches.map((m) => {
    if (m.id !== matchId) return m;

    return {
      ...m,
      winnerId,
      status: 'completed' as const,
      method: method || 'Vitória Oficial',
      score1: score1 ?? 0,
      score2: score2 ?? 0,
    };
  });

  const targetMatch = updated.find((m) => m.id === matchId);
  const winnerNickname =
    targetMatch?.slot1?.registrationId === winnerId
      ? targetMatch?.slot1?.nickname
      : targetMatch?.slot2?.nickname || 'Vencedor';

  // Avança na árvore eliminatória
  const propagated = advanceWinnerInBracket(updated, matchId, winnerId, winnerNickname);
  const stats = calculateBracketStats(propagated);

  return {
    updatedMatches: propagated,
    champion: stats.champion,
  };
}

