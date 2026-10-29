import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  getAthleteDashboardData,
  AthleteEventDashboardData,
} from '../../services/athleteService';
import { subscribeToStore } from '../../services/storeSync';
import { NextFightCard } from '../../components/athlete/NextFightCard';
import { FightCardList } from '../../components/athlete/FightCardList';
import { AthleteProfileView } from '../../components/athlete/AthleteProfileView';
import { PendingStatusView } from '../../components/athlete/PendingStatusView';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Loader } from '../../components/common/Loader';
import { ErrorMessage } from '../../components/feedback/ErrorMessage';
import { LoginWelcomeAnimation } from '../../components/common/LoginWelcomeAnimation';
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
  const { user, profile, logout } = useAuth();
  const { showToast } = useToast();

  const [selectedEventSlug, setSelectedEventSlug] = useState<string>('arena-inaugural');
  const [dashboardData, setDashboardData] = useState<AthleteEventDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Animação de boas-vindas cinematográfica pós-login
  const [showWelcome, setShowWelcome] = useState<boolean>(
    () => sessionStorage.getItem('ucu_login_welcome') === 'true'
  );

  // Aba ativa de navegação interna (controlada via Bottom Navigation)
  const [activeTab, setActiveTab] = useState<'geral' | 'card' | 'categorias' | 'midia' | 'perfil'>('geral');

  const loadData = async (slug: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const userIdentifier = user?.id || profile?.auth_user_id || profile?.id || '';
      const nickname = profile?.nickname || (user?.user_metadata?.nickname as string | undefined);
      const profileIdHint = profile?.id;

      const data = await getAthleteDashboardData(
        userIdentifier || 'demo-auth-id',
        slug,
        nickname,
        profileIdHint
      );
      setDashboardData(data);
    } catch (err: any) {
      console.error('[AthletePortal] Erro ao carregar dados:', err);
      setErrorMessage('Não foi possível carregar as informações do evento.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedEventSlug);

    // Escutar alterações em tempo real do store unificado
    const unsubscribe = subscribeToStore(() => {
      loadData(selectedEventSlug);
    });

    return () => {
      unsubscribe();
    };
  }, [selectedEventSlug, user, profile]);

  const handleEventChange = (newSlug: string) => {
    setSelectedEventSlug(newSlug);
    showToast(`Alternando para o evento selecionado...`, 'info', 2000);
  };

  if (isLoading && !dashboardData) {
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

  // Se o participante estiver PENDENTE, SUSPENSO ou RECUSADO no evento selecionado:
  if (dashboardData.currentRegistration.status !== 'approved') {
    return (
      <PendingStatusView
        registration={dashboardData.currentRegistration}
        event={dashboardData.selectedEvent}
        onLogout={logout}
        onRefresh={() => loadData(selectedEventSlug)}
      />
    );
  }

  return (
    <>
      {showWelcome && (
        <LoginWelcomeAnimation
          onComplete={() => {
            setShowWelcome(false);
            sessionStorage.removeItem('ucu_login_welcome');
          }}
        />
      )}

      <div
        className="animate-fade-in"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
          paddingBottom: 'calc(80px + var(--safe-area-bottom))',
        }}
      >
        {/* 1. Barra Superior com Evento e Logout */}
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

      {/* 2. Conteúdo da Aba Selecionada */}

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

      {/* ABA: VÍDEOS E MÍDIA (CADASTRADOS PELO ADMIN) */}
      {activeTab === 'midia' && (
        <Card title="Vídeos e Highlights Oficiais" subtitle="Adicionados e gerenciados pela organização">
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
          onProfileUpdated={() => loadData(selectedEventSlug)}
        />
      )}

      {/* 3. BARRA DE NAVEGAÇÃO INFERIOR FIXA EXCLUSIVA DO MEU CARD */}
      <nav
        aria-label="Navegação do Card do Atleta"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 'var(--z-bottom-nav)',
          backgroundColor: 'rgba(10, 10, 14, 0.96)',
          backdropFilter: 'var(--glass-backdrop)',
          borderTop: '1px solid rgba(212, 175, 55, 0.25)',
          paddingBottom: 'max(var(--safe-area-bottom), 6px)',
          paddingTop: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          boxShadow: '0 -8px 24px rgba(0, 0, 0, 0.8)',
        }}
      >
        <button
          onClick={() => setActiveTab('geral')}
          className="interactive-tap"
          style={{
            background: 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            color: activeTab === 'geral' ? 'var(--color-gold-primary)' : 'var(--color-text-muted)',
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          <Calendar size={18} />
          <span style={{ fontSize: '0.65rem', fontWeight: activeTab === 'geral' ? 700 : 500 }}>
            Visão Geral
          </span>
        </button>

        <button
          onClick={() => setActiveTab('card')}
          className="interactive-tap"
          style={{
            background: 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            color: activeTab === 'card' ? 'var(--color-gold-primary)' : 'var(--color-text-muted)',
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          <Swords size={18} />
          <span style={{ fontSize: '0.65rem', fontWeight: activeTab === 'card' ? 700 : 500 }}>
            Cards de Lutas
          </span>
        </button>

        <button
          onClick={() => setActiveTab('categorias')}
          className="interactive-tap"
          style={{
            background: 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            color: activeTab === 'categorias' ? 'var(--color-gold-primary)' : 'var(--color-text-muted)',
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          <Scale size={18} />
          <span style={{ fontSize: '0.65rem', fontWeight: activeTab === 'categorias' ? 700 : 500 }}>
            Categorias
          </span>
        </button>

        <button
          onClick={() => setActiveTab('midia')}
          className="interactive-tap"
          style={{
            background: 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            color: activeTab === 'midia' ? 'var(--color-gold-primary)' : 'var(--color-text-muted)',
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          <Video size={18} />
          <span style={{ fontSize: '0.65rem', fontWeight: activeTab === 'midia' ? 700 : 500 }}>
            Vídeos
          </span>
        </button>

        <button
          onClick={() => setActiveTab('perfil')}
          className="interactive-tap"
          style={{
            background: 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            color: activeTab === 'perfil' ? 'var(--color-gold-primary)' : 'var(--color-text-muted)',
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          <User size={18} />
          <span style={{ fontSize: '0.65rem', fontWeight: activeTab === 'perfil' ? 700 : 500 }}>
            Meu Perfil
          </span>
        </button>
      </nav>
    </div>
    </>
  );
};
