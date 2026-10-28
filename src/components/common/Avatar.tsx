import React, { useState } from 'react';
import { User } from 'lucide-react';

export interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  borderRing?: 'gold' | 'red' | 'none';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = 'md',
  borderRing = 'gold',
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);

  const sizePixels = {
    sm: 36,
    md: 48,
    lg: 68,
    xl: 96,
  }[size];

  const borderStyles: Record<'gold' | 'red' | 'none', string> = {
    gold: '2px solid var(--color-gold-primary)',
    red: '2px solid var(--color-red-primary)',
    none: '1px solid var(--color-border-subtle)',
  };

  // Extrair iniciais do nome para fallback
  const initials = alt
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

  return (
    <div
      className={`athlete-avatar ${className}`}
      style={{
        width: `${sizePixels}px`,
        height: `${sizePixels}px`,
        borderRadius: 'var(--radius-full)',
        border: borderStyles[borderRing],
        backgroundColor: 'var(--color-bg-surface-elevated)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: borderRing === 'gold' ? '0 0 12px rgba(212, 175, 55, 0.25)' : undefined,
      }}
    >
      {src && !imageError ? (
        <img
          src={src}
          alt={alt}
          onError={() => setImageError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : initials ? (
        <span
          style={{
            fontFamily: 'var(--font-family-heading)',
            fontWeight: 700,
            fontSize: `${sizePixels * 0.4}px`,
            color: 'var(--color-gold-light)',
          }}
        >
          {initials}
        </span>
      ) : (
        <User size={sizePixels * 0.5} color="var(--color-text-muted)" />
      )}
    </div>
  );
};
