import React, { useState, useMemo } from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import {
  BracketResult,
  BracketMatch,
  BracketSlot,
  BracketStats,
  calculateBracketStats,
} from '../../services/bracketEngine';
import {
  Trophy,
  Swords,
  ChevronRight,
  Crown,
  GitBranch,
  BarChart3,
} from 'lucide-react';

// ==============================================================================
// BRACKET VISUAL — VISUALIZAÇÃO DE CHAVEAMENTO MATA-MATA
// ==============================================================================

export interface AdminBracketViewProps {
  brackets: BracketResult[];
  onMatchAction?: (bracketMatchId: string, action: 'start' | 'result') => void;
}

export const AdminBracketView: React.FC<AdminBracketViewProps> = ({
  brackets,
  onMatchAction,
}) => {
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);

  if (brackets.length === 0) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 'var(--space-6) 0' }}>
          <GitBranch size={32} color="var(--color-text-muted)" style={{ margin: '0 auto 8px' }} />
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
            Nenhum chaveamento gerado para este evento.
          </p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', marginTop: '4px' }}>
            Aprove atletas e gere o chaveamento automático na aba de Confrontos.
          </p>
        </div>
      </Card>
    );
  }

  const currentBracket = brackets[selectedCategoryIndex];
  const stats = useMemo(() => calculateBracketStats(currentBracket.matches), [currentBracket]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Header do Chaveamento */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <div>
          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <GitBranch size={18} color="var(--color-gold-primary)" />
            Chaveamento Mata-Mata
          </h3>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            Bracket de eliminação simples por categoria de peso
          </p>
        </div>

        <Badge variant="gold" size="sm">
          {currentBracket.totalRounds} rodadas • {currentBracket.totalMatches} lutas
        </Badge>
      </div>

      {/* Seletor de Categoria */}
      {brackets.length > 1 && (
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-2)',
            overflowX: 'auto',
            paddingBottom: '4px',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {brackets.map((b, idx) => (
            <Button
              key={b.categoryId}
              variant={idx === selectedCategoryIndex ? 'gold' : 'secondary'}
              size="sm"
              onClick={() => setSelectedCategoryIndex(idx)}
            >
              {b.categoryName}
            </Button>
          ))}
        </div>
      )}

      {/* Barra de Progresso */}
      <BracketProgressBar stats={stats} />

      {/* Campeão (se houver) */}
      {stats.champion && (
        <Card>
          <div
            style={{
              textAlign: 'center',
              padding: 'var(--space-4) 0',
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.12), rgba(153, 101, 21, 0.06))',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <Crown size={32} color="var(--color-gold-primary)" style={{ margin: '0 auto 8px' }} />
            <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: 900, color: 'var(--color-gold-primary)', textTransform: 'uppercase' }}>
              🏆 Campeão
            </p>
            <p style={{ fontSize: 'var(--font-size-md)', fontWeight: 700, marginTop: '4px' }}>
              {stats.champion.nickname}
            </p>
            <Badge variant="gold" size="sm">
              {currentBracket.categoryName}
            </Badge>
          </div>
        </Card>
      )}

      {/* Visualização do Bracket por Rodadas (Mobile-Scroll) */}
      <div
        style={{
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: 'var(--space-4)',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-4)',
            minWidth: `${currentBracket.totalRounds * 280}px`,
          }}
        >
          {Array.from({ length: currentBracket.totalRounds }, (_, round) => {
            const roundMatches = currentBracket.matches.filter((m) => m.round === round);
            return (
              <BracketRoundColumn
                key={round}
                round={round}
                totalRounds={currentBracket.totalRounds}
                matches={roundMatches}
                onMatchAction={onMatchAction}
              />
            );
          })}
        </div>
      </div>

      {/* Informações Extras */}
      {currentBracket.byes > 0 && (
        <div
          style={{
            padding: 'var(--space-2) var(--space-3)',
            backgroundColor: 'rgba(245, 158, 11, 0.06)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-muted)',
          }}
        >
          ℹ️ {currentBracket.byes} posição(ões) BYE — atletas com BYE avançam automaticamente para a próxima rodada.
        </div>
      )}
    </div>
  );
};

// ==============================================================================
// BARRA DE PROGRESSO DO BRACKET
// ==============================================================================

const BracketProgressBar: React.FC<{ stats: BracketStats }> = ({ stats }) => (
  <Card>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <BarChart3 size={14} color="var(--color-gold-primary)" />
          <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700 }}>
            Progresso do Campeonato
          </span>
        </div>
        <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 800, color: 'var(--color-gold-primary)' }}>
          {stats.progressPercent}%
        </span>
      </div>

      {/* Barra visual */}
      <div
        style={{
          width: '100%',
          height: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
        }}
      >
        <div
          className="animate-gold-shimmer"
          style={{
            width: `${stats.progressPercent}%`,
            height: '100%',
            background: 'linear-gradient(90deg, var(--color-gold-primary), var(--color-gold-light))',
            borderRadius: 'var(--radius-full)',
            transition: 'width 0.6s ease-out',
          }}
        />
      </div>

      {/* Contadores */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 'var(--space-2)',
          fontSize: 'var(--font-size-xs)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <span style={{ display: 'block', fontWeight: 800, color: 'var(--color-text-primary)' }}>
            {stats.completedFights}
          </span>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.65rem' }}>Concluídas</span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <span style={{ display: 'block', fontWeight: 800, color: 'var(--color-red-primary)' }}>
            {stats.inProgressFights}
          </span>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.65rem' }}>Ao Vivo</span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <span style={{ display: 'block', fontWeight: 800, color: 'var(--color-gold-primary)' }}>
            {stats.readyFights}
          </span>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.65rem' }}>Prontas</span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <span style={{ display: 'block', fontWeight: 800, color: 'var(--color-text-secondary)' }}>
            {stats.pendingFights}
          </span>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.65rem' }}>Pendentes</span>
        </div>
      </div>
    </div>
  </Card>
);

// ==============================================================================
// COLUNA DE RODADA DO BRACKET
// ==============================================================================

interface BracketRoundColumnProps {
  round: number;
  totalRounds: number;
  matches: BracketMatch[];
  onMatchAction?: (matchId: string, action: 'start' | 'result') => void;
}

const BracketRoundColumn: React.FC<BracketRoundColumnProps> = ({
  round,
  totalRounds,
  matches,
  onMatchAction,
}) => {
  const roundName = matches[0]?.roundName || `Rodada ${round + 1}`;
  const isFinal = round === totalRounds - 1;

  return (
    <div style={{ minWidth: '240px', flex: '0 0 240px' }}>
      {/* Cabeçalho da Rodada */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: 'var(--space-3)',
          padding: 'var(--space-2) var(--space-3)',
          background: isFinal
            ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(153, 101, 21, 0.08))'
            : 'rgba(255, 255, 255, 0.04)',
          borderRadius: 'var(--radius-md)',
          border: isFinal
            ? '1px solid rgba(212, 175, 55, 0.3)'
            : '1px solid var(--color-border-subtle)',
        }}
      >
        <span
          style={{
            fontSize: 'var(--font-size-xs)',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: isFinal ? 'var(--color-gold-primary)' : 'var(--color-text-secondary)',
          }}
        >
          {isFinal && '🏆 '}
          {roundName}
        </span>
      </div>

      {/* Lutas da Rodada */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
          justifyContent: 'space-around',
          minHeight: `${matches.length * 120}px`,
        }}
      >
        {matches.map((m) => (
          <BracketMatchCard
            key={m.id}
            match={m}
            isFinal={isFinal}
            onAction={onMatchAction}
          />
        ))}
      </div>
    </div>
  );
};

// ==============================================================================
// CARD INDIVIDUAL DE LUTA NO BRACKET
// ==============================================================================

interface BracketMatchCardProps {
  match: BracketMatch;
  isFinal: boolean;
  onAction?: (matchId: string, action: 'start' | 'result') => void;
}

const BracketMatchCard: React.FC<BracketMatchCardProps> = ({
  match,
  isFinal,
  onAction,
}) => {
  const isCompleted = match.status === 'completed';
  const isLive = match.status === 'in_progress';
  const isReady = match.status === 'ready';
  const isPending = match.status === 'pending';

  const statusBadge = () => {
    if (isLive) return <Badge variant="live" pulse size="sm">AO VIVO</Badge>;
    if (isCompleted) return <Badge variant="approved" size="sm">CONCLUÍDA</Badge>;
    if (isReady) return <Badge variant="gold" size="sm">PRONTA</Badge>;
    return <Badge variant="neutral" size="sm">AGUARDANDO</Badge>;
  };

  const borderColor = isLive
    ? 'rgba(229, 25, 40, 0.5)'
    : isFinal && !isPending
      ? 'rgba(212, 175, 55, 0.4)'
      : 'var(--color-border-subtle)';

  const bgColor = isLive
    ? 'rgba(229, 25, 40, 0.06)'
    : isFinal
      ? 'rgba(212, 175, 55, 0.04)'
      : 'var(--color-bg-card)';

  return (
    <div
      style={{
        padding: 'var(--space-3)',
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
        transition: 'border-color 0.3s ease, background-color 0.3s ease',
      }}
    >
      {/* Status Badge */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {statusBadge()}
      </div>

      {/* Slot 1 */}
      <BracketSlotRow
        slot={match.slot1}
        isWinner={isCompleted && match.winnerId === match.slot1?.registrationId}
        corner="red"
      />

      {/* Separador VS */}
      <div style={{
        textAlign: 'center',
        fontSize: '0.65rem',
        fontWeight: 900,
        color: isLive ? 'var(--color-red-primary)' : 'var(--color-text-muted)',
        letterSpacing: '0.1em',
        padding: '2px 0',
        borderTop: '1px dashed rgba(255,255,255,0.06)',
        borderBottom: '1px dashed rgba(255,255,255,0.06)',
      }}>
        {isLive ? '⚡ VS ⚡' : 'VS'}
      </div>

      {/* Slot 2 */}
      <BracketSlotRow
        slot={match.slot2}
        isWinner={isCompleted && match.winnerId === match.slot2?.registrationId}
        corner="gold"
      />

      {/* Ações */}
      {(isReady || isLive) && onAction && (
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-1)' }}>
          {isReady && (
            <Button
              variant="danger"
              size="sm"
              fullWidth
              leftIcon={<Swords size={12} />}
              onClick={() => onAction(match.id, 'start')}
            >
              Iniciar Combate
            </Button>
          )}
          {isLive && (
            <Button
              variant="gold"
              size="sm"
              fullWidth
              leftIcon={<Trophy size={12} />}
              onClick={() => onAction(match.id, 'result')}
            >
              Registrar Resultado
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

// ==============================================================================
// SLOT INDIVIDUAL DO BRACKET
// ==============================================================================

interface BracketSlotRowProps {
  slot: BracketSlot | null;
  isWinner: boolean;
  corner: 'red' | 'gold';
}

const BracketSlotRow: React.FC<BracketSlotRowProps> = ({
  slot,
  isWinner,
  corner,
}) => {
  if (!slot) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 8px',
        borderRadius: 'var(--radius-sm)',
        backgroundColor: 'rgba(255,255,255,0.02)',
        minHeight: '36px',
      }}>
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
          Aguardando vencedor...
        </span>
      </div>
    );
  }

  const isBye = !slot.registrationId;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 8px',
        borderRadius: 'var(--radius-sm)',
        backgroundColor: isWinner
          ? 'rgba(212, 175, 55, 0.12)'
          : isBye
            ? 'rgba(255,255,255,0.02)'
            : 'rgba(255,255,255,0.04)',
        border: isWinner
          ? '1px solid rgba(212, 175, 55, 0.3)'
          : '1px solid transparent',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Indicador de Seed */}
      <span
        style={{
          fontSize: '0.6rem',
          fontWeight: 800,
          color: corner === 'red' ? 'var(--color-red-primary)' : 'var(--color-gold-primary)',
          width: '16px',
          textAlign: 'center',
        }}
      >
        {isBye ? '—' : `#${slot.seed}`}
      </span>

      {/* Nome do Atleta */}
      <span
        style={{
          flex: 1,
          fontSize: 'var(--font-size-xs)',
          fontWeight: isWinner ? 800 : isBye ? 400 : 600,
          color: isWinner
            ? 'var(--color-gold-primary)'
            : isBye
              ? 'var(--color-text-muted)'
              : 'var(--color-text-primary)',
          textDecoration: isBye ? 'line-through' : 'none',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {slot.nickname}
      </span>

      {/* Troféu do Vencedor */}
      {isWinner && (
        <Trophy size={12} color="var(--color-gold-primary)" />
      )}

      {/* Seta de avanço */}
      {isWinner && (
        <ChevronRight size={12} color="var(--color-gold-primary)" />
      )}
    </div>
  );
};
