import React, { useState, useMemo } from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Avatar } from '../common/Avatar';
import { Modal } from '../common/Modal';
import { useToast } from '../../contexts/ToastContext';
import { MatchFight, EventRegistration, VictoryMethod } from '../../types/app.types';
import { createOrUpdateMatch, recordOfficialMatchResult } from '../../services/adminService';
import { validateLiveMatchTransition } from '../../services/bracketEngine';
import {
  Play,
  Trophy,
  Clock,
  Radio,
  AlertTriangle,
  Video,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// ==============================================================================
// CONTROLE AO VIVO DE COMBATES — PAINEL DO DIA DO EVENTO
// ==============================================================================

export interface AdminLiveControlProps {
  eventId: string;
  matches: MatchFight[];
  registrations: EventRegistration[];
  onRefreshData: () => void;
}

export const AdminLiveControl: React.FC<AdminLiveControlProps> = ({
  eventId: _eventId,
  matches,
  registrations: _registrations,
  onRefreshData,
}) => {
  const { showToast } = useToast();
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchFight | null>(null);
  const [expandedSection, setExpandedSection] = useState<'live' | 'next' | 'completed' | null>('live');

  // Agrupa por status
  const liveMatches = useMemo(() => matches.filter((m) => m.status === 'in_progress'), [matches]);
  const nextMatches = useMemo(() => matches.filter((m) => m.status === 'scheduled').sort((a, b) => a.match_order - b.match_order), [matches]);
  const completedMatches = useMemo(() => matches.filter((m) => m.status === 'completed').sort((a, b) => b.match_order - a.match_order), [matches]);
  const cancelledMatches = useMemo(() => matches.filter((m) => m.status === 'cancelled'), [matches]);

  // ==============================================================================
  // TRANSIÇÃO: INICIAR COMBATE (scheduled → in_progress)
  // ==============================================================================

  const handleStartFight = async (match: MatchFight) => {
    const transition = validateLiveMatchTransition(match.status, 'START_FIGHT');
    if (!transition.success) {
      showToast(transition.error || 'Transição inválida.', 'error');
      return;
    }

    const res = await createOrUpdateMatch(
      {
        id: match.id,
        eventId: match.event_id,
        fighter1RegistrationId: match.fighter1_registration_id,
        fighter2RegistrationId: match.fighter2_registration_id,
        weightCategoryId: match.weight_category_id,
        matchOrder: match.match_order,
        roundName: match.round_name,
        scheduledTime: match.scheduled_time || undefined,
        status: 'in_progress',
      },
      'Admin Principal'
    );

    if (res.success) {
      showToast(`🥊 Luta #${match.match_order} INICIADA! Combate ao vivo!`, 'success', 3000);
      onRefreshData();
    } else {
      showToast(res.error || 'Erro ao iniciar combate.', 'error');
    }
  };

  // ==============================================================================
  // TRANSIÇÃO: ABRIR MODAL DE RESULTADO (in_progress → completed)
  // ==============================================================================

  const handleOpenResult = (match: MatchFight) => {
    setSelectedMatch(match);
    setIsResultModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Radio size={18} color="var(--color-red-primary)" className="animate-live-pulse" />
          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800 }}>
            Controle Ao Vivo
          </h3>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {liveMatches.length > 0 && (
            <Badge variant="live" pulse>
              {liveMatches.length} AO VIVO
            </Badge>
          )}
          {cancelledMatches.length > 0 && (
            <Badge variant="neutral" size="sm">
              {cancelledMatches.length} cancelada(s)
            </Badge>
          )}
          <Badge variant="gold" size="sm">
            {completedMatches.length}/{matches.length} concluídas
          </Badge>
        </div>
      </div>

      {/* Alertas de Atenção */}
      {liveMatches.length > 1 && (
        <div
          style={{
            padding: 'var(--space-2) var(--space-3)',
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-xs)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <AlertTriangle size={14} color="var(--color-status-pending)" />
          <span style={{ color: 'var(--color-gold-light)' }}>
            Atenção: {liveMatches.length} lutas simultâneas ao vivo. Registre os resultados para manter a integridade.
          </span>
        </div>
      )}

      {/* ============================================ */}
      {/* SEÇÃO: LUTAS AO VIVO (IN_PROGRESS) */}
      {/* ============================================ */}
      <CollapsibleSection
        title="🔴 No Ringue — Ao Vivo"
        count={liveMatches.length}
        isExpanded={expandedSection === 'live'}
        onToggle={() => setExpandedSection(expandedSection === 'live' ? null : 'live')}
        accentColor="var(--color-red-primary)"
      >
        {liveMatches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-4) 0', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
            Nenhuma luta em andamento no momento.
          </div>
        ) : (
          liveMatches.map((m) => (
            <LiveMatchCard
              key={m.id}
              match={m}
              variant="live"
              onFinish={handleOpenResult}
            />
          ))
        )}
      </CollapsibleSection>

      {/* ============================================ */}
      {/* SEÇÃO: PRÓXIMAS LUTAS (SCHEDULED) */}
      {/* ============================================ */}
      <CollapsibleSection
        title="⏱️ Próximas Lutas"
        count={nextMatches.length}
        isExpanded={expandedSection === 'next'}
        onToggle={() => setExpandedSection(expandedSection === 'next' ? null : 'next')}
        accentColor="var(--color-gold-primary)"
      >
        {nextMatches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-4) 0', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
            Todas as lutas já foram iniciadas ou concluídas.
          </div>
        ) : (
          nextMatches.map((m) => (
            <LiveMatchCard
              key={m.id}
              match={m}
              variant="next"
              onStart={handleStartFight}
            />
          ))
        )}
      </CollapsibleSection>

      {/* ============================================ */}
      {/* SEÇÃO: LUTAS CONCLUÍDAS (COMPLETED) */}
      {/* ============================================ */}
      <CollapsibleSection
        title="✅ Resultados Oficiais"
        count={completedMatches.length}
        isExpanded={expandedSection === 'completed'}
        onToggle={() => setExpandedSection(expandedSection === 'completed' ? null : 'completed')}
        accentColor="var(--color-status-approved)"
      >
        {completedMatches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-4) 0', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
            Nenhuma luta concluída até o momento.
          </div>
        ) : (
          completedMatches.map((m) => (
            <LiveMatchCard key={m.id} match={m} variant="completed" />
          ))
        )}
      </CollapsibleSection>

      {/* Modal de Resultado Rápido */}
      {isResultModalOpen && selectedMatch && (
        <LiveResultModal
          match={selectedMatch}
          onClose={() => {
            setIsResultModalOpen(false);
            setSelectedMatch(null);
          }}
          onSuccess={() => {
            setIsResultModalOpen(false);
            setSelectedMatch(null);
            onRefreshData();
          }}
        />
      )}
    </div>
  );
};

// ==============================================================================
// SEÇÃO COLAPSÁVEL
// ==============================================================================

interface CollapsibleSectionProps {
  title: string;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
  accentColor: string;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  count,
  isExpanded,
  onToggle,
  accentColor,
  children,
}) => (
  <div
    style={{
      borderRadius: 'var(--radius-md)',
      border: `1px solid ${isExpanded ? accentColor + '33' : 'var(--color-border-subtle)'}`,
      overflow: 'hidden',
      transition: 'border-color 0.3s ease',
    }}
  >
    <button
      onClick={onToggle}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--space-3) var(--space-4)',
        backgroundColor: isExpanded ? `${accentColor}0A` : 'transparent',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'background-color 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 800, color: 'var(--color-text-primary)' }}>
          {title}
        </span>
        <Badge variant="neutral" size="sm">{count}</Badge>
      </div>
      {isExpanded ? (
        <ChevronUp size={16} color="var(--color-text-muted)" />
      ) : (
        <ChevronDown size={16} color="var(--color-text-muted)" />
      )}
    </button>

    {isExpanded && (
      <div style={{ padding: 'var(--space-3) var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {children}
      </div>
    )}
  </div>
);

// ==============================================================================
// CARD DE LUTA AO VIVO
// ==============================================================================

interface LiveMatchCardProps {
  match: MatchFight;
  variant: 'live' | 'next' | 'completed';
  onStart?: (match: MatchFight) => void;
  onFinish?: (match: MatchFight) => void;
}

const LiveMatchCard: React.FC<LiveMatchCardProps> = ({
  match,
  variant,
  onStart,
  onFinish,
}) => {
  const isLive = variant === 'live';
  const isCompleted = variant === 'completed';
  const isWinner1 = match.winner_registration_id === match.fighter1_registration_id;
  const isWinner2 = match.winner_registration_id === match.fighter2_registration_id;

  return (
    <Card>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 800, color: 'var(--color-gold-light)' }}>
              Luta #{match.match_order} • {match.round_name}
            </span>
            {match.scheduled_time && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                <Clock size={10} /> {match.scheduled_time}
              </span>
            )}
          </div>
          <Badge
            variant={isLive ? 'live' : isCompleted ? 'approved' : 'pending'}
            pulse={isLive}
            size="sm"
          >
            {isLive ? 'AO VIVO' : isCompleted ? 'CONCLUÍDA' : 'AGENDADA'}
          </Badge>
        </div>

        {/* Duelo Face-to-Face Compacto */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            gap: '8px',
            padding: 'var(--space-2) 0',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            borderBottom: isLive ? '1px solid rgba(229, 25, 40, 0.2)' : '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {/* Fighter 1 */}
          <div style={{ textAlign: 'center' }}>
            <Avatar
              src={match.fighter1?.profile?.avatar_url}
              alt={match.fighter1?.profile?.nickname || 'F1'}
              size="sm"
              borderRing="red"
            />
            <div style={{
              fontSize: 'var(--font-size-xs)',
              fontWeight: 700,
              marginTop: '2px',
              color: isWinner1 ? 'var(--color-gold-primary)' : 'var(--color-text-primary)',
            }}>
              {match.fighter1?.profile?.nickname || 'Lutador 1'}
            </div>
            {isWinner1 && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: 'var(--color-gold-primary)', fontSize: '0.6rem', fontWeight: 800 }}>
                <Trophy size={10} /> VENCEDOR
              </div>
            )}
          </div>

          {/* VS Animado */}
          <div style={{
            fontWeight: 900,
            fontSize: isLive ? 'var(--font-size-md)' : 'var(--font-size-xs)',
            color: isLive ? 'var(--color-red-primary)' : 'var(--color-text-muted)',
            textAlign: 'center',
          }}>
            {isLive ? (
              <span className="animate-live-pulse">⚡VS⚡</span>
            ) : 'VS'}
          </div>

          {/* Fighter 2 */}
          <div style={{ textAlign: 'center' }}>
            <Avatar
              src={match.fighter2?.profile?.avatar_url}
              alt={match.fighter2?.profile?.nickname || 'F2'}
              size="sm"
              borderRing="gold"
            />
            <div style={{
              fontSize: 'var(--font-size-xs)',
              fontWeight: 700,
              marginTop: '2px',
              color: isWinner2 ? 'var(--color-gold-primary)' : 'var(--color-text-primary)',
            }}>
              {match.fighter2?.profile?.nickname || 'Lutador 2'}
            </div>
            {isWinner2 && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: 'var(--color-gold-primary)', fontSize: '0.6rem', fontWeight: 800 }}>
                <Trophy size={10} /> VENCEDOR
              </div>
            )}
          </div>
        </div>

        {/* Resultado (se concluído) */}
        {isCompleted && match.victory_method && (
          <div
            style={{
              padding: 'var(--space-2) var(--space-3)',
              backgroundColor: 'rgba(212, 175, 55, 0.06)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--font-size-xs)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ color: 'var(--color-gold-light)' }}>
              Resultado: <strong>{match.victory_method}</strong>
              {match.score_details && ` — ${match.score_details}`}
            </span>
            {match.video_url && (
              <button
                onClick={() => window.open(match.video_url!, '_blank')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-gold-primary)',
                  cursor: 'pointer',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  fontFamily: 'inherit',
                }}
              >
                <Video size={12} /> Vídeo
              </button>
            )}
          </div>
        )}

        {/* Ações */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
          {variant === 'next' && onStart && (
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Play size={12} />}
              onClick={() => onStart(match)}
            >
              Iniciar Combate
            </Button>
          )}
          {variant === 'live' && onFinish && (
            <Button
              variant="gold"
              size="sm"
              leftIcon={<Trophy size={12} />}
              onClick={() => onFinish(match)}
            >
              Registrar Resultado
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

// ==============================================================================
// MODAL DE RESULTADO RÁPIDO (AO VIVO)
// ==============================================================================

interface LiveResultModalProps {
  match: MatchFight;
  onClose: () => void;
  onSuccess: () => void;
}

const LiveResultModal: React.FC<LiveResultModalProps> = ({
  match,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [method, setMethod] = useState<VictoryMethod>('POINTS');
  const [scoreDetails, setScoreDetails] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const methods: { value: VictoryMethod; label: string; emoji: string }[] = [
    { value: 'KO', label: 'Nocaute (KO)', emoji: '💥' },
    { value: 'TKO', label: 'Nocaute Técnico (TKO)', emoji: '🥊' },
    { value: 'SUBMISSION', label: 'Finalização', emoji: '🔒' },
    { value: 'POINTS', label: 'Decisão por Pontos', emoji: '📊' },
    { value: 'DQ', label: 'Desqualificação', emoji: '🚫' },
    { value: 'DRAW', label: 'Empate', emoji: '🤝' },
    { value: 'NO_CONTEST', label: 'Sem Resultado', emoji: '❌' },
  ];

  const isDraw = method === 'DRAW' || method === 'NO_CONTEST';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isDraw && !winnerId) {
      showToast('Selecione o vencedor da luta.', 'warning');
      return;
    }

    setIsSubmitting(true);
    const res = await recordOfficialMatchResult(
      match.id,
      {
        winnerRegistrationId: isDraw ? null : winnerId,
        victoryMethod: method,
        scoreDetails: scoreDetails.trim() || undefined,
        videoUrl: videoUrl.trim() || undefined,
      },
      'Admin Principal'
    );
    setIsSubmitting(false);

    if (res.success) {
      showToast(`🏆 Resultado oficial registrado para Luta #${match.match_order}!`, 'success');
      onSuccess();
    } else {
      showToast(res.error || 'Erro ao registrar resultado.', 'error');
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="⚡ Resultado Oficial — Ao Vivo"
      subtitle={`Luta #${match.match_order} • ${match.round_name}`}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {/* Seleção do Método de Vitória */}
        <div>
          <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 700, marginBottom: '6px' }}>
            Método de Vitória:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
            {methods.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => {
                  setMethod(m.value);
                  if (m.value === 'DRAW' || m.value === 'NO_CONTEST') {
                    setWinnerId(null);
                  }
                }}
                style={{
                  padding: '8px 10px',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: method === m.value ? 800 : 600,
                  fontFamily: 'inherit',
                  backgroundColor: method === m.value
                    ? 'rgba(212, 175, 55, 0.15)'
                    : 'rgba(255,255,255,0.04)',
                  border: method === m.value
                    ? '1px solid rgba(212, 175, 55, 0.4)'
                    : '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: method === m.value ? 'var(--color-gold-primary)' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
              >
                {m.emoji} {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Seleção do Vencedor */}
        {!isDraw && (
          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 700, marginBottom: '6px' }}>
              Vencedor:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {/* Fighter 1 */}
              <button
                type="button"
                onClick={() => setWinnerId(match.fighter1_registration_id)}
                style={{
                  padding: 'var(--space-3)',
                  textAlign: 'center',
                  borderRadius: 'var(--radius-md)',
                  border: winnerId === match.fighter1_registration_id
                    ? '2px solid var(--color-red-primary)'
                    : '1px solid var(--color-border-subtle)',
                  backgroundColor: winnerId === match.fighter1_registration_id
                    ? 'rgba(229, 25, 40, 0.1)'
                    : 'transparent',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s ease',
                }}
              >
                <Avatar
                  src={match.fighter1?.profile?.avatar_url}
                  alt={match.fighter1?.profile?.nickname || 'F1'}
                  size="md"
                  borderRing="red"
                />
                <div style={{
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 700,
                  marginTop: '4px',
                  color: winnerId === match.fighter1_registration_id
                    ? 'var(--color-red-primary)'
                    : 'var(--color-text-primary)',
                }}>
                  {match.fighter1?.profile?.nickname || 'Lutador 1'}
                </div>
                <div style={{ fontSize: '0.6rem', color: 'var(--color-red-primary)', fontWeight: 600 }}>
                  Corner Vermelho
                </div>
              </button>

              {/* Fighter 2 */}
              <button
                type="button"
                onClick={() => setWinnerId(match.fighter2_registration_id)}
                style={{
                  padding: 'var(--space-3)',
                  textAlign: 'center',
                  borderRadius: 'var(--radius-md)',
                  border: winnerId === match.fighter2_registration_id
                    ? '2px solid var(--color-gold-primary)'
                    : '1px solid var(--color-border-subtle)',
                  backgroundColor: winnerId === match.fighter2_registration_id
                    ? 'rgba(212, 175, 55, 0.1)'
                    : 'transparent',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s ease',
                }}
              >
                <Avatar
                  src={match.fighter2?.profile?.avatar_url}
                  alt={match.fighter2?.profile?.nickname || 'F2'}
                  size="md"
                  borderRing="gold"
                />
                <div style={{
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 700,
                  marginTop: '4px',
                  color: winnerId === match.fighter2_registration_id
                    ? 'var(--color-gold-primary)'
                    : 'var(--color-text-primary)',
                }}>
                  {match.fighter2?.profile?.nickname || 'Lutador 2'}
                </div>
                <div style={{ fontSize: '0.6rem', color: 'var(--color-gold-primary)', fontWeight: 600 }}>
                  Corner Dourado
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Detalhes da Pontuação */}
        <div>
          <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 700, marginBottom: '4px', color: 'var(--color-text-secondary)' }}>
            Detalhes / Pontuação (Opcional):
          </label>
          <input
            type="text"
            value={scoreDetails}
            onChange={(e) => setScoreDetails(e.target.value)}
            placeholder="Ex: 30-27 / 29-28 / Finalização no 2º round"
            style={{
              width: '100%',
              backgroundColor: '#111116',
              color: '#ffffff',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 12px',
              fontFamily: 'inherit',
              fontSize: 'var(--font-size-sm)',
              outline: 'none',
            }}
          />
        </div>

        {/* Link de Vídeo */}
        <div>
          <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 700, marginBottom: '4px', color: 'var(--color-text-secondary)' }}>
            Link do Vídeo (Opcional):
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Video size={16} color="var(--color-text-muted)" />
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/..."
              style={{
                flex: 1,
                backgroundColor: '#111116',
                color: '#ffffff',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 12px',
                fontFamily: 'inherit',
                fontSize: 'var(--font-size-sm)',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Botões */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
          <Button variant="ghost" fullWidth type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="gold" fullWidth type="submit" isLoading={isSubmitting}>
            ⚡ Confirmar Resultado Oficial
          </Button>
        </div>
      </form>
    </Modal>
  );
};
