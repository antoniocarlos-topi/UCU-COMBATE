import React from 'react';
import { Button } from '../common/Button';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`empty-state-box animate-fade-in ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 'var(--space-10) var(--space-4)',
        backgroundColor: 'var(--color-bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px dashed var(--color-border-subtle)',
        margin: 'var(--space-4) 0',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'rgba(212, 175, 55, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-gold-primary)',
          marginBottom: 'var(--space-4)',
        }}
      >
        {icon}
      </div>

      <h4
        style={{
          fontFamily: 'var(--font-family-heading)',
          fontSize: 'var(--font-size-lg)',
          color: 'var(--color-text-primary)',
          marginBottom: 'var(--space-2)',
        }}
      >
        {title}
      </h4>

      <p
        style={{
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-text-muted)',
          maxWidth: '360px',
          marginBottom: actionText && onAction ? 'var(--space-5)' : 0,
        }}
      >
        {description}
      </p>

      {actionText && onAction && (
        <Button variant="gold" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
