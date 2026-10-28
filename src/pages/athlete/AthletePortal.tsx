import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  getAthleteDashboardData,
  AthleteEventDashboardData,
} from '../../services/athleteService';
import { NextFightCard } from '../../components/athlete/NextFightCard';
import { FightCardList } from '../../components/athlete/FightCardList';
import { AthleteProfileView } from '../../components/athlete/AthleteProfileView';
import { PendingStatusView } from '../../components/athlete/PendingStatusView';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Loader } from '../../components/common/Loader';
import { ErrorMessage } from '../../components/feedback/ErrorMessage';
import {
  Calendar,
  Swords,
  User,
  Scale,
  Video,
  MapPin,
  LogOut,
} from 'lucide-react';

export const AthletePortal: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const [selectedEventSlug, setSelectedEventSlug] = useState<string>('arena-inaugural');
  const [dashboardData, setDashboardData] = useState<AthleteEventDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Aba ativa de navegação interna
  const [activeTab, setActiveTab] = useState<'geral' | 'card' | 'categorias' | 'midia' | 'perfil'>('geral');

  const loadData = async (slug: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await getAthleteDashboardData(user?.id || 'demo-auth-id', slug);
      setDashboardData(data);
    } catch (err: any) {
      setErrorMessage('Não foi possível carregar as informações do evento.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedEventSlug);
  }, [selectedEventSlug, user]);

  const handleEventChange = (newSlug: string) => {
    setSelectedEventSlug(newSlug);
    showToast(`Alternando para o evento selecionado...`, 'info', 2000);
  };

  if (isLoading) {
    return <Loader fullPage text="Carregando portal do atleta..." />;
  }

  if (errorMessage || !dashboardData) {
    return (
      <ErrorMessage
        title="Erro de Carregamento"
        message={errorMessage || 'Dados do participante não encontrados.'}
        onRetry={() => loadData(selectedEventSlug)}
      />
    );
  }

  // Se o participante estiver PENDENTE ou RECUSADO no evento selecionado:
  if (dashboardData.currentRegistration.status !== 'approved') {
    return (
      <PendingStatusView
        registration={dashboardData.currentRegistration}
        event={dashboardData.selectedEvent}
        onLogout={logout}
      />
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', paddingBottom: 'var(--space-8)' }}>
      {/* 1. Barra Superior do Portal com Seletor de Eventos e Logout */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--color-bg-surface-elevated)',
          padding: 'var(--space-3) var(--space-4)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} color="var(--color-gold-primary)" />
          {dashboardData.enrolledEvents.length > 1 ? (
            <select
              value={selectedEventSlug}
              onChange={(e) => handleEventChange(e.target.value)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 700,
                fontSize: 'var(--font-size-sm)',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {dashboardData.enrolledEvents.map((ev) => (
                <option key={ev.slug} value={ev.slug} style={{ backgroundColor: '#111', color: '#fff' }}>
                  {ev.title}
                </option>
              ))}
            </select>
          ) : (
            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-family-heading)' }}>
              {dashboardData.selectedEvent.title}
            </span>
          )}
        </div>

        <button
          onClick={() => logout()}
          aria-label="Sair da conta"
          className="interactive-tap"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: 'var(--font-size-xs)',
          }}
        >
          <LogOut size={16} />
          <span>Sair</span>
        </button>
      </div>

      {/* 2. Abas de Navegação Interna do Portal (Scroll Horizontal Mobile) */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-2)',
          overflowX: 'auto',
          paddingBottom: '4px',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <Button
          variant={activeTab === 'geral' ? 'gold' : 'secondary'}
          size="sm"
          onClick={() => setActiveTab('geral')}
        >
          Visão Geral
        </Button>
        <Button
          variant={activeTab === 'card' ? 'gold' : 'secondary'}
          size="sm"
          onClick={() => setActiveTab('card')}
          leftIcon={<Swords size={14} />}
        >
          Card de Lutas ({dashboardData.eventMatches.length})
        </Button>
        <Button
          variant={activeTab === 'categorias' ? 'gold' : 'secondary'}
          size="sm"
          onClick={() => setActiveTab('categorias')}
          leftIcon={<Scale size={14} />}
        >
          Categorias
        </Button>
        <Button
          variant={activeTab === 'midia' ? 'gold' : 'secondary'}
          size="sm"
          onClick={() => setActiveTab('midia')}
          leftIcon={<Video size={14} />}
        >
          Vídeos ({dashboardData.mediaItems.length})
        </Button>
        <Button
          variant={activeTab === 'perfil' ? 'gold' : 'secondary'}
          size="sm"
          onClick={() => setActiveTab('perfil')}
          leftIcon={<User size={14} />}
        >
          Meu Perfil
        </Button>
      </div>

      {/* 3. Conteúdo da Aba Selecionada */}

      {/* ABA: VISÃO GERAL */}
      {activeTab === 'geral' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Próximo Confronto Agendado */}
          <NextFightCard
            match={dashboardData.nextMatch}
            athleteProfileId={dashboardData.athleteProfile.id}
          />

          {/* Dados do Evento */}
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--font-size-sm)' }}>
                <MapPin size={16} color="var(--color-gold-primary)" />
                <span>Local: <strong style={{ color: '#fff' }}>{dashboardData.selectedEvent.location_name}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--font-size-sm)' }}>
                <Calendar size={16} color="var(--color-gold-primary)" />
                <span>Data e Horário: <strong style={{ color: '#fff' }}>{dashboardData.selectedEvent.event_date_text}</strong></span>
              </div>
            </div>
          </Card>

          {/* Comunicados Oficiais do Administrador */}
          <Card title="Comunicados Oficiais do Evento">
            {dashboardData.announcements.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
                Nenhum comunicado publicado até o momento.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {dashboardData.announcements.map((ann) => (
                  <div
                    key={ann.id}
                    style={{
                      padding: 'var(--space-3)',
                      backgroundColor: 'rgba(212, 175, 55, 0.05)',
                      borderLeft: '3px solid var(--color-gold-primary)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <h4 style={{ fontSize: 'var(--font-size-sm)', color: '#fff', fontWeight: 700 }}>
                        {ann.title}
                      </h4>
                      {ann.isPinned && <Badge variant="gold" size="sm">Fixado</Badge>}
                    </div>
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                      {ann.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ABA: CARD DE CONFRONTOS */}
      {activeTab === 'card' && (
        <FightCardList
          matches={dashboardData.eventMatches}
          currentAthleteId={dashboardData.athleteProfile.id}
        />
      )}

      {/* ABA: CATEGORIAS DO EVENTO */}
      {activeTab === 'categorias' && (
        <Card title="Categorias de Peso do Evento" subtitle="Faixas centralizadas e validadas sem lacunas">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {dashboardData.selectedEvent.categories.map((cat) => {
              const isAthleteCat = cat.name === dashboardData.currentRegistration.weight_category?.name;

              return (
                <div
                  key={cat.name}
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    backgroundColor: isAthleteCat ? 'rgba(212, 175, 55, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${isAthleteCat ? 'var(--color-gold-primary)' : 'var(--color-border-subtle)'}`,
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: '#fff' }}>
                      {cat.name}
                    </h4>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gold-light)' }}>
                      {cat.minWeight.toFixed(2)} kg até {cat.maxWeight.toFixed(2)} kg
                    </span>
                  </div>

                  {isAthleteCat && (
                    <Badge variant="gold" size="sm">Sua Categoria</Badge>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ABA: VÍDEOS E MÍDIA */}
      {activeTab === 'midia' && (
        <Card title="Vídeos e Highlights Oficiais" subtitle="Gravações autorizadas e melhores momentos">
          {dashboardData.mediaItems.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', textAlign: 'center', padding: 'var(--space-4) 0' }}>
              Nenhum vídeo publicado ainda para esta edição.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {dashboardData.mediaItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid var(--color-border-subtle)',
                  }}
                >
                  <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%' }}>
                    <iframe
                      src={item.url}
                      title={item.title}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        border: 'none',
                      }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  <div style={{ padding: 'var(--space-3)' }}>
                    <h4 style={{ fontSize: 'var(--font-size-sm)', color: '#fff', fontWeight: 700 }}>
                      {item.title}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ABA: MEU PERFIL E HISTÓRICO */}
      {activeTab === 'perfil' && (
        <AthleteProfileView
          profile={dashboardData.athleteProfile}
          registration={dashboardData.currentRegistration}
          stats={dashboardData.careerStats}
          careerMatches={dashboardData.eventMatches}
        />
      )}
    </div>
  );
};
