import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../common/Button';

export interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'Ocorreu um erro',
  message,
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`error-message-banner animate-slide-up ${className}`}
      style={{
        backgroundColor: 'var(--color-status-rejected-bg)',
        border: '1px solid var(--color-status-rejected)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-4)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--space-3)',
        margin: 'var(--space-3) 0',
      }}
    >
      <div style={{ color: 'var(--color-status-rejected)', marginTop: '2px' }}>
        <AlertCircle size={20} />
      </div>

      <div style={{ flex: 1 }}>
        <h5
          style={{
            fontFamily: 'var(--font-family-heading)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 700,
            color: '#ffffff',
            marginBottom: '2px',
          }}
        >
          {title}
        </h5>
        <p style={{ fontSize: 'var(--font-size-xs)', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.4 }}>
          {message}
        </p>

        {onRetry && (
          <div style={{ marginTop: 'var(--space-3)' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={onRetry}
              leftIcon={<RefreshCw size={14} />}
            >
              Tentar novamente
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
