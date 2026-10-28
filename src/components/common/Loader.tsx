import React from 'react';

export interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullPage?: boolean;
}

export const Loader: React.FC<LoaderProps> = ({
  size = 'md',
  text,
  fullPage = false,
}) => {
  const pixelMap = { sm: 24, md: 40, lg: 60 };
  const px = pixelMap[size];

  const content = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-3)',
      }}
    >
      <div
        className="animate-spin"
        style={{
          width: `${px}px`,
          height: `${px}px`,
          borderRadius: '50%',
          border: '3px solid rgba(212, 175, 55, 0.15)',
          borderTopColor: 'var(--color-gold-primary)',
          borderRightColor: 'var(--color-gold-light)',
        }}
      />
      {text && (
        <span
          style={{
            fontFamily: 'var(--font-family-heading)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
            color: 'var(--color-text-secondary)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          {text}
        </span>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        {content}
      </div>
    );
  }

  return content;
};
