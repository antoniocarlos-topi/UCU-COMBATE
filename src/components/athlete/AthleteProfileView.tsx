import React from 'react';
import { Card } from '../common/Card';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';
import { UserProfile, EventRegistration, MatchFight } from '../../types/app.types';
import { AthleteCareerStats } from '../../services/athleteService';
import { Scale, ShieldCheck, Video, Lock } from 'lucide-react';

export interface AthleteProfileViewProps {
  profile: UserProfile;
  registration: EventRegistration;
  stats: AthleteCareerStats;
  careerMatches: MatchFight[];
}

export const AthleteProfileView: React.FC<AthleteProfileViewProps> = ({
  profile,
  registration,
  stats,
  careerMatches,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* 1. Header do Perfil do Lutador */}
      <Card headerAccent="gold">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <Avatar src={profile.avatar_url} alt={profile.nickname} size="xl" borderRing="gold" />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800 }}>
                {profile.nickname}
              </h2>
              <Badge variant="approved">Lutador Oficial</Badge>
            </div>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              {profile.full_name}
            </p>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gold-light)', fontWeight: 600, marginTop: '2px' }}>
              {registration.weight_category?.name || 'Categoria Oficial'}
            </p>
          </div>
        </div>

        {/* Quadro Comparativo de Pesagem: Declarada vs Oficial Confirmada */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--space-3)',
            marginTop: 'var(--space-5)',
            paddingTop: 'var(--space-4)',
            borderTop: '1px solid var(--color-border-subtle)',
          }}
        >
          <div style={{ padding: 'var(--space-3)', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Scale size={13} /> Peso Declarado
            </span>
            <p style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: '#ffffff', marginTop: '2px' }}>
              {registration.declared_weight ? `${Number(registration.declared_weight).toFixed(2)} kg` : 'N/A'}
            </p>
          </div>

          <div style={{ padding: 'var(--space-3)', backgroundColor: 'rgba(212, 175, 55, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-gold-light)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={13} /> Pesagem Oficial (Aferida)
            </span>
            <p style={{ fontSize: 'var(--font-size-base)', fontWeight: 800, color: 'var(--color-gold-primary)', marginTop: '2px' }}>
              {registration.verified_weight ? `${Number(registration.verified_weight).toFixed(2)} kg` : 'Aguardando balança'}
            </p>
          </div>
        </div>
      </Card>

      {/* 2. Estatísticas Oficiais de Carreira (Calculadas Dinamicamente) */}
      <Card title="Estatísticas de Carreira">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 'var(--space-2)', textAlign: 'center' }}>
          <div style={{ padding: 'var(--space-2)', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff', display: 'block' }}>
              {stats.totalFights}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Lutas</span>
          </div>

          <div style={{ padding: 'var(--space-2)', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--color-status-approved)', display: 'block' }}>
              {stats.victories}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Vitórias</span>
          </div>

          <div style={{ padding: 'var(--space-2)', backgroundColor: 'rgba(212, 175, 55, 0.1)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--color-gold-primary)', display: 'block' }}>
              {stats.knockouts}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>KOs</span>
          </div>

          <div style={{ padding: 'var(--space-2)', backgroundColor: 'rgba(212, 175, 55, 0.1)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--color-gold-light)', display: 'block' }}>
              {stats.winRate}%
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Aproveitamento</span>
          </div>
        </div>
      </Card>

      {/* 3. Linha do Tempo e Histórico Esportivo */}
      <Card title="Histórico de Combates">
        {careerMatches.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', textAlign: 'center', padding: 'var(--space-4) 0' }}>
            Nenhum combate registrado até o momento.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {careerMatches.map((match) => {
              const isWinner = match.winner_registration_id === registration.id;
              const isFighter1 = match.fighter1_registration_id === registration.id;
              const opponent = isFighter1 ? match.fighter2 : match.fighter1;

              return (
                <div
                  key={match.id}
                  style={{
                    padding: 'var(--space-3)',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: '#fff' }}>
                      vs. {opponent?.profile?.nickname || 'Adversário'}
                    </span>
                    <Badge variant={isWinner ? 'approved' : 'neutral'} size="sm">
                      {isWinner ? 'VITÓRIA' : match.status === 'completed' ? 'DERROTA' : 'AGENDADA'}
                    </Badge>
                  </div>

                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                    {match.round_name} • Método: {match.victory_method || 'A definir'}
                  </span>

                  {match.video_url && (
                    <a
                      href={match.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.7rem',
                        color: 'var(--color-gold-primary)',
                        marginTop: '4px',
                      }}
                    >
                      <Video size={13} /> Assistir Vídeo da Luta
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* 4. Garantia de Sigilo dos Dados Pessoais */}
      <div
        style={{
          padding: 'var(--space-3) var(--space-4)',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.7rem',
          color: 'var(--color-text-muted)',
        }}
      >
        <Lock size={15} color="var(--color-gold-primary)" />
        <span>
          Seu e-mail de recuperação, telefone e dados de responsáveis são confidenciais e protegidos por RLS.
        </span>
      </div>
    </div>
  );
};
