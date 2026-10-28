import React, { useState } from 'react';
import { BrandLogo } from '../common/BrandLogo';
import { Button } from '../common/Button';
import { EventInvitationData } from '../../services/eventService';
import { Swords, Sparkles, MapPin, Calendar } from 'lucide-react';

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
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenLetter = () => {
    setIsOpen(true);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-2) 0 var(--space-8)',
        perspective: '1000px',
        width: '100%',
      }}
    >
      {/* 1. Abertura Animada / Topo Cinematográfico */}
      <div
        className="animate-slide-down"
        style={{
          textAlign: 'center',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div style={{ marginBottom: 'var(--space-2)' }}>
          <BrandLogo size="md" />
        </div>
        <span
          style={{
            fontFamily: 'var(--font-family-heading)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-gold-primary)',
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            fontWeight: 700,
          }}
        >
          Convite Exclusivo de Combate
        </span>
      </div>

      {/* 2. Envelope Tridimensional Premium */}
      <div
        onClick={!isOpen ? handleOpenLetter : undefined}
        className={`interactive-tap ${!isOpen ? 'envelope-hover' : ''}`}
        style={{
          width: '100%',
          maxWidth: '460px',
          position: 'relative',
          cursor: !isOpen ? 'pointer' : 'default',
          transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {!isOpen ? (
          /* Envelope Fechado com Lacre Oficial Dourado e Vermelho */
          <div
            className="animate-scale-in"
            style={{
              backgroundColor: '#121217',
              border: '2px solid var(--color-border-gold)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-12) var(--space-6)',
              textAlign: 'center',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.7), 0 0 20px rgba(212, 175, 55, 0.15)',
              position: 'relative',
              overflow: 'hidden',
              minHeight: '260px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(212, 175, 55, 0.08) 0%, transparent 70%)',
            }}
          >
            {/* Linhas Geométricas do Envelope */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '50%',
                borderBottom: '1px solid rgba(212, 175, 55, 0.25)',
                clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                backgroundColor: 'rgba(25, 25, 34, 0.95)',
              }}
            />

            {/* Selo / Lacre de Cera Dourado com UCU */}
            <div
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                background: 'var(--gradient-gold)',
                border: '3px solid #f3e5ab',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 20px rgba(212, 175, 55, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.6)',
                zIndex: 2,
                marginBottom: 'var(--space-4)',
                transform: 'scale(1)',
                transition: 'transform var(--transition-fast)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-family-heading)',
                  fontWeight: 900,
                  fontStyle: 'italic',
                  fontSize: '20px',
                  color: 'var(--color-red-primary)',
                  letterSpacing: '-0.05em',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)',
                }}
              >
                UCU
              </span>
              <span
                style={{
                  fontSize: '8px',
                  fontWeight: 800,
                  color: '#08080a',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginTop: '-2px',
                }}
              >
                SELO
              </span>
            </div>

            {/* Dica de Toque Mobile */}
            <div style={{ zIndex: 2, marginTop: 'var(--space-2)' }}>
              <p
                style={{
                  fontFamily: 'var(--font-family-heading)',
                  fontSize: 'var(--font-size-md)',
                  fontWeight: 700,
                  color: '#ffffff',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                {event.title}
              </p>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: 'var(--space-3)',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'rgba(212, 175, 55, 0.12)',
                  border: '1px solid var(--color-border-gold)',
                  color: 'var(--color-gold-light)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                }}
              >
                <Sparkles size={14} />
                <span>Toque na carta para ler</span>
              </div>
            </div>
          </div>
        ) : (
          /* 3. Carta Aberta em Estilo Editorial Luxuoso */
          <div
            className="animate-slide-up"
            style={{
              backgroundColor: '#111116',
              border: '2px solid var(--color-border-gold)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-6) var(--space-5)',
              boxShadow: 'var(--shadow-lg), 0 0 30px rgba(212, 175, 55, 0.2)',
              position: 'relative',
              backgroundImage: 'linear-gradient(180deg, rgba(25, 25, 34, 0.8) 0%, rgba(14, 14, 19, 0.98) 100%)',
            }}
          >
            {/* Cabeçalho da Carta */}
            <div
              style={{
                textAlign: 'center',
                paddingBottom: 'var(--space-4)',
                borderBottom: '1px solid rgba(212, 175, 55, 0.25)',
                marginBottom: 'var(--space-5)',
              }}
            >
              <h2
                style={{
                  fontFamily: 'var(--font-family-heading)',
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--color-gold-light)',
                }}
              >
                {event.headline}
              </h2>
              <span
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-muted)',
                  marginTop: '2px',
                }}
              >
                Edição Oficial — Convite Individual
              </span>
            </div>

            {/* Texto Editorial Oficial */}
            <div
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: 'var(--font-size-sm)',
                lineHeight: 1.7,
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
                backgroundColor: 'rgba(212, 175, 55, 0.06)',
                borderRadius: 'var(--radius-md)',
                borderLeft: '3px solid var(--color-gold-primary)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
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

            {/* Signatários Oficiais */}
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

            {/* 4. Botões de Ação Imediata Abaixo da Carta */}
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
        )}
      </div>
    </div>
  );
};
