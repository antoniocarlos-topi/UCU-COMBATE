import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { MatchFight } from '../../types/app.types';
import { Swords, Video, Trophy, Filter } from 'lucide-react';

export interface FightCardListProps {
  matches: MatchFight[];
  currentAthleteId: string;
}

export const FightCardList: React.FC<FightCardListProps> = ({ matches }) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'in_progress' | 'completed'>('all');

  const filteredMatches = matches.filter((m) => {
    if (statusFilter === 'all') return true;
    return m.status === statusFilter;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Barra de Filtros Mobile */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          overflowX: 'auto',
          paddingBottom: '4px',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', paddingRight: '4px' }}>
          <Filter size={14} />
          <span>Filtro:</span>
        </div>

        <Button
          variant={statusFilter === 'all' ? 'gold' : 'secondary'}
          size="sm"
          onClick={() => setStatusFilter('all')}
        >
          Todas ({matches.length})
        </Button>
        <Button
          variant={statusFilter === 'scheduled' ? 'gold' : 'secondary'}
          size="sm"
          onClick={() => setStatusFilter('scheduled')}
        >
          Agendadas
        </Button>
        <Button
          variant={statusFilter === 'in_progress' ? 'danger' : 'secondary'}
          size="sm"
          onClick={() => setStatusFilter('in_progress')}
        >
          No Ringue
        </Button>
        <Button
          variant={statusFilter === 'completed' ? 'gold' : 'secondary'}
          size="sm"
          onClick={() => setStatusFilter('completed')}
        >
          Resultados
        </Button>
      </div>

      {/* Lista de Lutas */}
      {filteredMatches.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 'var(--space-6) 0' }}>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
              Nenhum confronto encontrado para o filtro selecionado.
            </p>
          </div>
        </Card>
      ) : (
        filteredMatches.map((match) => {
          const isWinner1 = match.winner_registration_id === match.fighter1_registration_id;
          const isWinner2 = match.winner_registration_id === match.fighter2_registration_id;

          return (
            <Card key={match.id} style={{ padding: 'var(--space-4)' }}>
              {/* Topo do Card de Luta */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 'var(--space-3)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-family-heading)',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 700,
                    color: 'var(--color-gold-light)',
                  }}
                >
                  Luta #{match.match_order} • {match.round_name}
                </span>

                <Badge
                  variant={
                    match.status === 'in_progress'
                      ? 'live'
                      : match.status === 'completed'
                      ? 'approved'
                      : 'neutral'
                  }
                  size="sm"
                  pulse={match.status === 'in_progress'}
                >
                  {match.status === 'in_progress'
                    ? 'AO VIVO'
                    : match.status === 'completed'
                    ? 'FINALIZADA'
                    : 'AGENDADA'}
                </Badge>
              </div>

              {/* Duelo de Lutadores */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto 1fr',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-2) 0',
                }}
              >
                {/* Fighter 1 */}
                <div style={{ textAlign: 'center', opacity: match.status === 'completed' && !isWinner1 ? 0.6 : 1 }}>
                  <Avatar
                    src={match.fighter1?.profile?.avatar_url}
                    alt={match.fighter1?.profile?.nickname || 'Lutador 1'}
                    size="md"
                    borderRing="red"
                  />
                  <span
                    style={{
                      display: 'block',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 700,
                      marginTop: '4px',
                      color: isWinner1 ? 'var(--color-gold-light)' : '#fff',
                    }}
                  >
                    {match.fighter1?.profile?.nickname}
                  </span>
                  {isWinner1 && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: 'var(--color-gold-primary)', fontSize: '0.65rem', fontWeight: 800 }}>
                      <Trophy size={10} /> VENCEDOR
                    </div>
                  )}
                </div>

                <div style={{ color: 'var(--color-red-primary)', textAlign: 'center' }}>
                  <Swords size={18} />
                </div>

                {/* Fighter 2 */}
                <div style={{ textAlign: 'center', opacity: match.status === 'completed' && !isWinner2 ? 0.6 : 1 }}>
                  <Avatar
                    src={match.fighter2?.profile?.avatar_url}
                    alt={match.fighter2?.profile?.nickname || 'Lutador 2'}
                    size="md"
                    borderRing="gold"
                  />
                  <span
                    style={{
                      display: 'block',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 700,
                      marginTop: '4px',
                      color: isWinner2 ? 'var(--color-gold-light)' : '#fff',
                    }}
                  >
                    {match.fighter2?.profile?.nickname}
                  </span>
                  {isWinner2 && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: 'var(--color-gold-primary)', fontSize: '0.65rem', fontWeight: 800 }}>
                      <Trophy size={10} /> VENCEDOR
                    </div>
                  )}
                </div>
              </div>

              {/* Resultado ou Horário */}
              {match.status === 'completed' && match.score_details && (
                <div
                  style={{
                    marginTop: 'var(--space-3)',
                    padding: 'var(--space-2) var(--space-3)',
                    backgroundColor: 'rgba(212, 175, 55, 0.08)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-gold-light)',
                    textAlign: 'center',
                  }}
                >
                  Método: <strong>{match.victory_method}</strong> ({match.score_details})
                </div>
              )}

              {match.video_url && (
                <div style={{ marginTop: 'var(--space-3)', display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Video size={14} />}
                    onClick={() => window.open(match.video_url!, '_blank')}
                  >
                    Assistir Combate
                  </Button>
                </div>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
};
