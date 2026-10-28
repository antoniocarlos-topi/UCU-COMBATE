import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'gold' | 'secondary' | 'danger' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'gold',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className = '',
  style,
  ...props
}) => {
  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontFamily: 'var(--font-family-heading)',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    opacity: disabled || isLoading ? 0.6 : 1,
    transition: 'all var(--transition-fast)',
    width: fullWidth ? '100%' : 'auto',
    position: 'relative',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    ...style,
  };

  const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
    sm: {
      padding: '8px 14px',
      fontSize: 'var(--font-size-xs)',
      minHeight: '36px',
    },
    md: {
      padding: '12px 20px',
      fontSize: 'var(--font-size-sm)',
      minHeight: '46px',
    },
    lg: {
      padding: '16px 28px',
      fontSize: 'var(--font-size-base)',
      minHeight: '54px',
    },
  };

  const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
    gold: {
      background: 'var(--gradient-gold)',
      color: '#08080a',
      boxShadow: 'var(--shadow-gold)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
    },
    secondary: {
      background: 'var(--color-bg-surface-elevated)',
      color: 'var(--color-text-primary)',
      border: '1px solid var(--color-border-subtle)',
    },
    danger: {
      background: 'var(--gradient-red-accent)',
      color: '#ffffff',
      boxShadow: 'var(--shadow-red)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
    },
    outline: {
      background: 'transparent',
      color: 'var(--color-gold-primary)',
      border: '1.5px solid var(--color-gold-primary)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--color-text-secondary)',
      border: '1px solid transparent',
    },
  };

  const isShiny = variant === 'gold' || variant === 'danger';

  return (
    <button
      className={`interactive-tap ${isShiny ? 'shiny-button' : ''} ${className}`}
      disabled={disabled || isLoading}
      style={{
        ...baseStyles,
        ...sizeStyles[size],
        ...variantStyles[variant],
      }}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 size={18} className="animate-spin" />
          <span>Carregando...</span>
        </>
      ) : (
        <>
          {leftIcon && <span style={{ display: 'inline-flex' }}>{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span style={{ display: 'inline-flex' }}>{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
