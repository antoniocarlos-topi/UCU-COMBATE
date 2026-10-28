import React from 'react';

export type BadgeVariant =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'suspended'
  | 'withdrawn'
  | 'live'
  | 'gold'
  | 'neutral';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  pulse?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  pulse = false,
  className = '',
}) => {
  const variantStyles: Record<BadgeVariant, { bg: string; color: string; border: string }> = {
    pending: {
      bg: 'var(--color-status-pending-bg)',
      color: 'var(--color-status-pending)',
      border: 'rgba(245, 158, 11, 0.3)',
    },
    approved: {
      bg: 'var(--color-status-approved-bg)',
      color: 'var(--color-status-approved)',
      border: 'rgba(16, 185, 129, 0.3)',
    },
    rejected: {
      bg: 'var(--color-status-rejected-bg)',
      color: 'var(--color-status-rejected)',
      border: 'rgba(239, 68, 68, 0.3)',
    },
    suspended: {
      bg: 'rgba(239, 68, 68, 0.12)',
      color: 'var(--color-red-light)',
      border: 'rgba(239, 68, 68, 0.4)',
    },
    withdrawn: {
      bg: 'var(--color-status-withdrawn-bg)',
      color: 'var(--color-status-withdrawn)',
      border: 'rgba(156, 163, 175, 0.25)',
    },
    live: {
      bg: 'var(--color-status-live-bg)',
      color: 'var(--color-status-live)',
      border: 'rgba(229, 25, 40, 0.5)',
    },
    gold: {
      bg: 'var(--color-gold-muted)',
      color: 'var(--color-gold-primary)',
      border: 'rgba(212, 175, 55, 0.35)',
    },
    neutral: {
      bg: 'rgba(255, 255, 255, 0.06)',
      color: 'var(--color-text-secondary)',
      border: 'var(--color-border-subtle)',
    },
  };

  const { bg, color, border } = variantStyles[variant];

  return (
    <span
      className={`status-badge ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: size === 'sm' ? '2px 8px' : '4px 12px',
        fontSize: size === 'sm' ? '0.7rem' : 'var(--font-size-xs)',
        fontWeight: 700,
        fontFamily: 'var(--font-family-heading)',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        borderRadius: 'var(--radius-full)',
        backgroundColor: bg,
        color: color,
        border: `1px solid ${border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {pulse && (
        <span
          className="animate-live-pulse"
          style={{
            width: '6px',
            height: '6px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: color,
            display: 'inline-block',
          }}
        />
      )}
      {children}
    </span>
  );
};
