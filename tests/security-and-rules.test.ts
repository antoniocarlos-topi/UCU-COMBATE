import { describe, it, expect } from 'vitest';
import {
  validateAthleteWeight,
  findWeightCategoryForWeight,
  hasCategoryOverlap,
  normalizeNickname,
  calculateAgeAtEvent,
  validateMinorRegistration,
  validateMatchIntegrity,
  sanitizePublicAthleteProfile,
  DEFAULT_WEIGHT_CATEGORIES,
  WeightCategoryRule,
} from '../src/utils/validationRules';

describe('U.C.U Arena — Testes de Backend, Regras de Negócio e Segurança', () => {

  // ============================================================================
  // 1. REGRAS DE PESAGEM E CATEGORIAS DECIMAIS (50,00 kg a 90,00 kg)
  // ============================================================================
  describe('Validação de Pesagem Decimal', () => {
    it('deve aceitar pesos válidos nos limites inferior (50.00 kg) e superior (90.00 kg)', () => {
      expect(validateAthleteWeight(50.0).valid).toBe(true);
      expect(validateAthleteWeight('50.00').valid).toBe(true);
      expect(validateAthleteWeight(90.0).valid).toBe(true);
      expect(validateAthleteWeight('90,00').valid).toBe(true);
      expect(validateAthleteWeight(67.45).valid).toBe(true);
    });

    it('deve REJEITAR pesos abaixo do limite mínimo (< 50.00 kg)', () => {
      const res1 = validateAthleteWeight(49.99);
      expect(res1.valid).toBe(false);
      expect(res1.error).toContain('abaixo do limite mínimo');

      const res2 = validateAthleteWeight('35.50');
      expect(res2.valid).toBe(false);

      const res3 = validateAthleteWeight(0);
      expect(res3.valid).toBe(false);
    });

    it('deve REJEITAR pesos acima do limite máximo (> 90.00 kg)', () => {
      const res1 = validateAthleteWeight(90.01);
      expect(res1.valid).toBe(false);
      expect(res1.error).toContain('acima do limite máximo');

      const res2 = validateAthleteWeight(105.20);
      expect(res2.valid).toBe(false);
    });

    it('deve alocar corretamente os atletas nas 4 categorias padrão da U.C.U Arena', () => {
      // 50.00 a 60.00 kg
      expect(findWeightCategoryForWeight(55.0)?.name).toBe('Peso Leve (50 a 60 kg)');
      expect(findWeightCategoryForWeight(60.0)?.name).toBe('Peso Leve (50 a 60 kg)');

      // Mais de 60.00 até 70.00 kg
      expect(findWeightCategoryForWeight(60.01)?.name).toBe('Peso Meio-Médio (Mais de 60 até 70 kg)');
      expect(findWeightCategoryForWeight(68.50)?.name).toBe('Peso Meio-Médio (Mais de 60 até 70 kg)');

      // Mais de 70.00 até 80.00 kg
      expect(findWeightCategoryForWeight(74.20)?.name).toBe('Peso Médio (Mais de 70 até 80 kg)');

      // Mais de 80.00 até 90.00 kg
      expect(findWeightCategoryForWeight(85.90)?.name).toBe('Peso Pesado (Mais de 80 até 90 kg)');
      expect(findWeightCategoryForWeight(90.00)?.name).toBe('Peso Pesado (Mais de 80 até 90 kg)');
    });

    it('deve DETECTAR sobreposição de categorias configuradas por evento', () => {
      const overlappingCategories: WeightCategoryRule[] = [
        { name: 'Cat A', minWeight: 50.0, maxWeight: 65.0 },
        { name: 'Cat B', minWeight: 60.0, maxWeight: 75.0 }, // Conflito: 60 a 65 kg sobrepõe
      ];
      expect(hasCategoryOverlap(overlappingCategories)).toBe(true);

      expect(hasCategoryOverlap(DEFAULT_WEIGHT_CATEGORIES)).toBe(false);
    });
  });

  // ============================================================================
  // 2. PROTEÇÃO DE MENORES E CONSENTIMENTOS (LGPD & ECA)
  // ============================================================================
  describe('Proteção e Elegibilidade de Menores de Idade', () => {
    it('deve calcular corretamente a idade com base na data de nascimento', () => {
      const eventDate = new Date('2026-11-15');
      // Nascido em 2010-01-01 -> 16 anos em nov/2026 (Menor)
      expect(calculateAgeAtEvent('2010-01-01', eventDate)).toBe(16);
      // Nascido em 2005-01-01 -> 21 anos em nov/2026 (Adulto)
      expect(calculateAgeAtEvent('2005-01-01', eventDate)).toBe(21);
    });

    it('deve REJEITAR cadastro de menor sem dados completos do responsável legal', () => {
      const resWithoutName = validateMinorRegistration({
        isMinor: true,
        guardianName: '',
        guardianPhone: '(11) 99999-9999',
        guardianDoc: '12.345.678-9',
        imageConsent: true,
        termsConsent: true,
      });
      expect(resWithoutName.valid).toBe(false);
      expect(resWithoutName.error).toContain('nome do responsável legal é obrigatório');

      const resWithoutPhone = validateMinorRegistration({
        isMinor: true,
        guardianName: 'Marcos Silva',
        guardianPhone: '',
        guardianDoc: '12.345.678-9',
        imageConsent: true,
        termsConsent: true,
      });
      expect(resWithoutPhone.valid).toBe(false);
      expect(resWithoutPhone.error).toContain('telefone do responsável');

      const resWithoutDoc = validateMinorRegistration({
        isMinor: true,
        guardianName: 'Marcos Silva',
        guardianPhone: '(11) 99999-9999',
        guardianDoc: '',
        imageConsent: true,
        termsConsent: true,
      });
      expect(resWithoutDoc.valid).toBe(false);
      expect(resWithoutDoc.error).toContain('documento do responsável');
    });

    it('deve REJEITAR qualquer inscrição sem cessão de imagem ou sem aceite dos termos esportivos', () => {
      const noImage = validateMinorRegistration({
        isMinor: false,
        imageConsent: false,
        termsConsent: true,
      });
      expect(noImage.valid).toBe(false);
      expect(noImage.error).toContain('cessão de uso de imagem é obrigatório');

      const noTerms = validateMinorRegistration({
        isMinor: false,
        imageConsent: true,
        termsConsent: false,
      });
      expect(noTerms.valid).toBe(false);
      expect(noTerms.error).toContain('regulamento esportivo é obrigatório');
    });
  });

  // ============================================================================
  // 3. INTEGRIDADE DOS CONFRONTOS E CASAMENTO DE LUTAS (MATCHES)
  // ============================================================================
  describe('Integridade de Confrontos entre Atletas', () => {
    const eventA = 'event-aaa-111';
    const eventB = 'event-bbb-222';

    it('deve REJEITAR luta entre atletas de eventos distintos (Cross-Event Fight)', () => {
      const match = validateMatchIntegrity({
        matchEventId: eventA,
        fighter1: { registrationId: 'reg-1', eventId: eventA, status: 'approved' },
        fighter2: { registrationId: 'reg-2', eventId: eventB, status: 'approved' }, // Evento divergente!
      });
      expect(match.valid).toBe(false);
      expect(match.error).toContain('mesmo evento do combate');
    });

    it('deve REJEITAR atleta não aprovado ou pendente de lutar no ringue', () => {
      const match = validateMatchIntegrity({
        matchEventId: eventA,
        fighter1: { registrationId: 'reg-1', eventId: eventA, status: 'pending' }, // Ainda pendente!
        fighter2: { registrationId: 'reg-2', eventId: eventA, status: 'approved' },
      });
      expect(match.valid).toBe(false);
      expect(match.error).toContain('inscrição confirmada e APROVADA');
    });

    it('deve REJEITAR luta de um atleta contra si mesmo', () => {
      const match = validateMatchIntegrity({
        matchEventId: eventA,
        fighter1: { registrationId: 'reg-1', eventId: eventA, status: 'approved' },
        fighter2: { registrationId: 'reg-1', eventId: eventA, status: 'approved' }, // Mesmo ID!
      });
      expect(match.valid).toBe(false);
      expect(match.error).toContain('não pode ser casado contra si mesmo');
    });

    it('deve REJEITAR vencedor que não seja um dos competidores da luta', () => {
      const match = validateMatchIntegrity({
        matchEventId: eventA,
        fighter1: { registrationId: 'reg-1', eventId: eventA, status: 'approved' },
        fighter2: { registrationId: 'reg-2', eventId: eventA, status: 'approved' },
        winnerRegistrationId: 'reg-intruder-3', // Não participou da luta!
      });
      expect(match.valid).toBe(false);
      expect(match.error).toContain('vencedor registrado deve ser um dos participantes');
    });

    it('deve ACEITAR confronto válido com ambos os atletas aprovados no mesmo evento', () => {
      const match = validateMatchIntegrity({
        matchEventId: eventA,
        fighter1: { registrationId: 'reg-1', eventId: eventA, status: 'approved' },
        fighter2: { registrationId: 'reg-2', eventId: eventA, status: 'approved' },
        winnerRegistrationId: 'reg-1',
      });
      expect(match.valid).toBe(true);
    });
  });

  // ============================================================================
  // 4. PRIVACIDADE E SEGURANÇA DE DADOS (ZERO LEAKS)
  // ============================================================================
  describe('Blindagem de Privacidade e Segurança do Perfil', () => {
    it('deve normalizar o apelido ignorando maiúsculas e espaços externos', () => {
      expect(normalizeNickname('  Guerreiro_99  ')).toBe('guerreiro_99');
      expect(normalizeNickname('FALCÃO')).toBe('falcão');
      expect(normalizeNickname(' caveira ')).toBe('caveira');
    });

    it('deve expurgar rigorosamente e-mail, telefone e documentos de menores do perfil público', () => {
      const fullProfile = {
        id: 'prof-123',
        nickname: 'Tigre Negro',
        avatar_url: 'https://storage/avatars/tigre.webp',
        recovery_email: 'privado@gmail.com', // NUNCA deve vazar
        phone: '(11) 99999-8888',          // NUNCA deve vazar
        guardian_name: 'José da Silva',    // NUNCA deve vazar
        guardian_document: '123456789-00', // NUNCA deve vazar
        guardian_phone: '(11) 98888-7777', // NUNCA deve vazar
        birth_date: '2008-05-10',          // NUNCA deve vazar
      };

      const publicView = sanitizePublicAthleteProfile(fullProfile);

      // Campos permitidos
      expect(publicView.id).toBe('prof-123');
      expect(publicView.nickname).toBe('Tigre Negro');
      expect(publicView.avatar_url).toBe('https://storage/avatars/tigre.webp');

      // Campos sensíveis devem ser estritamente undefined
      expect((publicView as any).recovery_email).toBeUndefined();
      expect((publicView as any).phone).toBeUndefined();
      expect((publicView as any).guardian_name).toBeUndefined();
      expect((publicView as any).guardian_document).toBeUndefined();
      expect((publicView as any).guardian_phone).toBeUndefined();
      expect((publicView as any).birth_date).toBeUndefined();
    });
  });

  // ============================================================================
  // 5. TESTES DO CONVITE E UPLOAD DA FASE 03
  // ============================================================================
  describe('Validação de Convite, Upload e Inscrição (Fase 03)', () => {
    it('deve validar formatos de imagem permitidos (JPEG, PNG, WebP) e rejeitar outros', async () => {
      const { validateImageFile } = await import('../src/utils/imageCompressor');

      const validJpg = new File([''], 'foto.jpg', { type: 'image/jpeg' });
      const validPng = new File([''], 'foto.png', { type: 'image/png' });
      const validWebp = new File([''], 'foto.webp', { type: 'image/webp' });
      const invalidPdf = new File([''], 'doc.pdf', { type: 'application/pdf' });
      const invalidGif = new File([''], 'anim.gif', { type: 'image/gif' });

      expect(validateImageFile(validJpg).valid).toBe(true);
      expect(validateImageFile(validPng).valid).toBe(true);
      expect(validateImageFile(validWebp).valid).toBe(true);
      expect(validateImageFile(invalidPdf).valid).toBe(false);
      expect(validateImageFile(invalidPdf).error).toContain('não suportado');
      expect(validateImageFile(invalidGif).valid).toBe(false);
    });

    it('deve retornar dados do convite oficial inaugural com signatários e local configurados', async () => {
      const { getEventInvitationBySlug } = await import('../src/services/eventService');
      const event = await getEventInvitationBySlug('arena-inaugural');

      expect(event.slug).toBe('arena-inaugural');
      expect(event.location_name).toBe('Espaço M-thor');
      expect(event.signatories).toContain('Antônio Carlos');
      expect(event.signatories).toContain('Jardel Franklin');
      expect(event.signatories).toContain('Samuel Araújo');
      expect(event.signatories).toContain('Gabriel Brandão');
      expect(event.invitation_text).toContain('campeonato amador de boxe U.C.U');
    });

    it('deve REJEITAR submissão de inscrição sem foto de rosto', async () => {
      const { submitAthleteRegistration } = await import('../src/services/registrationService');
      const { DEFAULT_INAUGURAL_EVENT } = await import('../src/services/eventService');

      const res = await submitAthleteRegistration({
        event: DEFAULT_INAUGURAL_EVENT,
        fullName: 'Carlos Teste',
        nickname: 'Caveira_01',
        password: 'senhaSegura123',
        recoveryEmail: 'carlos@teste.com',
        phone: '(11) 99999-9999',
        birthDate: '2000-01-01',
        declaredWeight: '68.50',
        avatarFile: null, // Sem foto!
        imageConsent: true,
        termsConsent: true,
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('foto de rosto do lutador é obrigatória');
    });

    it('deve REJEITAR inscrição se o evento exigir código exclusivo e o código for incorreto', async () => {
      const { submitAthleteRegistration } = await import('../src/services/registrationService');
      const { DEFAULT_INAUGURAL_EVENT } = await import('../src/services/eventService');

      const fakePhoto = new File(['fake-content'], 'avatar.webp', { type: 'image/webp' });

      const restrictedEvent = {
        ...DEFAULT_INAUGURAL_EVENT,
        requires_invite: true,
        access_code: 'UCU-VIP-2026',
      };

      const res = await submitAthleteRegistration({
        event: restrictedEvent,
        fullName: 'Marcos Silva',
        nickname: 'Tornado',
        password: 'senhaSegura123',
        recoveryEmail: 'marcos@teste.com',
        phone: '(11) 98888-8888',
        birthDate: '1998-05-12',
        declaredWeight: '75.00',
        avatarFile: fakePhoto,
        inviteCode: 'CODIGO-ERRADO',
        imageConsent: true,
        termsConsent: true,
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('código de convite exclusivo válido');
    });
  });

  // ============================================================================
  // 6. PORTAL PRIVADO DO ATLETA, ESTATÍSTICAS E MULTI-EVENTO (FASE 04)
  // ============================================================================
  describe('Portal Privado do Atleta, Estatísticas e Multi-Evento (Fase 04)', () => {
    it('deve calcular rigorosamente estatísticas de carreira a partir de lutas oficiais finalizadas', async () => {
      const { calculateCareerStats } = await import('../src/services/athleteService');

      const profileId = 'prof-demolidor-1';
      const myRegId = 'reg-demolidor-1';
      const opp1RegId = 'reg-opp-1';
      const opp2RegId = 'reg-opp-2';

      const mockMatches: any[] = [
        // Luta 1: Vitória por KO
        {
          id: 'm1',
          status: 'completed',
          fighter1_registration_id: myRegId,
          fighter2_registration_id: opp1RegId,
          fighter1: { profile_id: profileId },
          fighter2: { profile_id: 'prof-opp-1' },
          winner_registration_id: myRegId,
          victory_method: 'KO',
        },
        // Luta 2: Vitória por Pontos (Decisão)
        {
          id: 'm2',
          status: 'completed',
          fighter1_registration_id: opp2RegId,
          fighter2_registration_id: myRegId,
          fighter1: { profile_id: 'prof-opp-2' },
          fighter2: { profile_id: profileId },
          winner_registration_id: myRegId,
          victory_method: 'POINTS',
        },
        // Luta 3: Empate Oficial (DRAW)
        {
          id: 'm3',
          status: 'completed',
          fighter1_registration_id: myRegId,
          fighter2_registration_id: opp1RegId,
          fighter1: { profile_id: profileId },
          fighter2: { profile_id: 'prof-opp-1' },
          winner_registration_id: null,
          victory_method: 'DRAW',
        },
        // Luta 4: Derrota
        {
          id: 'm4',
          status: 'completed',
          fighter1_registration_id: opp1RegId,
          fighter2_registration_id: myRegId,
          fighter1: { profile_id: 'prof-opp-1' },
          fighter2: { profile_id: profileId },
          winner_registration_id: opp1RegId,
          victory_method: 'TKO',
        },
        // Luta 5: Agendada (NÃO FINALIZADA - DEVE SER IGNORADA NAS ESTATÍSTICAS)
        {
          id: 'm5',
          status: 'scheduled',
          fighter1_registration_id: myRegId,
          fighter2_registration_id: opp2RegId,
          fighter1: { profile_id: profileId },
          fighter2: { profile_id: 'prof-opp-2' },
        },
      ];

      const stats = calculateCareerStats(profileId, mockMatches);

      expect(stats.totalFights).toBe(4);
      expect(stats.victories).toBe(2);
      expect(stats.defeats).toBe(1);
      expect(stats.draws).toBe(1);
      expect(stats.knockouts).toBe(1);
      expect(stats.decisionWins).toBe(1);
      // Aproveitamento: 2 vitórias em 4 lutas finalizadas = 50%
      expect(stats.winRate).toBe(50);
    });

    it('deve retornar zero e sem divisão por zero para atleta sem lutas finalizadas', async () => {
      const { calculateCareerStats } = await import('../src/services/athleteService');
      const stats = calculateCareerStats('prof-sem-lutas', []);

      expect(stats.totalFights).toBe(0);
      expect(stats.victories).toBe(0);
      expect(stats.defeats).toBe(0);
      expect(stats.draws).toBe(0);
      expect(stats.winRate).toBe(0);
    });

    it('deve isolar estritamente dados ao alternar entre múltiplos eventos', async () => {
      const { getAthleteDashboardData, SECOND_TEST_EVENT } = await import(
        '../src/services/athleteService'
      );
      const { DEFAULT_INAUGURAL_EVENT } = await import('../src/services/eventService');

      // 1. Carrega dados do evento inaugural
      const inauguralDashboard = await getAthleteDashboardData('user-demo', DEFAULT_INAUGURAL_EVENT.slug);
      expect(inauguralDashboard.selectedEvent.slug).toBe('arena-inaugural');
      expect(inauguralDashboard.eventMatches.length).toBeGreaterThan(0);
      expect(inauguralDashboard.nextMatch).not.toBeNull();

      // 2. Carrega dados do evento secundário (Desafio de Inverno)
      const secondDashboard = await getAthleteDashboardData('user-demo', SECOND_TEST_EVENT.slug);
      expect(secondDashboard.selectedEvent.slug).toBe('arena-desafio-inverno');
      // No segundo evento ainda não há lutas casadas:
      expect(secondDashboard.eventMatches.length).toBe(0);
      expect(secondDashboard.nextMatch).toBeNull();
    });

    it('deve garantir que o participante tenha acesso à lista de todos os eventos em que está inscrito', async () => {
      const { getAthleteDashboardData } = await import('../src/services/athleteService');
      const dashboard = await getAthleteDashboardData('user-demo', 'arena-inaugural');

      expect(dashboard.enrolledEvents.length).toBeGreaterThanOrEqual(2);
      const slugs = dashboard.enrolledEvents.map((e) => e.slug);
      expect(slugs).toContain('arena-inaugural');
      expect(slugs).toContain('arena-desafio-inverno');
    });

    it('deve manter peso declarado e peso verificado como grandezas separadas sem confusão', async () => {
      const { getAthleteDashboardData } = await import('../src/services/athleteService');
      const dashboard = await getAthleteDashboardData('user-demo', 'arena-inaugural');

      const reg = dashboard.currentRegistration;
      expect(reg.declared_weight).toBeDefined();
      expect(reg.verified_weight).toBeDefined();
      // Devem ser independentes:
      expect(typeof reg.declared_weight).toBe('number');
      expect(typeof reg.verified_weight).toBe('number');
      expect(reg.declared_weight).not.toBe(reg.verified_weight);
    });
  });

  // ============================================================================
  // 7. CENTRO DE COMANDO ADMINISTRATIVO, MODERAÇÃO E SÚMULAS (FASE 05)
  // ============================================================================
  describe('Centro de Comando Administrativo e Gestão Esportiva (Fase 05)', () => {
    it('deve aprovar participante e registrar ação na trilha de auditoria', async () => {
      const {
        approveAthleteRegistration,
        adminStore,
      } = await import('../src/services/adminService');

      const targetId = 'reg-pending-03';
      const res = await approveAthleteRegistration(targetId, 'SuperAdmin');

      expect(res.success).toBe(true);
      const reg = adminStore.registrations.find((r) => r.id === targetId);
      expect(reg?.status).toBe('approved');

      // Verifica auditoria
      const audit = adminStore.auditLogs.find(
        (l) => l.target_id === targetId && l.action === 'ATHLETE_APPROVED'
      );
      expect(audit).toBeDefined();
      expect(audit?.admin_nickname).toBe('SuperAdmin');
    });

    it('deve EXIGIR motivo obrigatório ao recusar participante e registrar na auditoria', async () => {
      const { rejectAthleteRegistration } = await import('../src/services/adminService');

      // Tentativa sem motivo
      const resNoReason = await rejectAthleteRegistration('reg-pending-04', '', 'SuperAdmin');
      expect(resNoReason.success).toBe(false);
      expect(resNoReason.error).toContain('motivo da recusa');

      // Com motivo válido
      const resValid = await rejectAthleteRegistration(
        'reg-pending-04',
        'Foto ilegível e dados inconsistentes',
        'SuperAdmin'
      );
      expect(resValid.success).toBe(true);
    });

    it('deve registrar pesagem oficial e alertar sobre reenquadramento de categoria', async () => {
      const { recordOfficialWeighIn, adminStore } = await import('../src/services/adminService');

      // Atleta inscrito no Peso Meio-Médio (60.01 a 70.00 kg) pesando 74.50 kg (Peso Médio)
      const res = await recordOfficialWeighIn('reg-demo-01', 74.5, 'Juiz Oficial');

      expect(res.success).toBe(true);
      expect(res.reallocatedCategory).toBeDefined();
      expect(res.reallocatedCategory).toContain('Peso Médio');

      const reg = adminStore.registrations.find((r) => r.id === 'reg-demo-01');
      expect(reg?.verified_weight).toBe(74.5);
    });

    it('deve REJEITAR pesagem oficial fora dos limites esportivos globais (< 50 kg ou > 90 kg)', async () => {
      const { recordOfficialWeighIn } = await import('../src/services/adminService');

      const resBelow = await recordOfficialWeighIn('reg-demo-01', 48.0, 'Juiz Oficial');
      expect(resBelow.success).toBe(false);
      expect(resBelow.error).toContain('abaixo do limite mínimo');

      const resAbove = await recordOfficialWeighIn('reg-demo-01', 95.0, 'Juiz Oficial');
      expect(resAbove.success).toBe(false);
      expect(resAbove.error).toContain('acima do limite máximo');
    });

    it('deve bloquear criação de confronto entre atleta contra si mesmo ou não aprovado', async () => {
      const { createOrUpdateMatch } = await import('../src/services/adminService');
      const { DEFAULT_INAUGURAL_EVENT } = await import('../src/services/eventService');

      // Mesma pessoa
      const resSelf = await createOrUpdateMatch(
        {
          eventId: DEFAULT_INAUGURAL_EVENT.id,
          fighter1RegistrationId: 'reg-demo-01',
          fighter2RegistrationId: 'reg-demo-01',
          weightCategoryId: 'cat-meio-medio',
          matchOrder: 5,
          roundName: 'Luta Teste',
        },
        'Admin'
      );
      expect(resSelf.success).toBe(false);
      expect(resSelf.error).toContain('não pode ser casado contra si mesmo');

      // Atleta não aprovado / recusado
      const resNotApproved = await createOrUpdateMatch(
        {
          eventId: DEFAULT_INAUGURAL_EVENT.id,
          fighter1RegistrationId: 'reg-demo-01',
          fighter2RegistrationId: 'reg-pending-04', // Foi recusado no teste anterior
          weightCategoryId: 'cat-meio-medio',
          matchOrder: 5,
          roundName: 'Luta Teste',
        },
        'Admin'
      );
      expect(resNotApproved.success).toBe(false);
      expect(resNotApproved.error).toContain('APROVADA');
    });

    it('deve registrar resultado oficial e rejeitar vencedor que não participou da luta', async () => {
      const { recordOfficialMatchResult } = await import('../src/services/adminService');

      // Vencedor invasor
      const resIntruder = await recordOfficialMatchResult(
        'match-01',
        {
          winnerRegistrationId: 'reg-desconhecido-999',
          victoryMethod: 'KO',
        },
        'Arbitragem'
      );
      expect(resIntruder.success).toBe(false);
      expect(resIntruder.error).toContain('obrigatoriamente um dos participantes');

      // Vencedor legítimo
      const resValid = await recordOfficialMatchResult(
        'match-01',
        {
          winnerRegistrationId: 'reg-demo-01',
          victoryMethod: 'TKO',
          scoreDetails: 'Nocaute técnico no 2º round aos 1:30',
        },
        'Arbitragem'
      );
      expect(resValid.success).toBe(true);
    });

    it('deve gerar exportação CSV de participantes e pacote de backup JSON versionado', async () => {
      const { exportEventParticipantsCsv, exportEventJsonBackup } = await import(
        '../src/services/adminService'
      );
      const { DEFAULT_INAUGURAL_EVENT } = await import('../src/services/eventService');

      // CSV
      const csv = exportEventParticipantsCsv(DEFAULT_INAUGURAL_EVENT.id);
      expect(csv).toContain('Nome Completo');
      expect(csv).toContain('Apelido de Combate');
      expect(csv).toContain('Demolidor');

      // Backup JSON
      const jsonBackup = exportEventJsonBackup(DEFAULT_INAUGURAL_EVENT.id);
      const parsed = JSON.parse(jsonBackup);
      expect(parsed.schemaVersion).toBe('1.0.0');
      expect(parsed.checksum).toBeDefined();
      expect(parsed.data.registrations.length).toBeGreaterThan(0);
      expect(parsed.data.matches.length).toBeGreaterThan(0);
    });

    it('deve executar análise de impacto pré-salvamento de categorias de peso', async () => {
      const { getCategoryChangeImpact } = await import('../src/services/adminService');
      const { DEFAULT_INAUGURAL_EVENT } = await import('../src/services/eventService');

      // Categorias com sobreposição
      const impactOverlap = getCategoryChangeImpact(DEFAULT_INAUGURAL_EVENT.id, [
        { name: 'Cat 1', minWeight: 50.0, maxWeight: 65.0 },
        { name: 'Cat 2', minWeight: 60.0, maxWeight: 75.0 }, // 60 a 65 sobrepõe
      ]);
      expect(impactOverlap.hasOverlap).toBe(true);
      expect(impactOverlap.warnings.length).toBeGreaterThan(0);
    });

    it('deve proteger exclusão definitiva exigindo o título exato do evento', async () => {
      const { deleteEventSafely, adminStore } = await import('../src/services/adminService');

      const targetEvent = adminStore.events[0];

      // Tentativa com confirmação errada
      const resWrong = await deleteEventSafely(targetEvent.id, 'TITULO ERRADO', 'Admin');
      expect(resWrong.success).toBe(false);
      expect(resWrong.error).toContain('confirmação explícita do título');
    });
  });

  // ============================================================================
  // FASE 06 — CERTIFICAÇÃO, SEGURANÇA E DEPLOY: TESTES ESTRUTURADOS
  // ============================================================================

  describe('Fase 06 — Validação Completa dos 10 Casos Limite de Pesagem e Categorias', () => {
    it('deve validar rigorosamente os 10 casos de limite estipulados na Seção 2', () => {
      // 1. 49,99 kg: rejeitado
      const case1 = validateAthleteWeight(49.99);
      expect(case1.valid).toBe(false);
      expect(case1.error).toContain('abaixo do limite mínimo');

      // 2. 50,00 kg: primeira categoria (Peso Leve)
      const case2 = validateAthleteWeight(50.0);
      expect(case2.valid).toBe(true);
      expect(findWeightCategoryForWeight(case2.parsedWeight!)?.name).toBe('Peso Leve (50 a 60 kg)');

      // 3. 60,00 kg: primeira categoria (Peso Leve)
      const case3 = validateAthleteWeight(60.0);
      expect(case3.valid).toBe(true);
      expect(findWeightCategoryForWeight(case3.parsedWeight!)?.name).toBe('Peso Leve (50 a 60 kg)');

      // 4. 60,01 kg: segunda categoria (Peso Meio-Médio)
      const case4 = validateAthleteWeight(60.01);
      expect(case4.valid).toBe(true);
      expect(findWeightCategoryForWeight(case4.parsedWeight!)?.name).toBe('Peso Meio-Médio (Mais de 60 até 70 kg)');

      // 5. 70,00 kg: segunda categoria (Peso Meio-Médio)
      const case5 = validateAthleteWeight(70.0);
      expect(case5.valid).toBe(true);
      expect(findWeightCategoryForWeight(case5.parsedWeight!)?.name).toBe('Peso Meio-Médio (Mais de 60 até 70 kg)');

      // 6. 70,01 kg: terceira categoria (Peso Médio)
      const case6 = validateAthleteWeight(70.01);
      expect(case6.valid).toBe(true);
      expect(findWeightCategoryForWeight(case6.parsedWeight!)?.name).toBe('Peso Médio (Mais de 70 até 80 kg)');

      // 7. 80,00 kg: terceira categoria (Peso Médio)
      const case7 = validateAthleteWeight(80.0);
      expect(case7.valid).toBe(true);
      expect(findWeightCategoryForWeight(case7.parsedWeight!)?.name).toBe('Peso Médio (Mais de 70 até 80 kg)');

      // 8. 80,01 kg: quarta categoria (Peso Pesado)
      const case8 = validateAthleteWeight(80.01);
      expect(case8.valid).toBe(true);
      expect(findWeightCategoryForWeight(case8.parsedWeight!)?.name).toBe('Peso Pesado (Mais de 80 até 90 kg)');

      // 9. 90,00 kg: quarta categoria (Peso Pesado)
      const case9 = validateAthleteWeight(90.0);
      expect(case9.valid).toBe(true);
      expect(findWeightCategoryForWeight(case9.parsedWeight!)?.name).toBe('Peso Pesado (Mais de 80 até 90 kg)');

      // 10. 90,01 kg: rejeitado
      const case10 = validateAthleteWeight(90.01);
      expect(case10.valid).toBe(false);
      expect(case10.error).toContain('acima do limite máximo');
    });

    it('deve interpretar e normalizar entradas com vírgula para todas as 10 fronteiras', () => {
      expect(validateAthleteWeight('49,99').valid).toBe(false);
      expect(validateAthleteWeight('50,00').valid).toBe(true);
      expect(validateAthleteWeight('60,00').valid).toBe(true);
      expect(validateAthleteWeight('60,01').valid).toBe(true);
      expect(validateAthleteWeight('70,00').valid).toBe(true);
      expect(validateAthleteWeight('70,01').valid).toBe(true);
      expect(validateAthleteWeight('80,00').valid).toBe(true);
      expect(validateAthleteWeight('80,01').valid).toBe(true);
      expect(validateAthleteWeight('90,00').valid).toBe(true);
      expect(validateAthleteWeight('90,01').valid).toBe(false);
    });

    it('deve rejeitar casamentos entre lutadores de eventos distintos', () => {
      const result = validateMatchIntegrity({
        matchEventId: 'event-01',
        fighter1: { registrationId: 'reg-01', eventId: 'event-01', status: 'approved' },
        fighter2: { registrationId: 'reg-02', eventId: 'event-outro-evento', status: 'approved' },
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('mesmo evento');
    });
  });

  describe('Fase 06 — Matriz de Segurança e Perfis de Acesso (5 Perfis)', () => {
    it('Perfil 1 (Anônimo): visualização pública é estritamente sanitizada sem dados sensíveis', () => {
      const rawProfile = {
        id: 'prof-secret-123',
        nickname: 'Lobo Solitário',
        avatar_url: 'https://example.com/avatar.webp',
        recovery_email: 'privado@gmail.com',
        phone: '(11) 98765-4321',
        guardian_name: 'Pai do Atleta',
        guardian_document: '12.345.678-0',
        guardian_phone: '(11) 99999-0000',
        birth_date: '2008-05-10',
      };

      const sanitized = sanitizePublicAthleteProfile(rawProfile);
      expect(sanitized.id).toBe('prof-secret-123');
      expect(sanitized.nickname).toBe('Lobo Solitário');
      expect(sanitized.avatar_url).toBe('https://example.com/avatar.webp');

      // Campos confidenciais jamais vazam
      expect((sanitized as Record<string, unknown>).recovery_email).toBeUndefined();
      expect((sanitized as Record<string, unknown>).phone).toBeUndefined();
      expect((sanitized as Record<string, unknown>).guardian_name).toBeUndefined();
      expect((sanitized as Record<string, unknown>).guardian_document).toBeUndefined();
      expect((sanitized as Record<string, unknown>).guardian_phone).toBeUndefined();
    });

    it('Perfil 2 (Atleta Pendente): bloqueado de entrar no ringue até aprovação oficial', () => {
      const checkPending = validateMatchIntegrity({
        matchEventId: 'event-01',
        fighter1: { registrationId: 'reg-approved-01', eventId: 'event-01', status: 'approved' },
        fighter2: { registrationId: 'reg-pending-02', eventId: 'event-01', status: 'pending' },
      });
      expect(checkPending.valid).toBe(false);
      expect(checkPending.error).toContain('APROVADA');
    });

    it('Perfil 3 (Atleta Aprovado): elegível para casamentos de combate no mesmo evento', () => {
      const checkApproved = validateMatchIntegrity({
        matchEventId: 'event-01',
        fighter1: { registrationId: 'reg-approved-01', eventId: 'event-01', status: 'approved' },
        fighter2: { registrationId: 'reg-approved-02', eventId: 'event-01', status: 'approved' },
      });
      expect(checkApproved.valid).toBe(true);
    });

    it('Perfil 4 (Atleta de Outro Evento): bloqueado de participar em outro evento', () => {
      const checkOtherEvent = validateMatchIntegrity({
        matchEventId: 'event-01',
        fighter1: { registrationId: 'reg-approved-01', eventId: 'event-01', status: 'approved' },
        fighter2: { registrationId: 'reg-approved-02', eventId: 'event-02', status: 'approved' },
      });
      expect(checkOtherEvent.valid).toBe(false);
      expect(checkOtherEvent.error).toContain('mesmo evento');
    });

    it('Perfil 5 (Administrador Principal): executa operações com trilha de auditoria imutável', async () => {
      const { approveAthleteRegistration, adminStore } = await import('../src/services/adminService');

      const initialLogCount = adminStore.auditLogs.length;
      const res = await approveAthleteRegistration('reg-demo-01', 'Admin Master');
      expect(res.success).toBe(true);

      expect(adminStore.auditLogs.length).toBeGreaterThan(initialLogCount);
      const latestLog = adminStore.auditLogs[0];
      expect(latestLog.admin_nickname).toBe('Admin Master');
      expect(latestLog.action).toBe('ATHLETE_APPROVED');
    });
  });

  describe('Fase 06 — Gestão de Mídias e Comunicados Oficiais', () => {
    it('deve salvar e fixar comunicados oficiais do evento', async () => {
      const { saveAnnouncement, adminStore } = await import('../src/services/adminService');
      const { DEFAULT_INAUGURAL_EVENT } = await import('../src/services/eventService');

      const res = await saveAnnouncement(
        {
          eventId: DEFAULT_INAUGURAL_EVENT.id,
          title: 'Aviso Importante: Pesagem Antecipada',
          content: 'A pesagem terá início pontualmente às 17:00.',
          isPinned: true,
        },
        'Admin Master'
      );
      expect(res.success).toBe(true);

      const saved = adminStore.announcements.find((a) => a.title.includes('Pesagem Antecipada'));
      expect(saved).toBeDefined();
      expect(saved?.is_pinned).toBe(true);
    });

    it('deve excluir comunicados oficiais com registro em log', async () => {
      const { deleteAnnouncement, adminStore } = await import('../src/services/adminService');

      const annToDelete = adminStore.announcements[0];
      if (annToDelete) {
        const res = await deleteAnnouncement(annToDelete.id, 'Admin Master');
        expect(res.success).toBe(true);
        expect(adminStore.announcements.find((a) => a.id === annToDelete.id)).toBeUndefined();
      }
    });

    it('deve salvar mídia pública e privada e suportar exclusão segura', async () => {
      const { saveMediaItem, deleteMediaItem, adminStore } = await import('../src/services/adminService');
      const { DEFAULT_INAUGURAL_EVENT } = await import('../src/services/eventService');

      // Mídia pública
      const resPub = await saveMediaItem(
        {
          eventId: DEFAULT_INAUGURAL_EVENT.id,
          title: 'Melhores Momentos - Luta Principal',
          url: 'https://youtube.com/watch?v=demo123',
          mediaType: 'video',
          isPublic: true,
        },
        'Admin Master'
      );
      expect(resPub.success).toBe(true);

      // Mídia privada (exclusiva de arbitragem)
      const resPriv = await saveMediaItem(
        {
          eventId: DEFAULT_INAUGURAL_EVENT.id,
          title: 'Gravação Oficial para Análise de Recursos',
          url: 'https://internal-storage.ucu/video-raw.mp4',
          mediaType: 'video',
          isPublic: false,
        },
        'Admin Master'
      );
      expect(resPriv.success).toBe(true);

      // Excluir mídia
      const mediaItem = adminStore.mediaItems[0];
      const resDel = await deleteMediaItem(mediaItem.id, 'Admin Master');
      expect(resDel.success).toBe(true);
      expect(adminStore.mediaItems.find((m) => m.id === mediaItem.id)).toBeUndefined();
    });
  });

  describe('Fase 06 — Upload Seguro e Sanitização de Entradas', () => {
    it('deve validar tipos MIME de imagem e rejeitar extensões perigosas (prevenção XSS)', async () => {
      const { validateImageFile } = await import('../src/utils/imageCompressor');

      // Tipos válidos
      const validJpg = new File(['content'], 'avatar.jpg', { type: 'image/jpeg' });
      expect(validateImageFile(validJpg).valid).toBe(true);

      const validPng = new File(['content'], 'avatar.png', { type: 'image/png' });
      expect(validateImageFile(validPng).valid).toBe(true);

      const validWebp = new File(['content'], 'avatar.webp', { type: 'image/webp' });
      expect(validateImageFile(validWebp).valid).toBe(true);

      // Tipos maliciosos / não suportados
      const dangerousSvg = new File(['<svg onload="alert(1)"/>'], 'exploit.svg', { type: 'image/svg+xml' });
      expect(validateImageFile(dangerousSvg).valid).toBe(false);
      expect(validateImageFile(dangerousSvg).error).toContain('não suportado');

      const dangerousExe = new File(['MZ binary'], 'malware.exe', { type: 'application/x-msdownload' });
      expect(validateImageFile(dangerousExe).valid).toBe(false);

      const dangerousScript = new File(['alert(1)'], 'script.js', { type: 'text/javascript' });
      expect(validateImageFile(dangerousScript).valid).toBe(false);
    });

    it('deve normalizar e sanitizar apelidos contra espaços e formatação inconsistente', () => {
      expect(normalizeNickname('  Guerreiro_SP  ')).toBe('guerreiro_sp');
      expect(normalizeNickname('DEMOLIDOR')).toBe('demolidor');
      expect(normalizeNickname('  Falcão Negro  ')).toBe('falcão negro');
    });
  });
});


