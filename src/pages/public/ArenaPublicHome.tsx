import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getUnifiedStore, subscribeToStore } from '../../services/storeSync';
import { DEFAULT_INAUGURAL_EVENT } from '../../services/eventService';
import { FightCardList } from '../../components/athlete/FightCardList';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoginWelcomeAnimation } from '../../components/common/LoginWelcomeAnimation';
import { Swords, Scale, Video, Bell, Calendar, MapPin, Shield, LogIn, LogOut, Flame } from 'lucide-react';

export const ArenaPublicHome: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth();
  const [store, setStore] = useState(getUnifiedStore());
  const [activeTab, setActiveTab] = useState<'lutas' | 'categorias' | 'videos' | 'comunicados'>('lutas');
  const [showWelcome, setShowWelcome] = useState<boolean>(
    () => sessionStorage.getItem('ucu_login_welcome') === 'true'
  );

  useEffect(() => {
    // Sincronização em tempo real quando admin ou inscrições atualizarem dados
    const unsubscribe = subscribeToStore((newStore) => {
      setStore({ ...newStore });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const activeEvent = store.events.find((e) => e.id === DEFAULT_INAUGURAL_EVENT.id) || store.events[0];
  const eventMatches = store.matches.filter(
    (m) => m.event_id === activeEvent.id || m.event_id === DEFAULT_INAUGURAL_EVENT.id
  );
  const mediaItems = store.mediaItems.filter(
    (m) => m.event_id === activeEvent.id || m.event_id === DEFAULT_INAUGURAL_EVENT.id
  );
  const announcements = store.announcements.filter(
    (a) => a.event_id === activeEvent.id || a.event_id === DEFAULT_INAUGURAL_EVENT.id
  );

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
        gap: 'var(--space-5)',
        paddingBottom: 'var(--space-8)',
        width: '100%',
      }}
    >
      {/* 1. Hero Banner da Arena U.C.U */}
      <div
        style={{
          position: 'relative',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-6) var(--space-5)',
          backgroundColor: '#101015',
          border: '2px solid rgba(212, 175, 55, 0.4)',
          backgroundImage:
            'radial-gradient(circle at 50% 10%, rgba(212, 175, 55, 0.12) 0%, rgba(12, 12, 16, 0.98) 80%)',
          boxShadow: '0 12px 35px rgba(0, 0, 0, 0.8), 0 0 25px rgba(212, 175, 55, 0.12)',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(212, 175, 55, 0.15)',
              border: '1px solid var(--color-border-gold)',
            }}
          >
            <Flame size={14} color="var(--color-gold-primary)" />
            <span
              style={{
                fontSize: '0.68rem',
                fontFamily: 'var(--font-family-heading)',
                color: 'var(--color-gold-light)',
                fontWeight: 800,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
              }}
            >
              Circuito Oficial Amador
            </span>
          </div>

          <Badge variant="live">Arena Oficial</Badge>
        </div>

        <h1
          style={{
            fontSize: 'var(--font-size-2xl)',
            fontFamily: 'var(--font-family-heading)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: '#ffffff',
            lineHeight: 1.2,
          }}
        >
          {activeEvent.title}
        </h1>

        <div
          style={{
            marginTop: 'var(--space-3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-secondary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={15} color="var(--color-gold-primary)" />
            <span>Local: <strong style={{ color: '#fff' }}>{activeEvent.location_name}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={15} color="var(--color-gold-primary)" />
            <span>Data e Horário: <strong style={{ color: '#fff' }}>Dia e horas a combinar</strong></span>
          </div>
        </div>

        {/* Botão de Ação: Login ou Meu Card */}
        <div style={{ marginTop: 'var(--space-5)', display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          {user ? (
            <>
              <Button
                variant="gold"
                size="md"
                leftIcon={<Shield size={18} />}
                onClick={() => navigate('/atleta')}
              >
                Acessar Meu Card ({profile?.nickname || 'Atleta'})
              </Button>
              <Button
                variant="ghost"
                size="md"
                leftIcon={<LogOut size={16} />}
                onClick={() => logout()}
                style={{ color: 'var(--color-text-muted)' }}
              >
                Sair
              </Button>
            </>
          ) : (
            <Button
              variant="gold"
              size="lg"
              fullWidth
              leftIcon={<LogIn size={20} />}
              onClick={() => navigate('/login')}
            >
              Entrar na Arena (Login do Atleta)
            </Button>
          )}
        </div>
      </div>

      {/* 2. Menu de Navegação da Arena */}
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
          variant={activeTab === 'lutas' ? 'gold' : 'secondary'}
          size="sm"
          leftIcon={<Swords size={15} />}
          onClick={() => setActiveTab('lutas')}
        >
          Cards de Lutas ({eventMatches.length})
        </Button>

        <Button
          variant={activeTab === 'categorias' ? 'gold' : 'secondary'}
          size="sm"
          leftIcon={<Scale size={15} />}
          onClick={() => setActiveTab('categorias')}
        >
          Categorias
        </Button>

        <Button
          variant={activeTab === 'videos' ? 'gold' : 'secondary'}
          size="sm"
          leftIcon={<Video size={15} />}
          onClick={() => setActiveTab('videos')}
        >
          Vídeos ({mediaItems.length})
        </Button>

        <Button
          variant={activeTab === 'comunicados' ? 'gold' : 'secondary'}
          size="sm"
          leftIcon={<Bell size={15} />}
          onClick={() => setActiveTab('comunicados')}
        >
          Comunicados ({announcements.length})
        </Button>
      </div>

      {/* 3. Conteúdo das Abas Públicas */}

      {/* ABA: LUTAS */}
      {activeTab === 'lutas' && (
        <div>
          <FightCardList
            matches={eventMatches}
            currentAthleteId={profile?.id || ''}
          />
        </div>
      )}

      {/* ABA: CATEGORIAS */}
      {activeTab === 'categorias' && (
        <Card title="Categorias de Peso Oficiais" subtitle="Regulamento de pesagem do torneio amador">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {DEFAULT_INAUGURAL_EVENT.categories.map((cat) => (
              <div
                key={cat.name}
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--color-border-subtle)',
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
                <Badge variant="gold" size="sm">Oficial</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ABA: VÍDEOS OFICIAIS */}
      {activeTab === 'videos' && (
        <Card title="Vídeos e Destaques da Arena" subtitle="Publicados e autorizados pela administração">
          {mediaItems.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', textAlign: 'center', padding: 'var(--space-4) 0' }}>
              Nenhum vídeo oficial publicado ainda pela organização.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {mediaItems.map((item) => (
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
                    {item.description && (
                      <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ABA: COMUNICADOS */}
      {activeTab === 'comunicados' && (
        <Card title="Comunicados Oficiais">
          {announcements.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', textAlign: 'center', padding: 'var(--space-4) 0' }}>
              Nenhum comunicado oficial publicado no momento.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {announcements.map((ann) => (
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
                    {ann.is_pinned && <Badge variant="gold" size="sm">Fixado</Badge>}
                  </div>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                    {ann.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
    </>
  );
};
