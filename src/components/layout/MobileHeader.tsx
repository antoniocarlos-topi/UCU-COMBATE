import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';

export interface MobileHeaderProps {
  title?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  showBack = false,
  rightAction,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isHome = location.pathname === '/' || location.pathname === '/e/arena-inaugural';

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 'var(--z-header)',
        backgroundColor: 'rgba(8, 8, 10, 0.88)',
        backdropFilter: 'var(--glass-backdrop)',
        borderBottom: '1px solid var(--color-border-subtle)',
        paddingTop: 'var(--safe-area-top)',
        height: 'calc(56px + var(--safe-area-top))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 'var(--space-4)',
        paddingRight: 'var(--space-4)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '40px' }}>
        {showBack && !isHome ? (
          <button
            onClick={() => navigate(-1)}
            aria-label="Voltar"
            className="interactive-tap"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <ChevronLeft size={24} />
          </button>
        ) : null}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {title ? (
          <h2
            style={{
              fontSize: 'var(--font-size-base)',
              fontFamily: 'var(--font-family-heading)',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
            }}
          >
            {title}
          </h2>
        ) : (
          <BrandLogo size="sm" />
        )}
      </div>

      <div style={{ minWidth: '40px', display: 'flex', justifyContent: 'flex-end' }}>
        {rightAction}
      </div>
    </header>
  );
};
