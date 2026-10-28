import React, { useState, useEffect } from 'react';
import { BrandLogo } from '../common/BrandLogo';
import { Button } from '../common/Button';
import { EventInvitationData } from '../../services/eventService';
import { Swords, Sparkles, MapPin, Calendar, Flame } from 'lucide-react';

export interface CinematicEnvelopeProps {
  event: EventInvitationData;
  onAccept: () => void;
  onDecline: () => void;
}

export const CinematicEnvelope: React.FC<CinematicEnvelopeProps> = ({
  event,
  onAccept,
  onDecline,
}) => {
  // Fases da experiência:
  // 'intro'    → Logo U.C.U cinematográfica revelando (1.4s)
  // 'envelope' → Envelope fechado com selo flutuando, aguardando toque
  // 'opening'  → Animação de abertura: selo quebra, aba abre, envelope some, carta sobe
  // 'letter'   → Carta aberta com conteúdo e botões de ação
  const [phase, setPhase] = useState<'intro' | 'envelope' | 'opening' | 'letter'>('intro');

  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase('envelope');
    }, 1400);
    return () => clearTimeout(timer);
  }, []);

  const handleOpenLetter = () => {
    if (phase !== 'envelope') return;
    setPhase('opening');

    // Após a sequência completa de abertura (~1.5s), mostra a carta
    setTimeout(() => {
      setPhase('letter');
    }, 1500);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-2) 0 var(--space-8)',
        perspective: '1200px',
        width: '100%',
        minHeight: '75vh',
      }}
    >
      {/* ===== FASE 1: INTRO CINEMATOGRÁFICA DA LOGO U.C.U ===== */}
      {phase === 'intro' && (
        <div
          className="animate-logo-intro"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: 'var(--space-12) 0',
          }}
        >
          <BrandLogo size="xl" />
          <div
            style={{
              marginTop: 'var(--space-4)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--color-gold-primary)',
              fontFamily: 'var(--font-family-heading)',
              letterSpacing: '0.28em',
              fontSize: 'var(--font-size-sm)',
              textTransform: 'uppercase',
              fontWeight: 800,
            }}
          >
            <Sparkles size={16} />
            <span>Convocação Oficial de Combate</span>
          </div>
        </div>
      )}

      {/* ===== FASE 2: ENVELOPE FECHADO COM SELO FLUTUANTE ===== */}
      {phase === 'envelope' && (
        <>
          {/* Topo pós-intro com a marca */}
          <div
            className="animate-fade-in"
            style={{ textAlign: 'center', marginBottom: 'var(--space-5)' }}
          >
            <div style={{ marginBottom: 'var(--space-2)' }}>
              <BrandLogo size="md" />
            </div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 14px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
              }}
            >
              <Flame size={14} color="var(--color-gold-primary)" />
              <span
                style={{
                  fontFamily: 'var(--font-family-heading)',
                  fontSize: '0.72rem',
                  color: 'var(--color-gold-light)',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  fontWeight: 800,
                }}
              >
                Convite Exclusivo para Guerreiros Selecionados
              </span>
            </div>
          </div>

          {/* Envelope flutuante clicável */}
          <div
            onClick={handleOpenLetter}
            className="interactive-tap floating-letter"
            style={{
              width: '100%',
              maxWidth: '480px',
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            <div
              style={{
                backgroundColor: '#0f0f14',
                border: '2px solid rgba(212, 175, 55, 0.65)',
                borderRadius: 'var(--radius-xl)',
                padding: 'var(--space-10) var(--space-6)',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                minHeight: '290px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background:
                  'radial-gradient(ellipse at 50% 25%, rgba(212, 175, 55, 0.16) 0%, rgba(18, 18, 24, 0.98) 75%)',
                boxShadow:
                  '0 20px 50px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
              }}
            >
              {/* Aba triangular do envelope */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '52%',
                  borderBottom: '2px solid rgba(212, 175, 55, 0.4)',
                  clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                  backgroundColor: 'rgba(26, 26, 36, 0.96)',
                  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.6)',
                }}
              />

              {/* Selo de Cera 3D com UCU */}
              <div
                className="wax-seal-pulse"
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at 35% 35%, #fff1b8 0%, #d4af37 50%, #996515 100%)',
                  border: '3px solid #ffdf79',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2,
                  marginBottom: 'var(--space-4)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-family-heading)',
                    fontWeight: 900,
                    fontStyle: 'italic',
                    fontSize: '22px',
                    color: 'var(--color-red-primary)',
                    letterSpacing: '-0.05em',
                    textShadow: '0 1px 3px rgba(0, 0, 0, 0.6)',
                  }}
                >
                  UCU
                </span>
                <span
                  style={{
                    fontSize: '8px',
                    fontWeight: 900,
                    color: '#0a0a0c',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    marginTop: '-3px',
                  }}
                >
                  OFICIAL
                </span>
              </div>

              {/* Título e Chamada */}
              <div style={{ zIndex: 2, marginTop: 'var(--space-2)' }}>
                <p
                  style={{
                    fontFamily: 'var(--font-family-heading)',
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: 800,
                    color: '#ffffff',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)',
                  }}
                >
                  {event.title}
                </p>

                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: 'var(--space-4)',
                    padding: '8px 18px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'rgba(212, 175, 55, 0.16)',
                    border: '1px solid var(--color-gold-primary)',
                    color: 'var(--color-gold-light)',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    boxShadow: '0 0 16px rgba(212, 175, 55, 0.25)',
                  }}
                >
                  <Sparkles size={16} />
                  <span>Toque na carta para romper o lacre</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ===== FASE 3: ANIMAÇÃO DE ABERTURA CINEMATOGRÁFICA ===== */}
      {phase === 'opening' && (
        <div
          style={{
            width: '100%',
            maxWidth: '480px',
            position: 'relative',
            minHeight: '350px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Selo quebrando e saindo */}
          <div
            className="animate-seal-break"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              marginLeft: '-42px',
              marginTop: '-42px',
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, #fff1b8 0%, #d4af37 50%, #996515 100%)',
              border: '3px solid #ffdf79',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              boxShadow: '0 4px 20px rgba(212, 175, 55, 0.6)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 900,
                fontStyle: 'italic',
                fontSize: '22px',
                color: 'var(--color-red-primary)',
              }}
            >
              UCU
            </span>
          </div>

          {/* Envelope abrindo e desaparecendo */}
          <div
            className="animate-envelope-fade"
            style={{
              width: '100%',
              backgroundColor: '#0f0f14',
              border: '2px solid rgba(212, 175, 55, 0.5)',
              borderRadius: 'var(--radius-xl)',
              minHeight: '280px',
              position: 'relative',
              overflow: 'hidden',
              background:
                'radial-gradient(ellipse at 50% 25%, rgba(212, 175, 55, 0.1) 0%, rgba(18, 18, 24, 0.98) 75%)',
            }}
          >
            {/* Aba do envelope abrindo para trás */}
            <div
              className="animate-flap-open"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '52%',
                borderBottom: '2px solid rgba(212, 175, 55, 0.4)',
                clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                backgroundColor: 'rgba(26, 26, 36, 0.96)',
                zIndex: 5,
              }}
            />
          </div>

          {/* Partículas douradas de luz durante a abertura */}
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-gold-primary)',
                top: `${30 + Math.random() * 40}%`,
                left: `${20 + Math.random() * 60}%`,
                opacity: 0,
                animation: `fadeIn 0.3s ${0.2 + i * 0.1}s forwards, floatingLetter 2s ${i * 0.15}s infinite`,
                boxShadow: '0 0 8px rgba(212, 175, 55, 0.8)',
              }}
            />
          ))}
        </div>
      )}

      {/* ===== FASE 4: CARTA ABERTA COM CONTEÚDO ===== */}
      {phase === 'letter' && (
        <>
          {/* Logo pequena no topo */}
          <div
            className="animate-fade-in"
            style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}
          >
            <BrandLogo size="md" />
          </div>

          {/* Carta subindo de dentro do envelope */}
          <div
            className="animate-letter-rise"
            style={{
              width: '100%',
              maxWidth: '480px',
              backgroundColor: '#101015',
              border: '2px solid var(--color-border-gold)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-6) var(--space-5)',
              boxShadow:
                '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(212, 175, 55, 0.25)',
              position: 'relative',
              backgroundImage:
                'radial-gradient(circle at 50% 0%, rgba(212, 175, 55, 0.08) 0%, transparent 60%), linear-gradient(180deg, rgba(22, 22, 30, 0.95) 0%, rgba(12, 12, 16, 0.98) 100%)',
            }}
          >
            {/* Cabeçalho da Carta Oficial */}
            <div
              style={{
                textAlign: 'center',
                paddingBottom: 'var(--space-4)',
                borderBottom: '1px solid rgba(212, 175, 55, 0.3)',
                marginBottom: 'var(--space-5)',
              }}
            >
              <span
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--color-gold-primary)',
                  fontFamily: 'var(--font-family-heading)',
                  fontWeight: 700,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Documento Oficial de Convocação
              </span>
              <h2
                style={{
                  fontFamily: 'var(--font-family-heading)',
                  fontSize: 'var(--font-size-xl)',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--color-gold-light)',
                }}
              >
                {event.headline}
              </h2>
            </div>

            {/* Texto Editorial da Carta */}
            <div
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: 'var(--font-size-sm)',
                lineHeight: 1.75,
                color: 'var(--color-text-primary)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-4)',
                whiteSpace: 'pre-line',
              }}
            >
              <p>{event.invitation_text}</p>
            </div>

            {/* Informações de Local e Data */}
            <div
              style={{
                marginTop: 'var(--space-5)',
                padding: 'var(--space-3) var(--space-4)',
                backgroundColor: 'rgba(212, 175, 55, 0.08)',
                borderRadius: 'var(--radius-md)',
                borderLeft: '4px solid var(--color-gold-primary)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--font-size-xs)' }}>
                <MapPin size={16} color="var(--color-gold-primary)" />
                <span>Local: <strong style={{ color: '#fff' }}>{event.location_name}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--font-size-xs)' }}>
                <Calendar size={16} color="var(--color-gold-primary)" />
                <span>Data e horário: <strong style={{ color: '#fff' }}>{event.event_date_text}</strong></span>
              </div>
            </div>

            {/* Signatários */}
            <div
              style={{
                marginTop: 'var(--space-6)',
                paddingTop: 'var(--space-4)',
                borderTop: '1px solid var(--color-border-subtle)',
              }}
            >
              <p
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  marginBottom: 'var(--space-2)',
                }}
              >
                Atenciosamente,
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 'var(--space-2)',
                }}
              >
                {event.signatories.map((name) => (
                  <span
                    key={name}
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 700,
                      color: 'var(--color-gold-light)',
                      fontFamily: 'var(--font-family-heading)',
                    }}
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>

            {/* Apenas os Botões de Ação Decisória */}
            <div
              style={{
                marginTop: 'var(--space-6)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
              }}
            >
              <Button
                variant="gold"
                size="lg"
                fullWidth
                leftIcon={<Swords size={20} />}
                onClick={onAccept}
              >
                Quero Lutar
              </Button>

              <Button
                variant="ghost"
                size="md"
                fullWidth
                onClick={onDecline}
                style={{
                  color: 'var(--color-text-muted)',
                  fontSize: 'var(--font-size-xs)',
                }}
              >
                Não quero participar
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
