import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = ''
}) => {
  const sizeMap = {
    sm: { height: 26, fontSize: 18, subSize: 9, tracking: '0.22em' },
    md: { height: 38, fontSize: 26, subSize: 11, tracking: '0.28em' },
    lg: { height: 54, fontSize: 38, subSize: 14, tracking: '0.34em' },
    xl: { height: 72, fontSize: 52, subSize: 18, tracking: '0.40em' },
  };

  const current = sizeMap[size];

  return (
    <div
      className={`brand-logo-container ${className}`}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        lineHeight: 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Letras UCU em Vermelho Combate Estilizado Itálico */}
        <span
          style={{
            fontFamily: "var(--font-family-heading)",
            fontWeight: 900,
            fontStyle: 'italic',
            fontSize: `${current.fontSize}px`,
            color: 'var(--color-red-primary)',
            letterSpacing: '-0.04em',
            textShadow: '0 0 16px rgba(229, 25, 40, 0.4)',
            transform: 'skewX(-6deg)',
            display: 'inline-block',
          }}
        >
          UCU
        </span>

        {showSubtitle && (
          <span
            style={{
              fontFamily: "var(--font-family-heading)",
              fontWeight: 800,
              fontSize: `${current.subSize}px`,
              color: 'var(--color-gold-primary)',
              letterSpacing: current.tracking,
              textTransform: 'uppercase',
              background: 'var(--gradient-gold)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              borderLeft: '2px solid rgba(212, 175, 55, 0.4)',
              paddingLeft: '8px',
              marginLeft: '2px',
              display: 'inline-block',
            }}
          >
            ARENA
          </span>
        )}
      </div>
    </div>
  );
};
