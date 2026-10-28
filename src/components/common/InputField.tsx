import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

export interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
}

export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  isPassword = false,
  required,
  disabled,
  className = '',
  style,
  id,
  type = 'text',
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;

  const currentType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`input-field-wrapper ${className}`} style={{ marginBottom: 'var(--space-4)', width: '100%', ...style }}>
      <label
        htmlFor={inputId}
        style={{
          display: 'block',
          fontSize: 'var(--font-size-sm)',
          fontWeight: 600,
          color: error ? 'var(--color-status-rejected)' : 'var(--color-text-secondary)',
          marginBottom: 'var(--space-2)',
          fontFamily: 'var(--font-family-heading)',
          letterSpacing: '0.02em',
        }}
      >
        {label}
        {required && <span style={{ color: 'var(--color-red-primary)', marginLeft: '4px' }}>*</span>}
      </label>

      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'var(--color-bg-surface-elevated)',
          border: `1.5px solid ${error ? 'var(--color-status-rejected)' : 'var(--color-border-subtle)'}`,
          borderRadius: 'var(--radius-md)',
          transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
        }}
      >
        {leftIcon && (
          <div
            style={{
              paddingLeft: 'var(--space-3)',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--color-text-muted)',
            }}
          >
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          type={currentType}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          style={{
            width: '100%',
            padding: '12px 14px',
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--color-text-primary)',
            fontSize: 'var(--font-size-base)',
            fontFamily: 'var(--font-family-body)',
            minHeight: '46px',
          }}
          {...props}
        />

        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '0 var(--space-3)',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        ) : rightIcon ? (
          <div
            style={{
              paddingRight: 'var(--space-3)',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--color-text-muted)',
            }}
          >
            {rightIcon}
          </div>
        ) : null}
      </div>

      {error ? (
        <div
          id={`${inputId}-error`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: 'var(--space-1)',
            color: 'var(--color-status-rejected)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 500,
          }}
        >
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      ) : helperText ? (
        <p style={{ marginTop: 'var(--space-1)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

InputField.displayName = 'InputField';
