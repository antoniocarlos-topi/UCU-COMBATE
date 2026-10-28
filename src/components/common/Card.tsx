import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  headerAccent?: 'gold' | 'red' | 'none';
  interactive?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  action,
  headerAccent = 'none',
  interactive = false,
  onClick,
  className = '',
  style,
}) => {
  return (
    <div
      onClick={onClick}
      className={`card-container ${interactive ? 'interactive-tap' : ''} ${className}`}
      style={{
        backgroundColor: 'var(--color-bg-surface-card)',
        backdropFilter: 'var(--glass-backdrop)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden',
        position: 'relative',
        cursor: interactive ? 'pointer' : 'default',
        transition: 'all var(--transition-normal)',
        ...style,
      }}
    >
      {headerAccent !== 'none' && (
        <div
          style={{
            height: '3px',
            width: '100%',
            background: headerAccent === 'gold' ? 'var(--gradient-gold)' : 'var(--gradient-red-accent)',
          }}
        />
      )}

      {(title || subtitle || action) && (
        <div
          style={{
            padding: 'var(--space-4) var(--space-5)',
            borderBottom: '1px solid var(--color-border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-3)',
          }}
        >
          <div>
            {title && (
              <h3
                style={{
                  fontSize: 'var(--font-size-md)',
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                  letterSpacing: '-0.01em',
                }}
              >
                {title}
              </h3>
            )}
            {subtitle && (
              <p
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-muted)',
                  marginTop: '2px',
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}

      <div style={{ padding: 'var(--space-5)' }}>
        {children}
      </div>
    </div>
  );
};
