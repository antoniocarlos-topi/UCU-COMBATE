import React, { useState, useEffect } from 'react';
import { BrandLogo } from './BrandLogo';
import { Sparkles, Flame, X } from 'lucide-react';

interface LoginWelcomeAnimationProps {
  onComplete?: () => void;
  durationMs?: number;
}

export const LoginWelcomeAnimation: React.FC<LoginWelcomeAnimationProps> = ({
  onComplete,
  durationMs = 6400,
}) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Inicia fade out suave antes do encerramento total
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, durationMs - 900);

    // Conclui e desmonta
    const completeTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, durationMs);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [durationMs, onComplete]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 450);
  };

  return (
    <div
      onClick={handleDismiss}
      className={isExiting ? 'animate-welcome-exit' : ''}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 5, 8, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-6)',
        cursor: 'pointer',
        userSelect: 'none',
        overflow: 'hidden',
      }}
      role="dialog"
      aria-label="Boas-vindas à U.C.U Arena"
    >
      {/* Luz ambiente de fundo dinâmica */}
      <div
        style={{
          position: 'absolute',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.20) 0%, rgba(229, 25, 40, 0.10) 45%, transparent 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none',
        }}
      />

      {/* Partículas de brasa / douradas flutuando */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage:
            'radial-gradient(2px 2px at 20px 30px, #d4af37, rgba(0,0,0,0)), radial-gradient(2px 2px at 40px 70px, #e51928, rgba(0,0,0,0)), radial-gradient(1px 1px at 90px 40px, #ffffff, rgba(0,0,0,0))',
          backgroundSize: '150px 150px',
          opacity: 0.35,
          pointerEvents: 'none',
        }}
      />

      {/* Botão de Fechar / Pular discreto no topo */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDismiss();
        }}
        style={{
          position: 'absolute',
          top: '24px',
          right: '24px',
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          color: 'var(--color-text-muted)',
          borderRadius: 'var(--radius-full)',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.8rem',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          zIndex: 10,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#fff';
          e.currentTarget.style.borderColor = 'var(--color-gold-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--color-text-muted)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
        }}
      >
        <span>Pular</span>
        <X size={14} />
      </button>

      {/* Conteúdo Central com a Logo e Raio de Luz */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative',
          zIndex: 2,
          maxWidth: '680px',
          width: '100%',
        }}
      >
        {/* Contêiner da Logo com o Raio de Luz passando sem corte ou rebarba */}
        <div
          className="animate-welcome-logo"
          style={{
            position: 'relative',
            padding: 'var(--space-8) var(--space-10)',
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'visible',
          }}
        >
          {/* Raio de luz orgânico 100% sem rebarbas: elipse ultra-difusa com gradiente suave */}
          <div
            className="animate-light-ray"
            style={{
              position: 'absolute',
              top: '-100%',
              left: '-40%',
              width: '260px',
              height: '320%',
              borderRadius: '50%',
              background:
                'radial-gradient(ellipse 45% 55% at 50% 50%, rgba(255, 255, 255, 0.95) 0%, rgba(243, 229, 171, 0.75) 25%, rgba(212, 175, 55, 0.35) 55%, transparent 75%)',
              filter: 'blur(8px)',
              mixBlendMode: 'screen',
              pointerEvents: 'none',
            }}
          />

          {/* Logo UCU ARENA Monumental */}
          <div style={{ transform: 'scale(1.45)', margin: 'var(--space-4) 0' }}>
            <BrandLogo size="xl" />
          </div>

          {/* Subtítulo Dourado da Arena com Ícones */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: 'var(--space-3)',
              color: 'var(--color-gold-primary)',
              fontFamily: 'var(--font-family-heading)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 800,
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              textShadow: '0 0 12px rgba(212, 175, 55, 0.5)',
            }}
          >
            <Sparkles size={16} />
            <span>Plataforma Oficial de Combate</span>
            <Flame size={16} />
          </div>
        </div>

        {/* Mensagem Subliminar e Elegante de Boas-Vindas */}
        <div
          className="animate-welcome-text"
          style={{
            marginTop: 'var(--space-6)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '1px',
              background: 'linear-gradient(90deg, transparent, var(--color-gold-primary), transparent)',
              marginBottom: '4px',
            }}
          />
          <p
            style={{
              fontFamily: 'var(--font-family-heading)',
              fontSize: 'clamp(1.1rem, 3.5vw, 1.65rem)',
              fontWeight: 700,
              color: '#f0f0f5',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              textAlign: 'center',
              textShadow: '0 2px 14px rgba(0, 0, 0, 0.9), 0 0 24px rgba(212, 175, 55, 0.3)',
              lineHeight: 1.3,
            }}
          >
            Bem vindo ao melhor evento da sua vida!
          </p>
          <span
            style={{
              fontSize: '0.75rem',
              color: 'var(--color-text-muted)',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            Toque em qualquer lugar para entrar
          </span>
        </div>
      </div>
    </div>
  );
};
