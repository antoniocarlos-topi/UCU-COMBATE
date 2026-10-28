import React, { useRef, useState } from 'react';
import { Card } from '../common/Card';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';
import { Loader } from '../common/Loader';
import { UserProfile, EventRegistration, MatchFight } from '../../types/app.types';
import { AthleteCareerStats } from '../../services/athleteService';
import { useToast } from '../../contexts/ToastContext';
import { processAndCompressAthleteAvatar } from '../../utils/imageCompressor';
import { updateAthleteAvatarInStore } from '../../services/storeSync';
import { Scale, ShieldCheck, Video, Lock, Camera } from 'lucide-react';

export interface AthleteProfileViewProps {
  profile: UserProfile;
  registration: EventRegistration;
  stats: AthleteCareerStats;
  careerMatches: MatchFight[];
  onProfileUpdated?: () => void;
}

export const AthleteProfileView: React.FC<AthleteProfileViewProps> = ({
  profile,
  registration,
  stats,
  careerMatches,
  onProfileUpdated,
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(profile.avatar_url || null);

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUpdatingAvatar(true);
      const result = await processAndCompressAthleteAvatar(file);
      setCurrentAvatarUrl(result.previewUrl);

      // Persistir no store unificado
      updateAthleteAvatarInStore(profile.id, result.previewUrl);
      showToast('Foto do perfil atualizada com sucesso!', 'success');

      if (onProfileUpdated) {
        onProfileUpdated();
      }
    } catch (err: any) {
      showToast(err.message || 'Erro ao atualizar foto.', 'error');
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* 1. Header do Perfil do Lutador com Edição de Foto */}
      <Card headerAccent="gold">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          {/* Avatar com Botão de Alteração de Foto */}
          <div style={{ position: 'relative' }}>
            <Avatar src={currentAvatarUrl} alt={profile.nickname} size="xl" borderRing="gold" />

            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarSelect}
              style={{ display: 'none' }}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUpdatingAvatar}
              aria-label="Alterar foto de perfil"
              className="interactive-tap shiny-button"
              style={{
                position: 'absolute',
                bottom: '-4px',
                right: '-4px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-gold-primary)',
                border: '2px solid #000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#08080a',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
              }}
            >
              {isUpdatingAvatar ? (
                <Loader size="sm" />
              ) : (
                <Camera size={16} strokeWidth={2.5} />
              )}
            </button>
          </div>

          <div style={{ flex: 1, minWidth: '180px' }}>
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
            <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', display: 'block', marginTop: '4px' }}>
              Toque no ícone de câmera para alterar sua foto oficial
            </span>
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
            <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Aproveit.</span>
          </div>
        </div>
      </Card>

      {/* 3. Histórico Oficial de Confrontos */}
      <Card title="Histórico de Lutas Realizadas">
        {careerMatches.filter((m) => m.status === 'completed').length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', textAlign: 'center', padding: 'var(--space-4) 0' }}>
            Nenhum confronto finalizado registrado ainda nesta arena.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {careerMatches
              .filter((m) => m.status === 'completed')
              .map((m) => {
                const isWinner = m.winner_registration_id === registration.id;

                return (
                  <div
                    key={m.id}
                    style={{
                      padding: 'var(--space-3) var(--space-4)',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--color-border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gold-light)', fontWeight: 700 }}>
                        {m.round_name}
                      </span>
                      <Badge variant={isWinner ? 'approved' : 'rejected'} size="sm">
                        {isWinner ? 'Vitória' : 'Derrota'} ({m.victory_method || 'DEC'})
                      </Badge>
                    </div>

                    <p style={{ fontSize: 'var(--font-size-sm)', color: '#fff', fontWeight: 600 }}>
                      {m.fighter1?.profile?.nickname || 'Atleta 1'} vs {m.fighter2?.profile?.nickname || 'Atleta 2'}
                    </p>

                    {m.score_details && (
                      <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                        Detalhes: {m.score_details}
                      </p>
                    )}

                    {m.video_url && (
                      <div style={{ marginTop: '4px' }}>
                        <a
                          href={m.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: 'var(--font-size-xs)',
                            color: 'var(--color-gold-primary)',
                            textDecoration: 'none',
                            fontWeight: 600,
                          }}
                        >
                          <Video size={14} /> Assistir gravação oficial
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </Card>

      {/* 4. Termos e Privacidade (LGPD) */}
      <Card title="Governança e Consentimento">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={14} color="var(--color-status-approved)" />
            <span>Consentimento de uso de imagem e transmissão: <strong>Ativo e Válido</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={14} color="var(--color-status-approved)" />
            <span>Concordância com o regulamento do campeonato: <strong>Registrada</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={14} color="var(--color-status-approved)" />
            <span>Dados de contato protegidos e restritos à coordenação oficial.</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
