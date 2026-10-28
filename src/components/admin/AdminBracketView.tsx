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
  resolveBracketMatch,
} from '../../services/bracketEngine';
import {
  Trophy,
  Crown,
  GitBranch,
  BarChart3,
  RefreshCw,
  Plus,
  Download,
  Medal,
  CheckCircle,
  X,
  Flame,
} from 'lucide-react';

// ==============================================================================
// BRACKET VISUAL — PAINEL PROFISSIONAL DE GESTÃO DE CAMPEONATOS E CHAVEAMENTOS
// Suporte completo a Eliminatória Simples, Dupla Eliminação, Round-Robin e Superfight
// ==============================================================================

export interface AdminBracketViewProps {
  brackets: BracketResult[];
  onUpdateBrackets?: (newBrackets: BracketResult[]) => void;
  onOpenTournamentModal?: () => void;
  onMatchAction?: (bracketMatchId: string, action: 'start' | 'result') => void;
}

export const AdminBracketView: React.FC<AdminBracketViewProps> = ({
  brackets,
  onUpdateBrackets,
  onOpenTournamentModal,
  onMatchAction,
}) => {
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
  const [doubleEliminationTab, setDoubleEliminationTab] = useState<'winners' | 'losers'>('winners');

  // Estado para modal de resolução rápida de combate
  const [resolvingMatch, setResolvingMatch] = useState<BracketMatch | null>(null);
  const [selectedWinnerId, setSelectedWinnerId] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('Nocaute (KO)');

  if (brackets.length === 0) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 'var(--space-8) var(--space-4)' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(212, 175, 55, 0.1)',
              border: '2px solid rgba(212, 175, 55, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto var(--space-4)',
            }}
          >
            <Trophy size={32} color="var(--color-gold-primary)" />
          </div>
          <h3
            style={{
              fontSize: 'var(--font-size-xl)',
              fontWeight: 800,
              textTransform: 'uppercase',
              color: '#ffffff',
              letterSpacing: '0.04em',
            }}
          >
            Nenhum Torneio ou Chaveamento Ativo
          </h3>
          <p
            style={{
              color: 'var(--color-text-muted)',
              fontSize: 'var(--font-size-sm)',
              maxWidth: '460px',
              margin: 'var(--space-2) auto var(--space-5)',
              lineHeight: 1.5,
            }}
          >
            Crie campeonatos personalizados com eliminatória simples, dupla eliminação, round-robin ou superfights para os lutadores aprovados.
          </p>
          {onOpenTournamentModal && (
            <Button
              variant="gold"
              size="md"
              leftIcon={<Plus size={16} />}
              onClick={onOpenTournamentModal}
            >
              Criar Campeonato & Chaveamento
            </Button>
          )}
        </div>
      </Card>
    );
  }

  const currentBracket = brackets[selectedCategoryIndex] || brackets[0];
  const stats = useMemo(() => calculateBracketStats(currentBracket.matches), [currentBracket]);

  const handleOpenResolveModal = (match: BracketMatch) => {
    setResolvingMatch(match);
    setSelectedWinnerId(match.slot1?.registrationId || '');
  };

  const handleConfirmResult = () => {
    if (!resolvingMatch || !selectedWinnerId) return;

    const result = resolveBracketMatch(
      currentBracket.matches,
      resolvingMatch.id,
      selectedWinnerId,
      selectedMethod
    );

    const updatedBrackets = brackets.map((b, idx) => {
      if (idx !== selectedCategoryIndex) return b;
      return {
        ...b,
        matches: result.updatedMatches,
      };
    });

    if (onUpdateBrackets) {
      onUpdateBrackets(updatedBrackets);
    }

    setResolvingMatch(null);
  };

  const handleExportTournament = () => {
    const exportData = {
      title: currentBracket.tournamentTitle || 'Chaveamento UCU Arena',
      category: currentBracket.categoryName,
      format: currentBracket.format || 'single_elimination',
      totalRounds: currentBracket.totalRounds,
      totalMatches: currentBracket.totalMatches,
      champion: stats.champion?.nickname || 'Em andamento',
      matches: currentBracket.matches.map((m) => ({
        rodada: m.roundName,
        luta: `${m.slot1?.nickname || 'BYE'} vs ${m.slot2?.nickname || 'BYE'}`,
        status: m.status,
        vencedor: m.winnerId ? (m.winnerId === m.slot1?.registrationId ? m.slot1?.nickname : m.slot2?.nickname) : 'Pendente',
        metodo: m.method || '—',
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `chaveamento_${currentBracket.categoryId}_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtragem de lutas por formato
  const visibleMatches = useMemo(() => {
    if (currentBracket.format === 'double_elimination') {
      return currentBracket.matches.filter(
        (m) => (doubleEliminationTab === 'winners' ? m.bracketType !== 'losers' : m.bracketType === 'losers')
      );
    }
    return currentBracket.matches;
  }, [currentBracket, doubleEliminationTab]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* 1. Header do Campeonato com Informações de Título */}
      <Card headerAccent="gold">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trophy size={20} color="var(--color-gold-primary)" />
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {currentBracket.tournamentTitle || 'Torneio Oficial U.C.U Arena'}
              </h3>
            </div>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gold-light)', marginTop: '4px' }}>
              🏆 Troféu em disputa: <strong>{currentBracket.trophyName || 'Cinturão dos Campeões'}</strong> • {currentBracket.categoryName}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <Badge variant="gold" size="sm">
              {currentBracket.format === 'double_elimination'
                ? 'Dupla Eliminação'
                : currentBracket.format === 'round_robin'
                  ? 'Round Robin (Pontos)'
                  : currentBracket.format === 'superfight'
                    ? 'Super Luta'
                    : 'Eliminatória Simples'}
            </Badge>

            {onOpenTournamentModal && (
              <Button
                variant="gold"
                size="sm"
                leftIcon={<Plus size={14} />}
                onClick={onOpenTournamentModal}
              >
                Novo Torneio
              </Button>
            )}

            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download size={14} />}
              onClick={handleExportTournament}
            >
              Exportar
            </Button>
          </div>
        </div>
      </Card>

      {/* 2. Seletor de Categoria (se houver mais de uma) */}
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
              {b.categoryName} ({b.matches.length} lutas)
            </Button>
          ))}
        </div>
      )}

      {/* 3. Sub-Abas quando Dupla Eliminação */}
      {currentBracket.format === 'double_elimination' && (
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button
            variant={doubleEliminationTab === 'winners' ? 'gold' : 'secondary'}
            size="sm"
            leftIcon={<GitBranch size={14} />}
            onClick={() => setDoubleEliminationTab('winners')}
          >
            Chave Principal (Vencedores)
          </Button>
          <Button
            variant={doubleEliminationTab === 'losers' ? 'danger' : 'secondary'}
            size="sm"
            leftIcon={<RefreshCw size={14} />}
            onClick={() => setDoubleEliminationTab('losers')}
          >
            Chave de Repescagem (Perdedores)
          </Button>
        </div>
      )}

      {/* 4. Barra de Progresso do Campeonato */}
      <BracketProgressBar stats={stats} />

      {/* 5. Campeão Consagrado (se houver) */}
      {stats.champion && (
        <Card>
          <div
            className="animate-logo-intro"
            style={{
              textAlign: 'center',
              padding: 'var(--space-5) var(--space-4)',
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.18), rgba(229, 25, 40, 0.1))',
              border: '2px solid var(--color-gold-primary)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 0 25px rgba(212, 175, 55, 0.3)',
            }}
          >
            <Crown size={40} color="var(--color-gold-primary)" style={{ margin: '0 auto 8px' }} />
            <span
              style={{
                fontFamily: 'var(--font-family-heading)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 900,
                color: 'var(--color-gold-primary)',
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
              }}
            >
              Campeão Consagrado do Torneio
            </span>
            <h2
              style={{
                fontFamily: 'var(--font-family-heading)',
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 900,
                color: '#ffffff',
                textTransform: 'uppercase',
                margin: '6px 0',
              }}
            >
              🏆 {stats.champion.nickname}
            </h2>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
              Detentor oficial do {currentBracket.trophyName || 'Cinturão U.C.U Arena'} • {currentBracket.categoryName}
            </p>
          </div>
        </Card>
      )}

      {/* 6. Tabela de Classificação do Round Robin (quando aplicável) */}
      {currentBracket.format === 'round_robin' && currentBracket.standings && (
        <Card headerAccent="gold">
          <div style={{ marginBottom: 'var(--space-3)' }}>
            <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-gold-primary)' }}>
              Tabela de Classificação Geral (Pontos Corridos)
            </h4>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              3 pontos por vitória • 1 ponto por empate • Bônus de finalização/nocaute
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-xs)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--color-text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>#</th>
                  <th style={{ padding: '8px' }}>Atleta</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>Lutas</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>V</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>D</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>E</th>
                  <th style={{ padding: '8px', textAlign: 'center', color: 'var(--color-gold-primary)', fontWeight: 800 }}>PTS</th>
                </tr>
              </thead>
              <tbody>
                {currentBracket.standings.map((st, idx) => (
                  <tr
                    key={st.registrationId}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      backgroundColor: idx === 0 ? 'rgba(212, 175, 55, 0.08)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '10px 8px', fontWeight: 800, color: idx === 0 ? 'var(--color-gold-primary)' : 'inherit' }}>
                      {idx + 1}º
                    </td>
                    <td style={{ padding: '10px 8px', fontWeight: 700, color: '#ffffff' }}>
                      {st.nickname}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>{st.matchesPlayed}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', color: '#10b981', fontWeight: 700 }}>{st.wins}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', color: '#ef4444' }}>{st.losses}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', color: '#f59e0b' }}>{st.draws}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 900, color: 'var(--color-gold-primary)', fontSize: 'var(--font-size-sm)' }}>
                      {st.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 7. Visualização Interativa do Bracket por Rodadas */}
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
            const roundMatches = visibleMatches.filter((m) => m.round === round);
            if (roundMatches.length === 0) return null;

            return (
              <BracketRoundColumn
                key={round}
                round={round}
                totalRounds={currentBracket.totalRounds}
                matches={roundMatches}
                onResolveMatch={handleOpenResolveModal}
                onMatchAction={onMatchAction}
              />
            );
          })}
        </div>
      </div>

      {/* Disputa de Bronze (quando houver) */}
      {currentBracket.hasBronzeMatch && currentBracket.matches.some((m) => m.bracketType === 'bronze') && (
        <Card headerAccent="red">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-3)' }}>
            <Medal size={18} color="#cd7f32" />
            <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 800, textTransform: 'uppercase', color: '#ffffff' }}>
              Disputa do 3º Lugar (Medalha de Bronze)
            </h4>
          </div>
          {currentBracket.matches
            .filter((m) => m.bracketType === 'bronze')
            .map((m) => (
              <BracketMatchCard
                key={m.id}
                match={m}
                isFinal={false}
                onResolveMatch={handleOpenResolveModal}
                onAction={onMatchAction}
              />
            ))}
        </Card>
      )}

      {/* Informações Extras de BYEs */}
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

      {/* Modal de Registro Rápido de Resultado de Combate */}
      {resolvingMatch && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-4)',
          }}
          onClick={() => setResolvingMatch(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              backgroundColor: '#121218',
              border: '2px solid var(--color-gold-primary)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-6)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.9)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trophy size={20} color="var(--color-gold-primary)" />
                <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 800, textTransform: 'uppercase' }}>
                  Definir Vencedor do Combate
                </h3>
              </div>
              <button
                onClick={() => setResolvingMatch(null)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
              Selecione o lutador vitorioso e a forma de término da luta para avançar no chaveamento:
            </p>

            {/* Escolha do Vencedor */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
              {[resolvingMatch.slot1, resolvingMatch.slot2]
                .filter(Boolean)
                .map((slot) => {
                  const isSelected = selectedWinnerId === slot?.registrationId;
                  return (
                    <div
                      key={slot?.registrationId}
                      onClick={() => slot?.registrationId && setSelectedWinnerId(slot.registrationId)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: isSelected ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255,255,255,0.03)',
                        border: isSelected ? '2px solid var(--color-gold-primary)' : '1px solid rgba(255,255,255,0.1)',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            border: isSelected ? '5px solid var(--color-gold-primary)' : '2px solid rgba(255,255,255,0.3)',
                          }}
                        />
                        <span style={{ fontWeight: 800, fontSize: 'var(--font-size-sm)', color: '#fff' }}>
                          {slot?.nickname}
                        </span>
                      </div>
                      <Badge variant="gold" size="sm">
                        Seed #{slot?.seed}
                      </Badge>
                    </div>
                  );
                })}
            </div>

            {/* Método de Vitória */}
            <div style={{ marginBottom: 'var(--space-5)' }}>
              <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                Método de Decisão
              </label>
              <select
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  color: '#fff',
                  fontSize: 'var(--font-size-sm)',
                  outline: 'none',
                }}
              >
                <option value="Nocaute (KO)">Nocaute (KO)</option>
                <option value="Nocaute Técnico (TKO)">Nocaute Técnico (TKO)</option>
                <option value="Finalização / Submissão">Finalização / Submissão</option>
                <option value="Decisão Unânime dos Juízes">Decisão Unânime dos Juízes</option>
                <option value="Decisão Dividida dos Juízes">Decisão Dividida dos Juízes</option>
                <option value="Desclassificação (DQ)">Desclassificação (DQ)</option>
                <option value="Walkover / Desistência">Walkover / Desistência</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button variant="secondary" size="sm" onClick={() => setResolvingMatch(null)}>
                Cancelar
              </Button>
              <Button
                variant="gold"
                size="md"
                leftIcon={<CheckCircle size={16} />}
                onClick={handleConfirmResult}
                disabled={!selectedWinnerId}
              >
                Confirmar Resultado & Avançar
              </Button>
            </div>
          </div>
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
  onResolveMatch?: (match: BracketMatch) => void;
  onMatchAction?: (matchId: string, action: 'start' | 'result') => void;
}

const BracketRoundColumn: React.FC<BracketRoundColumnProps> = ({
  round,
  totalRounds,
  matches,
  onResolveMatch,
  onMatchAction,
}) => {
  const roundName = matches[0]?.roundName || `Rodada ${round + 1}`;
  const isFinal = round === totalRounds - 1;

  return (
    <div style={{ minWidth: '260px', flex: '0 0 260px' }}>
      {/* Cabeçalho da Rodada */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: 'var(--space-3)',
          padding: 'var(--space-2) var(--space-3)',
          background: isFinal
            ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.18), rgba(153, 101, 21, 0.08))'
            : 'rgba(255, 255, 255, 0.04)',
          borderRadius: 'var(--radius-md)',
          border: isFinal
            ? '1px solid rgba(212, 175, 55, 0.4)'
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
          minHeight: `${matches.length * 130}px`,
        }}
      >
        {matches.map((m) => (
          <BracketMatchCard
            key={m.id}
            match={m}
            isFinal={isFinal}
            onResolveMatch={onResolveMatch}
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
  onResolveMatch?: (match: BracketMatch) => void;
  onAction?: (matchId: string, action: 'start' | 'result') => void;
}

const BracketMatchCard: React.FC<BracketMatchCardProps> = ({
  match,
  isFinal,
  onResolveMatch,
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
    ? 'rgba(229, 25, 40, 0.6)'
    : isFinal && !isPending
      ? 'rgba(212, 175, 55, 0.5)'
      : 'var(--color-border-subtle)';

  const bgColor = isLive
    ? 'rgba(229, 25, 40, 0.08)'
    : isFinal
      ? 'rgba(212, 175, 55, 0.05)'
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
        transition: 'all 0.3s ease',
      }}
    >
      {/* Topo do card: Rodada/Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>
          {match.roundName}
        </span>
        {statusBadge()}
      </div>

      {/* Slot 1 */}
      <BracketSlotRow
        slot={match.slot1}
        isWinner={isCompleted && match.winnerId === match.slot1?.registrationId}
        corner="red"
      />

      {/* Separador VS */}
      <div
        style={{
          textAlign: 'center',
          fontSize: '0.65rem',
          fontWeight: 900,
          color: isLive ? 'var(--color-red-primary)' : 'var(--color-text-muted)',
          letterSpacing: '0.1em',
          padding: '2px 0',
          borderTop: '1px dashed rgba(255,255,255,0.06)',
          borderBottom: '1px dashed rgba(255,255,255,0.06)',
        }}
      >
        {isLive ? '⚡ VS ⚡' : 'VS'}
      </div>

      {/* Slot 2 */}
      <BracketSlotRow
        slot={match.slot2}
        isWinner={isCompleted && match.winnerId === match.slot2?.registrationId}
        corner="gold"
      />

      {/* Método de Vitória (se concluída) */}
      {isCompleted && match.method && (
        <div
          style={{
            fontSize: '0.65rem',
            color: 'var(--color-gold-light)',
            textAlign: 'center',
            backgroundColor: 'rgba(212, 175, 55, 0.08)',
            padding: '3px 6px',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 700,
          }}
        >
          {match.method}
        </div>
      )}

      {/* Ações Rápidas de Administração */}
      {(isReady || isLive) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: 'var(--space-1)' }}>
          {isReady && onAction && (
            <Button
              variant="danger"
              size="sm"
              fullWidth
              leftIcon={<Flame size={12} />}
              onClick={() => onAction(match.id, 'start')}
            >
              Iniciar no Octógono
            </Button>
          )}

          {/* Botão de Definir Vencedor Rápido */}
          {onResolveMatch && (
            <Button
              variant="gold"
              size="sm"
              fullWidth
              leftIcon={<Trophy size={12} />}
              onClick={() => onResolveMatch(match)}
            >
              Definir Vencedor
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 8px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'rgba(255,255,255,0.02)',
          minHeight: '36px',
        }}
      >
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
          ? 'rgba(212, 175, 55, 0.14)'
          : isBye
            ? 'rgba(255,255,255,0.02)'
            : 'rgba(255,255,255,0.04)',
        border: isWinner
          ? '1px solid rgba(212, 175, 55, 0.4)'
          : '1px solid transparent',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Indicador de Seed */}
      <span
        style={{
          fontSize: '0.65rem',
          fontWeight: 800,
          color: corner === 'red' ? 'var(--color-red-primary)' : 'var(--color-gold-primary)',
          width: '20px',
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
        <Trophy size={14} color="var(--color-gold-primary)" />
      )}
    </div>
  );
};
