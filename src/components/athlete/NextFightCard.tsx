import React from 'react';
import { Card } from '../common/Card';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';
import { MatchFight } from '../../types/app.types';
import { Swords, Clock, Calendar, Shield } from 'lucide-react';

export interface NextFightCardProps {
  match: MatchFight | null;
  athleteProfileId: string;
}

export const NextFightCard: React.FC<NextFightCardProps> = ({ match, athleteProfileId }) => {
  if (!match) {
    return (
      <Card title="Próximo Confronto" headerAccent="gold">
        <div style={{ textAlign: 'center', padding: 'var(--space-6) var(--space-4)' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              backgroundColor: 'rgba(212, 175, 55, 0.08)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-gold-primary)',
              marginBottom: 'var(--space-3)',
            }}
          >
            <Shield size={26} />
          </div>
          <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
            Aguardando Casamento de Luta
          </h4>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', maxWidth: '340px', margin: '0 auto' }}>
            A organização está finalizando o sorteio e chaveamento da sua categoria. Fique atento aos comunicados oficiais.
          </p>
        </div>
      </Card>
    );
  }

  const isFighter1 = match.fighter1?.profile_id === athleteProfileId;
  const athleteFighter = isFighter1 ? match.fighter1 : match.fighter2;
  const opponentFighter = isFighter1 ? match.fighter2 : match.fighter1;

  const athleteCorner = isFighter1 ? 'Corner Vermelho' : 'Corner Dourado';
  const opponentCorner = isFighter1 ? 'Corner Dourado' : 'Corner Vermelho';
  const athleteCornerRing = isFighter1 ? 'red' : 'gold';
  const opponentCornerRing = isFighter1 ? 'gold' : 'red';

  return (
    <Card headerAccent="red">
      {/* Cabeçalho do Confronto */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-4)',
          borderBottom: '1px solid var(--color-border-subtle)',
          paddingBottom: 'var(--space-3)',
        }}
      >
        <div>
          <span
            style={{
              fontSize: 'var(--font-size-xs)',
              fontWeight: 800,
              color: 'var(--color-gold-primary)',
              fontFamily: 'var(--font-family-heading)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {match.round_name}
          </span>
          <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
            Luta #{match.match_order} no Card Oficial
          </p>
        </div>
        <Badge variant={match.status === 'in_progress' ? 'live' : 'gold'} pulse={match.status === 'in_progress'}>
          {match.status === 'in_progress' ? 'NO RINGUE' : 'CONFIRMADA'}
        </Badge>
      </div>

      {/* Duelo de Lutadores (Face to Face) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: 'var(--space-2)',
          padding: 'var(--space-2) 0',
        }}
      >
        {/* Atleta Logado */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-block', position: 'relative' }}>
            <Avatar
              src={athleteFighter?.profile?.avatar_url}
              alt={athleteFighter?.profile?.nickname || 'Você'}
              size="lg"
              borderRing={athleteCornerRing as any}
            />
          </div>
          <span
            style={{
              display: 'block',
              fontFamily: 'var(--font-family-heading)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 800,
              color: '#ffffff',
              marginTop: '6px',
            }}
          >
            {athleteFighter?.profile?.nickname} (Você)
          </span>
          <span
            style={{
              fontSize: '0.7rem',
              color: athleteCornerRing === 'red' ? 'var(--color-red-primary)' : 'var(--color-gold-primary)',
              fontWeight: 600,
              textTransform: 'uppercase',
            }}
          >
            {athleteCorner}
          </span>
        </div>

        {/* Ícone Central VS */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 var(--space-2)',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-red-muted)',
              border: '1px solid rgba(229, 25, 40, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-red-primary)',
              boxShadow: 'var(--shadow-red)',
            }}
          >
            <Swords size={22} />
          </div>
          <span
            style={{
              fontFamily: 'var(--font-family-heading)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 900,
              color: 'var(--color-text-muted)',
              marginTop: '4px',
            }}
          >
            VS
          </span>
        </div>

        {/* Adversário */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-block', position: 'relative' }}>
            <Avatar
              src={opponentFighter?.profile?.avatar_url}
              alt={opponentFighter?.profile?.nickname || 'Adversário'}
              size="lg"
              borderRing={opponentCornerRing as any}
            />
          </div>
          <span
            style={{
              display: 'block',
              fontFamily: 'var(--font-family-heading)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 800,
              color: '#ffffff',
              marginTop: '6px',
            }}
          >
            {opponentFighter?.profile?.nickname}
          </span>
          <span
            style={{
              fontSize: '0.7rem',
              color: opponentCornerRing === 'red' ? 'var(--color-red-primary)' : 'var(--color-gold-primary)',
              fontWeight: 600,
              textTransform: 'uppercase',
            }}
          >
            {opponentCorner}
          </span>
        </div>
      </div>

      {/* Rodapé com Horário e Detalhes */}
      <div
        style={{
          marginTop: 'var(--space-4)',
          paddingTop: 'var(--space-3)',
          borderTop: '1px solid var(--color-border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-secondary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={15} color="var(--color-gold-primary)" />
          <span>Previsão de Entrada: <strong style={{ color: '#fff' }}>{match.scheduled_time || 'A definir'}</strong></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calendar size={15} color="var(--color-gold-primary)" />
          <span>{match.fighter1?.weight_category?.name || 'Peso Oficial'}</span>
        </div>
      </div>
    </Card>
  );
};
